# 网址收藏夹插件 - 开发设计文档

> 版本: 1.0.0
> 创建日期: 2026-07-28

---

## 1. 需求分析

### 1.1 产品定位
网址收藏夹（Favorite）是一款本地书签管理工具，为用户提供优雅的网址收藏、分类管理和快速访问体验。工具运行在独立的 Electron 窗口中，数据完全本地存储，注重隐私和便捷。

### 1.2 核心功能

| 功能模块 | 描述 | 优先级 |
|---------|------|--------|
| 书签管理 | 添加、编辑、删除、搜索网址书签 | P0 |
| 分类管理 | 树形分类（支持二级分类）、拖拽排序 | P0 |
| 数据持久化 | localStorage 本地存储，自动保存 | P0 |
| 导入导出 | 支持 HTML（浏览器书签格式）、JSON、TXT 三种格式 | P0 |
| 网址信息抓取 | 输入 URL 自动获取标题、Favicon、描述 | P1 |
| 收藏夹视图 | 卡片视图 + 列表视图切换 | P1 |
| 主题适配 | 跟随主应用浅色/深色主题 | P0 |
| 快捷键支持 | 常用操作绑定键盘快捷键 | P2 |

### 1.3 用户场景
- 设计师/开发者收藏灵感网站，需要分类整理和快速检索
- 普通用户管理日常浏览的网址，从浏览器书签导入
- 用户在不同设备间通过 JSON 格式备份/恢复收藏数据

---

## 2. 技术架构

### 2.1 技术栈
- **React 19** + **TypeScript**
- **Vite 5** 构建（IIFE 格式）
- **Tailwind CSS 3**（CDN 版本）
- **Lucide React** 图标库
- **localStorage** 数据持久化

### 2.2 架构设计

```
┌─────────────────────────────────────────┐
│              ToolPlugin Window          │
├─────────────────────────────────────────┤
│  src/                                   │
│  ├── index.tsx          # 入口+注册    │
│  ├── ToolPanel.tsx      # 主面板       │
│  ├── store/                             │
│  │   └── bookmarkStore.ts  # 状态管理  │
│  ├── components/                        │
│  │   ├── BookmarkCard.tsx  # 书签卡片  │
│  │   ├── BookmarkList.tsx  # 书签列表  │
│  │   ├── CategoryTree.tsx  # 分类树    │
│  │   ├── SearchBar.tsx     # 搜索栏    │
│  │   ├── BookmarkForm.tsx  # 表单弹窗  │
│  │   ├── ImportExport.tsx  # 导入导出  │
│  │   └── EmptyState.tsx    # 空状态    │
│  ├── services/                          │
│  │   ├── storageService.ts # 存储服务  │
│  │   ├── importService.ts  # 导入解析  │
│  │   └── exportService.ts  # 导出生成  │
│  ├── types/                             │
│  │   └── index.ts          # 类型定义  │
│  └── utils/                             │
│      ├── id.ts             # ID生成    │
│      └── validator.ts      # 数据校验  │
└─────────────────────────────────────────┘
```

### 2.3 数据流
- **存储层**：`localStorage` 存储 JSON 序列化数据
- **状态层**：React `useState` + `useReducer` 管理应用状态
- **视图层**：组件订阅状态变化，渲染 UI

---

## 3. 数据模型

### 3.1 类型定义

```typescript
interface Bookmark {
  id: string;              // 唯一标识 (nanoid)
  title: string;           // 书签标题
  url: string;             // 网址 URL
  description: string;     // 描述/备注
  categoryId: string | null; // 所属分类 ID
  favicon: string;         // Favicon URL
  tags: string[];          // 标签数组
  order: number;           // 排序序号
  createdAt: string;       // 创建时间 ISO
  updatedAt: string;       // 更新时间 ISO
}

interface Category {
  id: string;              // 唯一标识
  name: string;            // 分类名称
  parentId: string | null; // 父分类 ID (null = 一级)
  order: number;           // 排序序号
  createdAt: string;       // 创建时间
}

interface PluginData {
  version: string;         // 数据版本号
  bookmarks: Bookmark[];  // 书签列表
  categories: Category[]; // 分类列表
  settings: PluginSettings; // 插件设置
  exportedAt?: string;     // 导出时间
}

interface PluginSettings {
  viewMode: 'card' | 'list';
  sortBy: 'createdAt' | 'title' | 'order';
  sortOrder: 'asc' | 'desc';
  showFavicon: boolean;
  defaultCategory: string | null;
}
```

### 3.2 存储结构

存储 key: `toolbox.favorite-plugin.data`

```json
{
  "version": "1.0.0",
  "bookmarks": [...],
  "categories": [...],
  "settings": {
    "viewMode": "card",
    "sortBy": "createdAt",
    "sortOrder": "desc",
    "showFavicon": true,
    "defaultCategory": null
  }
}
```

### 3.3 ID 生成策略
- 使用时间戳 + 随机字符串组合: `bm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
- 分类 ID: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

---

## 4. UI 设计规范

### 4.1 整体布局

```
┌──────────────────────────────────────────────────────┐
│  工具栏: [搜索框] [+ 添加] [导入] [导出] [视图切换]  │
├────────────┬─────────────────────────────────────────┤
│            │                                         │
│  分类树    │         书签展示区                       │
│  ┌──────┐  │  ┌──────┐ ┌──────┐ ┌──────┐            │
│  │📂 全部│  │  │ 卡片1 │ │ 卡片2 │ │ 卡片3 │            │
│  │📂 开发│  │  └──────┘ └──────┘ └──────┘            │
│  │  ├React│ │                                         │
│  │  ├Vue  │ │  ┌──────┐ ┌──────┐ ┌──────┐            │
│  │📂 设计│  │  │ 卡片4 │ │ 卡片5 │ │ 卡片6 │            │
│  │📂 工具│  │  └──────┘ └──────┘ └──────┘            │
│  └──────┘  │                                         │
│            │                                         │
├────────────┴─────────────────────────────────────────┤
│  状态栏: 共 N 个书签 · M 个分类                        │
└──────────────────────────────────────────────────────┘
```

### 4.2 色彩规范

| 用途 | 变量/类 | 色值 |
|------|---------|------|
| 主背景 | `bg-white` / `dark:bg-gray-800` | #ffffff / #1f2937 |
| 次背景 | `bg-gray-50` / `dark:bg-gray-700` | #f9fafb / #374151 |
| 主文字 | `text-gray-900` / `dark:text-gray-100` | #111827 / #f3f4f6 |
| 次文字 | `text-gray-600` / `dark:text-gray-400` | #6b7280 / #9ca3af |
| 辅助文字 | `text-gray-400` / `dark:text-gray-500` | #9ca3af / #6b7280 |
| 主色调 | `bg-primary` | 由主题 CSS 变量决定 |
| 边框 | `border-gray-200` / `dark:border-gray-600` | #e5e7eb / #4b5563 |
| 悬停 | `hover:bg-gray-100` / `dark:hover:bg-gray-700` | #f3f4f6 / #374151 |

### 4.3 组件设计

#### 4.3.1 书签卡片 (Card View)
```
┌─────────────────────────────┐
│  [Favicon]  标题文字         │
│            网址 (截断)       │
│            描述 (2行截断)    │
│  [分类Tag]  [标签]  [操作]   │
└─────────────────────────────┘
```
- 卡片尺寸：宽度自适应网格（2-3列），最小宽度 240px
- 圆角：8px
- 间距：16px (gap-4)
- 阴影：`shadow-sm` 或 `border` 二选一
- Hover: 轻微上移 + 阴影加深

#### 4.3.2 书签列表 (List View)
```
┌──────────────────────────────────────────────────────────┐
│ [Favicon]  标题          网址                分类  操作  │
│──────────────────────────────────────────────────────────│
│ [🌐]      React官网     react.dev          开发  🖊️🗑️ │
│ [🌐]      Vue官网       vuejs.org          开发  🖊️🗑️ │
└──────────────────────────────────────────────────────────┘
```
- 表头固定，行可悬停高亮
- Favicon 尺寸：16x16
- 操作列：编辑、删除按钮

#### 4.3.3 分类树
```
📁 全部书签 (N)
├── 📂 开发 (N)
│   ├── 📂 React
│   └── 📂 Vue
├── 📂 设计 (N)
└── 📂 工具 (N)
```
- 支持展开/折叠
- 点击筛选
- 右键菜单：新增子分类、重命名、删除
- 拖拽支持（可选，P2）

#### 4.3.4 搜索栏
- 实时搜索（输入时过滤）
- 支持标题、网址、描述、标签搜索
- 清空按钮
- 快捷键 `Ctrl+K` / `Ctrl+F` 聚焦

### 4.4 交互设计

#### 4.4.1 添加/编辑书签
- 模态弹窗，点击外部不关闭
- 表单字段：
  - 标题（必填，自动从 URL 获取建议）
  - URL（必填，支持自动补全 https://）
  - 描述（可选，多行文本）
  - 分类（下拉选择）
  - Favicon URL（可选，自动获取）
  - 标签（可选，逗号分隔）
- 「获取网站信息」按钮：调用 API 获取网站元数据

#### 4.4.2 删除确认
- 轻量 Toast 确认（5秒内可撤销）
- 支持批量删除（多选模式）

#### 4.4.3 导入流程
```
选择文件 → 解析 → 预览 → 确认导入
```
- 支持拖拽文件到窗口
- HTML 格式：解析浏览器导出的书签 HTML
- JSON 格式：解析本插件导出的 JSON
- TXT 格式：每行一个 URL
- 导入预览：显示将导入的书签数量和冲突提示

#### 4.4.4 导出流程
```
选择格式 → 选择范围 → 生成 → 下载
```
- HTML：标准浏览器书签 HTML 格式
- JSON：完整数据导出（包含分类）
- TXT：纯 URL 列表

---

## 5. API 设计

### 5.1 存储服务 (storageService)

```typescript
// 初始化/加载数据
function loadData(): PluginData

// 保存数据
function saveData(data: PluginData): void

// 重置数据
function resetData(): PluginData

// 导出数据为指定格式
function exportData(data: PluginData, format: 'html' | 'json' | 'txt'): string

// 导入指定格式数据
function importData(content: string, format: 'html' | 'json' | 'txt'): PluginData
```

### 5.2 书签操作 API

```typescript
// CRUD
function addBookmark(data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>): Bookmark
function updateBookmark(id: string, data: Partial<Bookmark>): Bookmark
function deleteBookmark(id: string): void
function getBookmark(id: string): Bookmark | undefined
function getAllBookmarks(): Bookmark[]

// 批量操作
function bulkDeleteBookmarks(ids: string[]): void
function bulkMoveBookmarks(ids: string[], categoryId: string | null): void

// 查询
function searchBookmarks(query: string, categoryId?: string | null): Bookmark[]
function getBookmarksByCategory(categoryId: string): Bookmark[]

// 排序
function reorderBookmarks(bookmarks: Bookmark[]): void
```

### 5.3 分类操作 API

```typescript
function addCategory(name: string, parentId: string | null): Category
function updateCategory(id: string, name: string): Category
function deleteCategory(id: string): void  // 子分类移动到父级
function getAllCategories(): Category[]
function getCategoryTree(): Category[]  // 嵌套树结构
function getSubCategories(parentId: string): Category[]
```

### 5.4 导入解析 API

```typescript
// 解析浏览器书签 HTML 文件
function parseBrowserBookmarks(html: string): {
  categories: Category[];
  bookmarks: Bookmark[];
}

// 解析 JSON 格式
function parseJsonImport(json: string): PluginData

// 解析 TXT 格式（每行一个 URL）
function parseTextImport(text: string): Bookmark[]
```

### 5.5 导出生成 API

```typescript
// 生成浏览器书签 HTML
function generateBrowserBookmarks(data: PluginData): string

// 生成 JSON 导出
function generateJsonExport(data: PluginData): string

// 生成 TXT 导出
function generateTextExport(bookmarks: Bookmark[]): string
```

---

## 6. HTML 书签格式兼容性

### 6.1 支持的浏览器导出格式
- **Chrome/Edge**：`bookmarks.html`
- **Firefox**：`bookmarks-*.html`
- **通用**：Netscape Bookmark File Format

### 6.2 HTML 解析规则
```html
<!-- 示例浏览器书签格式 -->
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
  <DT><H3>开发</H3>
  <DL><p>
    <DT><A HREF="https://react.dev" ICON="...">React</A>
    <DD>React 官方网站
  </DL><p>
  <DT><H3>设计</H3>
  <DL><p>
    <DT><A HREF="https://figma.com">Figma</A>
  </DL><p>
</DL><p>
```

- `<H3>` 标签 → 分类
- `<A HREF>` 标签 → 书签
- `<DD>` 标签 → 描述
- `ICON` 属性 → Favicon

### 6.3 JSON 导出格式
```json
{
  "version": "1.0.0",
  "exportedAt": "2026-07-28T12:00:00Z",
  "bookmarks": [
    {
      "id": "bm_xxx",
      "title": "React",
      "url": "https://react.dev",
      "description": "React 官方网站",
      "categoryId": "cat_dev",
      "favicon": "https://react.dev/favicon.ico",
      "tags": ["react", "frontend"],
      "order": 0,
      "createdAt": "2026-07-28T12:00:00Z",
      "updatedAt": "2026-07-28T12:00:00Z"
    }
  ],
  "categories": [
    {
      "id": "cat_dev",
      "name": "开发",
      "parentId": null,
      "order": 0,
      "createdAt": "2026-07-28T12:00:00Z"
    }
  ]
}
```

### 6.4 TXT 格式
```
# 每行一个 URL，可选备注
https://react.dev
https://vuejs.org
https://svelte.dev
```

---

## 7. 快捷键支持

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+N` | 新增书签 |
| `Ctrl+K` / `Ctrl+F` | 聚焦搜索框 |
| `Ctrl+I` | 导入书签 |
| `Ctrl+E` | 导出书签 |
| `Ctrl+A` | 全选当前列表 |
| `Delete` | 删除选中书签 |
| `Esc` | 关闭弹窗/取消选中 |
| `Ctrl+Click` | 多选模式 |

---

## 8. 插件配置信息

### 8.1 manifest.json

```json
{
  "id": "plugin-favorite",
  "name": "网址收藏夹",
  "version": "1.0.0",
  "description": "本地书签管理工具，支持分类整理、搜索、导入导出（HTML/JSON/TXT）",
  "author": "ToolBox Team",
  "icon": "Bookmark",
  "color": "#2563eb",
  "textColor": "#ffffff",
  "categories": ["工具", "效率"],
  "tags": ["bookmark", "favorite", "bookmarks", "manager"],
  "githubRepo": "fqyjfb/plugin-favorite",
  "entry": "dist/index.js",
  "isBeta": false,
  "width": 1000,
  "height": 680
}
```

### 8.2 依赖配置

```json
{
  "name": "plugin-favorite",
  "version": "1.0.0",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "node build.mjs"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "lucide-react": "^0.454.0"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "typescript": "^6.0.0",
    "vite": "^5.0.0"
  }
}
```

---

## 9. 开发路线图

### Phase 1: 核心功能 (MVP)
- [x] 项目结构搭建
- [x] manifest.json / build.mjs / tsconfig.json
- [x] 基础 UI 框架（布局、主题）
- [x] localStorage 存储层
- [x] 书签 CRUD 操作
- [x] 分类 CRUD 操作
- [x] 搜索功能
- [x] 卡片视图 + 列表视图

### Phase 2: 导入导出
- [ ] HTML 格式导入（浏览器书签）
- [ ] JSON 格式导入导出
- [ ] TXT 格式导入导出
- [ ] 导入预览和冲突处理
- [ ] 拖拽文件导入

### Phase 3: 增强功能
- [ ] 网址信息自动抓取（Favicon、标题、描述）
- [ ] 标签系统
- [ ] 拖拽排序
- [ ] 批量操作（多选）
- [ ] 数据统计面板

### Phase 4: 体验优化
- [ ] 快捷键绑定
- [ ] 动画过渡
- [ ] 空状态引导
- [ ] 首次使用引导
- [ ] 数据自动备份

---

## 10. 设计约束

### 10.1 必须遵守
- 遵循 ToolBox 插件开发规范
- 数据 100% 本地存储，不发送到任何服务器
- UI 遵循 ToolBox 设计系统（色彩、排版、间距）
- 支持浅色/深色主题自动切换
- 代码零 lint 警告

### 10.2 禁止事项
- 禁止蓝紫渐变背景
- 禁止使用表情符号作为功能图标
- 禁止玻璃拟态效果
- 禁止硬编码颜色值（使用 CSS 变量）
- 禁止魔法数字（使用设计 token）
- 禁止全圆角按钮（`rounded-full`）

### 10.3 性能要求
- 书签列表 1000+ 条目流畅滚动
- 搜索响应时间 < 100ms
- 数据保存操作 < 50ms
- 首屏渲染 < 500ms

---

## 11. 文件清单

```
plugin-favorite/
├── src/
│   ├── index.tsx              # 入口 + 插件注册
│   ├── ToolPanel.tsx          # 主面板组件
│   ├── store/
│   │   └── useBookmarkStore.ts  # 状态管理 Hook
│   ├── components/
│   │   ├── BookmarkCard.tsx    # 卡片视图组件
│   │   ├── BookmarkListItem.tsx # 列表视图组件
│   │   ├── CategoryTree.tsx    # 分类树
│   │   ├── SearchBar.tsx       # 搜索栏
│   │   ├── BookmarkForm.tsx   # 添加/编辑弹窗
│   │   ├── ImportExportModal.tsx # 导入导出弹窗
│   │   ├── EmptyState.tsx      # 空状态
│   │   ├── ConfirmDialog.tsx   # 确认对话框
│   │   └── Toast.tsx           # Toast 提示
│   ├── services/
│   │   ├── storageService.ts   # 存储服务
│   │   ├── importService.ts    # 导入解析
│   │   └── exportService.ts    # 导出生成
│   ├── types/
│   │   └── index.ts            # 类型定义
│   └── utils/
│       ├── id.ts               # ID 生成
│       └── validator.ts       # 数据校验
├── manifest.json              # 插件元数据
├── build.mjs                  # Vite 构建配置
├── tsconfig.json              # TypeScript 配置
├── package.json              # 依赖配置
└── README.md                  # 说明文档
```

---

## 附录 A: Favicon 获取方案

浏览器直接获取 Favicon 的方式：
1. `https://www.google.com/s2/favicons?domain={domain}` (Google，不稳定)
2. `https://icon.horse/icon/{domain}` (icon.horse 服务)
3. `https://favicon-fetcher.vercel.app/api?url={url}` (自建服务)
4. 直接请求 `{domain}/favicon.ico`

插件内实现：在用户添加 URL 时，异步尝试获取 favicon.ico 作为默认图标。

## 附录 B: HTML 解析器实现思路

使用 DOM Parser 解析浏览器导出的 HTML：
1. 将 HTML 字符串传入 `DOMParser`
2. 遍历 `<DL>` 嵌套结构识别分类层级
3. 提取 `<A>` 标签的 `href`、`ICON`、文本内容
4. 提取 `<DD>` 标签的描述内容
5. 构建分类树和书签列表