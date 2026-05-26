interface PageLoadingProps {
  title?: string;
  subtitle?: string;
  /** compact=true → small inline loader for tabs / panels */
  compact?: boolean;
}

export default function PageLoading({
  title = 'Loading…',
  subtitle = 'Please wait a moment',
  compact = false,
}: PageLoadingProps) {

  /* ── Compact (tab / panel level) ── */
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 select-none">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-3 shadow shadow-orange-200 animate-pulse">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
            <path d="M3 2v7c0 1.1.9 2 2 2h1v11h2V11h1a2 2 0 002-2V2h-2v5H9V2H7v5H6V2H3z" fill="currentColor" opacity=".9" />
            <path d="M18 2c-1.66 0-3 1.79-3 4v5h1.5v9H19V2h-1z" fill="currentColor" opacity=".9" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
      </div>
    );
  }

  /* ── Full page ── */
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 select-none">
      {/* Animated icon */}
      <div className="relative mb-8">
        <span className="absolute inset-0 rounded-full bg-orange-100 animate-ping opacity-60" />
        <span className="absolute inset-[-8px] rounded-full bg-orange-50 animate-ping opacity-40 [animation-delay:300ms]" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white">
            <path d="M3 2v7c0 1.1.9 2 2 2h1v11h2V11h1a2 2 0 002-2V2h-2v5H9V2H7v5H6V2H3z" fill="currentColor" opacity=".9" />
            <path d="M18 2c-1.66 0-3 1.79-3 4v5h1.5v9H19V2h-1z" fill="currentColor" opacity=".9" />
          </svg>
        </div>
      </div>

      <p className="text-base font-semibold text-slate-700 mb-1">{title}</p>
      <p className="text-sm text-slate-400 mb-10">{subtitle}</p>

      {/* Skeleton shimmer */}
      <div className="w-full max-w-md space-y-3 animate-pulse">
        <div className="h-10 bg-slate-100 rounded-xl w-full" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 bg-slate-100 rounded-xl" />
          <div className="h-20 bg-slate-100 rounded-xl" />
          <div className="h-20 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-10 bg-slate-100 rounded-xl w-4/5" />
        <div className="h-10 bg-slate-100 rounded-xl w-3/5" />
        <div className="h-10 bg-slate-100 rounded-xl w-4/5" />
      </div>
    </div>
  );
}
