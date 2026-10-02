export function ArrowIcon({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="arrow-icon">
      <path d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}
