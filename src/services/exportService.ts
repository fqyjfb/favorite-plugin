import type { PluginData, Bookmark } from '../types';

export function generateBrowserBookmarks(data: PluginData): string {
  const { bookmarks, categories } = data;
  const lines: string[] = [];

  lines.push('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
  lines.push(
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">'
  );
  lines.push('<TITLE>Bookmarks</TITLE>');
  lines.push('<H1>Bookmarks</H1>');
  lines.push('<DL><p>');

  const rootCategories = categories.filter((c) => !c.parentId);

  rootCategories.forEach((cat) => {
    lines.push(`<DT><H3>${escapeHtml(cat.name)}</H3>`);
    lines.push('<DL><p>');

    const catBookmarks = bookmarks.filter((b) => b.categoryId === cat.id);
    catBookmarks.forEach((b) => {
      lines.push(
        `<DT><A HREF="${escapeHtml(b.url)}" ICON="${escapeHtml(
          b.favicon
        )}">${escapeHtml(b.title)}</A>`
      );
      if (b.description) {
        lines.push(`<DD>${escapeHtml(b.description)}`);
      }
    });

    const subCategories = categories.filter((c) => c.parentId === cat.id);
    subCategories.forEach((subCat) => {
      lines.push(`<DT><H3>${escapeHtml(subCat.name)}</H3>`);
      lines.push('<DL><p>');

      const subBookmarks = bookmarks.filter(
        (b) => b.categoryId === subCat.id
      );
      subBookmarks.forEach((b) => {
        lines.push(
          `<DT><A HREF="${escapeHtml(b.url)}" ICON="${escapeHtml(
            b.favicon
          )}">${escapeHtml(b.title)}</A>`
        );
        if (b.description) {
          lines.push(`<DD>${escapeHtml(b.description)}`);
        }
      });

      lines.push('</DL><p>');
    });

    lines.push('</DL><p>');
  });

  const uncategorized = bookmarks.filter((b) => !b.categoryId);
  if (uncategorized.length > 0) {
    uncategorized.forEach((b) => {
      lines.push(
        `<DT><A HREF="${escapeHtml(b.url)}" ICON="${escapeHtml(
          b.favicon
        )}">${escapeHtml(b.title)}</A>`
      );
      if (b.description) {
        lines.push(`<DD>${escapeHtml(b.description)}`);
      }
    });
  }

  lines.push('</DL><p>');

  return lines.join('\n');
}

export function generateJsonExport(data: PluginData): string {
  const exportData = {
    ...data,
    exportedAt: new Date().toISOString()
  };
  return JSON.stringify(exportData, null, 2);
}

export function generateTextExport(bookmarks: Bookmark[]): string {
  return bookmarks.map((b) => b.url).join('\n');
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}