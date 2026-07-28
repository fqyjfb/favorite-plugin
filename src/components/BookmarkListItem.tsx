import React, { useState } from 'react';
import { ExternalLink, Pencil, Trash2, Globe } from 'lucide-react';
import type { Bookmark, Category } from '../types';
import { getFaviconUrl, truncateText } from '../utils/validator';

interface BookmarkListItemProps {
  bookmark: Bookmark;
  category?: Category;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpen: () => void;
  showFavicon: boolean;
}

const FaviconFallback: React.FC<{ url: string }> = ({ url }) => {
  const [error, setError] = useState(false);

  if (!url || error) {
    return (
      <div className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
        <Globe className="w-3 h-3 text-gray-400 dark:text-gray-500" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt="favicon"
      className="w-5 h-5 rounded object-contain flex-shrink-0"
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
  showFavicon
}) => {
  const faviconUrl = bookmark.favicon || getFaviconUrl(bookmark.url);

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 border-b border-gray-100 dark:border-gray-700/50 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
        isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
      }`}
      onClick={onOpen}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelect()}
        onClick={(e) => e.stopPropagation()}
        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
      />

      {showFavicon && <FaviconFallback url={faviconUrl} />}

      <div className="flex-1 min-w-0 flex items-center gap-3">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[160px]">
          {bookmark.title}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
          {truncateText(bookmark.url, 60)}
        </span>
        {category && (
          <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded flex-shrink-0">
            {category.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 hover:text-primary"
          title="打开"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 hover:text-primary"
          title="编辑"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-500"
          title="删除"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default BookmarkListItem;