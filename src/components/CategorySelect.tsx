import { useState, useRef, useEffect } from 'react';
import './CategorySelect.css';

interface CategorySelectProps {
  value: string;
  categories: string[];
  onChange: (value: string) => void;
}

export function CategorySelect({ value, categories, onChange }: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = [{ value: '', label: '카테고리 없음' }, ...categories.map(c => ({ value: c, label: c }))];
  const selected = options.find(o => o.value === value) ?? options[0];

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div className={`cat-select${open ? ' open' : ''}`} ref={ref}>
      <button
        type="button"
        className="cat-select__trigger"
        onClick={() => setOpen(o => !o)}
      >
        <span className={`cat-select__value${!value ? ' placeholder' : ''}`}>
          {selected.label}
        </span>
        <svg className="cat-select__arrow" viewBox="0 0 24 24" width="16" height="16" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <ul className="cat-select__list">
          {options.map(opt => (
            <li
              key={opt.value}
              className={`cat-select__option${opt.value === value ? ' selected' : ''}${opt.value === '' ? ' none-option' : ''}`}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.value === '' ? (
                <span className="cat-select__none-label">{opt.label}</span>
              ) : (
                <>
                  <span className="cat-select__dot" />
                  {opt.label}
                </>
              )}
              {opt.value === value && (
                <svg className="cat-select__check" viewBox="0 0 24 24" width="15" height="15" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
