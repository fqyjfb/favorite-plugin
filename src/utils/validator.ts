import type { Bookmark } from '../types';

export function isValidUrl(url: string): boolean {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
}

export function normalizeUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function getDomain(url: string): string {
  try {
    const u = new URL(normalizeUrl(url));
    return u.hostname;
  } catch {
    return '';
  }
}

export function getFaviconUrl(url: string): string {
  const domain = getDomain(url);
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// 比对用：统一协议并去掉结尾斜杠，避免 example.com 与 example.com/ 判定为不同网址
export function normalizeUrlForCompare(url: string): string {
  return normalizeUrl(url).replace(/\/+$/, '');
}

// 标题与 URL 同时相同才视为重复；excludeId 用于编辑时排除自身
export function isDuplicateBookmark(
  bookmarks: Bookmark[],
  title: string,
  url: string,
  excludeId?: string
): boolean {
  const targetTitle = title.trim();
  const targetUrl = normalizeUrlForCompare(url);
  return bookmarks.some(
    (b) =>
      b.id !== excludeId &&
      b.title.trim() === targetTitle &&
      normalizeUrlForCompare(b.url) === targetUrl
  );
}

export async function fetchFaviconAsBase64(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return url;
    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize) as unknown as number[]);
    }
    const base64 = btoa(binary);
    const mimeMatch = contentType.match(/image\/(png|jpeg|gif|webp|svg\+xml|ico)/);
    const mime = mimeMatch ? `image/${mimeMatch[1].replace('svg+xml', 'svg+xml')}` : 'image/png';
    return `data:${mime};base64,${base64}`;
  } catch {
    return url;
  }
}