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
import '../styles.css';

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

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.3)'
  };

  const modalStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '512px',
    margin: '0 16px',
    background: 'var(--color-bg-card)',
    borderRadius: '8px',
    boxShadow: 'var(--shadow-md)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid var(--color-neutral-200)'
  };

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '12px 16px',
    borderTop: '1px solid var(--color-neutral-200)',
    background: 'var(--color-neutral-50)'
  };

  const contentStyle: React.CSSProperties = {
    padding: '16px',
    overflowY: 'auto'
  };

  const formatBtnStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    fontSize: '13px',
    borderRadius: '6px',
    border: '1px solid',
    borderColor: active ? 'var(--color-primary)' : 'var(--color-neutral-300)',
    background: active ? 'var(--color-primary)' + '0d' : 'transparent',
    color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
    cursor: 'pointer',
    transition: 'background-color 0.15s'
  });

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
            {mode === 'import' ? '导入书签' : '导出书签'}
          </h3>
          <button
            onClick={handleClose}
            style={{
              padding: '4px', borderRadius: '4px', background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--color-text-tertiary)', display: 'flex'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ ...contentStyle, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mode === 'import' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(['html', 'json', 'txt'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setImportFormat(format)}
                    style={formatBtnStyle(importFormat === format)}
                  >
                    {format === 'html' && <Globe size={14} />}
                    {format === 'json' && <FileJson size={14} />}
                    {format === 'txt' && <FileText size={14} />}
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>

              <div
                style={{
                  border: '2px dashed var(--color-neutral-300)',
                  borderRadius: '8px',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s'
                }}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-neutral-300)'; }}
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
                <Upload size={32} style={{ color: 'var(--color-neutral-400)', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>
                  {fileName ? fileName : '点击选择文件或拖拽到此处'}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', margin: 0 }}>
                  支持 HTML（浏览器书签）、JSON、TXT 格式
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.htm,.json,.txt"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
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
                  style={{
                    width: '100%', padding: '8px 12px',
                    fontSize: '12px', border: '1px solid var(--color-neutral-200)',
                    borderRadius: '6px', background: 'var(--color-bg-card)',
                    color: 'var(--color-text)',
                    outline: 'none',
                    fontFamily: 'monospace',
                    resize: 'none'
                  }}
                />
                {rawContent && (
                  <button
                    onClick={handleTextPaste}
                    style={{
                      marginTop: '4px', fontSize: '12px',
                      color: 'var(--color-primary)',
                      background: 'none', border: 'none',
                      cursor: 'pointer', textDecoration: 'none',
                      padding: 0
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                  >
                    解析内容
                  </button>
                )}
              </div>

              {previewData && (
                <div style={{
                  padding: '12px',
                  background: 'var(--color-neutral-50)',
                  borderRadius: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Check size={16} style={{ color: 'var(--color-success)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
                      解析成功
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    将导入 <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{previewData.bookmarks.length}</span> 个书签
                    {previewData.categories.length > 0 && (
                      <>，<span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{previewData.categories.length}</span> 个分类</>
                    )}
                  </p>
                  {previewData.conflicts > 0 && (
                    <p style={{ fontSize: '12px', color: 'var(--color-warning)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={12} />
                      检测到 {previewData.conflicts} 个重复项
                    </p>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>导入方式：</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  合并（保留现有数据）
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  替换（清空现有数据）
                </label>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(['html', 'json', 'txt'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setExportFormat(format)}
                    style={formatBtnStyle(exportFormat === format)}
                  >
                    {format === 'html' && <Globe size={14} />}
                    {format === 'json' && <FileJson size={14} />}
                    {format === 'txt' && <FileText size={14} />}
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>

              <div style={{
                padding: '12px',
                background: 'var(--color-neutral-50)',
                borderRadius: '6px'
              }}>
                <p style={{ fontSize: '13px', color: 'var(--color-text)', margin: 0 }}>
                  将导出 <span style={{ fontWeight: 500 }}>{bookmarks.length}</span> 个书签
                  {data.categories.length > 0 && (
                    <>，<span style={{ fontWeight: 500 }}>{data.categories.length}</span> 个分类</>
                  )}
                </p>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={{ margin: 0 }}>• HTML 格式：可导入浏览器（Chrome/Edge/Firefox）书签</p>
                <p style={{ margin: 0 }}>• JSON 格式：完整备份，包含分类结构</p>
                <p style={{ margin: 0 }}>• TXT 格式：纯 URL 列表，无分类信息</p>
              </div>
            </>
          )}
        </div>

        <div style={footerStyle}>
          <button
            onClick={handleClose}
            className="fp-btn-secondary"
            style={{ padding: '6px 16px', fontSize: '13px' }}
          >
            取消
          </button>
          {mode === 'import' ? (
            <button
              onClick={handleConfirmImport}
              disabled={!rawContent}
              className="fp-btn-primary"
              style={{ padding: '6px 16px', fontSize: '13px', opacity: !rawContent ? 0.5 : 1, cursor: !rawContent ? 'not-allowed' : 'pointer' }}
            >
              确认导入
            </button>
          ) : (
            <button
              onClick={handleExport}
              className="fp-btn-primary"
              style={{ padding: '6px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Download size={14} />
              下载文件
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal;