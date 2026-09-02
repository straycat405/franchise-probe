"""수집된 정보공개서 분석.

두 가지를 본다.
  1) 조항별 변별력 - 브랜드마다 실제로 다른 조항만 분위수에 쓸 수 있다.
     법정 문구를 그대로 옮겨 적는 조항은 값이 거의 같아 의미가 없다.
  2) 규칙 기반 추출률 - 표나 정형 문구에서 값을 몇 %나 뽑아내는지.
     여기서 실패한 나머지가 LLM이 맡을 몫이고, 골든셋의 범위가 된다.

    python3 analyze.py
    python3 analyze.py --clause JNG_CTRT_UPDT_PD --dump 5
"""

import argparse
import re
import statistics as st
from collections import Counter, defaultdict

import ftc

NUM = re.compile(r"^-?[\d,]+(?:\.\d+)?$")
UNIT = re.compile(r"단위\s*[:：]?\s*(백만원|십만원|만원|천원|원)")
BRACKET_YEAR = re.compile(r"\[\s*(\d{1,2})\s*\]\s*년")
PLAIN_YEAR = re.compile(r"(\d{1,2})\s*년")

MULT = {"원": 1, "천원": 1000, "만원": 10000, "십만원": 100000, "백만원": 1000000}


def pct(values, p):
    if not values:
        return None
    s = sorted(values)
    k = (len(s) - 1) * p / 100
    lo, hi = int(k), min(int(k) + 1, len(s) - 1)
    return s[lo] + (s[hi] - s[lo]) * (k - lo)


def histogram(values, bins=8, width=34):
    if not values:
        return
    lo, hi = min(values), max(values)
    if lo == hi:
        print("      모든 값이 %s 로 동일" % fmt(lo))
        return
    step = (hi - lo) / bins
    counts = Counter(min(bins - 1, int((v - lo) / step)) for v in values)
    top = max(counts.values())
    for b in range(bins):
        a, z = lo + b * step, lo + (b + 1) * step
        n = counts.get(b, 0)
        bar = "█" * int(round(n / top * width)) if n else ""
        print("      %10s ~ %-10s %4d  %s" % (fmt(a), fmt(z), n, bar))


def fmt(v):
    if v is None:
        return "-"
    if isinstance(v, float) and abs(v - round(v)) < 1e-9:
        v = int(round(v))
    return format(v, ",") if isinstance(v, int) else "%.1f" % v


def summarize(name, values, unit=""):
    print("\n  [%s]  n=%d" % (name, len(values)))
    if not values:
        print("      추출 0건")
        return
    print("      최소 %s / p25 %s / 중위 %s / p75 %s / 최대 %s %s"
          % (fmt(min(values)), fmt(pct(values, 25)), fmt(pct(values, 50)),
             fmt(pct(values, 75)), fmt(max(values)), unit))
    histogram(values)


# ── 추출기 ────────────────────────────────────────────────────────────────

def x_contract_years(c):
    """계약기간. '[ 2 ] 년' 채움 서식이 표준이고, 없으면 첫 'N년'."""
    m = BRACKET_YEAR.search(c["text"]) or PLAIN_YEAR.search(c["text"])
    if not m:
        return None
    v = int(m.group(1))
    return v if 1 <= v <= 20 else None


def norm_num(cell):
    """표 셀의 숫자. 변환 과정에서 자간이 깨져 '8  8 00000' 처럼 오는 셀이 있다."""
    s = cell.replace(" ", "").replace(",", "")
    if not s or not re.fullmatch(r"-?\d+(?:\.\d+)?", s):
        return None
    return float(s)


def x_initial_fee(c):
    """최초 가맹금 총계. 금액은 표 안에 있고 단위는 헤더 문장에 있다.

    0원과 1억 초과는 단위 오파싱이나 서식 이탈일 가능성이 높아 버린다.
    버려진 건수 자체가 규칙의 한계를 보여주는 지표다.
    """
    m = UNIT.search(c["text"])
    mult = MULT.get(m.group(1), 1) if m else 1
    for table in c["tables"]:
        for row in table:
            if not row:
                continue
            head = row[0].replace(" ", "")
            if head.startswith("총") or head in ("합계", "계"):
                for cell in row[1:]:
                    v = norm_num(cell)
                    if v is not None:
                        won = int(v * mult)
                        return won if 0 < won <= 100000000 else None
                break
    return None


SENT = re.compile(r"[^.。!?]*(?:다|음)\s*[.。]|[^.。!?]+$")


def x_exclusive_area(c):
    """독점적·배타적 영업지역 설정 여부.

    문서 전체에서 부정 표현을 찾으면 안 된다. 본문은 "설정하여 명시하고
    있습니다"로 시작해 놓고 뒤에 "온라인 판매는 영업지역을 설정하지
    않습니다" 같은 예외 문장을 덧붙이는 경우가 많다. 영업지역 설정을
    직접 서술하는 문장만 골라서 판단한다.
    """
    for s in SENT.findall(c["text"][:900]):
        if "영업지역" not in s or "설정" not in s:
            continue
        if re.search(r"설정하지\s*않|설정을\s*하지\s*않|설정하고\s*있지\s*않", s):
            return 0
        if re.search(r"설정(하여|합니다|하고|하며|한다|함)", s):
            return 1
    if re.search(r"영업지역을\s*설정하지\s*않", c["text"]):
        return 0
    return None


def x_noncompete_years(c):
    m = PLAIN_YEAR.search(c["text"])
    return int(m.group(1)) if m and int(m.group(1)) <= 20 else None


EXTRACTORS = [
    ("계약기간", "JNG_CTRT_UPDT_PD", x_contract_years, "년"),
    ("최초 가맹금 총계", "FRCS_BZMN_FRST_JNNT_INFO", x_initial_fee, "원"),
    ("경업금지 기간", "CMPET_INDUTY_PRHIBT_SCOPE", x_noncompete_years, "년"),
    ("영업지역 독점 설정", "MNPLY_ECL_BSN_AREA_STNG_CN", x_exclusive_area, "(1=설정)"),
]


# ── 본체 ─────────────────────────────────────────────────────────────────

def load_docs():
    idx = ftc.load_index()
    docs = {}
    for sn in ftc.cached_ids():
        xml = ftc.read_cached(sn)
        if xml:
            docs[sn] = ftc.parse_clauses(xml)
    return docs, idx


def variance_table(docs, top):
    print("\n[2] 조항별 변별력  (고유 텍스트 비율이 높을수록 브랜드마다 다름)")
    cover, uniq, lens, titles = Counter(), defaultdict(set), defaultdict(list), {}
    for clauses in docs.values():
        for attr, c in clauses.items():
            cover[attr] += 1
            uniq[attr].add(c["text"][:300])
            lens[attr].append(len(c["text"]))
            titles.setdefault(attr, c["title"])
    rows = []
    for attr, n in cover.items():
        if n < len(docs) * 0.5:
            continue
        u = len(uniq[attr]) / n
        mean = st.mean(lens[attr]) or 1
        cv = st.pstdev(lens[attr]) / mean * 100
        rows.append((u, cv, n, attr, titles[attr]))
    rows.sort(reverse=True)
    print("    %-34s %5s %6s %5s  %s" % ("조항코드", "보유", "고유율", "CV%", "제목"))
    for u, cv, n, attr, title in rows[:top]:
        print("    %-34s %4d %5.0f%% %5.0f  %s" % (attr, n, u * 100, cv, title[:38]))
    weak = [r for r in rows if r[0] < 0.4]
    if weak:
        print("\n    변별력 낮음 (분위수에 쓰지 말 것):")
        for u, cv, n, attr, title in weak[:8]:
            print("    %-34s %5.0f%%  %s" % (attr, u * 100, title[:44]))
    return rows


def concentration(idx, docs):
    by_corp = defaultdict(list)
    for sn in docs:
        meta = idx.get(sn)
        if meta:
            by_corp[meta["corpNm"]].append(meta["brandNm"])
    multi = sorted(((len(v), k, v) for k, v in by_corp.items()), reverse=True)
    print("\n[4] 가맹본부 집중도  (한 본부가 브랜드를 찍어내는 패턴)")
    print("    본부 %d곳 / 브랜드 %d개 / 본부당 평균 %.2f개"
          % (len(by_corp), len(docs), len(docs) / max(1, len(by_corp))))
    hits = [m for m in multi if m[0] >= 3]
    if hits:
        print("    브랜드 3개 이상 보유 본부:")
        for n, corp, brands in hits[:8]:
            print("      %2d개  %-24s %s" % (n, corp[:24], ", ".join(brands[:6])))
    else:
        print("    브랜드 3개 이상 보유 본부 없음")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--top", type=int, default=18)
    ap.add_argument("--clause", help="이 조항의 원문 샘플을 출력")
    ap.add_argument("--dump", type=int, default=3)
    args = ap.parse_args()

    docs, idx = load_docs()
    if not docs:
        raise SystemExit("캐시가 비어 있다. 먼저 collect.py 를 돌려라.")
    print("[1] 캐시 문서 %d건 / 색인 %d건" % (len(docs), len(idx)))
    counts = [len(c) for c in docs.values()]
    print("    문서당 조항 %d~%d개 (평균 %.1f)"
          % (min(counts), max(counts), st.mean(counts)))

    # 조항 코드 체계를 따르지 않는 문서가 섞여 있다. 본문 분량은 멀쩡한데
    # 헤더 속성이 없어서 조항이 잡히지 않는 경우다.
    broken = sorted((len(c), sn) for sn, c in docs.items() if len(c) < 95)
    if broken:
        print("    서식 이탈 %d건 (조항 95개 미만) - 전체의 %.1f%%"
              % (len(broken), len(broken) / len(docs) * 100))
        for n, sn in broken[:6]:
            meta = idx.get(sn, {})
            print("      조항 %3d개  %-22s %s자"
                  % (n, meta.get("brandNm", sn)[:22],
                     format(meta.get("chars", 0), ",")))

    variance_table(docs, args.top)

    print("\n[3] 규칙 기반 추출률과 분포")
    for name, code, fn, unit in EXTRACTORS:
        have = [c[code] for c in docs.values() if code in c]
        vals = []
        for c in have:
            try:
                v = fn(c)
            except Exception:
                v = None
            if v is not None:
                vals.append(v)
        rate = len(vals) / len(have) * 100 if have else 0
        print("\n  %s  조항 보유 %d/%d · 추출 성공 %d건 (%.0f%%)"
              % (name, len(have), len(docs), len(vals), rate))
        if rate < 100 and have:
            print("      실패 %d건 -> 이 구간이 LLM 몫이자 골든셋 범위"
                  % (len(have) - len(vals)))
        summarize(name, vals, unit)

    concentration(idx, docs)

    if args.clause:
        print("\n[5] 원문 샘플  (%s)" % args.clause)
        shown = 0
        for sn, clauses in docs.items():
            c = clauses.get(args.clause)
            if not c:
                continue
            meta = idx.get(sn, {})
            print("\n    --- %s  %s" % (sn, meta.get("brandNm", "")))
            print("    %s" % c["text"][:600])
            for table in c["tables"][:1]:
                print("    표: %s" % table[:4])
            shown += 1
            if shown >= args.dump:
                break


if __name__ == "__main__":
    main()
