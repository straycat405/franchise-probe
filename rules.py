"""규칙 기반 추출기.

LLM 없이 어디까지 되는지가 기준선이다. 여기서 실패하거나 조용히 틀리는
구간이 골든셋의 범위이자 LLM이 맡을 몫이다.

추출기는 (값, 근거문장) 을 함께 돌려준다. 근거 없는 값은 제품에 실을 수
없으므로 규칙 단계에서부터 근거를 붙인다.
"""

import re

UNIT = re.compile(r"단위\s*[:：]?\s*(백만원|십만원|만원|천원|원)")
MULT = {"원": 1, "천원": 1000, "만원": 10000, "십만원": 100000, "백만원": 1000000}

BRACKET_YEAR = re.compile(r"\[\s*(\d{1,2})\s*\]\s*년")
PLAIN_YEAR = re.compile(r"(\d{1,2})\s*년")
SENT = re.compile(r"[^.。!?]*?(?:다|음|함)\s*[.。]|[^.。!?]{10,}$")

# 계약 종료 후 경업금지. '종료' 뒤 60자 안의 기간만 본다.
AFTER = re.compile(r"(?:계약)?\s*(?:종료|해지|해제)[^.]{0,60}?(\d{1,2})\s*(년|개월)")
DURING = re.compile(r"계약기간\s*(?:중|동안|존속|의\s*존속)")
GEO_RADIUS = re.compile(r"반경\s*([\d.]+)\s*(?:km|킬로|㎞)")
GEO_WORD = re.compile(r"국내\s*전지역|전국|동일\s*지역|영업지역\s*내")


def sentences(text, limit=1200):
    return [s.strip() for s in SENT.findall(text[:limit]) if s.strip()]


def find_sentence(text, pattern, limit=1200):
    """패턴이 걸린 문장을 근거로 돌려준다."""
    for s in sentences(text, limit):
        if pattern.search(s):
            return s
    return None


def norm_num(cell):
    """표 셀의 숫자. 변환 과정에서 자간이 깨져 '8  8 00000' 처럼 오는 셀이 있다."""
    s = cell.replace(" ", "").replace(",", "")
    if not s or not re.fullmatch(r"-?\d+(?:\.\d+)?", s):
        return None
    return float(s)


def contract_years(c):
    """계약기간. '[ 2 ] 년' 채움 서식이 표준이고, 없으면 첫 'N년'."""
    m = BRACKET_YEAR.search(c["text"]) or PLAIN_YEAR.search(c["text"])
    if not m:
        return None, None
    v = int(m.group(1))
    if not 1 <= v <= 20:
        return None, None
    return v, find_sentence(c["text"], BRACKET_YEAR) or find_sentence(c["text"], PLAIN_YEAR)


def initial_fee(c):
    """최초 가맹금 총계. 금액은 표에, 단위는 헤더 문장에 있다."""
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
                        if 0 < won <= 100000000:
                            return won, " | ".join(row[:3])
                        return None, None
                break
    return None, None


def exclusive_area(c):
    """독점적·배타적 영업지역 설정 여부.

    문서 전체에서 부정 표현을 찾으면 안 된다. "설정하여 명시하고 있습니다"로
    시작해 놓고 뒤에 "온라인 판매는 설정하지 않습니다" 같은 예외를 덧붙이는
    경우가 많다. 영업지역 설정을 직접 서술하는 문장만 본다.
    """
    for s in sentences(c["text"], 900):
        if "영업지역" not in s or "설정" not in s:
            continue
        if re.search(r"설정하지\s*않|설정을\s*하지\s*않|설정하고\s*있지\s*않", s):
            return 0, s
        if re.search(r"설정(하여|합니다|하고|하며|한다|함)", s):
            return 1, s
    return None, None


def noncompete(c):
    """경업금지.

    단일 '기간' 필드로 보면 안 된다. 계약기간 중 금지는 대부분 있고,
    변별력은 계약 종료 후 제한에서 나온다. 종료 후 조항이 아예 없는 것과
    2년인 것은 가맹점주에게 전혀 다른 조건이다.

    표에 '경업제한기간 / 경업금지 되는 업종 / 경업제한지역' 열이 있는
    서식도 있어 본문과 표를 함께 본다.
    """
    text = c["text"]
    flat = text + " " + " ".join(" ".join(r) for t in c["tables"] for r in t)

    during = bool(DURING.search(flat))

    after, after_ev = None, None
    m = AFTER.search(flat)
    if m:
        after = int(m.group(1)) * (12 if m.group(2) == "년" else 1)
        after_ev = flat[max(0, m.start() - 40):m.end() + 20].strip()

    geo, geo_ev = None, None
    g = GEO_RADIUS.search(flat)
    if g:
        geo, geo_ev = "반경 %skm" % g.group(1), g.group(0)
    else:
        g = GEO_WORD.search(flat)
        if g:
            geo, geo_ev = g.group(0), g.group(0)

    return {"during": during, "after_months": after, "geo": geo}, \
           {"during": find_sentence(text, DURING), "after_months": after_ev, "geo": geo_ev}


# 골든셋과 평가가 공유하는 명세. key -> (조항코드, 함수, 필드목록)
SPECS = {
    "contract_years": ("JNG_CTRT_UPDT_PD", contract_years, None),
    "initial_fee": ("FRCS_BZMN_FRST_JNNT_INFO", initial_fee, None),
    "exclusive_area": ("MNPLY_ECL_BSN_AREA_STNG_CN", exclusive_area, None),
    "noncompete": ("CMPET_INDUTY_PRHIBT_SCOPE", noncompete,
                   ["during", "after_months", "geo"]),
}
