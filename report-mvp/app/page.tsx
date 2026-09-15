'use client';

import { useState } from 'react';
import { ArrowUpRight, Check, Clipboard, Database, Landmark, MapPin, Search, TrendingUp, WalletCards } from 'lucide-react';
import { CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { calculated, report } from '../lib/ftc-latest';

const eok = (thousandWon: number) => `${(thousandWon / 100_000).toFixed(2).replace(/\.00$/, '')}억원`;
const man = (thousandWon: number) => `${(thousandWon / 10).toLocaleString('ko-KR')}만원`;
const questions = [
  '2024년 계약해지 33건의 사유와 평균 영업기간을 확인할 수 있나요?',
  '여의도역 후보지의 영업지역 설정 기준과 인근 출점 계획은 무엇인가요?',
  '월 정액비용 외 물류·앱·기기 관련 비용은 각각 얼마인가요?',
];
const areaTiles = [-1, 0, 1].flatMap((row) => [-1, 0, 1].map((column) => ({
  x: 55873 + column,
  y: 25389 + row,
})));
const storeTrend = report.stores.yearly.map(({ year, stores }) => ({ year: `${year}년`, stores }));
const trendDomain = [
  Math.floor(Math.min(...storeTrend.map(({ stores }) => stores)) / 10) * 10 - 20,
  Math.ceil(Math.max(...storeTrend.map(({ stores }) => stores)) / 10) * 10 + 10,
];

export default function Home() {
  const [copied, setCopied] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [areaSqm, setAreaSqm] = useState(40);
  const normalizedAreaSqm = Number.isFinite(areaSqm) && areaSqm > 0 ? areaSqm : 1;
  const baseScenarioThousandWon = report.sales.seoulAveragePerPyeongThousandWon * (normalizedAreaSqm / 3.3) * report.scenario.yeouidoMarketMultiplier;
  const revenueScenarios = [
    { label: '보수', value: baseScenarioThousandWon * 0.85, note: '기준값 -15%' },
    { label: '기준', value: baseScenarioThousandWon, note: '입력 면적 기준' },
    { label: '상향', value: baseScenarioThousandWon * 1.15, note: '기준값 +15%' },
  ];
  const copyQuestion = async (question: string, index: number) => {
    await navigator.clipboard.writeText(question);
    setCopied(index);
    window.setTimeout(() => setCopied(null), 1600);
  };

  const searchBrand = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchStatus(query.trim() === report.brand.name ? `${report.brand.name} 리포트를 표시 중입니다.` : '현재 시연 데이터는 한솥만 준비되어 있습니다.');
  };

  return <main>
    <header className="topbar"><div className="shell topbar-inner"><a className="brand" href="#top">FRANCHISE<span>PROBE</span></a><form className="brand-search" onSubmit={searchBrand}><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="브랜드 검색" aria-label="브랜드 검색" /><button type="submit">검색</button></form><span className="topbar-tag">계약 전 확인 리포트</span></div>{searchStatus && <p className="search-status" role="status">{searchStatus}</p>}</header>
    <div id="top" className="shell page">
      <section className="hero"><div><p className="eyebrow"><span /> 후보 상권 · {report.area.name}</p><h1>{report.brand.name}</h1><p className="hero-copy">브랜드와 후보지를 함께 확인합니다.</p></div><div className="checked"><Check /> 공식 공개자료 확인 · {report.checkedAt}</div></section>
      <section className="notice" aria-label="리포트 사용 안내"><Database /><p>평균매출은 이익·여의도 예상매출이 아닙니다. 상권 업소 수는 경쟁 강도를 보는 참고값입니다.</p></section>
      <section className="quick-facts" aria-label="핵심 수치">
        <div><p>서울 가맹점 평균매출</p><strong>{eok(report.sales.seoulAverageThousandWon)}</strong><span>{report.sales.reportingStores}개 산정 · {report.brand.performanceYear}년</span></div>
        <div><p>가맹점 수</p><strong>{report.stores.yearly[2].stores}개</strong><span>전년 대비 +{calculated.storeChange}개</span></div>
        <div><p>계약종료·해지</p><strong>{report.stores.expirations + report.stores.cancellations}개</strong><span>신규개점 {report.stores.openings}개 · {report.brand.performanceYear}년</span></div>
        <div><p>최초 가맹금</p><strong>{man(report.fees.initialFranchiseFeeThousandWon)}</strong><span>가맹비·교육비 · 별도 비용 확인</span></div>
      </section>
      <section className="split-section area-section" aria-labelledby="area-title"><div className="section-title"><p className="eyebrow"><MapPin /> 후보지</p><h2 id="area-title">여의도역 500m</h2><p>점심 대체 업종을 먼저 봅니다.</p></div><div className="area-content"><div className="map-frame"><div className="tile-grid">{areaTiles.map((tile) => <img key={`${tile.x}-${tile.y}`} src={`https://tile.openstreetmap.org/16/${tile.x}/${tile.y}.png`} alt="" />)}</div><div className="radius-ring"><span>분석 범위<br />500m</span></div><small>© OpenStreetMap contributors</small></div><div className="area-summary"><div><span>음식업소</span><strong>{report.area.foodStores.toLocaleString('ko-KR')}<small>개</small></strong><em>{report.area.categories}개 업종</em></div><div className="area-list">{report.area.lunchAlternatives.map((item) => <p key={item.label}><span>{item.label}</span><b>{item.count}개</b></p>)}</div><p className="card-note">한솥의 직접 경쟁점 수가 아니라, 점심 선택지의 공개 업종 분포입니다.</p></div></div></section>
      <section className="split-section scenario-section" aria-labelledby="scenario-title"><div className="section-title"><p className="eyebrow">가정 기반</p><h2 id="scenario-title">입점 매출 시나리오</h2><p>면적과 공개 상권 데이터를 함께 반영합니다.</p></div><div className="scenario-panel"><label className="area-input"><span>예정 전용면적</span><div><input type="number" min="1" step="1" value={areaSqm || ''} onChange={(event) => setAreaSqm(Number(event.target.value))} aria-label="예정 전용면적 제곱미터" /><b>㎡</b></div><small>{(normalizedAreaSqm / 3.3).toFixed(1)}평</small></label><div className="scenario-values">{revenueScenarios.map((scenario) => <div key={scenario.label} className={scenario.label === '기준' ? 'is-base' : ''}><span>{scenario.label}</span><strong>{eok(scenario.value)}</strong><small>{scenario.note}</small></div>)}</div><div className="scenario-formula"><p>한솥 서울 평당 평균매출 × {normalizedAreaSqm}㎡ × 여의도역 한식 상권 보정 {report.scenario.yeouidoMarketMultiplier.toFixed(2)}배</p><span>한솥 2024년 · 상권 2025년 공개자료 기준</span></div><p className="card-note">개별 매장 실매출·임대료·배달비·운영 역량은 반영하지 않은 판단 보조용 민감도 시나리오입니다.</p></div></section>
      <section className="split-section flow-section" aria-labelledby="flow-title"><div className="section-title"><p className="eyebrow"><TrendingUp /> 점포 흐름</p><h2 id="flow-title">전년 대비 +{calculated.storeChange}개</h2><p>가맹점 수와 계약 종료·해지를 함께 봅니다.</p></div><div className="flow-card"><div className="trend-chart" aria-label="가맹점 수 2022년 767개, 2023년 793개, 2024년 811개"><ResponsiveContainer width="100%" height={180}><LineChart data={storeTrend} margin={{ top: 28, right: 24, left: -8, bottom: 4 }}><CartesianGrid vertical={false} stroke="#edf1f5" /><XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#6d7b90', fontSize: 11 }} dy={9} /><YAxis domain={trendDomain} axisLine={false} tickLine={false} tick={{ fill: '#8b97a7', fontSize: 10 }} width={35} tickCount={3} /><Tooltip cursor={{ stroke: '#cdd8e6', strokeWidth: 1 }} contentStyle={{ border: '1px solid #dfe6ef', borderRadius: 4, boxShadow: '0 6px 18px rgba(18,35,60,.10)', fontSize: 12 }} labelStyle={{ color: '#6d7b90' }} formatter={(value) => [`${value}개`, '가맹점 수']} /><Line type="linear" dataKey="stores" name="가맹점 수" stroke="#1976f3" strokeWidth={3} dot={{ r: 5, fill: '#1976f3', stroke: '#fff', strokeWidth: 3 }} activeDot={{ r: 6, fill: '#1976f3', stroke: '#fff', strokeWidth: 3 }}><LabelList dataKey="stores" position="top" offset={12} fill="#13233c" fontSize={12} fontWeight={800} /></Line></LineChart></ResponsiveContainer></div><div className="flow-numbers"><span>신규개점 <b>{report.stores.openings}개</b></span><span>계약종료·해지 <b>{report.stores.expirations + report.stores.cancellations}개</b></span><span>전년 대비 <b>+{calculated.storeChange}개</b></span></div></div></section>
      <section className="details-grid"><article className="detail-card"><div className="icon"><WalletCards /></div><div><p className="eyebrow">계약 후 비용</p><h2>매월 확인할 항목</h2></div><ul>{report.fees.monthly.map((fee) => <li key={fee.label}><span>{fee.label}</span><b>{fee.value}</b></li>)}</ul><p className="card-note">정보공개서 표기 기준. 앱 수수료·교육 등 별도 항목도 확인하세요.</p></article><article className="detail-card"><div className="icon"><Landmark /></div><div><p className="eyebrow">가맹본부 재무</p><h2>{report.brand.company} 재무현황</h2></div><ul><li><span>매출</span><b>{eok(report.headquarters.revenueThousandWon)}</b></li><li><span>영업이익률</span><b>{calculated.operatingMargin.toFixed(1)}%</b></li><li><span>부채 / 자본</span><b>{calculated.debtToEquity.toFixed(1)}%</b></li></ul><p className="card-note">개별 가맹점의 이익·수익성을 뜻하지 않습니다.</p></article></section>
      <section className="questions" aria-labelledby="questions-title"><div><p className="eyebrow">다음 행동</p><h2 id="questions-title">본사에 물어볼 질문</h2></div><ol>{questions.map((question, index) => <li key={question}><span>{index + 1}</span><p>{question}</p><button type="button" onClick={() => copyQuestion(question, index)} aria-label={`${index + 1}번 질문 복사`}>{copied === index ? <Check /> : <Clipboard />}</button></li>)}</ol></section>
      <footer><div><b>출처</b><span>공정거래위원회 정보공개서 · 2024년 실적</span><span>소상공인시장진흥공단 상가(상권)정보 API · {report.checkedAt} 조회</span><span>서울시 우리마을가게 상권분석서비스 · 2025년</span></div><div className="source-links"><a href={report.source.ftcUrl} target="_blank" rel="noreferrer">정보공개서 <ArrowUpRight /></a><a href={report.source.sbizUrl} target="_blank" rel="noreferrer">상권 API <ArrowUpRight /></a><a href={report.source.seoulCommercialUrl} target="_blank" rel="noreferrer">추정매출 <ArrowUpRight /></a></div></footer>
    </div>
  </main>;
}
