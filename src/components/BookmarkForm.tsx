import React, { useState, useEffect } from 'react';
import { Download, Globe, Tag } from 'lucide-react';
import type { Bookmark, Category } from '../types';
import { isValidUrl, normalizeUrl, getFaviconUrl } from '../utils/validator';

interface BookmarkFormProps {
  bookmark?: Bookmark | null;
  categories: Category[];
  onSubmit: (data: {
    title: string;
    url: string;
    description: string;
    categoryId: string | null;
    favicon: string;
    tags: string[];
  }) => void;
  onCancel: () => void;
  defaultCategoryId?: string | null;
}

const BookmarkForm: React.FC<BookmarkFormProps> = ({
  bookmark,
  categories,
  onSubmit,
  onCancel,
  defaultCategoryId
}) => {
  const [title, setTitle] = useState(bookmark?.title || '');
  const [url, setUrl] = useState(bookmark?.url || '');
  const [description, setDescription] = useState(bookmark?.description || '');
  const [categoryId, setCategoryId] = useState(
    bookmark?.categoryId ?? defaultCategoryId ?? ''
  );
  const [favicon, setFavicon] = useState(bookmark?.favicon || '');
  const [tagsText, setTagsText] = useState(
    bookmark?.tags ? bookmark.tags.join(', ') : ''
  );
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!bookmark && url && !title) {
      try {
        const domain = new URL(normalizeUrl(url)).hostname;
        setTitle(domain);
      } catch {
        // ignore
      }
    }
  }, [url, bookmark, title]);

  const handleFetchInfo = async () => {
    if (!url.trim()) {
      setError('请先输入网址');
      return;
    }

    const normalized = normalizeUrl(url);
    if (!isValidUrl(normalized)) {
      setError('请输入有效的 URL 地址');
      return;
    }

    setFetching(true);
    setError('');

    try {
      setFavicon(getFaviconUrl(normalized));
      if (!title) {
        try {
          const domain = new URL(normalized).hostname;
          setTitle(domain);
        } catch {
          // ignore
        }
      }
    } catch {
      setError('获取网站信息失败');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('标题不能为空');
      return;
    }
    if (!url.trim()) {
      setError('网址不能为空');
      return;
    }

    const normalizedUrl = normalizeUrl(url);
    if (!isValidUrl(normalizedUrl)) {
      setError('请输入有效的 URL 地址');
      return;
    }

    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);

    onSubmit({
      title: title.trim(),
      url: normalizedUrl,
      description: description.trim(),
      categoryId: categoryId || null,
      favicon: favicon.trim(),
      tags
    });
  };

  const mainCategories = categories.filter((c) => !c.parentId);
  const subCategories = categoryId
    ? categories.filter((c) => c.parentId === categoryId)
    : [];
  const isSubCategory =
    categoryId && categories.find((c) => c.id === categoryId)?.parentId;

  useEffect(() => {
    if (isSubCategory) {
      const mainCat = categories.find(
        (c) => c.id === categories.find((s) => s.id === categoryId)?.parentId
      );
      if (mainCat && categoryId) {
        // keep as is
      }
    }
  }, [categoryId, categories, isSubCategory]);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="px-3 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs rounded-md">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          网址 URL <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary"
            required
          />
          <button
            type="button"
            onClick={handleFetchInfo}
            disabled={fetching}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            title="获取网站信息"
          >
            <Download className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          标题 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="网站标题"
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          分类
        </label>
        <div className="flex gap-2">
          {mainCategories.length > 0 && (
            <select
              value={
                isSubCategory
                  ? categories.find(
                      (c) =>
                        c.id ===
                        categories.find((s) => s.id === categoryId)?.parentId
                    )?.id || ''
                  : categoryId || ''
              }
              onChange={(e) => {
                const mainId = e.target.value;
                setCategoryId(mainId);
              }}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary"
            >
              <option value="">未分类</option>
              {mainCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
          {subCategories.length > 0 && (
            <select
              value={isSubCategory ? categoryId : ''}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary"
            >
              <option value="">子分类</option>
              {subCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          描述
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="添加描述信息..."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          标签（逗号分隔）
        </label>
        <div className="relative">
          <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="标签1, 标签2, 标签3"
            className="w-full px-3 py-2 pl-7 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Favicon URL（可选）
        </label>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={favicon}
            onChange={(e) => setFavicon(e.target.value)}
            placeholder="https://..."
            className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary"
          />
          {favicon && (
            <div className="w-9 h-9 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden">
              <img
                src={favicon}
                alt="preview"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          {!favicon && (
            <div className="w-9 h-9 border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
              <Globe className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-primary text-button-text rounded-md hover:opacity-90 transition-colors"
        >
          {bookmark ? '保存' : '添加'}
        </button>
      </div>
    </form>
  );
};

export default BookmarkForm;