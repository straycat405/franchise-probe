import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: '본건강한상 계약 전 확인 리포트 | 계약체크',
  description: 'FTC 정보공개서 원문을 근거로 계약 조건과 비교기준을 보여주는 프랜차이즈 사전검토 리포트',
  openGraph: {
    title: '계약체크 | 프랜차이즈 계약 전 확인 리포트',
    description: '정보공개서 원문으로 확인하는 프랜차이즈 계약 조건',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: '계약체크 리포트 미리보기' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '계약체크 | 프랜차이즈 계약 전 확인 리포트',
    description: '정보공개서 원문으로 확인하는 프랜차이즈 계약 조건',
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
