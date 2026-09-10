import Link from 'next/link';

const footerLinks = [
  {
    title: 'Platform',
    links: [
      { label: 'Tender Intelligence', href: '#workspace' },
      { label: 'Document Vault', href: '/documents' },
      { label: 'Compliance Reports', href: '/reports' },
    ],
  },
  {
    title: 'Product',
    links: [
      { label: 'Competitive Benefits', href: '#benefits' },
      { label: 'Multilingual Audio', href: '#workspace' },
      { label: 'Command Center', href: '/dashboard' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', href: '/login' },
      { label: 'Create Account', href: '/signup' },
      { label: 'System Settings', href: '/settings' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[#E5E5E5] bg-transparent font-sans">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center">
              <span className="text-sm font-semibold tracking-[0.2em] uppercase text-[#111111] font-sans">
                CLAUSENTIS
              </span>
            </Link>
            <p className="mt-3 text-xs sm:text-sm text-[#555555] font-light leading-relaxed max-w-sm">
              AI-powered bid compliance intelligence for government procurement. Procurement Intelligence, Made Verifiable.
            </p>
          </div>

          {/* Link Groups */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-medium uppercase tracking-[0.10em] text-[#111111]">{group.title}</h4>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm text-[#555555] font-light transition-colors hover:text-[#111111]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-[#E5E5E5] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#777777] font-light">
          <p>
            &copy; {new Date().getFullYear()} Clausentis. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-[11px] uppercase tracking-[0.08em] font-mono">
            <span>ENGINEERED FOR CERTAINTY</span>
            <span>&bull;</span>
            <span>ENTERPRISE GRADE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}