import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  Bookmark,
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
  Tag,
  Pencil,
  FolderOpen
} from 'lucide-react';
import { useBookmarkStore } from './store/useBookmarkStore';
import CategoryTree from './components/CategoryTree';
import SearchBar from './components/SearchBar';
import BookmarkForm from './components/BookmarkForm';
import BookmarkCard from './components/BookmarkCard';
import BookmarkListItem from './components/BookmarkListItem';
import ImportExportModal from './components/ImportExportModal';
import EmptyState from './components/EmptyState';
import ToastContainer from './components/ToastContainer';
import type { Bookmark as BookmarkType } from './types';
import { normalizeUrl } from './utils/validator';
import './styles.css';

const ToolPanel: React.FC = () => {
  const store = useBookmarkStore();
  const {
    bookmarks,
    categories,
    categoryTree,
    settings,
    searchQuery,
    selectedCategoryId,
    selectedTags,
    allTags,
    selectedBookmarks,
    filteredBookmarks,
    toasts,
    setSearchQuery,
    setSelectedCategoryId,
    toggleTag,
    clearTagFilter,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    bulkDeleteBookmarks,
    toggleBookmarkSelect,
    selectAllBookmarks,
    clearSelection,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategory,
    updateSettings,
    importData,
    resetAllData
  } = store;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [renamingCategoryId, setRenamingCategoryId] = useState<string | null>(null);

  const [contentMenu, setContentMenu] = useState<{
    visible: boolean; x: number; y: number;
    bookmarkId: string | null;
  }>({ visible: false, x: 0, y: 0, bookmarkId: null });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentMenuRef = useRef<HTMLDivElement>(null);

  const closeContentMenu = useCallback(() => {
    setContentMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (contentMenuRef.current && !contentMenuRef.current.contains(e.target as Node)) {
        closeContentMenu();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeContentMenu();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [closeContentMenu]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, typeof categories[0]>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const bookmarkCounts = useMemo(() => {
    const counts = new Map<string | null, number>();
    counts.set('__all__', bookmarks.length);
    counts.set(null, bookmarks.filter((b) => !b.categoryId).length);

    const countForCategory = (catId: string): number => {
      const childIds = new Set<string>([catId]);
      const stack = [catId];
      while (stack.length > 0) {
        const current = stack.pop()!;
        categories.forEach((cat) => {
          if (cat.parentId === current && !childIds.has(cat.id)) {
            childIds.add(cat.id);
            stack.push(cat.id);
          }
        });
      }
      return bookmarks.filter((b) => b.categoryId && childIds.has(b.categoryId)).length;
    };

    categoryTree.forEach((rootCat) => {
      counts.set(rootCat.id, countForCategory(rootCat.id));
    });

    return counts;
  }, [bookmarks, categories, categoryTree]);

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
    closeContentMenu();
  }, [closeContentMenu]);

  const handleEditClick = useCallback((bookmark: BookmarkType) => {
    setEditingBookmark(bookmark);
    setIsFormOpen(true);
    closeContentMenu();
  }, [closeContentMenu]);

  const handleDeleteClick = useCallback((id: string) => {
    setPendingDeleteId(id);
    setIsDeleteConfirmOpen(true);
    closeContentMenu();
  }, [closeContentMenu]);

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

  const handleContentContextMenu = useCallback((e: React.MouseEvent, bookmarkId: string | null) => {
    e.preventDefault();
    setContentMenu({ visible: true, x: e.clientX, y: e.clientY, bookmarkId });
  }, []);

  const allSelected =
    filteredBookmarks.length > 0 &&
    selectedBookmarks.size === filteredBookmarks.length;

  const labelBase: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--color-text)'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg)' }}>
      <ToastContainer toasts={toasts} />

      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'var(--color-bg-card)',
        borderBottom: '1px solid var(--color-neutral-200)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bookmark size={20} style={{ color: 'var(--color-primary)' }} />
          <h1 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
            网址收藏夹
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setIsExportOpen(true)}
            title="导出"
            style={{
              padding: '6px', borderRadius: '6px', background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--color-text-secondary)',
              display: 'flex', alignItems: 'center', transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-neutral-100)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => setIsImportOpen(true)}
            title="导入"
            style={{
              padding: '6px', borderRadius: '6px', background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--color-text-secondary)',
              display: 'flex', alignItems: 'center', transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-neutral-100)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Upload size={16} />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="设置"
            style={{
              padding: '6px', borderRadius: '6px', background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--color-text-secondary)',
              display: 'flex', alignItems: 'center', transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-neutral-100)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 16px', background: 'var(--color-bg-card)',
        borderBottom: '1px solid var(--color-neutral-200)'
      }}>
        <div style={{ flex: '0 1 200px', minWidth: '160px' }}>
          <SearchBar value={searchQuery} onChange={setSearchQuery} inputRef={searchInputRef} />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={toggleSort}
            title={`排序: ${settings.sortBy}`}
            style={{
              padding: '6px', borderRadius: '6px', background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--color-text-secondary)',
              display: 'flex', alignItems: 'center', transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-neutral-100)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {settings.sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
          </button>

          <button
            onClick={() => updateSettings({ viewMode: settings.viewMode === 'card' ? 'list' : 'card' })}
            title={settings.viewMode === 'card' ? '列表视图' : '卡片视图'}
            style={{
              padding: '6px', borderRadius: '6px', background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--color-text-secondary)',
              display: 'flex', alignItems: 'center', transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-neutral-100)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {settings.viewMode === 'card' ? <List size={16} /> : <LayoutGrid size={16} />}
          </button>
        </div>
      </div>

      {allTags.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
          padding: '8px 16px', background: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-neutral-200)'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <Tag size={12} /> 标签筛选:
          </span>
          {selectedTags.size > 0 && (
            <button
              onClick={clearTagFilter}
              style={{
                padding: '2px 8px', fontSize: '12px', color: 'var(--color-error)',
                border: '1px solid var(--color-error)' + '4d', borderRadius: '4px',
                background: 'none', cursor: 'pointer', transition: 'background-color 0.15s'
              }}
            >
              清除
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  padding: '2px 8px', fontSize: '12px', borderRadius: '4px',
                  cursor: 'pointer', border: 'none', transition: 'background-color 0.15s',
                  background: selectedTags.has(tag) ? 'var(--color-primary)' : 'var(--color-neutral-100)',
                  color: selectedTags.has(tag) ? '#fff' : 'var(--color-text-secondary)'
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside style={{
          width: '224px', flexShrink: 0, borderRight: '1px solid var(--color-neutral-200)',
          background: 'var(--color-bg-card)', padding: '8px', overflow: 'auto'
        }} className="fp-scrollbar">
          <CategoryTree
            categories={categoryTree}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onAddCategory={(name, parentId) => addCategory(name, parentId)}
            onUpdateCategory={(id, name) => updateCategory(id, name)}
            onDeleteCategory={(id) => deleteCategory(id)}
            onReorderCategory={reorderCategory}
            bookmarkCounts={bookmarkCounts}
            renamingCategoryId={renamingCategoryId}
            onStartRename={(id) => setRenamingCategoryId(id)}
            onFinishRename={() => setRenamingCategoryId(null)}
          />
        </aside>

        <main
          style={{ flex: 1, overflow: 'auto', padding: '16px' }}
          className="fp-scrollbar"
          onContextMenu={(e) => handleContentContextMenu(e, null)}
        >
          {selectedBookmarks.size > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '12px', padding: '8px 12px', borderRadius: '6px',
              background: 'var(--color-primary)' + '0d'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleSelectAll}
                  style={{ padding: '4px', borderRadius: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {allSelected ? (
                    <X size={16} style={{ color: 'var(--color-primary)' }} />
                  ) : (
                    <CheckSquare size={16} style={{ color: 'var(--color-primary)' }} />
                  )}
                </button>
                <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                  已选 {selectedBookmarks.size} 个
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={clearSelection}
                  style={{ padding: '4px 8px', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                >
                  取消
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="fp-btn-danger"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                >
                  <Trash2 size={12} style={{ marginRight: '4px' }} />删除
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
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
                  onContextMenu={(e) => handleContentContextMenu(e, bookmark.id)}
                  showFavicon={settings.showFavicon}
                />
              ))}
            </div>
          ) : (
            <div style={{ border: '1px solid var(--color-neutral-200)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '8px 12px', background: 'var(--color-neutral-100)',
                borderBottom: '1px solid var(--color-neutral-200)'
              }}>
                <div style={{ width: '16px' }} />
                <div style={{ width: '20px' }} />
                <span style={{ flex: 1, fontSize: '12px', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>书签</span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', width: '96px' }}>分类</span>
                <div style={{ width: '64px' }} />
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
                  onContextMenu={(e) => handleContentContextMenu(e, bookmark.id)}
                  showFavicon={settings.showFavicon}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <footer style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', background: 'var(--color-bg-card)',
        borderTop: '1px solid var(--color-neutral-200)',
        fontSize: '12px', color: 'var(--color-text-tertiary)'
      }}>
        <span>共 {bookmarks.length} 个书签 · {categories.length} 个分类</span>
        <span>{settings.viewMode === 'card' ? '卡片视图' : '列表视图'}</span>
      </footer>

      {isFormOpen && (
        <div className="fp-modal-overlay">
          <div className="fp-modal">
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: '1px solid var(--color-neutral-200)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                {editingBookmark ? '编辑书签' : '添加书签'}
              </h3>
              <button
                onClick={() => { setIsFormOpen(false); setEditingBookmark(null); }}
                style={{
                  padding: '4px', borderRadius: '4px', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--color-text-tertiary)', display: 'flex'
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '16px', overflowY: 'auto' }} className="fp-scrollbar">
              <BookmarkForm
                bookmark={editingBookmark}
                categories={categories}
                defaultCategoryId={settings.defaultCategory}
                onSubmit={handleFormSubmit}
                onCancel={() => { setIsFormOpen(false); setEditingBookmark(null); }}
              />
            </div>
          </div>
        </div>
      )}

      {contentMenu.visible && (
        <div
          ref={contentMenuRef}
          className="fp-context-menu"
          style={{ left: contentMenu.x, top: contentMenu.y }}
        >
          {contentMenu.bookmarkId ? (
            <>
              <div
                className="fp-context-menu-item"
                onClick={() => {
                  const b = bookmarks.find((b) => b.id === contentMenu.bookmarkId);
                  if (b) handleOpenBookmark(b.url);
                  closeContentMenu();
                }}
              >
                <FolderOpen size={14} /> 打开
              </div>
              <div className="fp-context-menu-separator" />
              <div
                className="fp-context-menu-item"
                onClick={() => {
                  const b = bookmarks.find((b) => b.id === contentMenu.bookmarkId);
                  if (b) handleEditClick(b);
                }}
              >
                <Pencil size={14} /> 编辑
              </div>
              {selectedBookmarks.size > 1 && (
                <div
                  className="fp-context-menu-item"
                  onClick={() => {
                    if (selectedBookmarks.has(contentMenu.bookmarkId!)) {
                      handleBulkDelete();
                    } else {
                      handleDeleteClick(contentMenu.bookmarkId!);
                    }
                  }}
                >
                  <Trash2 size={14} /> {selectedBookmarks.size > 1 ? `删除选中(${selectedBookmarks.size})` : '删除'}
                </div>
              )}
              {selectedBookmarks.size <= 1 && (
                <div
                  className="fp-context-menu-item danger"
                  onClick={() => handleDeleteClick(contentMenu.bookmarkId!)}
                >
                  <Trash2 size={14} /> 删除
                </div>
              )}
            </>
          ) : (
            <>
              <div
                className="fp-context-menu-item"
                onClick={handleAddClick}
              >
                <Bookmark size={14} /> 添加书签
              </div>
              {selectedBookmarks.size > 0 && (
                <>
                  <div className="fp-context-menu-separator" />
                  <div
                    className="fp-context-menu-item"
                    onClick={handleSelectAll}
                  >
                    <CheckSquare size={14} /> {allSelected ? '取消全选' : '全选'}
                  </div>
                  <div
                    className="fp-context-menu-item danger"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 size={14} /> 删除选中 ({selectedBookmarks.size})
                  </div>
                </>
              )}
            </>
          )}
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

      {isDeleteConfirmOpen && (
        <div className="fp-modal-overlay">
          <div className="fp-modal" style={{ maxWidth: '384px' }}>
            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                {pendingBulkDelete.length > 0
                  ? `确定要删除选中的 ${pendingBulkDelete.length} 个书签吗？此操作无法撤销。`
                  : '确定要删除这个书签吗？此操作无法撤销。'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setPendingDeleteId(null);
                    setPendingBulkDelete([]);
                  }}
                  className="fp-btn-secondary"
                  style={{ padding: '6px 16px', fontSize: '13px' }}
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="fp-btn-danger"
                  style={{ padding: '6px 16px', fontSize: '13px' }}
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fp-modal-overlay">
          <div className="fp-modal" style={{ maxWidth: '384px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: '1px solid var(--color-neutral-200)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>插件设置</h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                style={{ padding: '4px', borderRadius: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', display: 'flex' }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={labelBase}>显示 Favicon</span>
                <button
                  onClick={() => updateSettings({ showFavicon: !settings.showFavicon })}
                  style={{
                    width: '40px', height: '20px', borderRadius: '10px',
                    background: settings.showFavicon ? 'var(--color-primary)' : 'var(--color-neutral-300)',
                    border: 'none', cursor: 'pointer', position: 'relative', transition: 'background-color 0.15s'
                  }}
                >
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: '2px',
                    left: settings.showFavicon ? '22px' : '2px',
                    transition: 'left 0.15s'
                  }} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={labelBase}>默认排序</span>
                <select
                  value={settings.sortBy}
                  onChange={(e) => updateSettings({ sortBy: e.target.value as 'createdAt' | 'title' | 'order' })}
                  className="fp-input"
                  style={{ width: '120px', padding: '6px 8px' }}
                >
                  <option value="createdAt">创建时间</option>
                  <option value="title">标题</option>
                  <option value="order">自定义排序</option>
                </select>
              </div>

              <div style={{ borderTop: '1px solid var(--color-neutral-200)', paddingTop: '16px' }}>
                <button
                  onClick={() => { resetAllData(); setIsSettingsOpen(false); }}
                  style={{
                    width: '100%', padding: '8px 12px', fontSize: '13px',
                    border: '1px solid var(--color-error)', borderRadius: '6px',
                    background: 'none', cursor: 'pointer', transition: 'background-color 0.15s',
                    color: 'var(--color-error)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-error)' + '0d'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  重置所有数据
                </button>
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', margin: '4px 0 0' }}>
                  将清除所有书签和分类数据
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolPanel;