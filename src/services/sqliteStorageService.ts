import type { PluginData, Bookmark, Category, PluginSettings } from '../types';
import { generateBookmarkId, generateCategoryId } from '../utils/id';

const STORAGE_KEY = 'plugin-favorite';
const DATA_KEY = 'data';
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

function getPluginContext() {
  const pluginData = (window as any).__PLUGIN_DATA__;
  const pluginId = pluginData?.pluginId || STORAGE_KEY;
  const userId = pluginData?.userId || 'default';
  const isElectron = !!(window as any).electron?.plugin?.storage;
  return { pluginId, userId, isElectron };
}

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

async function loadFromLocalStorage(): Promise<PluginData | null> {
  try {
    const raw = localStorage.getItem('toolbox.favorite-plugin.data');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PluginData;
    if (!parsed.version) return null;
    return migrateData(parsed);
  } catch {
    return null;
  }
}

async function loadFromSQLite(): Promise<PluginData | null> {
  const { pluginId, userId, isElectron } = getPluginContext();
  if (!isElectron) return null;

  try {
    const result = await (window as any).electron.plugin.storage.get(pluginId, userId, DATA_KEY);
    if (result) {
      const parsed = (typeof result === 'string' ? JSON.parse(result) : result) as PluginData;
      return migrateData(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

function migrateData(data: PluginData): PluginData {
  if (!data.settings) {
    data.settings = { ...DEFAULT_SETTINGS };
  } else {
    if (data.settings.tagDisplayLimit === undefined) data.settings.tagDisplayLimit = 5;
    if (!data.settings.tagOrder) data.settings.tagOrder = [];
    if (!data.settings.hiddenTags) data.settings.hiddenTags = [];
  }
  if (!data.bookmarks) data.bookmarks = [];
  if (!data.categories) data.categories = [];
  if (data.version !== DATA_VERSION) {
    data.version = DATA_VERSION;
  }
  return data;
}

export async function loadData(): Promise<PluginData> {
  const sqliteData = await loadFromSQLite();
  if (sqliteData) {
    return sqliteData;
  }

  const localData = await loadFromLocalStorage();
  if (localData) {
    await saveData(localData);
    return localData;
  }

  return createDefaultData();
}

export async function saveData(data: PluginData): Promise<void> {
  const { pluginId, userId, isElectron } = getPluginContext();

  try {
    if (isElectron) {
      await (window as any).electron.plugin.storage.set(pluginId, userId, DATA_KEY, data);
    }
    localStorage.setItem('toolbox.favorite-plugin.data', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data:', error);
  }
}

export async function resetData(): Promise<PluginData> {
  const data = createDefaultData();
  await saveData(data);
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
