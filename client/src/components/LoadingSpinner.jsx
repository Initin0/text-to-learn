export default function LoadingSpinner({ label = 'Loading', hint, size = 'md', className = '' }) {
  const dim = size === 'sm' ? 'h-4 w-4 border-2' : 'h-7 w-7 border-[3px]';
  return (
    <div role="status" aria-live="polite" className={`flex items-center gap-3 text-muted ${className}`}>
      <span className={`${dim} inline-block animate-spin rounded-full border-pen/25 border-t-pen`} aria-hidden="true" />
      <span>
        <span className="text-ink">{label}</span>
        {hint && <span className="block text-sm">{hint}</span>}
      </span>
    </div>
  );
}
