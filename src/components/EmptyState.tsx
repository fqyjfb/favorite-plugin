import React from 'react';
import { BookmarkPlus, FolderOpen } from 'lucide-react';

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
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {hasBookmarks ? (
        <>
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
            没有找到匹配的书签
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            尝试调整搜索条件或切换分类
          </p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
            <BookmarkPlus className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
            {hasCategories ? '还没有书签' : '开始使用前，先创建一些分类'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {hasCategories
              ? '点击下方按钮添加第一个书签'
              : '分类可以帮助你更好地组织书签'}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onAddBookmark}
              className="px-4 py-2 text-sm bg-primary text-button-text rounded-md hover:opacity-90 transition-colors"
            >
              添加书签
            </button>
            <button
              onClick={onImport}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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