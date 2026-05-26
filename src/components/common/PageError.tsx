interface PageErrorProps {
  message?: string;
  onRetry?: () => void;
}

export default function PageError({
  message = 'Something went wrong while loading the data.',
  onRetry,
}: PageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center select-none">

      {/* Icon */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="1.5" />
            <path d="M12 7v5" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="#f87171" />
          </svg>
        </div>
        {/* Subtle decorative dots */}
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-100 border border-red-200" />
        <span className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-orange-100 border border-orange-200" />
      </div>

      <p className="text-base font-semibold text-slate-700 mb-1">Failed to load</p>
      <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-6">{message}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
        >
          {/* Retry icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Try again
        </button>
      )}
    </div>
  );
}
