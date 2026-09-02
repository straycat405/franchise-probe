import {
  ArrowRight,
  BadgeCheck,
  Ban,
  BookOpenText,
  CalendarDays,
  ChevronDown,
  CircleAlert,
  Database,
  FileText,
  Landmark,
  MapPinned,
  Scale,
  Search,
  ShieldCheck,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const facts = [
  {
    id: 'evidence-fee',
    label: '최초 가맹금',
    value: '1,540만원',
    note: '검증 가능 표본 129건 중 94건보다 높거나 같음',
    compare: '73백분위',
    tag: '표 직접 확인',
    icon: Landmark,
  },
  {
    id: 'evidence-term',
    label: '최초 계약기간',
    value: '1년',
    note: '표본 228건 중 17건 · 7.5%',
    compare: '2년 76.3%',
    tag: '본문 직접 확인',
    icon: CalendarDays,
  },
  {
    id: 'evidence-noncompete',
    label: '종료 후 경업금지',
    value: '12개월',
    note: '검수 표본 50건 중 16건 · 32%',
    compare: '제한 없음 50%',
    tag: '사람 검수 완료',
    icon: Ban,
  },
  {
    id: 'evidence-area',
    label: '독점 영업지역',
    value: '설정함',
    note: '표본 229건 중 225건에서 확인',
    compare: '브랜드 차이 적음',
    tag: '본문 직접 확인',
    icon: MapPinned,
  },
];

const evidence = [
  {
    id: 'evidence-fee',
    clause: 'Ⅲ-1-1) 최초 가맹금',
    title: '최초 가맹금 총계 15,400천원',
    quote:
      '“(단위: 천원, 부가세 포함) 총계 15,400 / 가입비 11,000 / 교육비 4,400”',
    detail: '가입비와 교육비 모두 계약체결일로부터 3일 이내 지급으로 기재돼 있습니다.',
    source: '정보공개서 표',
  },
  {
    id: 'evidence-term',
    clause: 'Ⅴ-5-1) 가맹계약 및 갱신기간',
    title: '최초 계약기간과 갱신기간 모두 1년',
    quote:
      '“계약기간은 계약체결일로부터 1년이며, 가맹계약 갱신 시 계약기간은 계약갱신일로부터 1년입니다.”',
    detail: '최초 계약과 갱신 계약의 기간이 같은 사례입니다.',
    source: '정보공개서 본문',
  },
  {
    id: 'evidence-noncompete',
    clause: 'Ⅴ-8-1) 경업금지의 범위',
    title: '계약 종료 후 1년간 같은 영업장소에서 제한',
    quote:
      '“가맹계약이 종료된 후 1년 동안 동일한 영업장소(영업지역)에서 당사와 동일한 영업을 할 수 없습니다.”',
    detail: '기간은 사람 검수 골든셋으로 확인했습니다. 지역 표현은 아직 별도 사람 검수 전입니다.',
    source: '정보공개서 본문 · 기간 사람 검수',
  },
  {
    id: 'evidence-area',
    clause: 'Ⅴ-1-1) 독점적·배타적 영업지역 설정',
    title: '계약서에 영업지역을 설정해 명시',
    quote:
      '“가맹계약 체결 시 가맹점사업자의 영업지역을 설정하여 가맹계약서에 영업지역을 명시하고 있습니다.”',
    detail: '계약기간 중 해당 영업지역 안에 동일 업종 직영점·가맹점을 추가 개설하지 않는다고 기재돼 있습니다.',
    source: '정보공개서 본문',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-5 px-5 sm:px-8">
          <a href="#top" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-4.5" />
            </span>
            계약체크
          </a>
          <div className="mx-auto hidden w-full max-w-md items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground sm:flex">
            <Search className="size-4" />
            브랜드명 또는 가맹본부 검색
            <Badge variant="secondary" className="ml-auto">MVP</Badge>
          </div>
          <span className="text-xs font-medium text-muted-foreground">FTC 공개자료 기반</span>
        </div>
      </header>

      <div id="top" className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8 sm:py-12">
        <nav className="mb-7 flex items-center gap-2 text-xs text-muted-foreground">
          <span>브랜드 리포트</span>
          <span>/</span>
          <span className="text-foreground">본건강한상</span>
        </nav>

        <section className="mb-8 grid gap-8 lg:grid-cols-[1fr_280px] lg:items-end">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge className="bg-verified text-white hover:bg-verified">2022년 등록본</Badge>
              <Badge variant="outline">정보공개서 SN 131782</Badge>
            </div>
            <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">본건강한상</h1>
            <p className="mt-3 text-base text-muted-foreground">본아이에프(주) · 사업자등록번호 101-86-07256</p>
          </div>
          <div className="rounded-xl border border-verified/20 bg-verified-soft p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-verified-strong">
              <BadgeCheck className="size-4" />
              원문 근거 연결 완료
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-verified-strong/75">
              아래 값은 정보공개서 본문과 표에서 직접 추출했습니다.
            </p>
          </div>
        </section>

        <aside className="mb-8 flex gap-3 rounded-xl border border-amber-300/70 bg-amber-50 p-4 text-amber-950">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          <p className="text-xs leading-relaxed">
            이 화면은 2022년 등록 정보공개서를 이용한 MVP입니다. 실제 계약 전에는 최신 정보공개서와 계약서를 다시 확인해야 합니다.
          </p>
        </aside>

        <section aria-labelledby="facts-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">계약 전 확인할 사실</p>
              <h2 id="facts-heading" className="mt-1 text-xl font-semibold tracking-tight">핵심 조건 4가지</h2>
            </div>
            <p className="hidden text-xs text-muted-foreground sm:block">판정 없이 사실과 비교기준만 제공합니다.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map((fact) => {
              const Icon = fact.icon;
              return (
                <a key={fact.label} href={`#${fact.id}`} className="group rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40">
                  <Card className="h-full min-h-[202px] border-0 shadow-none ring-border transition group-hover:-translate-y-0.5 group-hover:ring-foreground/20">
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">{fact.label}</CardTitle>
                      <CardAction>
                        <Icon className="size-4 text-muted-foreground/70" />
                      </CardAction>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      <p className="text-[1.75rem] font-semibold tracking-[-0.04em]">{fact.value}</p>
                      <p className="mt-2 min-h-9 text-xs leading-relaxed text-muted-foreground">{fact.note}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-verified-strong">{fact.tag}</span>
                        <span className="text-[11px] text-muted-foreground">{fact.compare}</span>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              );
            })}
          </div>
        </section>

        <section className="mt-7 grid gap-4 lg:grid-cols-[1fr_0.72fr]">
          <Card className="border-0 shadow-none ring-border">
            <CardHeader>
              <CardDescription>계약 종료 후 경업금지 기간</CardDescription>
              <CardTitle className="text-lg">비교 표본에서 12개월은 32%였습니다</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-muted" aria-label="제한 없음 50%, 12개월 32%, 24개월 18%">
                <span className="w-1/2 bg-slate-300" />
                <span className="w-[32%] bg-primary" />
                <span className="w-[18%] bg-slate-500" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                <div><b className="block text-base">50%</b><span className="text-muted-foreground">제한 없음</span></div>
                <div><b className="block text-base">32%</b><span className="text-muted-foreground">12개월</span></div>
                <div><b className="block text-base">18%</b><span className="text-muted-foreground">24개월</span></div>
              </div>
              <p className="mt-4 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
                규칙 성공·미검출 사례를 절반씩 뽑은 50건 층화 표본입니다. 기간 값은 전 건 사람이 원문과 대조했습니다.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-ink text-white shadow-none ring-0">
            <CardHeader>
              <CardDescription className="text-white/55">원문 확인 원칙</CardDescription>
              <CardTitle className="text-lg">요약보다 근거를 먼저</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-white/72">
                숫자를 누르면 해당 값이 나온 정보공개서 조항과 표를 그대로 확인할 수 있습니다.
              </p>
              <a href="#evidence" className="mt-5 flex items-center gap-2 text-xs font-semibold text-mint">
                <BookOpenText className="size-4" /> 근거 조항 보기 <ArrowRight className="size-3.5" />
              </a>
            </CardContent>
          </Card>
        </section>

        <section id="evidence" className="scroll-mt-24 pt-16" aria-labelledby="evidence-heading">
          <div className="grid gap-8 lg:grid-cols-[270px_1fr]">
            <div>
              <p className="eyebrow">Evidence</p>
              <h2 id="evidence-heading" className="mt-1 text-2xl font-semibold tracking-tight">근거 원문</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                정리된 값과 실제 공개 문서 사이를 직접 확인할 수 있습니다.
              </p>
            </div>
            <div className="space-y-3">
              {evidence.map((item, index) => (
                <details key={item.id} id={item.id} className="evidence-row scroll-mt-24 group" open={index === 2}>
                  <summary className="flex cursor-pointer list-none items-start gap-4 p-5 sm:p-6">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-xs font-semibold">{String(index + 1).padStart(2, '0')}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-semibold text-verified-strong">{item.clause}</span>
                      <span className="mt-1 block font-semibold tracking-tight">{item.title}</span>
                    </span>
                    <ChevronDown className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="border-t px-5 py-5 sm:px-[4.5rem] sm:py-6">
                    <blockquote className="border-l-2 border-verified pl-4 text-sm font-medium leading-7 text-foreground/90">
                      {item.quote}
                    </blockquote>
                    <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                    <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-verified-strong">
                      <FileText className="size-3.5" /> {item.source}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-4 border-t pt-10 sm:grid-cols-3">
          <div className="rounded-xl bg-card p-5 ring-1 ring-border">
            <Database className="size-5 text-verified-strong" />
            <h3 className="mt-4 text-sm font-semibold">비교 데이터</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">FTC 공개본 231건을 수집해 조항별 비교 표본을 만들었습니다.</p>
          </div>
          <div className="rounded-xl bg-card p-5 ring-1 ring-border">
            <BadgeCheck className="size-5 text-verified-strong" />
            <h3 className="mt-4 text-sm font-semibold">정확도 확인</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">경업금지 기간은 사람 검수 50건에서 규칙 정확도 100%를 확인했습니다.</p>
          </div>
          <div className="rounded-xl bg-card p-5 ring-1 ring-border">
            <Scale className="size-5 text-verified-strong" />
            <h3 className="mt-4 text-sm font-semibold">사실만 제시</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">좋고 나쁨을 판정하지 않습니다. 사실·출처·비교기준만 제공합니다.</p>
          </div>
        </section>
      </div>

      <footer className="mt-10 border-t bg-card/60">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-5 py-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2 font-semibold text-foreground"><ShieldCheck className="size-4" /> 계약체크 MVP</div>
          <p>출처: 공정거래위원회 가맹사업거래 정보공개서 · 최종 계약 판단은 최신 원문 확인 필요</p>
        </div>
      </footer>
    </main>
  );
}
