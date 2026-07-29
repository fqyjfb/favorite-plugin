import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Pencil,
  FolderOpen,
  ChevronDown
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
    updateCategoryColor,
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
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const [contentMenu, setContentMenu] = useState<{
    visible: boolean; x: number; y: number;
    bookmarkId: string | null;
  }>({ visible: false, x: 0, y: 0, bookmarkId: null });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentMenuRef = useRef<HTMLDivElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

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

  useEffect(() => {
    if (!tagDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [tagDropdownOpen]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, typeof categories[0]>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const bookmarkCounts = useMemo(() => {
    const counts = new Map<string | null, number>();
    counts.set('__all__', bookmarks.length);
    counts.set(null, bookmarks.filter((b) => !b.categoryId).length);

    const allIds: string[] = [];
    const stack = [...categoryTree];
    while (stack.length > 0) {
      const node = stack.pop()!;
      allIds.push(node.id);
      if (node.children && node.children.length > 0) {
        stack.push(...node.children);
      }
    }

    allIds.forEach((id) => {
      const childIds = new Set<string>([id]);
      const idStack = [id];
      while (idStack.length > 0) {
        const current = idStack.pop()!;
        categories.forEach((cat) => {
          if (cat.parentId === current && !childIds.has(cat.id)) {
            childIds.add(cat.id);
            idStack.push(cat.id);
          }
        });
      }
      counts.set(id, bookmarks.filter((b) => b.categoryId && childIds.has(b.categoryId)).length);
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

  const singleSelectedBookmark = useMemo(() => {
    if (selectedBookmarks.size === 1) {
      const id = Array.from(selectedBookmarks)[0];
      return bookmarks.find((b) => b.id === id);
    }
    return null;
  }, [selectedBookmarks, bookmarks]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg)' }}>
      <ToastContainer toasts={toasts} />

      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'var(--color-bg-card)'
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
        position: 'relative', zIndex: 10
      }}>
        <div style={{ flex: '0 1 200px', minWidth: '160px' }}>
          <SearchBar value={searchQuery} onChange={setSearchQuery} inputRef={searchInputRef} />
        </div>

        {allTags.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, overflow: 'hidden' }}>
            {(() => {
              const visiblePool = allTags.filter((t) => !settings.hiddenTags.includes(t));
              const limit = Math.max(1, settings.tagDisplayLimit || 5);
              const visibleTags = visiblePool.slice(0, limit);
              const hiddenOverflow = visiblePool.slice(limit);
              return (
                <>
                  {visibleTags.map((tag) => (
                    <button
                      key={tag}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', tag);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const draggedTag = e.dataTransfer.getData('text/plain');
                        if (draggedTag && draggedTag !== tag) {
                          const baseOrder = settings.tagOrder.length ? settings.tagOrder : allTags;
                          const newOrder = [...baseOrder];
                          const fromIdx = newOrder.indexOf(draggedTag);
                          const toIdx = newOrder.indexOf(tag);
                          if (fromIdx !== -1 && toIdx !== -1) {
                            newOrder.splice(fromIdx, 1);
                            newOrder.splice(toIdx, 0, draggedTag);
                            updateSettings({ tagOrder: newOrder });
                          }
                        }
                      }}
                      onClick={() => toggleTag(tag)}
                      title={tag}
                      style={{
                        padding: '2px 8px', fontSize: '12px', borderRadius: '4px',
                        cursor: 'pointer', border: 'none', transition: 'background-color 0.15s',
                        background: selectedTags.has(tag) ? 'var(--color-primary)' : 'var(--color-neutral-100)',
                        color: selectedTags.has(tag) ? '#fff' : 'var(--color-text-secondary)',
                        whiteSpace: 'nowrap', flexShrink: 0
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                  {hiddenOverflow.length > 0 && (
                    <>
                      <button
                        ref={moreBtnRef}
                        onClick={() => {
                          if (moreBtnRef.current) {
                            const rect = moreBtnRef.current.getBoundingClientRect();
                            setDropdownPos({ top: rect.bottom + 4, left: rect.left });
                          }
                          setTagDropdownOpen(!tagDropdownOpen);
                        }}
                        title={`更多 (${hiddenOverflow.length})`}
                        style={{
                          padding: '2px 6px', fontSize: '12px', borderRadius: '4px',
                          cursor: 'pointer', border: 'none',
                          background: 'var(--color-neutral-100)',
                          color: 'var(--color-text-secondary)',
                          display: 'flex', alignItems: 'center', gap: '2px',
                          whiteSpace: 'nowrap', flexShrink: 0
                        }}
                      >
                        更多
                        <ChevronDown size={12} style={{
                          transition: 'transform 0.15s',
                          transform: tagDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                        }} />
                      </button>
                      {tagDropdownOpen && createPortal(
                        <div
                          ref={tagDropdownRef}
                          style={{
                            position: 'fixed', top: dropdownPos.top, left: dropdownPos.left,
                            background: 'var(--color-bg-card)',
                            border: '1px solid var(--color-neutral-200)',
                            borderRadius: '6px', boxShadow: 'var(--shadow-md)',
                            minWidth: '140px', padding: '4px 0', zIndex: 9999,
                            maxHeight: '200px', overflowY: 'auto'
                          }}
                          className="fp-scrollbar"
                        >
                          {hiddenOverflow.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => { toggleTag(tag); setTagDropdownOpen(false); }}
                              title={tag}
                              style={{
                                display: 'block', width: '100%', textAlign: 'left',
                                padding: '6px 12px', fontSize: '12px', border: 'none',
                                cursor: 'pointer',
                                background: selectedTags.has(tag) ? 'var(--color-primary)' : 'transparent',
                                color: selectedTags.has(tag) ? '#fff' : 'var(--color-text-secondary)',
                                transition: 'background-color 0.1s'
                              }}
                              onMouseEnter={(e) => {
                                if (!selectedTags.has(tag)) e.currentTarget.style.background = 'var(--color-neutral-100)';
                              }}
                              onMouseLeave={(e) => {
                                if (!selectedTags.has(tag)) e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>,
                        document.body
                      )}
                    </>
                  )}
                  {selectedTags.size > 0 && (
                    <button
                      onClick={clearTagFilter}
                      style={{
                        padding: '2px 6px', fontSize: '12px', color: 'var(--color-error)',
                        border: 'none', borderRadius: '4px',
                        background: 'var(--color-error)14', cursor: 'pointer',
                        transition: 'background-color 0.15s',
                        whiteSpace: 'nowrap', flexShrink: 0
                      }}
                    >
                      清除
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        )}

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

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside style={{
          width: '224px', flexShrink: 0,
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
            onUpdateCategoryColor={updateCategoryColor}
            bookmarkCounts={bookmarkCounts}
            renamingCategoryId={renamingCategoryId}
            onStartRename={(id) => setRenamingCategoryId(id)}
            onFinishRename={() => setRenamingCategoryId(null)}
          />
        </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            flexShrink: 0, padding: '8px 16px',
            background: 'transparent'
          }}>
            {settings.viewMode === 'list' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '8px 12px'
              }}>
                <button
                  onClick={handleSelectAll}
                  title={allSelected ? '取消全选' : '全选'}
                  style={{ padding: '4px', borderRadius: '4px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                >
                  {allSelected ? (
                    <X size={16} style={{ color: 'var(--color-primary)' }} />
                  ) : (
                    <CheckSquare size={16} style={{ color: selectedBookmarks.size > 0 ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }} />
                  )}
                </button>
                <button
                  onClick={handleBulkDelete}
                  title="删除选中"
                  disabled={selectedBookmarks.size === 0}
                  style={{
                    padding: '4px', borderRadius: '4px', background: 'none', border: 'none',
                    cursor: selectedBookmarks.size > 0 ? 'pointer' : 'not-allowed',
                    color: selectedBookmarks.size > 0 ? 'var(--color-error)' : 'var(--color-text-tertiary)',
                    display: 'flex', opacity: selectedBookmarks.size > 0 ? 1 : 0.4
                  }}
                >
                  <Trash2 size={14} />
                </button>
                <span style={{ flex: 1, fontSize: '12px', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>书签</span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', width: '96px' }}>分类</span>
                <div style={{ width: '64px' }} />
              </div>
            )}
          </div>

          <div
            style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px' }}
            className="fp-scrollbar"
            onContextMenu={(e) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.fp-bookmark-card') && !target.closest('.fp-bookmark-item')) {
              handleContentContextMenu(e, null);
            }
          }}
          >
            {filteredBookmarks.length === 0 ? (
              <EmptyState
                hasBookmarks={bookmarks.length > 0}
                onAddBookmark={handleAddClick}
                onImport={() => setIsImportOpen(true)}
                hasCategories={categories.length > 0}
              />
            ) : settings.viewMode === 'card' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', paddingTop: '4px' }}>
                {filteredBookmarks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    category={categoryMap.get(bookmark.categoryId || '')}
                    isSelected={selectedBookmarks.has(bookmark.id)}
                    onSelect={() => toggleBookmarkSelect(bookmark.id)}
                    onOpen={() => handleOpenBookmark(bookmark.url)}
                    onContextMenu={(e) => handleContentContextMenu(e, bookmark.id)}
                    showFavicon={settings.showFavicon}
                  />
                ))}
              </div>
            ) : (
              <div style={{ paddingTop: '4px' }}>
                {filteredBookmarks.map((bookmark) => (
                  <BookmarkListItem
                    key={bookmark.id}
                    bookmark={bookmark}
                    category={categoryMap.get(bookmark.categoryId || '')}
                    isSelected={selectedBookmarks.has(bookmark.id)}
                    onSelect={() => toggleBookmarkSelect(bookmark.id)}
                    onOpen={() => handleOpenBookmark(bookmark.url)}
                    onContextMenu={(e) => handleContentContextMenu(e, bookmark.id)}
                    showFavicon={settings.showFavicon}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <footer style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', background: selectedBookmarks.size > 0 ? 'var(--color-primary)' + '0d' : 'var(--color-bg-card)',
        fontSize: '12px', color: 'var(--color-text-tertiary)'
      }}>
        <span>
          共 {bookmarks.length} 个书签 · {categories.length} 个分类
          {selectedBookmarks.size > 0 && (
            <span style={{ marginLeft: 12, color: 'var(--color-primary)', fontWeight: 500 }}>
              已选 {selectedBookmarks.size} 个
            </span>
          )}
        </span>
        <span>{settings.viewMode === 'card' ? '卡片视图' : '列表视图'}</span>
      </footer>

      {isFormOpen && (
        <div className="fp-modal-overlay">
          <div className="fp-modal">
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px'
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
                categories={categoryTree}
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
              {selectedBookmarks.size === 1 && singleSelectedBookmark && (
                <div
                  className="fp-context-menu-item"
                  onClick={() => handleEditClick(singleSelectedBookmark)}
                >
                  <Pencil size={14} /> 编辑
                </div>
              )}
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
          <div className="fp-modal" style={{ maxWidth: '420px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px'
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

              <div style={{ borderTop: '1px solid var(--color-neutral-200)', paddingTop: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px' }}>标签显示</h4>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>显示标签数量</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={settings.tagDisplayLimit}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(20, parseInt(e.target.value) || 5));
                      updateSettings({ tagDisplayLimit: v });
                    }}
                    style={{
                      width: '64px', padding: '4px 8px', fontSize: '13px',
                      border: '1px solid var(--color-neutral-300)', borderRadius: '6px',
                      background: 'var(--color-bg-card)', color: 'var(--color-text)',
                      textAlign: 'right'
                    }}
                  />
                </div>

                {allTags.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      显示的标签（勾选显示，支持拖拽排序）
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {allTags.map((tag) => {
                        const hidden = settings.hiddenTags.includes(tag);
                        return (
                          <div
                            key={tag}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', tag);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const draggedTag = e.dataTransfer.getData('text/plain');
                              if (draggedTag && draggedTag !== tag) {
                                const newOrder = [...(settings.tagOrder.length ? settings.tagOrder : allTags)];
                                const fromIdx = newOrder.indexOf(draggedTag);
                                const toIdx = newOrder.indexOf(tag);
                                if (fromIdx !== -1 && toIdx !== -1) {
                                  newOrder.splice(fromIdx, 1);
                                  newOrder.splice(toIdx, 0, draggedTag);
                                  updateSettings({ tagOrder: newOrder });
                                }
                              }
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '6px 8px', borderRadius: '4px',
                              background: 'var(--color-neutral-50)',
                              cursor: 'grab',
                              transition: 'background-color 0.15s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-neutral-100)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-neutral-50)'; }}
                          >
                            <input
                              type="checkbox"
                              checked={!hidden}
                              onChange={() => {
                                const newHidden = hidden
                                  ? settings.hiddenTags.filter((t) => t !== tag)
                                  : [...settings.hiddenTags, tag];
                                updateSettings({ hiddenTags: newHidden });
                              }}
                              style={{ margin: 0 }}
                            />
                            <span style={{ flex: 1, fontSize: '13px', color: hidden ? 'var(--color-text-tertiary)' : 'var(--color-text)', textDecoration: hidden ? 'line-through' : 'none' }}>
                              {tag}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>⋮⋮</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ paddingTop: '8px', borderTop: '1px solid var(--color-neutral-200)' }}>
                <button
                  onClick={() => setIsResetConfirmOpen(true)}
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

      {isResetConfirmOpen && (
        <div className="fp-modal-overlay">
          <div className="fp-modal" style={{ maxWidth: '384px' }}>
            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                确定要重置所有数据吗？此操作将清除所有书签和分类，且无法撤销。
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="fp-btn-secondary"
                  style={{ padding: '6px 16px', fontSize: '13px' }}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    resetAllData();
                    setIsResetConfirmOpen(false);
                    setIsSettingsOpen(false);
                  }}
                  className="fp-btn-danger"
                  style={{ padding: '6px 16px', fontSize: '13px' }}
                >
                  确认重置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolPanel;