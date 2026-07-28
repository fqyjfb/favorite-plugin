import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Tag, Globe } from 'lucide-react';
import type { Bookmark } from '../types';
import '../styles.css';

interface BookmarkFormProps {
  bookmark?: Partial<Bookmark>;
  categories: { id: string; name: string }[];
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
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

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
    if (!url.trim()) {
      setError('请先输入URL');
      return;
    }
    setError('');
    setFetching(true);

    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    setUrl(normalizedUrl);

    try {
      const response = await fetch(
        `https://api.allorigins.win/get?url=${encodeURIComponent(normalizedUrl)}`
      );
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      const html = data.contents || '';

      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      if (titleMatch && titleMatch[1] && !bookmark?.title) {
        setTitle(titleMatch[1].trim());
      }

      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
        || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
      if (descMatch && descMatch[1] && !bookmark?.description) {
        setDescription(descMatch[1].trim());
      }

      if (!titleMatch || !titleMatch[1]) {
        const urlObj = new URL(normalizedUrl);
        if (!title) setTitle(urlObj.hostname);
      }
    } catch {
      const urlObj = new URL(normalizedUrl);
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
      order: bookmark?.order ?? 0
    });
  }, [title, url, description, categoryId, tags, bookmark?.order, onSubmit]);

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
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
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