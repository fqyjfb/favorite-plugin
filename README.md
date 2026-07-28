# 网址收藏夹插件 (plugin-favorite)

本地书签管理工具，为 ToolBox 提供优雅的网址收藏、分类管理和快速访问体验。

## 功能特点

- 书签管理：添加、编辑、删除、搜索网址书签
- 分类管理：树形分类（支持二级分类）
- 数据持久化：localStorage 本地存储
- 导入导出：支持 HTML（浏览器书签格式）、JSON、TXT
- 双视图模式：卡片视图 + 列表视图
- 主题适配：跟随主应用浅色/深色主题

## 开发

```bash
# 安装依赖
npm install

# 构建
node build.mjs
```

## 技术栈

- React 19 + TypeScript
- Vite 5
- Tailwind CSS 3
- Lucide React

## 文档

详细设计文档请参考 [DEVELOPMENT.md](DEVELOPMENT.md)。