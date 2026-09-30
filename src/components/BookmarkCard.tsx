import React, { useState } from 'react';
import { ExternalLink, Globe, Tag, Star } from 'lucide-react';
import type { Bookmark, Category } from '../types';
import { getFaviconUrl, truncateText } from '../utils/validator';
import '../styles.css';

interface BookmarkCardProps {
  bookmark: Bookmark;
  category?: Category;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  showFavicon: boolean;
}

const FaviconFallback: React.FC<{ url: string }> = ({ url }) => {
  const [error, setError] = useState(false);

  if (!url || error) {
    return (
      <div style={{
        width: '24px', height: '24px', borderRadius: '4px',
        background: 'var(--color-neutral-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        <Globe size={14} style={{ color: 'var(--color-neutral-400)' }} />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt="favicon"
      style={{
        width: '24px', height: '24px', borderRadius: '4px',
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
  onOpen,
  onContextMenu,
  showFavicon
}) => {
  const faviconUrl = bookmark.favicon || getFaviconUrl(bookmark.url);
  // 未显示 favicon 时，为左上角悬浮复选框预留空间
  const textOffset = showFavicon ? 0 : '20px';

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    background: isSelected ? 'var(--color-primary)' + '0d' : 'var(--color-bg-card)',
    borderRadius: '8px',
    padding: '8px 10px',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s, transform 0.15s',
    boxShadow: isSelected ? '0 0 0 2px var(--color-primary)' : 'none'
  };

  const checkboxWrapStyle: React.CSSProperties = {
    position: 'absolute',
    top: '6px',
    left: '6px',
    opacity: isSelected ? 1 : undefined
  };

  const badgeStyle: React.CSSProperties = {
    padding: '1px 5px', fontSize: '11px', borderRadius: '4px',
    whiteSpace: 'nowrap', flexShrink: 0
  };

  const openButtonStyle: React.CSSProperties = {
    padding: '3px', borderRadius: '4px', background: 'none', border: 'none',
    cursor: 'pointer', color: 'var(--color-text-tertiary)',
    display: 'flex', alignItems: 'center', flexShrink: 0,
    transition: 'background-color 0.15s, color 0.15s'
  };

  return (
    <div
      className="fp-bookmark-card"
      style={cardStyle}
      onClick={onOpen}
      onContextMenu={(e) => { e.stopPropagation(); onContextMenu(e); }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }
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
            width: '14px', height: '14px', borderRadius: '4px',
            borderColor: 'var(--color-neutral-300)', cursor: 'pointer'
          }}
        />
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        paddingLeft: textOffset
      }}>
        {showFavicon && <FaviconFallback url={faviconUrl} />}
        <h3 style={{
          flex: 1, minWidth: 0, fontSize: '13px', fontWeight: 500,
          color: 'var(--color-text)', margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }} title={bookmark.title}>
          {bookmark.title}
        </h3>
        {bookmark.isFavorite && (
          <Star
            size={12}
            fill="#f59e0b"
            aria-label="已收藏"
            style={{ color: '#f59e0b', flexShrink: 0 }}
          />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          title="打开"
          style={openButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-neutral-100)';
            e.currentTarget.style.color = 'var(--color-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-tertiary)';
          }}
        >
          <ExternalLink size={12} />
        </button>
      </div>

      {bookmark.description && (
        <p style={{
          fontSize: '11px', color: 'var(--color-text-secondary)',
          margin: '4px 0 0', paddingLeft: textOffset,
          display: '-webkit-box', WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {truncateText(bookmark.description, 60)}
        </p>
      )}

      {(category || bookmark.tags.length > 0) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          marginTop: '6px', paddingLeft: textOffset, overflow: 'hidden'
        }}>
          {category && (
            <span style={{
              ...badgeStyle,
              background: 'var(--color-neutral-100)',
              color: 'var(--color-text-secondary)'
            }}>
              {category.name}
            </span>
          )}
          {bookmark.tags.slice(0, 1).map((tag) => (
            <span
              key={tag}
              style={{
                ...badgeStyle,
                background: 'var(--color-primary)' + '1a',
                color: 'var(--color-primary)',
                display: 'inline-flex', alignItems: 'center', gap: '2px'
              }}
            >
              <Tag size={9} />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookmarkCard;
