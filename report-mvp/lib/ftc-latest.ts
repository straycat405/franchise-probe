export const report = {
  checkedAt: '2026.09.15',
  brand: { name: '한솥', company: '(주)한솥', performanceYear: 2024 },
  sales: {
    seoulAverageThousandWon: 457_442,
    seoulAveragePerPyeongThousandWon: 37_403,
    reportingStores: 113,
    nationwideAverageThousandWon: 408_402,
    nationwideReportingStores: 787,
  },
  stores: {
    yearly: [{ year: 2022, stores: 767 }, { year: 2023, stores: 793 }, { year: 2024, stores: 811 }],
    openings: 51, expirations: 0, cancellations: 33,
  },
  headquarters: {
    revenueThousandWon: 140_609_091, operatingProfitThousandWon: 14_609_453,
    liabilitiesThousandWon: 15_443_146, equityThousandWon: 77_395_982,
  },
  fees: {
    initialFranchiseFeeThousandWon: 12_100, operatingDepositThousandWon: 4_000,
    monthly: [
      { label: '로열티', value: '33만원 / 월' },
      { label: '광고·판촉비', value: '11만원 / 월' },
      { label: 'POS 유지관리비', value: '2.2만원 / 월' },
    ],
  },
  contract: {
    registrationSn: '284840',
    items: [
      { label: '가맹계약기간', value: '최초 3년 · 재계약 1년', evidence: '가맹점 타입 최초 계약기간 3년, 재계약 기간 1년 (엔젤점 타입 2년)' },
      { label: '계약 종료 후 경업금지', value: '조항 없음', evidence: '계약기간동안(계약해지의 경우 계약 잔여기간을 포함) 동일한 업종의 영업을 하는 행위를 금지 — 종료 후 제한 문구 없음' },
      { label: '영업지역', value: '계약서에 설정·명시', evidence: '가맹계약 체결 시 영업지역을 설정하여 가맹계약서에 명시. 계약기간 중 정당한 사유 없이 영업지역 내 동일 업종 직영점·가맹점 추가 개설 안 함' },
      { label: '최초 가맹금 구성', value: '가맹비 660만원 + 교육비 550만원', evidence: '총계 12,100천원(부가세 포함). 교육 시작 후 계약해지 시 교육비 반환 안 됨' },
    ],
  },
  area: {
    name: '여의도역 권역', radius: '500m', foodStores: 776, categories: 39,
    lunchAlternatives: [{ label: '백반·한정식', count: 200 }, { label: '김밥·분식', count: 29 }, { label: '구내식당', count: 13 }],
  },
  scenario: {
    sourceYear: 2025,
    yeouidoMarketMultiplier: 1.233,
    localAnnualSalesPerStoreWon: 533_562_124,
    seoulDevelopmentAreaAnnualSalesPerStoreWon: 432_874_150,
  },
  source: {
    ftcUrl: 'https://franchise.ftc.go.kr/mnu/00013/program/userRqst/list.do',
    sbizUrl: 'https://www.data.go.kr/data/15083033/openapi.do',
    seoulCommercialUrl: 'https://data.seoul.go.kr/dataList/OA-15572/A/1/datasetView.do',
  },
} as const;

export const calculated = {
  storeChange: report.stores.yearly[2].stores - report.stores.yearly[1].stores,
  operatingMargin: (report.headquarters.operatingProfitThousandWon / report.headquarters.revenueThousandWon) * 100,
  debtToEquity: (report.headquarters.liabilitiesThousandWon / report.headquarters.equityThousandWon) * 100,
} as const;
