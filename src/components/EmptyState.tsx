import React from 'react';
import { BookmarkPlus, FolderOpen } from 'lucide-react';
import '../styles.css';

interface EmptyStateProps {
  hasBookmarks: boolean;
  onAddBookmark: () => void;
  onImport: () => void;
  hasCategories: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  hasBookmarks,
  onAddBookmark,
  onImport,
  hasCategories
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 32px',
    textAlign: 'center'
  };

  const iconCircleStyle: React.CSSProperties = {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'var(--color-neutral-100)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 500,
    color: 'var(--color-text)',
    margin: '0 0 8px'
  };

  const descStyle: React.CSSProperties = {
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
    margin: '0 0 16px'
  };

  const btnGroupStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  return (
    <div style={containerStyle}>
      {hasBookmarks ? (
        <>
          <div style={iconCircleStyle}>
            <FolderOpen size={32} style={{ color: 'var(--color-neutral-400)' }} />
          </div>
          <h3 style={titleStyle}>没有找到匹配的书签</h3>
          <p style={descStyle}>尝试调整搜索条件或切换分类</p>
        </>
      ) : (
        <>
          <div style={iconCircleStyle}>
            <BookmarkPlus size={32} style={{ color: 'var(--color-neutral-400)' }} />
          </div>
          <h3 style={titleStyle}>
            {hasCategories ? '还没有书签' : '开始使用前，先创建一些分类'}
          </h3>
          <p style={{ ...descStyle, marginBottom: '24px' }}>
            {hasCategories
              ? '点击下方按钮添加第一个书签'
              : '分类可以帮助你更好地组织书签'}
          </p>
          <div style={btnGroupStyle}>
            <button
              onClick={onAddBookmark}
              className="fp-btn-primary"
            >
              添加书签
            </button>
            <button
              onClick={onImport}
              className="fp-btn-secondary"
            >
              导入书签
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EmptyState;