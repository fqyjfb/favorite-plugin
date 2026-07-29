import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Tag, Globe, Image as ImageIcon } from 'lucide-react';
import type { Bookmark, CategoryNode } from '../types';
import { fetchFaviconAsBase64 } from '../utils/validator';
import '../styles.css';

interface FlatCategory {
  id: string;
  name: string;
  level: number;
}

function flattenCategoryTree(nodes: CategoryNode[], level = 0): FlatCategory[] {
  const result: FlatCategory[] = [];
  nodes.forEach((node) => {
    result.push({ id: node.id, name: node.name, level });
    if (node.children && node.children.length > 0) {
      result.push(...flattenCategoryTree(node.children, level + 1));
    }
  });
  return result;
}

const PRESET_TAGS = [
  '搜索','工作', '学习', '工具', '设计', '前端', '后端',
  'AI','阅读', '参考', '收藏', '重要', '项目', '资源',
  '教程', '文档', '开源', 'VPN'
];

interface BookmarkFormProps {
  bookmark?: Partial<Bookmark>;
  categories: CategoryNode[];
  defaultCategoryId?: string | null;
  onSubmit: (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const BookmarkForm: React.FC<BookmarkFormProps> = ({
  bookmark,
  categories,
  defaultCategoryId,
  onSubmit,
  onCancel
}) => {
  const [title, setTitle] = useState(bookmark?.title || '');
  const [url, setUrl] = useState(bookmark?.url || '');
  const [description, setDescription] = useState(bookmark?.description || '');
  const [categoryId, setCategoryId] = useState(bookmark?.categoryId ?? defaultCategoryId ?? '');
  const [tags, setTags] = useState<string[]>(bookmark?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [faviconInput, setFaviconInput] = useState(bookmark?.favicon || '');
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const flatCategories = flattenCategoryTree(categories);

  useEffect(() => {
    if (!categoryId && defaultCategoryId !== undefined) {
      setCategoryId(defaultCategoryId);
    }
  }, [defaultCategoryId, categoryId]);

  const addTag = useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  }, [tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  }, [tags]);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }, [tagInput, tags, addTag, removeTag]);

  const fetchUrlInfo = useCallback(async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('请先输入网址');
      return;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      setError('请输入有效的URL地址');
      return;
    }

    setError('');
    setFetching(true);

    try {
      const response = await fetch(
        `https://api.ahfi.cn/api/websiteinfo?url=${encodeURIComponent(trimmedUrl)}`
      );
      const result = await response.json();

      if (result.code === 200 && result.data) {
        if (result.data.title && !bookmark?.title) {
          setTitle(result.data.title.trim());
        }
        if (result.data.description && !bookmark?.description) {
          setDescription(result.data.description.trim());
        }
        if (result.data.ico_url) {
          const base64Favicon = await fetchFaviconAsBase64(result.data.ico_url);
          setFaviconInput(base64Favicon);
        }
      } else {
        const urlObj = new URL(trimmedUrl);
        if (!title) setTitle(urlObj.hostname);
      }
    } catch {
      const urlObj = new URL(trimmedUrl);
      if (!title) setTitle(urlObj.hostname);
    } finally {
      setFetching(false);
    }
  }, [url, bookmark?.title, bookmark?.description, title, description]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('标题不能为空');
      return;
    }
    if (!url.trim()) {
      setError('URL不能为空');
      return;
    }

    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = 'https://' + normalizedUrl;
      setUrl(normalizedUrl);
    }

    try {
      new URL(normalizedUrl);
    } catch {
      setError('URL格式不正确');
      return;
    }

    onSubmit({
      title: title.trim(),
      url: normalizedUrl,
      description: description.trim(),
      categoryId: categoryId || null,
      tags,
      favicon: faviconInput.trim(),
      order: bookmark?.order ?? 0
    });
  }, [title, url, description, categoryId, tags, faviconInput, bookmark?.order, onSubmit]);

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--color-text)',
    marginBottom: '4px'
  };

  const starStyle = { color: 'var(--color-error)' };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && (
        <div style={{
          padding: '8px 12px',
          fontSize: '13px',
          color: 'var(--color-error)',
          background: 'var(--color-error)' + '1a',
          borderRadius: '6px'
        }}>
          {error}
        </div>
      )}

      <div>
        <label style={labelStyle}>
          标题 <span style={starStyle}>*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="书签标题"
          className="fp-input"
        />
      </div>

      <div>
        <label style={labelStyle}>
          URL <span style={starStyle}>*</span>
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="fp-input"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={fetchUrlInfo}
            disabled={fetching}
            title="获取网页信息"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              padding: '0',
              background: fetching ? 'var(--color-neutral-300)' : 'var(--color-neutral-100)',
              border: '1px solid var(--color-neutral-300)',
              borderRadius: '6px',
              cursor: fetching ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s'
            }}
          >
            <Globe size={16} style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>
      </div>

      <div>
        <label style={labelStyle}>描述</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="简要描述..."
          rows={2}
          className="fp-input"
          style={{ resize: 'none' }}
        />
      </div>

      <div>
        <label style={labelStyle}>分类</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="fp-input"
        >
          <option value="">未分类</option>
          {flatCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {'\u00A0\u00A0'.repeat(cat.level)}{cat.level > 0 ? '└ ' : ''}{cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>图标</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={faviconInput}
            onChange={(e) => setFaviconInput(e.target.value)}
            placeholder="图标URL（获取后自动填充）"
            className="fp-input"
            style={{ flex: 1 }}
          />
          {faviconInput ? (
            <img
              src={faviconInput}
              alt="favicon预览"
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                border: '1px solid var(--color-neutral-300)',
                objectFit: 'contain',
                flexShrink: 0
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.visibility = 'hidden';
              }}
            />
          ) : (
            <ImageIcon size={20} style={{ color: 'var(--color-neutral-300)', flexShrink: 0 }} />
          )}
        </div>
      </div>

      <div>
        <label style={labelStyle}>标签</label>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '4px',
            padding: '8px',
            border: '1px solid var(--color-neutral-300)',
            borderRadius: '6px',
            background: 'var(--color-bg-card)',
            cursor: 'text'
          }}
          onClick={() => tagInputRef.current?.focus()}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                fontSize: '12px',
                background: 'var(--color-primary)' + '1a',
                color: 'var(--color-primary)',
                borderRadius: '4px'
              }}
            >
              <Tag size={12} />
              {tag}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                style={{ padding: '2px', borderRadius: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            ref={tagInputRef}
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
            placeholder={tags.length === 0 ? '输入标签，按回车添加' : ''}
            style={{
              flex: 1,
              minWidth: '80px',
              fontSize: '13px',
              background: 'transparent',
              color: 'var(--color-text)',
              border: 'none',
              outline: 'none'
            }}
          />
        </div>
        {(() => {
          const available = PRESET_TAGS.filter((t) => !tags.includes(t));
          if (available.length === 0) return null;
          return (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>
                常用标签（点击添加）
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {available.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    style={{
                      padding: '2px 8px', fontSize: '12px', borderRadius: '4px',
                      cursor: 'pointer', border: '1px solid var(--color-neutral-200)',
                      background: 'var(--color-bg-card)',
                      color: 'var(--color-text-secondary)',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-neutral-100)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg-card)'; }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', paddingTop: '8px' }}>
        <button
          type="button"
          onClick={onCancel}
          className="fp-btn-secondary"
        >
          取消
        </button>
        <button
          type="submit"
          className="fp-btn-primary"
        >
          {bookmark?.id ? '保存修改' : '添加'}
        </button>
      </div>
    </form>
  );
};

export default BookmarkForm;