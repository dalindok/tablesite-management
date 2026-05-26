import React from 'react';
import PageEmpty from './PageEmpty';

interface Column<T> {
  key: string;
  title: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  rowKey: keyof T | ((row: T) => string | number);
  emptyText?: string;
  emptySubtitle?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-slate-50 animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className="h-4 bg-slate-100 rounded-lg"
            style={{ width: `${55 + ((i * 23) % 35)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function DataTable<T>({
  columns,
  data,
  loading,
  rowKey,
  emptyText = 'Nothing here yet',
  emptySubtitle,
  emptyIcon,
  emptyAction,
}: TableProps<T>) {
  const getKey = (row: T) =>
    typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map(col => (
              <th
                key={col.key}
                className={`text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${col.className ?? ''}`}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} cols={columns.length} />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <PageEmpty
                  icon={emptyIcon}
                  title={emptyText}
                  subtitle={emptySubtitle}
                  action={emptyAction}
                />
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr
                key={getKey(row)}
                className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
              >
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-3.5 ${col.className ?? ''}`}>
                    {col.render ? col.render(row) : String((row as any)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
