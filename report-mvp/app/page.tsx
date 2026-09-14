'use client';

import { useState } from 'react';
import {
  ArrowUpRight, BarChart3, BookOpen, Check, ChevronDown, CircleAlert,
  CircleHelp, Database, FileCheck2, FileText, Gauge, Landmark, Search,
  ShieldCheck, Store, TrendingUp, WalletCards,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculated, report } from '../lib/ftc-latest';

type MetricKey = 'sales' | 'stores' | 'cost';

const won = (thousandWon: number) => {
  const tenThousands = Math.round(thousandWon / 10);
  const eok = Math.floor(tenThousands / 10_000);
  const man = tenThousands % 10_000;
  if (eok && man) return `${eok}억 ${man.toLocaleString('ko-KR')}만원`;
  if (eok) return `${eok}억원`;
  return `${man.toLocaleString('ko-KR')}만원`;
};

const metrics: Record<MetricKey, {
  label: string; short: string; value: string; note: string;
  description: string; tone: 'positive' | 'watch'; icon: typeof Gauge;
}> = {
  sales: {
    label: '점포 매출', short: '2025년 점포당 평균매출',
    value: won(report.sales.averageStoreSalesThousandWon),
    note: `${report.sales.reportingStores}개 점포 기준`,
    description: `3.3㎡당 평균매출은 ${won(report.sales.averageSalesPer3_3SqmThousandWon)}입니다. 평균매출은 이익이나 예상수익이 아닙니다.`,
    tone: 'positive', icon: BarChart3,
  },
  stores: {
    label: '점포 흐름', short: '2025년 가맹점 수', value: `${report.stores.yearly[2].stores}개`,
    note: `전년 대비 +${calculated.storeChange}개`,
    description: `2025년 신규 5개, 계약해지 4개로 순증 ${calculated.storeChange}개입니다. 단기 확장과 이탈이 동시에 나타났습니다.`,
    tone: 'positive', icon: Store,
  },
  cost: {
    label: '진입 부담', short: '정보공개서상 창업비용 합계',
    value: won(report.startupCost.disclosedTotalThousandWon),
    note: `${report.startupCost.referenceAreaSqm}㎡ 기준`,
    description: '가맹비·교육비·보증금·기타비용과 인테리어 비용의 공개 합계입니다. 임대차비용과 별도 공사는 포함되지 않을 수 있습니다.',
    tone: 'watch', icon: WalletCards,
  },
};

const questions = [
  '평균매출 산정 대상 8개 점포의 영업개월 수와 지역별 매출 편차를 확인할 수 있나요?',
  '2025년 신규개점 5개와 계약해지 4개의 사유, 해지 점포의 평균 영업기간은 얼마인가요?',
  '기타비용 4,543만원의 세부 항목과 임대보증금·권리금·철거·추가공사 등 제외 비용은 무엇인가요?',
];

const evidence = [
  { title: '점포당 평균매출', value: won(report.sales.averageStoreSalesThousandWon), source: '가맹점사업자 연평균 매출액', quote: `2025년 매출 산정 가맹점 ${report.sales.reportingStores}개, 연평균 매출액 177,570천원, 3.3㎡당 10,445천원` },
  { title: '가맹점 증감', value: `7개 → 8개`, source: '가맹점 및 직영점 현황', quote: '2025년 신규개점 5개, 계약종료 0개, 계약해지 4개, 명의변경 0개' },
  { title: '공개 창업비용', value: won(report.startupCost.disclosedTotalThousandWon), source: '가맹점사업자의 부담', quote: '가맹비 3,300천원, 교육비 1,100천원, 보증금 1,000천원, 기타 45,430천원, 인테리어 18,480천원' },
  { title: '가맹본부 재무', value: `매출 ${won(report.headquarters.revenueThousandWon)}`, source: '가맹본부 재무상황', quote: `2025년 영업이익 ${won(report.headquarters.operatingProfitThousandWon)}, 당기순이익 ${won(report.headquarters.netIncomeThousandWon)}, 영업이익률 ${calculated.operatingMargin.toFixed(1)}%` },
  { title: '계약·법 위반 이력', value: '최초 2년 · 갱신 1년', source: '계약기간 및 법 위반 사실', quote: '공정위 시정조치 0건, 민사상 패소·화해 0건, 형사처벌 0건' },
];

function StoreTrendChart() {
  return <div className="trend-chart actual-trend" role="img" aria-label="가맹점 수 2023년 0개, 2024년 7개, 2025년 8개">
    <svg viewBox="0 0 660 250" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--signal)" stopOpacity=".23"/><stop offset="100%" stopColor="var(--signal)" stopOpacity="0"/></linearGradient></defs>
      {[42,92,142,192].map(y => <line key={y} x1="44" x2="640" y1={y} y2={y} className="grid-line"/>)}
      <path d="M62 208 L344 68 L624 48 L624 210 L62 210 Z" fill="url(#areaFill)"/>
      <path d="M62 208 L344 68 L624 48" className="brand-line"/>
      {[{x:62,y:208,v:0},{x:344,y:68,v:7},{x:624,y:48,v:8}].map(p => <g key={p.x}><circle cx={p.x} cy={p.y} r="5" className="brand-dot"/><text x={p.x} y={p.y-13} textAnchor="middle" className="value-label">{p.v}</text></g>)}
      <text x="62" y="235">2023</text><text x="344" y="235" textAnchor="middle">2024</text><text x="624" y="235" textAnchor="end">2025</text>
    </svg>
  </div>;
}

function CostBreakdown() {
  const items = [
    ['가맹비', report.startupCost.franchiseFeeThousandWon, 'fee'],
    ['교육비', report.startupCost.trainingFeeThousandWon, 'training'],
    ['보증금', report.startupCost.depositThousandWon, 'deposit'],
    ['기타비용', report.startupCost.otherCostThousandWon, 'other'],
    ['인테리어', report.startupCost.interiorThousandWon, 'interior'],
  ] as const;
  return <div className="cost-breakdown">
    <div className="cost-total"><span>공개 합계</span><strong>{won(report.startupCost.disclosedTotalThousandWon)}</strong><small>{report.startupCost.referenceAreaSqm}㎡ 기준</small></div>
    <div className="cost-stack" aria-label="공개 창업비용 구성">{items.map(([name,value,key]) => <span key={key} className={key} style={{width:`${value / report.startupCost.disclosedTotalThousandWon * 100}%`}} title={`${name} ${won(value)}`}/>)}</div>
    <div className="cost-legend">{items.map(([name,value,key]) => <div key={key}><i className={key}/><span>{name}</span><b>{won(value)}</b></div>)}</div>
  </div>;
}

export default function Home() {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('sales');
  const [copiedQuestion, setCopiedQuestion] = useState<number | null>(null);
  const copyQuestion = async (question: string, index: number) => {
    await navigator.clipboard.writeText(question);
    setCopiedQuestion(index);
  };

  return <main className="min-h-screen bg-background text-foreground">
    <header className="topbar"><div className="shell topbar-inner"><a href="#top" className="brand-lockup" aria-label="프랜차이즈 프로브 홈"><span className="brand-mark"><Gauge/></span><span>FRANCHISE<span>PROBE</span></span></a><div className="search-shell" role="search"><Search aria-hidden="true"/><input aria-label="브랜드명 또는 가맹본부 검색" value={report.brand.name} readOnly/><kbd>⌘ K</kbd></div><div className="source-chip"><Database/> 공정위 공개자료</div></div></header>
    <div id="top" className="shell page-shell">
      <aside className="data-notice"><ShieldCheck/><p><b>공정위 최신 등록본 적용</b> · 최종등록 {report.source.disclosureFinalRegisteredAt} · 실적 기준 {report.source.performanceYear}년 · 확인일 {report.source.observedAt}</p><a href={report.source.url} target="_blank" rel="noreferrer">공식 원문 <ArrowUpRight/></a></aside>

      <section className="report-head"><div><div className="breadcrumb">{report.brand.category.replace(' > ', ' / ')} <span>/</span> 브랜드 분석</div><div className="title-row"><h1>{report.brand.name}</h1><Badge className="status-badge">실데이터</Badge></div><p>{report.brand.company} · 등록번호 {report.source.registrationNumber} · 가맹사업 개시 {report.brand.franchiseStartedAt}</p></div><div className="brand-picker"><Store/> 단일 브랜드 MVP</div></section>

      <section className="verdict-grid" aria-labelledby="verdict-title"><div className="verdict-card"><div className="section-kicker"><ShieldCheck/> 지금 확인 가능한 결론</div><h2 id="verdict-title">실제 매출과 점포 흐름은 확인됐지만,<br/>시장 내 백분위는 아직 보류합니다.</h2><p>최신 정보공개서의 절대값을 먼저 보여줍니다. 동일 기준연도 비교표본이 최소 30개에 미달해 ‘상위 몇 %’는 표시하지 않았습니다.</p><div className="verdict-tags"><span className="good"><BarChart3/> 평균매출 {won(report.sales.averageStoreSalesThousandWon)}</span><span className="good"><TrendingUp/> 점포 전년 대비 +{calculated.storeChange}</span><span className="warn"><WalletCards/> 공개비용 {won(report.startupCost.disclosedTotalThousandWon)}</span></div></div><div className="confidence-card"><div className="confidence-head"><span>데이터 판정</span><b>원문 A</b></div><div className="confidence-meter"><i/><i/><i/><i className="off"/></div><ul><li><Check/> 최신 등록일 확인</li><li><Check/> 2025년 원문 수치 연결</li><li><Check/> 계산식 공개</li><li className="muted">— 업계 백분위 표본 부족</li></ul></div></section>

      <section className="metric-section" aria-labelledby="metrics-title"><div className="section-heading"><div><span className="section-kicker"><Gauge/> 공개 수치</span><h2 id="metrics-title">비교 전에, 사실부터 정확하게</h2></div><div className="cohort-meta"><span>비교표본</span><b>한식 유효 {report.cohortAudit.usableSalesRecords}/{report.cohortAudit.minimumRequired}개</b><span title="동일한 기준연도와 업종의 유효 표본"><CircleHelp/></span></div></div>
        <Tabs value={activeMetric} onValueChange={v => setActiveMetric(v as MetricKey)}><TabsList className="metric-tabs" aria-label="핵심 지표 선택">{(Object.entries(metrics) as [MetricKey, typeof metrics[MetricKey]][]).map(([key,m]) => { const Icon=m.icon; return <TabsTrigger key={key} value={key} className="metric-tab"><span className={`metric-icon ${m.tone}`}><Icon/></span><span className="metric-copy"><small>{m.label}</small><strong>{m.value}</strong><em>{m.note}</em></span></TabsTrigger>; })}</TabsList>
          {(Object.keys(metrics) as MetricKey[]).map(key => { const m=metrics[key]; return <TabsContent key={key} value={key} className="metric-detail"><div><span className="detail-label">{m.short}</span><strong>{m.value}</strong><p>{m.description}</p></div><div className="audit-panel"><div><CircleAlert/><b>백분위 산출 보류</b></div><p>{report.cohortAudit.reason}</p><span>확보 {report.cohortAudit.usableSalesRecords}개</span><progress value={report.cohortAudit.usableSalesRecords} max={report.cohortAudit.minimumRequired}/><span>최소 {report.cohortAudit.minimumRequired}개</span></div></TabsContent>; })}
        </Tabs>
      </section>

      <section className="analysis-grid"><Card className="analysis-card"><CardHeader><div><span className="section-kicker"><WalletCards/> 비용 구성</span><CardTitle>공개된 {won(report.startupCost.disclosedTotalThousandWon)}은 무엇으로 구성되나</CardTitle></div><Badge variant="outline">{report.startupCost.referenceAreaSqm}㎡</Badge></CardHeader><CardContent><CostBreakdown/><p className="chart-takeaway"><CircleAlert/> ‘기타비용’이 가장 큽니다. 포함 항목과 임대차·별도공사 등 정보공개서 밖의 비용을 견적서로 확인해야 합니다.</p></CardContent></Card>
        <Card className="analysis-card trend-card"><CardHeader><div><span className="section-kicker"><Store/> 점포 흐름</span><CardTitle>2024년 7개 → 2025년 8개</CardTitle></div><span className="delta positive">+{calculated.storeGrowthRate.toFixed(1)}%</span></CardHeader><CardContent><div className="chart-legend"><span className="brand-key">{report.brand.name} 가맹점 수</span></div><StoreTrendChart/><div className="flow-numbers"><div><span>신규개점</span><b>{report.stores.openings2025}</b></div><div><span>계약종료</span><b>{report.stores.expirations2025}</b></div><div><span>계약해지</span><b>{report.stores.cancellations2025}</b></div><div><span>순증감</span><b className="positive">+{calculated.storeChange}</b></div></div></CardContent></Card></section>

      <section className="financial-section"><div><span className="section-kicker"><Landmark/> 가맹본부 재무</span><h2>본사 숫자는 점포 수익성과 구분해서 봅니다</h2><p>2025년 재무제표 기준. 본사 매출과 이익은 개별 가맹점의 이익이 아닙니다.</p></div><div className="financial-grid"><div><span>본사 매출</span><b>{won(report.headquarters.revenueThousandWon)}</b></div><div><span>영업이익</span><b>{won(report.headquarters.operatingProfitThousandWon)}</b><small>영업이익률 {calculated.operatingMargin.toFixed(1)}%</small></div><div><span>부채 / 자본</span><b>{calculated.debtToEquity.toFixed(1)}%</b><small>부채 {won(report.headquarters.liabilitiesThousandWon)}</small></div></div></section>

      <section className="question-section" aria-labelledby="questions-title"><div className="question-intro"><span className="section-kicker"><CircleAlert/> 다음 행동</span><h2 id="questions-title">이 숫자로 본사에 물어볼 질문</h2><p>공개자료가 답하지 못하는 부분을 계약 전에 확인합니다.</p></div><ol className="question-list">{questions.map((q,i) => <li key={q}><span>{i+1}</span><p>{q}</p><button onClick={() => copyQuestion(q,i)} aria-label={`${i+1}번 질문 복사`}>{copiedQuestion===i ? <Check/> : <FileCheck2/>}</button></li>)}</ol></section>

      <section className="contract-section" aria-labelledby="contract-title"><div className="section-heading"><div><span className="section-kicker"><FileText/> 원문 근거</span><h2 id="contract-title">숫자마다 출처를 연결했습니다</h2></div><p>공정위 정보공개서 최종등록 {report.source.disclosureFinalRegisteredAt}</p></div><div className="evidence-list">{evidence.map((item,index) => <details key={item.title} open={index===0}><summary><span className="evidence-index">0{index+1}</span><div><small>{item.title}</small><strong>{item.value}</strong></div><span className="evidence-source">{item.source}</span><ChevronDown/></summary><div className="evidence-body"><BookOpen/><blockquote>{item.quote}</blockquote><span className="source-status"><Check/> 원문 확인</span></div></details>)}</div></section>

      <footer><div className="footer-brand"><span className="brand-mark"><Gauge/></span><b>FRANCHISEPROBE</b></div><p>{report.source.authority} 정보공개서 기반 · 평균매출은 이익이나 예상수익을 의미하지 않습니다.</p><span>실데이터 MVP · {report.source.observedAt}</span></footer>
    </div>
  </main>;
}
