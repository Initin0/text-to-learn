export default function ErrorMessage({ error, onRetry, title = 'That did not work', className = '' }) {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.message;
  return (
    <div role="alert" className={`rounded-lg border border-bad/30 bg-bad-soft px-4 py-3 ${className}`}>
      <p className="font-semibold text-bad">{title}</p>
      <p className="mt-1 text-ink">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 rounded-md border border-bad/40 px-3 py-1.5 text-sm font-semibold text-bad hover:bg-bad/10">
          Try again
        </button>
      )}
    </div>
  );
}
