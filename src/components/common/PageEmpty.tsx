import React from 'react';

interface PageEmptyProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageEmpty({
  icon,
  title,
  subtitle,
  action,
}: PageEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center select-none">

      {/* Icon container */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
          {icon ?? (
            // Default: inbox/empty box
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 22V12h6v10" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        {/* Decorative dots */}
        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-slate-100 border border-slate-200" />
        <span className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-orange-100 border border-orange-200" />
      </div>

      {/* Text */}
      <p className="text-sm font-semibold text-slate-600 mb-1">{title}</p>
      {subtitle && (
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-5">{subtitle}</p>
      )}

      {/* Optional CTA */}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
