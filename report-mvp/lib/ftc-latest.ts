export const report = {
  source: {
    authority: '공정거래위원회 가맹사업거래',
    disclosureFinalRegisteredAt: '2026-09-14',
    observedAt: '2026-09-15',
    registrationNumber: '20241145',
    performanceYear: 2025,
    url: 'https://franchise.ftc.go.kr/mnu/00013/program/userRqst/list.do',
  },
  brand: {
    name: '청담해장국', company: '(주)국밥생각', category: '외식 > 한식',
    franchiseStartedAt: '2024-11-01',
  },
  stores: {
    yearly: [{ year: 2023, stores: 0 }, { year: 2024, stores: 7 }, { year: 2025, stores: 8 }],
    openings2025: 5, expirations2025: 0, cancellations2025: 4, ownershipChanges2025: 0,
  },
  sales: {
    reportingStores: 8,
    averageStoreSalesThousandWon: 177_570,
    averageSalesPer3_3SqmThousandWon: 10_445,
  },
  startupCost: {
    franchiseFeeThousandWon: 3_300, trainingFeeThousandWon: 1_100,
    depositThousandWon: 1_000, otherCostThousandWon: 45_430,
    subtotalThousandWon: 50_830, interiorThousandWon: 18_480,
    disclosedTotalThousandWon: 69_310, referenceAreaSqm: 46,
  },
  headquarters: {
    year: 2025, assetsThousandWon: 1_402_303, liabilitiesThousandWon: 952_986,
    equityThousandWon: 449_317, revenueThousandWon: 6_018_740,
    operatingProfitThousandWon: 206_927, netIncomeThousandWon: 195_879,
  },
  contract: {
    firstTermYears: 2, renewalTermYears: 1, ftcCorrectiveActions: 0,
    civilLossesOrSettlements: 0, criminalSentences: 0,
  },
  cohortAudit: {
    category: '한식', requestedRecords: 30, retrievedBeforeRateLimit: 5,
    usableSalesRecords: 4, minimumRequired: 30, percentileStatus: '보류',
    reason: '동일 기준연도 비교표본이 최소 기준에 미달해 백분위를 표시하지 않습니다.',
  },
} as const;

export const calculated = {
  storeChange: report.stores.yearly[2].stores - report.stores.yearly[1].stores,
  storeGrowthRate: ((report.stores.yearly[2].stores - report.stores.yearly[1].stores) / report.stores.yearly[1].stores) * 100,
  operatingMargin: (report.headquarters.operatingProfitThousandWon / report.headquarters.revenueThousandWon) * 100,
  debtToEquity: (report.headquarters.liabilitiesThousandWon / report.headquarters.equityThousandWon) * 100,
} as const;
