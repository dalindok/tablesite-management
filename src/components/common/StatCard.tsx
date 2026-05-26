import React from 'react';

interface Props {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  change?: { value: number; label: string };
  subtitle?: string;
}

export default function StatCard({ title, value, icon, color, subtitle }: Props) {
  return (
    <div className="card p-5 flex items-start gap-4 hover:shadow-card-hover transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
