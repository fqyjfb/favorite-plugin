import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, FileJson, Globe, X, Check, AlertTriangle } from 'lucide-react';
import type { ExportFormat, ImportResult, PluginData, Bookmark } from '../types';
import {
  generateBrowserBookmarks,
  generateJsonExport,
  generateTextExport,
  downloadFile
} from '../services/exportService';
import {
  parseBrowserBookmarks,
  parseJsonImport,
  parseTextImport
} from '../services/importService';

interface ImportExportModalProps {
  mode: 'import' | 'export';
  isOpen: boolean;
  onClose: () => void;
  data: PluginData;
  bookmarks: Bookmark[];
  onImport: (content: string, format: 'html' | 'json' | 'txt', mode: 'merge' | 'replace') => ImportResult;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({
  mode,
  isOpen,
  onClose,
  data,
  bookmarks,
  onImport
}) => {
  const [importFormat, setImportFormat] = useState<'html' | 'json' | 'txt'>('html');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [previewData, setPreviewData] = useState<ImportResult | null>(null);
  const [rawContent, setRawContent] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setPreviewData(null);
    setRawContent('');
    setFileName('');
    setImportMode('merge');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawContent(content);
      parsePreview(content, file.name);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleTextPaste = () => {
    if (!rawContent) return;
    parsePreview(rawContent, 'paste.txt');
  };

  const parsePreview = (content: string, name: string) => {
    let format: 'html' | 'json' | 'txt' = importFormat;

    if (name.endsWith('.html') || name.endsWith('.htm')) {
      format = 'html';
      setImportFormat('html');
    } else if (name.endsWith('.json')) {
      format = 'json';
      setImportFormat('json');
    } else if (name.endsWith('.txt')) {
      format = 'txt';
      setImportFormat('txt');
    }

    try {
      let result: ImportResult;

      switch (format) {
        case 'html':
          result = parseBrowserBookmarks(content);
          break;
        case 'json':
          result = parseJsonImport(content);
          break;
        case 'txt':
        default:
          result = parseTextImport(content);
          break;
      }
      setPreviewData(result);
    } catch {
      setPreviewData({ categories: [], bookmarks: [], conflicts: 0, total: 0 });
    }
  };

  const handleConfirmImport = () => {
    if (!rawContent) return;
    onImport(rawContent, importFormat, importMode);
    handleClose();
  };

  const handleExport = () => {
    let content = '';
    let mimeType = '';
    let filename = '';
    const timestamp = new Date().toISOString().slice(0, 10);

    switch (exportFormat) {
      case 'html':
        content = generateBrowserBookmarks(data);
        mimeType = 'text/html';
        filename = `bookmarks_${timestamp}.html`;
        break;
      case 'json':
        content = generateJsonExport(data);
        mimeType = 'application/json';
        filename = `bookmarks_${timestamp}.json`;
        break;
      case 'txt':
        content = generateTextExport(bookmarks);
        mimeType = 'text/plain';
        filename = `bookmarks_${timestamp}.txt`;
        break;
    }

    downloadFile(content, filename, mimeType);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
            {mode === 'import' ? '导入书签' : '导出书签'}
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          {mode === 'import' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {(['html', 'json', 'txt'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setImportFormat(format)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${
                      importFormat === format
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {format === 'html' && <Globe className="w-4 h-4" />}
                    {format === 'json' && <FileJson className="w-4 h-4" />}
                    {format === 'txt' && <FileText className="w-4 h-4" />}
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>

              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary dark:hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files[0]) {
                    const file = e.dataTransfer.files[0];
                    setFileName(file.name);
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result as string;
                      setRawContent(content);
                      parsePreview(content, file.name);
                    };
                    reader.readAsText(file, 'UTF-8');
                  }
                }}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {fileName ? fileName : '点击选择文件或拖拽到此处'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  支持 HTML（浏览器书签）、JSON、TXT 格式
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.htm,.json,.txt"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  或粘贴内容
                </label>
                <textarea
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  placeholder={
                    importFormat === 'txt'
                      ? '每行一个 URL'
                      : importFormat === 'json'
                      ? '粘贴 JSON 内容'
                      : '粘贴 HTML 书签内容'
                  }
                  rows={4}
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary font-mono resize-none"
                />
                {rawContent && (
                  <button
                    onClick={handleTextPaste}
                    className="mt-1 text-xs text-primary hover:underline"
                  >
                    解析内容
                  </button>
                )}
              </div>

              {previewData && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      解析成功
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    将导入 <span className="font-medium text-gray-800 dark:text-gray-200">{previewData.bookmarks.length}</span> 个书签
                    {previewData.categories.length > 0 && (
                      <>，<span className="font-medium text-gray-800 dark:text-gray-200">{previewData.categories.length}</span> 个分类</>
                    )}
                  </p>
                  {previewData.conflicts > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      检测到 {previewData.conflicts} 个重复项
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-600 dark:text-gray-400">导入方式：</span>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="text-primary"
                  />
                  合并（保留现有数据）
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-primary"
                  />
                  替换（清空现有数据）
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {(['html', 'json', 'txt'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setExportFormat(format)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${
                      exportFormat === format
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {format === 'html' && <Globe className="w-4 h-4" />}
                    {format === 'json' && <FileJson className="w-4 h-4" />}
                    {format === 'txt' && <FileText className="w-4 h-4" />}
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  将导出 <span className="font-medium">{bookmarks.length}</span> 个书签
                  {data.categories.length > 0 && (
                    <>，<span className="font-medium">{data.categories.length}</span> 个分类</>
                  )}
                </p>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>• HTML 格式：可导入浏览器（Chrome/Edge/Firefox）书签</p>
                <p>• JSON 格式：完整备份，包含分类结构</p>
                <p>• TXT 格式：纯 URL 列表，无分类信息</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
          <button
            onClick={handleClose}
            className="px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          {mode === 'import' ? (
            <button
              onClick={handleConfirmImport}
              disabled={!rawContent}
              className="px-4 py-1.5 text-sm bg-primary text-button-text rounded-md hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认导入
            </button>
          ) : (
            <button
              onClick={handleExport}
              className="px-4 py-1.5 text-sm bg-primary text-button-text rounded-md hover:opacity-90 transition-colors flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              下载文件
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal;