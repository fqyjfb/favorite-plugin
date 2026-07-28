import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  Bookmark,
  Category,
  PluginData,
  PluginSettings,
  ImportFormat,
  ImportResult,
  ToastMessage
} from '../types';
import {
  loadData,
  saveData,
  addBookmark as createBookmark,
  updateBookmark as modifyBookmark,
  addCategory as createCategory,
  buildCategoryTree,
  searchBookmarks as filterBookmarks,
  sortBookmarks,
  getNextOrder
} from '../services/storageService';
import { parseBrowserBookmarks, parseJsonImport, parseTextImport } from '../services/importService';

export function useBookmarkStore() {
  const [data, setData] = useState<PluginData>(() => loadData());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>('all');
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
    }
  }, []);

  const persist = useCallback((nextData: PluginData) => {
    setData(nextData);
    saveData(nextData);
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastMessage['type'] = 'info') => {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  const bookmarks = data.bookmarks;
  const categories = data.categories;
  const settings = data.settings;

  const categoryTree = buildCategoryTree(categories);

  const filteredBookmarks = (() => {
    let result = bookmarks;

    if (selectedCategoryId !== 'all') {
      if (selectedCategoryId) {
        const childIds = new Set<string>([selectedCategoryId]);
        const stack = [selectedCategoryId];
        while (stack.length > 0) {
          const current = stack.pop()!;
          categories.forEach((cat) => {
            if (cat.parentId === current && !childIds.has(cat.id)) {
              childIds.add(cat.id);
              stack.push(cat.id);
            }
          });
        }
        result = result.filter(
          (b) => b.categoryId && childIds.has(b.categoryId)
        );
      } else {
        result = result.filter((b) => !b.categoryId);
      }
    }

    if (searchQuery.trim()) {
      result = filterBookmarks(result, searchQuery);
    }

    return sortBookmarks(result, settings.sortBy, settings.sortOrder);
  })();

  const addBookmark = useCallback(
    (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => {
      const bookmark = createBookmark(data);
      const nextData = {
        ...data,
        bookmarks: [...data.bookmarks, bookmark]
      };
      persist(nextData);
      addToast('书签添加成功', 'success');
      return bookmark;
    },
    [data, persist, addToast]
  );

  const updateBookmark = useCallback(
    (id: string, changes: Partial<Bookmark>) => {
      const nextData = {
        ...data,
        bookmarks: data.bookmarks.map((b) =>
          b.id === id ? modifyBookmark(b, changes) : b
        )
      };
      persist(nextData);
      addToast('书签更新成功', 'success');
    },
    [data, persist, addToast]
  );

  const deleteBookmark = useCallback(
    (id: string) => {
      const nextData = {
        ...data,
        bookmarks: data.bookmarks.filter((b) => b.id !== id)
      };
      persist(nextData);
      addToast('书签已删除', 'success');
    },
    [data, persist, addToast]
  );

  const bulkDeleteBookmarks = useCallback(
    (ids: string[]) => {
      const nextData = {
        ...data,
        bookmarks: data.bookmarks.filter((b) => !ids.includes(b.id))
      };
      persist(nextData);
      setSelectedBookmarks(new Set());
      addToast(`已删除 ${ids.length} 个书签`, 'success');
    },
    [data, persist, addToast]
  );

  const toggleBookmarkSelect = useCallback((id: string) => {
    setSelectedBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllBookmarks = useCallback(() => {
    setSelectedBookmarks(new Set(filteredBookmarks.map((b) => b.id)));
  }, [filteredBookmarks]);

  const clearSelection = useCallback(() => {
    setSelectedBookmarks(new Set());
  }, []);

  const addCategory = useCallback(
    (name: string, parentId: string | null = null) => {
      const order = getNextOrder(
        categories.filter((c) => c.parentId === parentId)
      );
      const category = createCategory(name, parentId, order);
      const nextData = {
        ...data,
        categories: [...data.categories, category]
      };
      persist(nextData);
      addToast('分类添加成功', 'success');
      return category;
    },
    [data, categories, persist, addToast]
  );

  const updateCategory = useCallback(
    (id: string, name: string) => {
      const nextData = {
        ...data,
        categories: data.categories.map((c) =>
          c.id === id ? { ...c, name } : c
        )
      };
      persist(nextData);
      addToast('分类更新成功', 'success');
    },
    [data, persist, addToast]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      if (categories.filter((c) => c.parentId === id).length > 0) {
        addToast('请先删除子分类', 'warning');
        return;
      }
      const isDefault = data.settings.defaultCategory === id;
      const nextData = {
        ...data,
        categories: data.categories.filter((c) => c.id !== id),
        bookmarks: data.bookmarks.map((b) =>
          b.categoryId === id ? { ...b, categoryId: null } : b
        ),
        settings: isDefault
          ? { ...data.settings, defaultCategory: null }
          : data.settings
      };
      persist(nextData);
      if (isDefault) {
        setSelectedCategoryId('all');
      }
      addToast('分类已删除，书签移至未分类', 'success');
    },
    [data, categories, persist, addToast]
  );

  const updateSettings = useCallback(
    (changes: Partial<PluginSettings>) => {
      const nextData = {
        ...data,
        settings: { ...data.settings, ...changes }
      };
      persist(nextData);
    },
    [data, persist]
  );

  const importData = useCallback(
    (content: string, format: ImportFormat, mode: 'merge' | 'replace' = 'merge'): ImportResult => {
      let result: ImportResult;

      switch (format) {
        case 'html':
          result = parseBrowserBookmarks(content);
          break;
        case 'json':
          result = parseJsonImport(content);
          break;
        case 'txt':
          result = parseTextImport(content);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      if (mode === 'replace') {
        const uncategorizedId =
          result.categories.find((c) => !c.parentId)?.id || 'uncategorized';
        const now = new Date().toISOString();
        if (!result.categories.find((c) => c.id === uncategorizedId)) {
          result.categories.push({
            id: uncategorizedId,
            name: '未分类',
            parentId: null,
            order: 0,
            createdAt: now
          });
        }
        const nextData: PluginData = {
          version: '1.0.0',
          bookmarks: result.bookmarks,
          categories: result.categories,
          settings: {
            ...data.settings,
            defaultCategory:
              data.settings.defaultCategory || uncategorizedId
          }
        };
        persist(nextData);
      } else {
        const existingIds = new Set(data.bookmarks.map((b) => b.url));
        const newBookmarks = result.bookmarks.filter(
          (b) => !existingIds.has(b.url)
        );
        const existingCategoryNames = new Set(
          data.categories.map((c) => c.name)
        );
        const newCategories = result.categories.filter(
          (c) => !existingCategoryNames.has(c.name)
        );
        const nextData: PluginData = {
          ...data,
          bookmarks: [...data.bookmarks, ...newBookmarks],
          categories: [...data.categories, ...newCategories]
        };
        persist(nextData);
        result = {
          ...result,
          bookmarks: newBookmarks,
          categories: newCategories,
          conflicts: result.bookmarks.length - newBookmarks
        };
      }

      addToast(`导入完成：${result.total} 个书签`, 'success');
      return result;
    },
    [data, persist, addToast]
  );

  const resetAllData = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('toolbox.favorite-plugin.data');
    }
    setData(loadData());
    setSearchQuery('');
    setSelectedCategoryId('all');
    setSelectedBookmarks(new Set());
    addToast('数据已重置', 'success');
  }, [addToast]);

  return {
    // State
    data,
    bookmarks,
    categories,
    categoryTree,
    settings,
    searchQuery,
    selectedCategoryId,
    selectedBookmarks,
    filteredBookmarks,
    toasts,
    // Actions
    setSearchQuery,
    setSelectedCategoryId,
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
    updateSettings,
    importData,
    resetAllData,
    addToast
  };
}