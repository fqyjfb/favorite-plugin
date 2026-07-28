import React, { useState } from 'react';
import { ExternalLink, Pencil, Trash2, Globe } from 'lucide-react';
import type { Bookmark, Category } from '../types';
import { getFaviconUrl, truncateText } from '../utils/validator';
import '../styles.css';

interface BookmarkListItemProps {
  bookmark: Bookmark;
  category?: Category;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpen: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  showFavicon: boolean;
}

const FaviconFallback: React.FC<{ url: string }> = ({ url }) => {
  const [error, setError] = useState(false);

  if (!url || error) {
    return (
      <div style={{
        width: '20px', height: '20px', borderRadius: '4px',
        background: 'var(--color-neutral-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        <Globe size={12} style={{ color: 'var(--color-neutral-400)' }} />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt="favicon"
      style={{
        width: '20px', height: '20px', borderRadius: '4px',
        objectFit: 'contain', flexShrink: 0
      }}
      onError={() => setError(true)}
    />
  );
};

const BookmarkListItem: React.FC<BookmarkListItemProps> = ({
  bookmark,
  category,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onOpen,
  onContextMenu,
  showFavicon
}) => {
  const faviconUrl = bookmark.favicon || getFaviconUrl(bookmark.url);

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    borderBottom: '1px solid var(--color-neutral-100)',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    background: isSelected ? 'var(--color-primary)' + '0d' : 'transparent'
  };

  return (
    <div
      style={rowStyle}
      onClick={onOpen}
      onContextMenu={onContextMenu}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'var(--color-neutral-50)';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent';
      }}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelect()}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '16px', height: '16px', borderRadius: '4px',
          borderColor: 'var(--color-neutral-300)',
          cursor: 'pointer', flexShrink: 0
        }}
      />

      {showFavicon && <FaviconFallback url={faviconUrl} />}

      <div style={{
        flex: 1, minWidth: 0,
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <span style={{
          fontSize: '14px', fontWeight: 500,
          color: 'var(--color-text)',
          overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', maxWidth: '160px'
        }}>
          {bookmark.title}
        </span>
        <span style={{
          fontSize: '12px', color: 'var(--color-text-tertiary)',
          overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', flex: 1
        }}>
          {truncateText(bookmark.url, 60)}
        </span>
        {category && (
          <span style={{
            padding: '2px 6px', fontSize: '12px',
            background: 'var(--color-neutral-100)',
            color: 'var(--color-text-secondary)',
            borderRadius: '4px', flexShrink: 0
          }}>
            {category.name}
          </span>
        )}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        flexShrink: 0
      }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          title="打开"
          style={{
            padding: '4px', borderRadius: '4px', background: 'none',
            border: 'none', cursor: 'pointer',
            color: 'var(--color-text-tertiary)',
            display: 'flex', alignItems: 'center',
            transition: 'background-color 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-neutral-100)';
            e.currentTarget.style.color = 'var(--color-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-tertiary)';
          }}
        >
          <ExternalLink size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="编辑"
          style={{
            padding: '4px', borderRadius: '4px', background: 'none',
            border: 'none', cursor: 'pointer',
            color: 'var(--color-text-tertiary)',
            display: 'flex', alignItems: 'center',
            transition: 'background-color 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-neutral-100)';
            e.currentTarget.style.color = 'var(--color-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-tertiary)';
          }}
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="删除"
          style={{
            padding: '4px', borderRadius: '4px', background: 'none',
            border: 'none', cursor: 'pointer',
            color: 'var(--color-text-tertiary)',
            display: 'flex', alignItems: 'center',
            transition: 'background-color 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-error)' + '0d';
            e.currentTarget.style.color = 'var(--color-error)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-tertiary)';
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default BookmarkListItem;