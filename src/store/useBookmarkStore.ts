import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type {
  Bookmark,
  Category,
  CategoryColor,
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
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
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

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    bookmarks.forEach((b) => {
      if (b.tags) b.tags.forEach((t) => tagSet.add(t));
    });
    const all = Array.from(tagSet);
    const orderMap = new Map(settings.tagOrder.map((t, i) => [t, i]));
    return all.sort((a, b) => {
      const aIdx = orderMap.get(a);
      const bIdx = orderMap.get(b);
      if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx;
      if (aIdx !== undefined) return -1;
      if (bIdx !== undefined) return 1;
      return a.localeCompare(b);
    });
  }, [bookmarks, settings.tagOrder]);

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

    if (selectedTags.size > 0) {
      result = result.filter((b) =>
        Array.from(selectedTags).every((t) => b.tags?.includes(t))
      );
    }

    if (searchQuery.trim()) {
      result = filterBookmarks(result, searchQuery);
    }

    return sortBookmarks(result, settings.sortBy, settings.sortOrder);
  })();

  const addBookmark = useCallback(
    (bookmarkData: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => {
      const bookmark = createBookmark(bookmarkData);
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

  const updateCategoryColor = useCallback(
    (id: string, color: CategoryColor) => {
      const nextData = {
        ...data,
        categories: data.categories.map((c) =>
          c.id === id ? { ...c, color } : c
        )
      };
      persist(nextData);
      addToast(color ? '已标记颜色' : '已取消标记', 'success');
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

  const reorderCategory = useCallback(
    (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'child') => {
      const dragged = categories.find((c) => c.id === draggedId);
      if (!dragged) return;

      const descendants = new Set<string>();
      const stack = [draggedId];
      while (stack.length > 0) {
        const current = stack.pop()!;
        descendants.add(current);
        categories.forEach((cat) => {
          if (cat.parentId === current && !descendants.has(cat.id)) {
            stack.push(cat.id);
          }
        });
      }

      if (targetId && descendants.has(targetId)) {
        addToast('不能将分类移动到其子分类下', 'warning');
        return;
      }

      const siblings = categories.filter((c) => {
        if (position === 'child') {
          return c.parentId === targetId;
        }
        if (targetId) {
          const target = categories.find((c) => c.id === targetId);
          return target && c.parentId === target.parentId;
        }
        return !c.parentId;
      });

      let newOrder: number;
      let newParentId: string | null;

      if (position === 'child') {
        newParentId = targetId;
        newOrder = getNextOrder(siblings);
      } else if (targetId) {
        const target = categories.find((c) => c.id === targetId)!;
        newParentId = target.parentId;
        const sorted = [...siblings].sort((a, b) => a.order - b.order);
        const targetIdx = sorted.findIndex((c) => c.id === targetId);

        const reordered = sorted.filter((c) => c.id !== draggedId);
        const insertIdx = position === 'before' ? targetIdx : targetIdx + 1;

        if (insertIdx >= reordered.length) {
          newOrder = getNextOrder(reordered);
        } else if (insertIdx <= 0) {
          newOrder = reordered[0].order - 1;
        } else {
          const prev = reordered[insertIdx - 1];
          const next = reordered[insertIdx];
          newOrder = (prev.order + next.order) / 2;
        }
      } else {
        newParentId = null;
        const rootCategories = categories.filter((c) => !c.parentId && c.id !== draggedId);
        newOrder = getNextOrder(rootCategories);
      }

      const nextData = {
        ...data,
        categories: data.categories.map((c) =>
          c.id === draggedId
            ? { ...c, parentId: newParentId, order: newOrder }
            : c
        )
      };
      persist(nextData);
      addToast('分类已移动', 'success');
    },
    [categories, data, persist, addToast]
  );

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }, []);

  const clearTagFilter = useCallback(() => {
    setSelectedTags(new Set());
  }, []);

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
    setSelectedTags(new Set());
    setSelectedBookmarks(new Set());
    addToast('数据已重置', 'success');
  }, [addToast]);

  return {
    data,
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
    resetAllData,
    addToast
  };
}