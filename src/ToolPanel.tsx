import React, { useCallback, useMemo } from 'react';
import {
  Bookmark,
  Plus,
  Download,
  Upload,
  LayoutGrid,
  List,
  Trash2,
  CheckSquare,
  X,
  SortAsc,
  SortDesc,
  Settings,
  ExternalLink
} from 'lucide-react';
import { useBookmarkStore } from './store/useBookmarkStore';
import BookmarkCard from './components/BookmarkCard';
import BookmarkListItem from './components/BookmarkListItem';
import CategoryTree from './components/CategoryTree';
import SearchBar from './components/SearchBar';
import BookmarkForm from './components/BookmarkForm';
import ImportExportModal from './components/ImportExportModal';
import EmptyState from './components/EmptyState';
import Modal from './components/Modal';
import ToastContainer from './components/ToastContainer';
import type { Bookmark as BookmarkType } from './types';
import { normalizeUrl } from './utils/validator';

const ToolPanel: React.FC = () => {
  const store = useBookmarkStore();
  const {
    bookmarks,
    categories,
    categoryTree,
    settings,
    searchQuery,
    selectedCategoryId,
    selectedBookmarks,
    filteredBookmarks,
    toasts,
    setSearchQuery,
    setSelectedCategoryId,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    bulkDeleteBookmarks,
    toggleBookmarkSelect,
    selectAllBookmarks,
    clearSelection,
    updateSettings,
    importData,
    resetAllData,
    addToast
  } = store;

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingBookmark, setEditingBookmark] = React.useState<BookmarkType | null>(null);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [isExportOpen, setIsExportOpen] = React.useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = React.useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const categoryMap = useMemo(() => {
    const map = new Map<string, typeof categories[0]>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const bookmarkCounts = useMemo(() => {
    const counts = new Map<string | null, number>();
    counts.set('__all__', bookmarks.length);
    counts.set(null, bookmarks.filter((b) => !b.categoryId).length);

    categoryTree.forEach((rootCat) => {
      const catIds = new Set<string>();
      catIds.add(rootCat.id);
      const stack = [rootCat];
      while (stack.length > 0) {
        const current = stack.pop()!;
        counts.set(current.id, 0);
        if (current.children) {
          current.children.forEach((child: any) => {
            catIds.add(child.id);
            stack.push(child);
          });
        }
      }
      const count = bookmarks.filter((b) => b.categoryId && catIds.has(b.categoryId)).length;
      counts.set(rootCat.id, count);

      const childStack = [rootCat];
      while (childStack.length > 0) {
        const current = childStack.pop()!;
        if (current.children) {
          current.children.forEach((child: any) => {
            const childCount = bookmarks.filter((b) => b.categoryId === child.id).length;
            counts.set(child.id, childCount);
            childStack.push(child);
          });
        }
      }
    });

    return counts;
  }, [bookmarks, categoryTree]);

  const handleOpenBookmark = useCallback((url: string) => {
    const normalizedUrl = normalizeUrl(url);
    if (window.electron?.openExternal) {
      window.electron.openExternal(normalizedUrl);
    } else {
      window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const handleAddClick = useCallback(() => {
    setEditingBookmark(null);
    setIsFormOpen(true);
  }, []);

  const handleEditClick = useCallback((bookmark: BookmarkType) => {
    setEditingBookmark(bookmark);
    setIsFormOpen(true);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setPendingDeleteId(id);
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleBulkDelete = useCallback(() => {
    const ids = Array.from(selectedBookmarks);
    setPendingBulkDelete(ids);
    setIsDeleteConfirmOpen(true);
  }, [selectedBookmarks]);

  const handleConfirmDelete = useCallback(() => {
    if (pendingDeleteId) {
      deleteBookmark(pendingDeleteId);
    } else if (pendingBulkDelete.length > 0) {
      bulkDeleteBookmarks(pendingBulkDelete);
    }
    setIsDeleteConfirmOpen(false);
    setPendingDeleteId(null);
    setPendingBulkDelete([]);
  }, [pendingDeleteId, pendingBulkDelete, deleteBookmark, bulkDeleteBookmarks]);

  const handleFormSubmit = useCallback(
    (data: Omit<BookmarkType, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (editingBookmark) {
        updateBookmark(editingBookmark.id, data);
      } else {
        addBookmark(data);
      }
      setIsFormOpen(false);
      setEditingBookmark(null);
    },
    [editingBookmark, addBookmark, updateBookmark]
  );

  const toggleSort = useCallback(() => {
    updateSettings({
      sortOrder: settings.sortOrder === 'asc' ? 'desc' : 'asc'
    });
  }, [settings.sortOrder, updateSettings]);

  const handleSelectAll = useCallback(() => {
    if (selectedBookmarks.size === filteredBookmarks.length) {
      clearSelection();
    } else {
      selectAllBookmarks();
    }
  }, [selectedBookmarks, filteredBookmarks, selectAllBookmarks, clearSelection]);

  const allSelected =
    filteredBookmarks.length > 0 &&
    selectedBookmarks.size === filteredBookmarks.length;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <ToastContainer toasts={toasts} />

      <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-primary" />
          <h1 className="text-base font-semibold text-gray-800 dark:text-gray-200">
            网址收藏夹
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExportOpen(true)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
            title="导出"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsImportOpen(true)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
            title="导入"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
            title="设置"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <SearchBar value={searchQuery} onChange={setSearchQuery} inputRef={searchInputRef} />

        <button
          onClick={toggleSort}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          title={`排序: ${settings.sortBy}`}
        >
          {settings.sortOrder === 'asc' ? (
            <SortAsc className="w-4 h-4" />
          ) : (
            <SortDesc className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={() =>
            updateSettings({
              viewMode: settings.viewMode === 'card' ? 'list' : 'card'
            })
          }
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          title={settings.viewMode === 'card' ? '列表视图' : '卡片视图'}
        >
          {settings.viewMode === 'card' ? (
            <List className="w-4 h-4" />
          ) : (
            <LayoutGrid className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={handleAddClick}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-button-text rounded-md hover:opacity-90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          添加
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 overflow-y-auto">
          <CategoryTree
            categories={categoryTree}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onAddCategory={(name, parentId) => addCategory(name, parentId)}
            onUpdateCategory={(id, name) => updateCategory(id, name)}
            onDeleteCategory={(id) => deleteCategory(id)}
            bookmarkCounts={bookmarkCounts}
          />
        </aside>

        <main className="flex-1 overflow-y-auto p-4">
          {selectedBookmarks.size > 0 && (
            <div className="flex items-center justify-between mb-3 px-3 py-2 bg-primary/5 dark:bg-primary/10 rounded-md">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {allSelected ? (
                    <X className="w-4 h-4 text-primary" />
                  ) : (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  )}
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  已选 {selectedBookmarks.size} 个
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearSelection}
                  className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  删除
                </button>
              </div>
            </div>
          )}

          {filteredBookmarks.length === 0 ? (
            <EmptyState
              hasBookmarks={bookmarks.length > 0}
              onAddBookmark={handleAddClick}
              onImport={() => setIsImportOpen(true)}
              hasCategories={categories.length > 0}
            />
          ) : settings.viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredBookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  category={categoryMap.get(bookmark.categoryId || '')}
                  isSelected={selectedBookmarks.has(bookmark.id)}
                  onSelect={() => toggleBookmarkSelect(bookmark.id)}
                  onEdit={() => handleEditClick(bookmark)}
                  onDelete={() => handleDeleteClick(bookmark.id)}
                  onOpen={() => handleOpenBookmark(bookmark.url)}
                  showFavicon={settings.showFavicon}
                />
              ))}
            </div>
          ) : (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700">
                <div className="w-4" />
                <div className="w-5" />
                <span className="flex-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  书签
                </span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24">
                  分类
                </span>
                <div className="w-16" />
              </div>
              {filteredBookmarks.map((bookmark) => (
                <BookmarkListItem
                  key={bookmark.id}
                  bookmark={bookmark}
                  category={categoryMap.get(bookmark.categoryId || '')}
                  isSelected={selectedBookmarks.has(bookmark.id)}
                  onSelect={() => toggleBookmarkSelect(bookmark.id)}
                  onEdit={() => handleEditClick(bookmark)}
                  onDelete={() => handleDeleteClick(bookmark.id)}
                  onOpen={() => handleOpenBookmark(bookmark.url)}
                  showFavicon={settings.showFavicon}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <footer className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <span>
          共 {bookmarks.length} 个书签 · {categories.length} 个分类
        </span>
        <span>
          {settings.viewMode === 'card' ? '卡片视图' : '列表视图'}
        </span>
      </footer>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                {editingBookmark ? '编辑书签' : '添加书签'}
              </h3>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingBookmark(null);
                }}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <BookmarkForm
                bookmark={editingBookmark}
                categories={categories}
                defaultCategoryId={settings.defaultCategory}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingBookmark(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <ImportExportModal
        mode="import"
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        data={store.data}
        bookmarks={bookmarks}
        onImport={(content, format, mode) => importData(content, format, mode)}
      />

      <ImportExportModal
        mode="export"
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        data={store.data}
        bookmarks={bookmarks}
        onImport={() => {}}
      />

      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setPendingDeleteId(null);
          setPendingBulkDelete([]);
        }}
        title="确认删除"
        size="sm"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {pendingBulkDelete.length > 0
            ? `确定要删除选中的 ${pendingBulkDelete.length} 个书签吗？此操作无法撤销。`
            : '确定要删除这个书签吗？此操作无法撤销。'}
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => {
              setIsDeleteConfirmOpen(false);
              setPendingDeleteId(null);
              setPendingBulkDelete([]);
            }}
            className="px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirmDelete}
            className="px-4 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            删除
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="插件设置"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              显示 Favicon
            </span>
            <button
              onClick={() =>
                updateSettings({ showFavicon: !settings.showFavicon })
              }
              className={`w-10 h-5 rounded-full transition-colors ${
                settings.showFavicon
                  ? 'bg-primary'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.showFavicon ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              默认排序
            </span>
            <select
              value={settings.sortBy}
              onChange={(e) =>
                updateSettings({
                  sortBy: e.target.value as 'createdAt' | 'title' | 'order'
                })
              }
              className="px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary"
            >
              <option value="createdAt">创建时间</option>
              <option value="title">标题</option>
              <option value="order">自定义排序</option>
            </select>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={() => {
                resetAllData();
                setIsSettingsOpen(false);
              }}
              className="w-full px-3 py-2 text-sm border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              重置所有数据
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              将清除所有书签和分类数据
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ToolPanel;