import type { Metadata } from 'next';
import { Lexend, Source_Sans_3 } from 'next/font/google';
import './globals.css';

const lexend = Lexend({
  variable: '--font-lexend',
  subsets: ['latin'],
  display: 'swap',
});

const sourceSans = Source_Sans_3({
  variable: '--font-source',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Clausentis · Bid compliance verification',
  description:
    'Clausentis checks every bid against every tender clause, cross-checks registrations with government sources, and gives the procurement officer the evidence to decide and sign.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${lexend.variable} ${sourceSans.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-page text-fg antialiased">{children}</body>
    </html>
  );
}
