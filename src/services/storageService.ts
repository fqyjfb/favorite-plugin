import type { PluginData, Bookmark, Category, PluginSettings } from '../types';
import { generateBookmarkId, generateCategoryId } from '../utils/id';

const STORAGE_KEY = 'toolbox.favorite-plugin.data';
const DATA_VERSION = '1.0.0';

const DEFAULT_SETTINGS: PluginSettings = {
  viewMode: 'card',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  showFavicon: true,
  defaultCategory: null,
  tagDisplayLimit: 5,
  tagOrder: [],
  hiddenTags: []
};

function createDefaultData(): PluginData {
  const now = new Date().toISOString();
  const uncategorizedId = generateCategoryId();
  return {
    version: DATA_VERSION,
    bookmarks: [],
    categories: [
      {
        id: uncategorizedId,
        name: '未分类',
        parentId: null,
        order: 0,
        createdAt: now
      }
    ],
    settings: { ...DEFAULT_SETTINGS, defaultCategory: uncategorizedId }
  };
}

export function loadData(): PluginData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const data = createDefaultData();
      saveData(data);
      return data;
    }
    const parsed = JSON.parse(raw) as PluginData;
    if (!parsed.version) {
      return createDefaultData();
    }
    if (!parsed.settings) {
      parsed.settings = { ...DEFAULT_SETTINGS };
    } else {
      if (parsed.settings.tagDisplayLimit === undefined) parsed.settings.tagDisplayLimit = 5;
      if (!parsed.settings.tagOrder) parsed.settings.tagOrder = [];
      if (!parsed.settings.hiddenTags) parsed.settings.hiddenTags = [];
    }
    if (!parsed.bookmarks) parsed.bookmarks = [];
    if (!parsed.categories) parsed.categories = [];
    return parsed;
  } catch {
    return createDefaultData();
  }
}

export function saveData(data: PluginData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.error('Failed to save data to localStorage');
  }
}

export function resetData(): PluginData {
  const data = createDefaultData();
  saveData(data);
  return data;
}

export function addBookmark(
  data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>
): Bookmark {
  const now = new Date().toISOString();
  return {
    ...data,
    id: generateBookmarkId(),
    createdAt: now,
    updatedAt: now
  };
}

export function updateBookmark(
  bookmark: Bookmark,
  changes: Partial<Bookmark>
): Bookmark {
  return {
    ...bookmark,
    ...changes,
    updatedAt: new Date().toISOString()
  };
}

export function addCategory(
  name: string,
  parentId: string | null,
  order: number = 0
): Category {
  return {
    id: generateCategoryId(),
    name,
    parentId,
    order,
    createdAt: new Date().toISOString()
  };
}

export function buildCategoryTree(categories: Category[]) {
  const map = new Map<string, any>();
  const roots: any[] = [];

  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  map.forEach((node) => {
    if (!node.parentId) {
      roots.push(node);
    } else {
      const parent = map.get(node.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  });

  const sortRecursive = (nodes: any[]) => {
    nodes.sort((a, b) => a.order - b.order);
    nodes.forEach((n) => {
      if (n.children && n.children.length > 0) {
        sortRecursive(n.children);
      }
    });
  };

  sortRecursive(roots);

  return roots;
}

export function getCategoryBookmarks(
  bookmarks: Bookmark[],
  categories: Category[],
  categoryId: string | null
): Bookmark[] {
  if (!categoryId) {
    return bookmarks.filter((b) => !b.categoryId);
  }

  const childIds = new Set<string>([categoryId]);
  const stack = [categoryId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    categories.forEach((cat) => {
      if (cat.parentId === current && !childIds.has(cat.id)) {
        childIds.add(cat.id);
        stack.push(cat.id);
      }
    });
  }

  return bookmarks.filter((b) => b.categoryId && childIds.has(b.categoryId));
}

export function searchBookmarks(
  bookmarks: Bookmark[],
  query: string
): Bookmark[] {
  if (!query.trim()) return bookmarks;
  const lower = query.toLowerCase();
  return bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(lower) ||
      b.url.toLowerCase().includes(lower) ||
      b.description.toLowerCase().includes(lower) ||
      b.tags.some((t) => t.toLowerCase().includes(lower))
  );
}

export function sortBookmarks(
  bookmarks: Bookmark[],
  sortBy: PluginSettings['sortBy'],
  sortOrder: PluginSettings['sortOrder']
): Bookmark[] {
  const sorted = [...bookmarks];
  const multiplier = sortOrder === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'order':
        comparison = a.order - b.order;
        break;
      case 'createdAt':
      default:
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    return comparison * multiplier;
  });

  return sorted;
}

export function getNextOrder(items: { order: number }[]): number {
  if (items.length === 0) return 0;
  return Math.max(...items.map((i) => i.order)) + 1;
}