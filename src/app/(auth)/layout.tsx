import { CinematicAuthPanel } from '@/components/auth/cinematic-auth-panel';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-white text-[#111111] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      
      {/* Left Brand Panel */}
      <div className="relative hidden h-full flex-col bg-[#111111] p-10 text-white lg:flex overflow-hidden">
        {/* Solid dark background */}
        <div className="absolute inset-0 bg-[#111111]" />
        
        {/* Procedural AI Film Canvas */}
        <CinematicAuthPanel />

        {/* Top Header & Editorial Wordmark */}
        <div className="relative z-20 flex items-center text-white">
          <span className="text-lg font-semibold tracking-[0.2em] uppercase font-sans">CLAUSENTIS</span>
        </div>

        {/* Bottom Taglines */}
        <div className="relative z-20 mt-auto pt-6">
          <blockquote className="space-y-2 max-w-md">
            <p className="text-xl font-medium leading-snug text-white">
              &ldquo;Procurement Intelligence, Made Verifiable.&rdquo;
            </p>
            <footer className="text-sm font-normal text-white/70">
              AI-powered bid compliance intelligence for government procurement
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="p-6 sm:p-8 lg:p-12 min-h-screen flex items-center justify-center bg-white">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px]">
          {children}
        </div>
      </div>
    </div>
  );
}
