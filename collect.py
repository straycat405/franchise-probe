"""정보공개서 본문 수집기.

일련번호 순으로 받으면 한 가맹본부가 연속 등록한 브랜드에 표본이 몰린다
(실측 30건 중 14건이 동일 본부였다). 연도 목록을 모두 모은 뒤 섞어서
뽑는다.

    python3 collect.py --limit 200
    python3 collect.py --limit 200 --years 2025 --seed 7
"""

import argparse
import os
import random
import time

import ftc


def parse_years(spec):
    years = []
    for part in spec.split(","):
        part = part.strip()
        if "-" in part:
            a, b = part.split("-")
            years.extend(range(int(a), int(b) + 1))
        elif part:
            years.append(int(part))
    return years


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--years", default="2017-2025")
    ap.add_argument("--limit", type=int, default=200, help="수집할 문서 수")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--delay", type=float, default=0.8)
    ap.add_argument("--no-shuffle", action="store_true",
                    help="섞지 않고 일련번호 순으로 (편향됨, 비교용)")
    args = ap.parse_args()

    key = ftc.require_key()
    os.makedirs(ftc.DATA, exist_ok=True)
    years = parse_years(args.years)

    print("[1] 연도별 목록 수집")
    pool, totals = [], {}
    for y in years:
        rows, total = ftc.fetch_year_list(key, y, args.delay / 2)
        totals[y] = total
        pool.extend(rows)
        print("    %d  목록 %5s건  수집 %5d건" % (y, format(total, ","), len(rows)))
    print("    ─────────────────────────")
    print("    합계 %s건" % format(len(pool), ","))
    if len(pool) <= 1:
        raise SystemExit("\n목록이 1건 이하다. 발급 키가 아니라 샘플 키일 수 있다.")

    if not args.no_shuffle:
        random.Random(args.seed).shuffle(pool)
    target = pool[:args.limit]

    by_corp = {}
    for r in target:
        by_corp.setdefault(r["corpNm"], []).append(r["brandNm"])
    print("    표본 %d건 / 가맹본부 %d곳 (본부당 평균 %.2f개 브랜드)"
          % (len(target), len(by_corp), len(target) / max(1, len(by_corp))))

    print("\n[2] 본문 수집")
    idx = ftc.load_index()
    ok = new = fail = 0
    t0 = time.time()
    for i, r in enumerate(target, 1):
        sn = r["jngIfrmpSn"]
        try:
            xml, cached = ftc.fetch_content(key, sn)
        except Exception as e:
            fail += 1
            print("    %4d/%d  %s  실패: %s" % (i, len(target), sn, e))
            continue
        ok += 1
        idx[sn] = {k: r[k] for k in ("corpNm", "brandNm", "brno", "year")}
        idx[sn]["chars"] = len(xml)
        if not cached:
            new += 1
            time.sleep(args.delay)
        if i % 20 == 0 or i == len(target):
            ftc.save_index(idx)
            print("    %4d/%d  누적 %d건 (신규 %d) %.0f초 경과"
                  % (i, len(target), ok, new, time.time() - t0))

    ftc.save_index(idx)
    size = sum(os.path.getsize(os.path.join(ftc.DATA, f))
               for f in os.listdir(ftc.DATA) if f.endswith(".xml.gz"))
    print("\n[3] 요약")
    print("    성공 %d / 실패 %d / 신규 다운로드 %d" % (ok, fail, new))
    print("    캐시 총 %d건, %.1f MB" % (len(ftc.cached_ids()), size / 1024 / 1024))
    print("    다음:  python3 analyze.py")


if __name__ == "__main__":
    main()
