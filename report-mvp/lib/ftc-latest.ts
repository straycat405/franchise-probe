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
