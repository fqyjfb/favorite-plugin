import type { Bookmark, Category, ImportResult } from '../types';
import { generateBookmarkId, generateCategoryId } from '../utils/id';
import { normalizeUrl } from '../utils/validator';

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

export function parseBrowserBookmarks(html: string): ImportResult {
  const cleanHtml = html
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '');

  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanHtml, 'text/html');
  const categories: Category[] = [];
  const bookmarks: Bookmark[] = [];
  const now = new Date().toISOString();

  function processDl(dl: Element, parentId: string | null) {
    const children = dl.children;
    let i = 0;

    while (i < children.length) {
      const child = children[i];

      if (child.tagName === 'DT') {
        const h3 = child.querySelector(':scope > h3');
        if (h3) {
          const categoryName = h3.textContent?.trim() || '未命名分类';
          const categoryId = generateCategoryId();
          categories.push({
            id: categoryId,
            name: categoryName,
            parentId,
            order: categories.length,
            createdAt: now
          });

          const nestedDl = child.querySelector(':scope > dl');
          if (nestedDl) {
            processDl(nestedDl, categoryId);
          }
        } else {
          const anchors = child.querySelectorAll(':scope > a');
          anchors.forEach((a) => {
            const href = a.getAttribute('href') || '';
            if (!href) return;

            const title = a.textContent?.trim() || href;
            const icon = a.getAttribute('icon') || '';

            bookmarks.push({
              id: generateBookmarkId(),
              title,
              url: normalizeUrl(href),
              description: '',
              categoryId: parentId,
              favicon: icon,
              tags: [],
              order: bookmarks.length,
              createdAt: now,
              updatedAt: now
            });
          });
        }
      } else if (child.tagName === 'DL') {
        processDl(child, parentId);
      }

      i++;
    }
  }

  const rootDl = doc.querySelector('dl');
  if (rootDl) {
    processDl(rootDl, null);
  }

  return {
    categories,
    bookmarks,
    conflicts: 0,
    total: bookmarks.length
  };
}

export function parseJsonImport(json: string): ImportResult {
  const data = JSON.parse(json);
  const categories: Category[] = (data.categories || []).map(
    (c: Category) => ({
      ...c,
      id: c.id || generateCategoryId(),
      createdAt: c.createdAt || new Date().toISOString()
    })
  );

  const bookmarks: Bookmark[] = (data.bookmarks || []).map(
    (b: Bookmark) => ({
      ...b,
      id: b.id || generateBookmarkId(),
      url: normalizeUrl(b.url),
      createdAt: b.createdAt || new Date().toISOString(),
      updatedAt: b.updatedAt || new Date().toISOString(),
      tags: b.tags || []
    })
  );

  return {
    categories,
    bookmarks,
    conflicts: 0,
    total: bookmarks.length
  };
}

export function parseTextImport(text: string): ImportResult {
  const lines = text.split('\n');
  const bookmarks: Bookmark[] = [];
  const now = new Date().toISOString();

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const urlMatch = trimmed.match(/https?:\/\/[^\s,，]+/) || trimmed;
    if (!/https?:\/\//.test(urlMatch)) return;

    bookmarks.push({
      id: generateBookmarkId(),
      title: urlMatch.replace(/^https?:\/\//, ''),
      url: normalizeUrl(urlMatch),
      description: '',
      categoryId: null,
      favicon: '',
      tags: [],
      order: bookmarks.length,
      createdAt: now,
      updatedAt: now
    });
  });

  return {
    categories: [],
    bookmarks,
    conflicts: 0,
    total: bookmarks.length
  };
}