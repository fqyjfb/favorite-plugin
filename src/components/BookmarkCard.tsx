import React, { useState } from 'react';
import { ExternalLink, Pencil, Trash2, Globe, Tag } from 'lucide-react';
import type { Bookmark, Category } from '../types';
import { getFaviconUrl, truncateText, formatDate } from '../utils/validator';

interface BookmarkCardProps {
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
      <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
        <Globe className="w-4 h-4 text-gray-400 dark:text-gray-500" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt="favicon"
      className="w-8 h-8 rounded object-contain flex-shrink-0"
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
  showFavicon
}) => {
  const faviconUrl =
    bookmark.favicon || getFaviconUrl(bookmark.url);

  return (
    <div
      className={`group relative bg-white dark:bg-gray-800 border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm hover:-translate-y-0.5 ${
        isSelected
          ? 'border-primary ring-1 ring-primary/30'
          : 'border-gray-200 dark:border-gray-700'
      }`}
      onClick={onOpen}
    >
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
      </div>

      <div className="flex items-start gap-2">
        {showFavicon && (
          <FaviconFallback url={faviconUrl} />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {bookmark.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {bookmark.url.replace(/^https?:\/\//, '')}
          </p>
        </div>
      </div>

      {bookmark.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
          {truncateText(bookmark.description, 100)}
        </p>
      )}

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {category && (
          <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
            {category.name}
          </span>
        )}
        {bookmark.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="px-1.5 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded flex items-center gap-0.5"
          >
            <Tag className="w-2.5 h-2.5" />
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {formatDate(bookmark.updatedAt)}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary"
            title="打开"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary"
            title="编辑"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-500"
            title="删除"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookmarkCard;