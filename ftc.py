"""정보공개서 API 클라이언트와 XML 파서.

본문은 gzip으로 오고, 루트 엘리먼트가 <xml ...> 이라 표준 XML 파서가
거부한다. 구조가 단순하고 예측 가능하므로 정규식으로 조항을 잘라낸다.
"""

import gzip
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://franchise.ftc.go.kr/api/search.do"
ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "data")
INDEX = os.path.join(DATA, "index.json")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"

# 조항 헤더. 속성 순서가 문서마다 다르므로 전방탐색으로 각각 잡는다.
HEADER = re.compile(
    r'<(h[1-4])\b(?=[^>]*\battrb_sn="(?P<sn>[^"]+)")'
    r'(?=[^>]*\battr="(?P<attr>[^"]+)")'
    r'(?=[^>]*\btitle="(?P<title>[^"]*)")[^>]*>',
    re.I,
)
TAG = re.compile(r"<[^>]+>")
TD = re.compile(r"<t[dh][^>]*>(.*?)</t[dh]>", re.S | re.I)
TR = re.compile(r"<tr[^>]*>(.*?)</tr>", re.S | re.I)
TABLE = re.compile(r"<table[^>]*>(.*?)</table>", re.S | re.I)


def load_env():
    """프로젝트 폴더의 .env 를 읽는다. 이미 설정된 환경변수가 우선."""
    path = os.path.join(ROOT, ".env")
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip("\"'"))


def require_key():
    load_env()
    key = os.environ.get("FTC_SERVICE_KEY")
    if not key:
        sys.exit("키를 찾을 수 없다. .env 에 FTC_SERVICE_KEY=... 를 넣어라.")
    return key


def fetch(params, retries=3):
    url = BASE + "?" + urllib.parse.urlencode(params)
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=90) as res:
                body = res.read()
            if body[:2] == b"\x1f\x8b":  # Accept-Encoding과 무관하게 gzip으로 온다
                body = gzip.decompress(body)
            return body.decode("utf-8", errors="replace")
        except (urllib.error.URLError, OSError) as e:
            if attempt == retries - 1:
                raise
            print(f"    재시도 {attempt + 1}/{retries}: {e}", file=sys.stderr)
            time.sleep(2 * (attempt + 1))


def total_count(key, year):
    xml = fetch({"type": "list", "yr": year, "serviceKey": key, "numOfRows": 1})
    m = re.search(r"<totalCount>(\d+)</totalCount>", xml)
    return int(m.group(1)) if m else 0


def fetch_year_list(key, year, delay=0.4):
    """해당 연도 목록 전체. yr 은 누적이 아니라 연도별 등록분이다."""
    out, page = [], 1
    total = total_count(key, year)
    while len(out) < total:
        xml = fetch({"type": "list", "yr": year, "serviceKey": key,
                     "pageNo": page, "numOfRows": 200})
        chunk = re.findall(r"<item>(.*?)</item>", xml, re.S)
        if not chunk:
            break
        for raw in chunk:
            row = {"year": year}
            for t in ("jngIfrmpSn", "corpNm", "brandNm", "brno"):
                m = re.search(r"<%s>(.*?)</%s>" % (t, t), raw, re.S)
                row[t] = (m.group(1).strip() if m else "")
            if row["jngIfrmpSn"]:
                out.append(row)
        page += 1
        time.sleep(delay)
    return out, total


def content_path(sn):
    return os.path.join(DATA, "%s.xml.gz" % sn)


def fetch_content(key, sn):
    """본문은 크므로 디스크에 캐시한다. 반환값 (xml, 캐시여부)."""
    path = content_path(sn)
    if os.path.exists(path) and os.path.getsize(path) > 0:
        with gzip.open(path, "rt", encoding="utf-8", errors="replace") as f:
            return f.read(), True
    xml = fetch({"type": "content", "jngIfrmpSn": sn, "serviceKey": key})
    with gzip.open(path, "wt", encoding="utf-8") as f:
        f.write(xml)
    return xml, False


def read_cached(sn):
    path = content_path(sn)
    if not os.path.exists(path):
        return None
    with gzip.open(path, "rt", encoding="utf-8", errors="replace") as f:
        return f.read()


def cached_ids():
    if not os.path.isdir(DATA):
        return []
    return sorted(f[:-7] for f in os.listdir(DATA) if f.endswith(".xml.gz"))


def clean(s):
    s = TAG.sub(" ", s)
    s = s.replace("&nbsp;", " ").replace("&amp;", "&")
    return re.sub(r"\s+", " ", s).strip()


def parse_tables(segment):
    """조항 구간 안의 표를 행 단위 셀 리스트로 반환한다."""
    tables = []
    for body in TABLE.findall(segment):
        rows = [[clean(c) for c in TD.findall(tr)] for tr in TR.findall(body)]
        rows = [r for r in rows if any(r)]
        if rows:
            tables.append(rows)
    return tables


def parse_clauses(xml):
    """조항 코드 -> {sn, title, text, tables}. 헤더 사이 구간을 본문으로 본다."""
    marks = [(m.start(), m.end(), m.group("sn"), m.group("attr"), m.group("title"))
             for m in HEADER.finditer(xml)]
    out = {}
    for i, (_, end, sn, attr, title) in enumerate(marks):
        stop = marks[i + 1][0] if i + 1 < len(marks) else len(xml)
        seg = xml[end:stop]
        out[attr] = {"sn": sn, "title": title,
                     "text": clean(seg), "tables": parse_tables(seg)}
    return out


def load_index():
    if os.path.exists(INDEX):
        with open(INDEX, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_index(idx):
    os.makedirs(DATA, exist_ok=True)
    with open(INDEX, "w", encoding="utf-8") as f:
        json.dump(idx, f, ensure_ascii=False, indent=1)
