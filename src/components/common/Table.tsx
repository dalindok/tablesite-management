import React from 'react';
import { RiLoader4Line } from 'react-icons/ri';

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
}

export default function DataTable<T>({ columns, data, loading, rowKey, emptyText = 'No data found' }: TableProps<T>) {
  const getKey = (row: T) =>
    typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map(col => (
              <th key={col.key} className={`text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${col.className ?? ''}`}>
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <RiLoader4Line className="animate-spin" size={20} />
                  <span>Loading…</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center text-slate-400">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr key={getKey(row)} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
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
