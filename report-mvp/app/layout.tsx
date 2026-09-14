import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: '청담해장국 데이터 리포트 | FranchiseProbe',
  description: '공정위 최신 정보공개서 기반으로 청담해장국의 매출, 점포 흐름, 창업비용과 데이터 신뢰도를 보여주는 리포트',
  openGraph: {
    title: '청담해장국 데이터 리포트 | FranchiseProbe',
    description: '최신 정보공개서 원문으로 확인하는 프랜차이즈 수치 리포트',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: '계약체크 리포트 미리보기' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '청담해장국 데이터 리포트 | FranchiseProbe',
    description: '최신 정보공개서 원문으로 확인하는 프랜차이즈 수치 리포트',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
