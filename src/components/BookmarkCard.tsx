import React, { useState } from 'react';
import { ExternalLink, Pencil, Trash2, Globe, Tag } from 'lucide-react';
import type { Bookmark, Category } from '../types';
import { getFaviconUrl, truncateText, formatDate } from '../utils/validator';
import '../styles.css';

interface BookmarkCardProps {
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
        width: '32px', height: '32px', borderRadius: '4px',
        background: 'var(--color-neutral-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        <Globe size={16} style={{ color: 'var(--color-neutral-400)' }} />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt="favicon"
      style={{
        width: '32px', height: '32px', borderRadius: '4px',
        objectFit: 'contain', flexShrink: 0
      }}
      onError={() => setError(true)}
    />
  );
};

const BookmarkCard: React.FC<BookmarkCardProps> = ({
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

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    background: 'var(--color-bg-card)',
    border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-neutral-200)',
    borderRadius: '8px',
    padding: '12px',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s, transform 0.15s',
    boxShadow: isSelected ? '0 0 0 1px var(--color-primary)' : 'none'
  };

  const checkboxWrapStyle: React.CSSProperties = {
    position: 'absolute',
    top: '8px',
    left: '8px',
    opacity: isSelected ? 1 : undefined
  };

  return (
    <div
      style={cardStyle}
      onClick={onOpen}
      onContextMenu={onContextMenu}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = isSelected
          ? '0 0 0 1px var(--color-primary), var(--shadow-sm)'
          : 'var(--shadow-sm)';
        if (!isSelected) e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = isSelected ? '0 0 0 1px var(--color-primary)' : 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={checkboxWrapStyle} className="fp-checkbox-wrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '16px', height: '16px', borderRadius: '4px',
            borderColor: 'var(--color-neutral-300)', cursor: 'pointer'
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        {showFavicon && <FaviconFallback url={faviconUrl} />}
        <div style={{ flex: 1, minWidth: 0, paddingLeft: showFavicon ? 0 : '24px' }}>
          <h3 style={{
            fontSize: '14px', fontWeight: 500,
            color: 'var(--color-text)',
            margin: 0, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {bookmark.title}
          </h3>
          <p style={{
            fontSize: '12px', color: 'var(--color-text-tertiary)',
            margin: '2px 0 0', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {bookmark.url.replace(/^https?:\/\//, '')}
          </p>
        </div>
      </div>

      {bookmark.description && (
        <p style={{
          fontSize: '12px', color: 'var(--color-text-secondary)',
          margin: '8px 0 0',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {truncateText(bookmark.description, 100)}
        </p>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginTop: '8px', flexWrap: 'wrap'
      }}>
        {category && (
          <span style={{
            padding: '2px 6px', fontSize: '12px',
            background: 'var(--color-neutral-100)',
            color: 'var(--color-text-secondary)',
            borderRadius: '4px'
          }}>
            {category.name}
          </span>
        )}
        {bookmark.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            style={{
              padding: '2px 6px', fontSize: '12px',
              background: 'var(--color-primary)' + '1a',
              color: 'var(--color-primary)',
              borderRadius: '4px',
              display: 'inline-flex', alignItems: 'center', gap: '2px'
            }}
          >
            <Tag size={10} />
            {tag}
          </span>
        ))}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '8px', paddingTop: '8px',
        borderTop: '1px solid var(--color-neutral-100)'
      }}>
        <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
          {formatDate(bookmark.updatedAt)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
    </div>
  );
};

export default BookmarkCard;