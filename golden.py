"""골든셋 구축과 평가.

    python3 golden.py build --spec noncompete --n 50
    python3 golden.py label --spec noncompete
    python3 golden.py eval  --spec noncompete

build 는 규칙이 값을 찾은 문서와 못 찾은 문서를 반씩 섞어 표본을 만든다.
한쪽만 보면 정확도가 부풀거나 깎인다.

정답에는 반드시 근거 문장을 적는다. 근거 없는 값은 제품에 실을 수 없으니
골든셋도 같은 규칙을 따른다.
"""

import argparse
import datetime
import json
import os
import random
import re

import ftc
import rules

GOLD = os.path.join(ftc.ROOT, "golden")
KEYWORDS = re.compile(r"경업|종료|해지|해제|계약기간|반경|지역|년|개월|가맹금|총\s*계|영업지역")
FIELD_GUIDE = {
    "during": "계약이 유지되는 동안 동종업 영업을 금지하면 True, 아니면 False",
    "after_months": "계약 종료·해지 뒤에도 경업금지가 이어지는 명시 기간. 없으면 None",
    "geo": "경업금지 지역 문구. 계약 중·종료 후 범위가 다르면 현재 스키마로 검수하지 않음",
}


def gold_path(spec):
    return os.path.join(GOLD, "%s.jsonl" % spec)


def load_gold(spec):
    path = gold_path(spec)
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        return [json.loads(l) for l in f if l.strip()]


def save_gold(spec, rows):
    os.makedirs(GOLD, exist_ok=True)
    with open(gold_path(spec), "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def load_docs():
    idx = ftc.load_index()
    out = {}
    for sn in ftc.cached_ids():
        xml = ftc.read_cached(sn)
        if xml:
            out[sn] = ftc.parse_clauses(xml)
    return out, idx


def rule_value(spec, clause):
    value, _ = rules.SPECS[spec][1](clause)
    return value


def has_value(spec, value):
    """규칙이 실질적으로 값을 찾았는지. 층화 표본의 기준."""
    fields = rules.SPECS[spec][2]
    if fields:
        return value.get("after_months") is not None
    return value is not None


def cmd_build(args):
    code = rules.SPECS[args.spec][0]
    docs, idx = load_docs()
    found, missing = [], []
    for sn, clauses in docs.items():
        c = clauses.get(code)
        if not c:
            continue
        row = {"sn": sn, "brand": idx.get(sn, {}).get("brandNm", ""),
               "corp": idx.get(sn, {}).get("corpNm", ""), "answer": None,
               "evidence": "", "note": ""}
        (found if has_value(args.spec, rule_value(args.spec, c)) else missing).append(row)

    rnd = random.Random(args.seed)
    rnd.shuffle(found)
    rnd.shuffle(missing)
    half = args.n // 2
    picked = found[:half] + missing[:args.n - half]
    rnd.shuffle(picked)

    existing = {r["sn"] for r in load_gold(args.spec)}
    rows = load_gold(args.spec) + [r for r in picked if r["sn"] not in existing]
    save_gold(args.spec, rows)
    print("조항 %s" % code)
    print("  규칙이 값을 찾은 문서 %d건 / 못 찾은 문서 %d건" % (len(found), len(missing)))
    print("  표본 %d건 (양쪽 균형) -> %s" % (len(picked), gold_path(args.spec)))
    print("  다음:  python3 golden.py label --spec %s" % args.spec)


def show_context(clause, width=110):
    """라벨링에 필요한 문장과 표만 추려서 보여준다."""
    for s in rules.sentences(clause["text"], 1600):
        if KEYWORDS.search(s):
            print("    " + s[:width * 2])
    for table in clause["tables"][:2]:
        for row in table[:6]:
            cells = [c for c in row if c]
            if cells and any(KEYWORDS.search(c) for c in cells):
                print("    표| " + " | ".join(c[:38] for c in cells[:5]))


def ask(prompt, cast=None, allow_blank=True):
    while True:
        v = input(prompt).strip()
        if not v:
            if allow_blank:
                return None
            continue
        if v == "?":
            return "?"
        if cast:
            try:
                return cast(v)
            except ValueError:
                print("      형식이 맞지 않는다.")
                continue
        return v


def cmd_label(args):
    code, _, fields = rules.SPECS[args.spec]
    rows = load_gold(args.spec)
    if not rows:
        raise SystemExit("표본이 없다. 먼저 build 를 돌려라.")
    docs, _ = load_docs()
    todo = [r for r in rows if r["answer"] is None]
    print("전체 %d건 / 남은 %d건.  빈 입력은 '없음', ? 는 보류, Ctrl-C 로 중단(진행분 저장)\n"
          % (len(rows), len(todo)))

    try:
        for i, row in enumerate(todo, 1):
            clause = docs.get(row["sn"], {}).get(code)
            if not clause:
                continue
            print("=" * 78)
            print("[%d/%d] %s  (%s)"
                  % (i, len(todo), row["brand"] or row["sn"], row["corp"] or "-"))
            show_context(clause)
            print("-" * 78)

            if args.spec == "noncompete":
                d = ask("  계약기간 중 금지? [y/n] ")
                a = ask("  계약 종료 후 개월수 (없으면 엔터) : ", int)
                g = ask("  지역 제한 (없으면 엔터) : ")
                if "?" in (d, a, g):
                    continue
                row["answer"] = {"during": (d or "").lower().startswith("y"),
                                 "after_months": a, "geo": g}
            else:
                v = ask("  정답 값 (없으면 엔터) : ",
                        int if args.spec in ("contract_years", "initial_fee",
                                             "exclusive_area") else None)
                if v == "?":
                    continue
                row["answer"] = v

            ev = ask("  근거 문장 (일부만 붙여넣기) : ")
            row["evidence"] = ev or ""
            save_gold(args.spec, rows)
    except KeyboardInterrupt:
        print("\n중단. 진행분은 저장됐다.")

    save_gold(args.spec, rows)
    done = sum(1 for r in rows if r["answer"] is not None)
    print("\n라벨 완료 %d/%d.  다음:  python3 golden.py eval --spec %s"
          % (done, len(rows), args.spec))


def cmd_eval(args):
    code, fn, fields = rules.SPECS[args.spec]
    rows = [r for r in load_gold(args.spec) if r["answer"] is not None]
    if not rows:
        raise SystemExit("라벨된 정답이 없다. 먼저 label 을 돌려라.")
    docs, _ = load_docs()

    keys = fields or ["value"]
    if args.field:
        if args.field not in keys:
            raise SystemExit("%s 명세에 %s 필드가 없다." % (args.spec, args.field))
        keys = [args.field]
    if args.verified_only:
        if not args.field:
            raise SystemExit("--verified-only 는 --field 와 함께 써라.")
        rows = [r for r in rows if args.field in r.get("verified_fields", [])
                or r.get("labeled_by") == "human"]
        if not rows:
            raise SystemExit("해당 필드를 사람이 검수한 정답이 없다.")
    stat = {k: {"tp": 0, "fp": 0, "fn": 0, "tn": 0, "wrong": []} for k in keys}
    for row in rows:
        clause = docs.get(row["sn"], {}).get(code)
        pred = fn(clause)[0] if clause else (None if not fields else {})
        for k in keys:
            p = pred.get(k) if fields else pred
            t = row["answer"].get(k) if fields else row["answer"]
            s = stat[k]
            if t in (None, False) and p in (None, False):
                s["tn"] += 1
            elif p == t:
                s["tp"] += 1
            elif p is None or p is False:
                s["fn"] += 1
                s["wrong"].append((row["brand"], t, p))
            else:
                s["fp"] += 1
                s["wrong"].append((row["brand"], t, p))

    print("골든셋 %d건 · 조항 %s\n" % (len(rows), code))
    print("  %-16s %6s %6s %6s %6s %8s" % ("필드", "정답", "미검출", "오답", "정답없음", "정확도"))
    for k in keys:
        s = stat[k]
        n = s["tp"] + s["fp"] + s["fn"] + s["tn"]
        acc = (s["tp"] + s["tn"]) / n * 100 if n else 0
        print("  %-16s %6d %6d %6d %6d %7.1f%%"
              % (k, s["tp"], s["fn"], s["fp"], s["tn"], acc))

    for k in keys:
        bad = stat[k]["wrong"][:args.show]
        if bad:
            print("\n  [%s] 틀린 사례" % k)
            for brand, truth, pred in bad:
                print("    %-24s 정답 %-14s 규칙 %s" % (brand[:24], truth, pred))
    print("\n  오답은 LLM이 맡을 구간이다. 같은 골든셋으로 LLM을 재면 비교가 된다.")


def cmd_review(args):
    """라벨된 정답과 근거를 한눈에 훑는다. 초안 라벨을 사람이 검수할 때 쓴다."""
    rows = [r for r in load_gold(args.spec) if r["answer"] is not None]
    fields = rules.SPECS[args.spec][2]
    by = {}
    for r in rows:
        by.setdefault(r.get("labeled_by", "human"), []).append(r)
    print("라벨 %d건  출처: %s\n"
          % (len(rows), ", ".join("%s %d건" % (k, len(v)) for k, v in by.items())))
    for r in rows:
        a = r["answer"]
        val = " ".join("%s=%s" % (k, a.get(k)) for k in fields) if fields else str(a)
        print("  %-26s %s" % ((r["brand"] or r["sn"])[:26], val))
        print("      근거: %s" % r["evidence"][:110])


def answer_diff(spec, truth, pred):
    """초안 정답과 현재 규칙이 다른 필드 목록."""
    fields = rules.SPECS[spec][2]
    if fields:
        return [k for k in fields if truth.get(k) != pred.get(k)]
    return [] if truth == pred else ["value"]


def edit_answer(spec, current):
    """빈 입력은 기존 값 유지, '-'는 명시적인 없음."""
    fields = rules.SPECS[spec][2]
    if not fields:
        raw = input("  정답 [%s] (유지: 엔터, 없음: -): " % current).strip()
        if not raw:
            return current
        if raw == "-":
            return None
        if spec in ("contract_years", "initial_fee", "exclusive_area"):
            return int(raw)
        return raw

    answer = dict(current)
    raw = input("  계약기간 중 금지 [%s] (y/n, 유지: 엔터): "
                % ("y" if current.get("during") else "n")).strip().lower()
    if raw:
        if raw not in ("y", "n"):
            raise ValueError("y 또는 n만 입력")
        answer["during"] = raw == "y"

    raw = input("  계약 종료 후 개월수 [%s] (유지: 엔터, 없음: -): "
                % current.get("after_months")).strip()
    if raw:
        answer["after_months"] = None if raw == "-" else int(raw)

    raw = input("  지역 제한 [%s] (유지: 엔터, 없음: -): "
                % current.get("geo")).strip()
    if raw:
        answer["geo"] = None if raw == "-" else raw
    return answer


def edit_field(field, current):
    """검수 중 선택한 필드 하나만 수정한다."""
    old = current.get(field)
    if field == "during":
        raw = input("  수정값 [y/n]: ").strip().lower()
        if raw not in ("y", "n"):
            raise ValueError("y 또는 n만 입력")
        return raw == "y"
    if field == "after_months":
        raw = input("  수정값 (개월 수, 종료 후 제한 없으면 -): ").strip()
        if raw == "-":
            return None
        return int(raw)
    raw = input("  수정값 (지역 문구, 제한 없으면 -): ").strip()
    return None if raw == "-" else raw


def cmd_verify(args):
    """초안 라벨을 사람이 확인·수정한다. 매 건 처리 직후 저장한다."""
    code, fn, fields = rules.SPECS[args.spec]
    rows = load_gold(args.spec)
    docs, _ = load_docs()
    labeled = [r for r in rows if r.get("answer") is not None]
    if not labeled:
        raise SystemExit("라벨된 정답이 없다. 먼저 label 을 돌려라.")
    if args.field and (not fields or args.field not in fields):
        raise SystemExit("%s 명세에 %s 필드가 없다." % (args.spec, args.field))
    if args.field:
        pending = [r for r in labeled
                   if args.field not in r.get("verified_fields", [])
                   and r.get("labeled_by") != "human"]
    else:
        pending = [r for r in labeled if r.get("labeled_by") != "human"]

    def priority(row):
        clause = docs.get(row["sn"], {}).get(code)
        pred = fn(clause)[0] if clause else ({} if fields else None)
        differences = answer_diff(args.spec, row["answer"], pred)
        diff = int(args.field in differences) if args.field else len(differences)
        # 규칙과 다른 사례를 먼저, 100% 주장 근거인 after_months 없음 사례를 다음에 본다.
        negative_after = bool(fields and row["answer"].get("after_months") is None)
        return diff, negative_after

    pending.sort(key=priority, reverse=True)
    if args.field:
        human_done = len(labeled) - len(pending)
        print("검수 필드: %s" % args.field)
        print("판단 기준: %s" % FIELD_GUIDE[args.field])
    else:
        human_done = sum(r.get("labeled_by") == "human" for r in labeled)
    print("라벨 %d건 / 사람 검수 완료 %d건 / 남은 %d건"
          % (len(labeled), human_done, len(pending)))
    print("규칙 불일치 사례 우선. 확인 y / 수정 e / 보류 s / 종료 q\n")

    try:
        for i, row in enumerate(pending, 1):
            clause = docs.get(row["sn"], {}).get(code)
            if not clause:
                print("[%d/%d] %s: 조항 없음, 보류" % (i, len(pending), row["sn"]))
                continue
            pred, pred_ev = fn(clause)
            diff = answer_diff(args.spec, row["answer"], pred)
            print("=" * 78)
            print("[%d/%d] %s (%s) · SN %s"
                  % (i, len(pending), row.get("brand") or "브랜드명 없음",
                     row.get("corp") or "본부명 없음", row["sn"]))
            if args.field:
                print("  초안 %s: %s" % (args.field, row["answer"].get(args.field)))
                print("  규칙 %s: %s" % (args.field, pred.get(args.field)))
                print("  차이: %s" % ("있음" if args.field in diff else "없음"))
            else:
                print("  초안: %s" % row["answer"])
                print("  규칙: %s" % pred)
                print("  차이: %s" % (", ".join(diff) if diff else "없음"))
            print("  초안 근거: %s" % row.get("evidence", ""))
            show_context(clause)

            while True:
                action = input("  선택 [y/e/s/q]: ").strip().lower()
                if action in ("y", "e", "s", "q"):
                    break
                print("  y, e, s, q 중 하나를 입력")
            if action == "q":
                break
            if action == "s":
                continue
            if action == "e":
                try:
                    if args.field:
                        row["answer"][args.field] = edit_field(
                            args.field, row["answer"])
                    else:
                        row["answer"] = edit_answer(args.spec, row["answer"])
                except ValueError as e:
                    print("  수정 취소: %s" % e)
                    continue
                evidence = input("  근거 수정 (유지: 엔터): ").strip()
                if evidence:
                    row["evidence"] = evidence

            if args.field:
                verified = set(row.get("verified_fields", []))
                verified.add(args.field)
                row["verified_fields"] = sorted(verified)
                if fields and all(k in verified for k in fields):
                    row["labeled_by"] = "human"
            else:
                row["labeled_by"] = "human"
            row["verified_at"] = datetime.datetime.now(
                datetime.timezone.utc).isoformat(timespec="seconds")
            save_gold(args.spec, rows)
            print("  저장 완료")
    except (EOFError, KeyboardInterrupt):
        print("\n중단. 완료한 검수는 저장됐다.")

    if args.field:
        done = sum(args.field in r.get("verified_fields", [])
                   or r.get("labeled_by") == "human" for r in labeled)
    else:
        done = sum(r.get("labeled_by") == "human" for r in labeled)
    print("\n사람 검수 %d/%d건" % (done, len(labeled)))
    if done == len(labeled):
        if args.field:
            print("다음: python3 golden.py eval --spec %s --field %s --verified-only"
                  % (args.spec, args.field))
        else:
            print("다음: python3 golden.py eval --spec %s" % args.spec)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name, fn in (("build", cmd_build), ("label", cmd_label),
                     ("eval", cmd_eval), ("review", cmd_review),
                     ("verify", cmd_verify)):
        p = sub.add_parser(name)
        p.add_argument("--spec", default="noncompete", choices=sorted(rules.SPECS))
        p.add_argument("--n", type=int, default=50)
        p.add_argument("--seed", type=int, default=42)
        p.add_argument("--show", type=int, default=8)
        p.add_argument("--field", choices=("during", "after_months", "geo"))
        p.add_argument("--verified-only", action="store_true")
        p.set_defaults(func=fn)
    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
