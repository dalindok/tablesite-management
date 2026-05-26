import { useState, useEffect } from 'react';
import { useDebounce } from 'ahooks';
import { RiSearchLine, RiCloseLine } from 'react-icons/ri';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  debounceMs = 500,
}: Props) {
  // Local state drives the input — instant feedback while typing
  const [inputValue, setInputValue] = useState(value);

  // Debounced value — only updates after the user stops typing
  const debouncedValue = useDebounce(inputValue, { wait: debounceMs });

  // Sync debounced value up to parent (triggers API call)
  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue]);

  // Keep local input in sync if parent resets it (e.g. filter change)
  useEffect(() => {
    if (value === '') setInputValue('');
  }, [value]);

  const handleClear = () => {
    setInputValue('');
    onChange('');
  };

  return (
    <div className="relative">
      <RiSearchLine
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        size={16}
      />
      <input
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-64 placeholder-slate-400 transition-all"
      />
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <RiCloseLine size={16} />
        </button>
      )}
    </div>
  );
}
