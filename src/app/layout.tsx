import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme/theme-provider';

const manrope = Manrope({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Clausentis - Procurement Intelligence, Made Verifiable',
  description:
    'AI-powered bid compliance intelligence for government procurement. Connect procurement requirements to verifiable evidence, audit risk signals, and support confident officer decisions.',
  keywords: [
    'procurement intelligence',
    'bid compliance',
    'tender verification',
    'government procurement',
    'evidence verification',
    'audit trail',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased font-sans`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground antialiased relative">
        <ThemeProvider>
          <div className="relative z-10 flex-1 flex flex-col">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
