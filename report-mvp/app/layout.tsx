import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: '한솥 계약 전 확인 리포트 | FranchiseProbe',
  description: '공정위 정보공개서와 소상공인 상가정보로 확인하는 한솥·여의도역 권역 리포트',
  openGraph: {
    title: '한솥 계약 전 확인 리포트 | FranchiseProbe',
    description: '공식 공개자료로 확인하는 프랜차이즈·후보 상권 리포트',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: '계약체크 리포트 미리보기' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '한솥 계약 전 확인 리포트 | FranchiseProbe',
    description: '공식 공개자료로 확인하는 프랜차이즈·후보 상권 리포트',
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
