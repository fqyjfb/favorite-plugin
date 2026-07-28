import React, { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import '../styles.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onFocus,
  placeholder = '搜索书签...',
  inputRef
}) => {
  const localRef = useRef<HTMLInputElement>(null);
  const ref = inputRef || localRef;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ref]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 32px 6px 28px',
    fontSize: '13px',
    border: '1px solid var(--color-neutral-300)',
    borderRadius: '6px',
    background: 'var(--color-bg-card)',
    color: 'var(--color-text)',
    outline: 'none',
    transition: 'border-color 0.15s'
  };

  return (
    <div style={containerStyle}>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        style={inputStyle}
        onFocusCapture={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-primary)';
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-neutral-300)';
        }}
      />
      <Search size={14} style={{
        position: 'absolute',
        left: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--color-text-tertiary)',
        pointerEvents: 'none'
      }} />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: '6px',
            top: '50%',
            transform: 'translateY(-50%)',
            padding: '2px',
            borderRadius: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-tertiary)',
            display: 'flex'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-neutral-100)';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-tertiary)';
          }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;