'use client';

export function PrintButton({ label = 'Print receipt' }: { label?: string }) {
  return (
    <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
      {label}
    </button>
  );
}
