import type { Bookmark, Category, ImportResult } from '../types';
import { generateBookmarkId, generateCategoryId } from '../utils/id';
import { normalizeUrl } from '../utils/validator';

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

export function parseBrowserBookmarks(html: string): ImportResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const categories: Category[] = [];
  const bookmarks: Bookmark[] = [];
  const now = new Date().toISOString();

  const dls = doc.querySelectorAll('dl');
  const categoryMap = new Map<string, string>();

  function processDl(dl: HTMLDListElement, parentId: string | null) {
    const h3s = dl.querySelectorAll(':scope > dt > h3');
    h3s.forEach((h3) => {
      const categoryName = h3.textContent?.trim() || '未命名分类';
      const categoryId = generateCategoryId();
      categories.push({
        id: categoryId,
        name: categoryName,
        parentId,
        order: categories.length,
        createdAt: now
      });

      const h3Dt = h3.parentElement;
      const h3Dl = h3Dt?.nextElementSibling as HTMLDListElement | null;
      if (h3Dl && h3Dl.tagName === 'DL') {
        processDl(h3Dl, categoryId);
      }
    });

    const anchors = dl.querySelectorAll(':scope > dt > a');
    anchors.forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (!href) return;

      const title = a.textContent?.trim() || href;
      const icon = a.getAttribute('icon') || '';
      const dd = a.parentElement?.nextElementSibling;
      const description =
        dd && dd.tagName === 'DD' ? dd.textContent?.trim() || '' : '';

      bookmarks.push({
        id: generateBookmarkId(),
        title,
        url: normalizeUrl(href),
        description,
        categoryId: parentId,
        favicon: icon,
        tags: [],
        order: bookmarks.length,
        createdAt: now,
        updatedAt: now
      });
    });
  }

  const topDl = doc.querySelector('dl');
  if (topDl) {
    processDl(topDl as HTMLDListElement, null);
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