import { Navbar } from '@/components/layout/navbar';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#FFFFFF] text-[#111111] min-h-screen selection:bg-[#111111] selection:text-white relative font-sans antialiased">
      <Navbar />
      <main className="w-full">{children}</main>
    </div>
  );
}
