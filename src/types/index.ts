export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description: string;
  categoryId: string | null;
  favicon?: string;
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  // 是否在 ToolBox 首页显示（首页区域与插件共用同一份数据）
  showOnHome?: boolean;
  // 首页区域内的展示顺序
  homeOrder?: number;
}

export type CategoryColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | null;

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  createdAt: string;
  color?: CategoryColor;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

export interface PluginSettings {
  viewMode: 'card' | 'list';
  sortBy: 'createdAt' | 'title' | 'order';
  sortOrder: 'asc' | 'desc';
  showFavicon: boolean;
  defaultCategory: string | null;
  tagDisplayLimit: number;
  tagOrder: string[];
  hiddenTags: string[];
  showCategoryPanel: boolean;
}

export interface PluginData {
  version: string;
  bookmarks: Bookmark[];
  categories: Category[];
  settings: PluginSettings;
  exportedAt?: string;
}

export type ImportFormat = 'html' | 'json' | 'txt';
export type ExportFormat = 'html' | 'json' | 'txt';

export interface ImportResult {
  categories: Category[];
  bookmarks: Bookmark[];
  conflicts: number;
  total: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}