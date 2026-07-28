import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, FolderOpen, ChevronRight, ChevronDown, GripVertical, Copy } from 'lucide-react';
import type { CategoryNode } from '../types';
import '../styles.css';

interface CategoryTreeProps {
  categories: CategoryNode[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onAddCategory: (name: string, parentId: string | null) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onReorderCategory: (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'child') => void;
  bookmarkCounts: Map<string | null, number>;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  categoryId: string | null;
  isRoot: boolean;
}

interface TreeNodeProps {
  category: CategoryNode;
  level: number;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onAddCategory: (name: string, parentId: string | null) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onReorderCategory: (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'child') => void;
  bookmarkCounts: Map<string | null, number>;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  draggingId: string | null;
  dropTargetId: string | null;
  dropPosition: string | null;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  category,
  level,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategory,
  bookmarkCounts,
  onDragStart,
  onDragEnd,
  draggingId,
  dropTargetId,
  dropPosition,
  onDragOver,
  onDrop,
  onContextMenu
}) => {
  const [expanded, setExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);

  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedCategoryId === category.id;
  const count = bookmarkCounts.get(category.id) || 0;
  const isDragging = draggingId === category.id;
  const isDropTarget = dropTargetId === category.id;

  const handleSaveRename = useCallback(() => {
    if (editName.trim()) {
      onUpdateCategory(category.id, editName.trim());
    }
    setIsEditing(false);
  }, [editName, category.id, onUpdateCategory]);

  return (
    <div
      style={{ userSelect: 'none' }}
      onDragOver={(e) => onDragOver(e, category.id)}
      onDrop={(e) => onDrop(e, category.id)}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 8px',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background-color 0.15s',
          backgroundColor: isDropTarget && dropPosition === 'child'
            ? 'var(--color-primary)' + '33'
            : (isSelected ? 'var(--color-primary)' + '1a' : 'transparent'),
          color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
          opacity: isDragging ? 0.5 : 1,
          borderTop: isDropTarget && dropPosition === 'before' ? '2px solid var(--color-primary)' : undefined,
          borderBottom: isDropTarget && dropPosition === 'after' ? '2px solid var(--color-primary)' : undefined,
          paddingLeft: `${level * 16 + 8}px`
        }}
        onMouseEnter={(e) => {
          if (!isSelected) (e.currentTarget.style.backgroundColor = 'var(--color-neutral-100)');
        }}
        onMouseLeave={(e) => {
          if (!isSelected) (e.currentTarget.style.backgroundColor = 'transparent');
        }}
        onClick={() => onSelectCategory(category.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(e, category.id);
        }}
      >
        <span
          style={{
            padding: '2px',
            borderRadius: '4px',
            cursor: 'grab',
            opacity: 0,
            display: 'flex'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            onDragStart(category.id);
          }}
          onDragEnd={onDragEnd}
        >
          <GripVertical size={12} style={{ color: 'var(--color-neutral-400)' }} />
        </span>

        <button
          style={{
            padding: '2px',
            borderRadius: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            color: 'inherit',
            opacity: hasChildren ? 1 : 0
          }}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
          ) : (
            <span style={{ width: '12px', height: '12px' }} />
          )}
        </button>

        <FolderOpen size={16} style={{ flexShrink: 0 }} />

        {isEditing ? (
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveRename();
              if (e.key === 'Escape') {
                setIsEditing(false);
                setEditName(category.name);
              }
            }}
            style={{
              flex: 1,
              padding: '2px 4px',
              fontSize: '13px',
              border: '1px solid var(--color-primary)',
              borderRadius: '4px',
              background: 'var(--color-bg-card)',
              color: 'var(--color-text)',
              outline: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span style={{ flex: 1, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {category.name}
          </span>
        )}

        <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
          {count}
        </span>
      </div>

      {expanded && hasChildren && (
        <div>
          {category.children.map((child) => (
            <TreeNode
              key={child.id}
              category={child}
              level={level + 1}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onSelectCategory}
              onAddCategory={onAddCategory}
              onUpdateCategory={onUpdateCategory}
              onDeleteCategory={onDeleteCategory}
              onReorderCategory={onReorderCategory}
              bookmarkCounts={bookmarkCounts}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              draggingId={draggingId}
              dropTargetId={dropTargetId}
              dropPosition={dropPosition}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategory,
  bookmarkCounts
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<string | null>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, categoryId: null, isRoot: false
  });

  const [rootContextMenu, setRootContextMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, categoryId: null, isRoot: true
  });

  const contextMenuRef = useRef<HTMLDivElement>(null);

  const closeAllMenus = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
    setRootContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        closeAllMenus();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAllMenus();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [closeAllMenus]);

  const handleDragStart = useCallback((id: string) => setDraggingId(id), []);
  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDropTargetId(null);
    setDropPosition(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggingId || draggingId === id) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    let position: 'before' | 'after' | 'child';
    if (y < height * 0.25) position = 'before';
    else if (y > height * 0.75) position = 'after';
    else position = 'child';
    setDropTargetId(id);
    setDropPosition(position);
  }, [draggingId]);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggingId || draggingId === targetId || !dropPosition) {
      handleDragEnd();
      return;
    }
    onReorderCategory(draggingId, targetId, dropPosition as 'before' | 'after' | 'child');
    handleDragEnd();
  }, [draggingId, dropPosition, onReorderCategory, handleDragEnd]);

  const handleContextMenu = useCallback((e: React.MouseEvent, categoryId: string) => {
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, categoryId, isRoot: false });
    setRootContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleRootContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setRootContextMenu({ visible: true, x: e.clientX, y: e.clientY, categoryId: null, isRoot: true });
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const uncategorizedCount = bookmarkCounts.get(null) || 0;

  const renderContextMenu = () => {
    if (!contextMenu.visible) return null;
    return (
      <div
        ref={contextMenuRef}
        className="fp-context-menu"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        <div
          className="fp-context-menu-item"
          onClick={() => {
            if (contextMenu.categoryId) {
              onSelectCategory(contextMenu.categoryId);
            }
            closeAllMenus();
          }}
        >
          <FolderOpen size={14} /> 打开
        </div>
        <div className="fp-context-menu-separator" />
        <div
          className="fp-context-menu-item"
          onClick={() => {
            if (contextMenu.categoryId) {
              onSelectCategory(contextMenu.categoryId);
            }
            closeAllMenus();
            setTimeout(() => {
              const event = new CustomEvent('category:edit', { detail: contextMenu.categoryId });
              window.dispatchEvent(event);
            }, 50);
          }}
        >
          <Pencil size={14} /> 重命名
        </div>
        <div
          className="fp-context-menu-item"
          onClick={() => {
            if (contextMenu.categoryId) {
              onAddCategory('新分类', contextMenu.categoryId);
            }
            closeAllMenus();
          }}
        >
          <Plus size={14} /> 添加子分类
        </div>
        <div className="fp-context-menu-separator" />
        <div
          className="fp-context-menu-item danger"
          onClick={() => {
            if (contextMenu.categoryId) {
              onDeleteCategory(contextMenu.categoryId);
            }
            closeAllMenus();
          }}
        >
          <Trash2 size={14} /> 删除
        </div>
      </div>
    );
  };

  const renderRootContextMenu = () => {
    if (!rootContextMenu.visible) return null;
    return (
      <div
        ref={contextMenuRef}
        className="fp-context-menu"
        style={{ left: rootContextMenu.x, top: rootContextMenu.y }}
      >
        <div
          className="fp-context-menu-item"
          onClick={() => {
            onAddCategory('新分类', null);
            closeAllMenus();
          }}
        >
          <Plus size={14} /> 添加根分类
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 8px',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background-color 0.15s',
          backgroundColor: selectedCategoryId === 'all' ? 'var(--color-primary)' + '1a' : 'transparent',
          color: selectedCategoryId === 'all' ? 'var(--color-primary)' : 'var(--color-text)'
        }}
        onMouseEnter={(e) => { if (selectedCategoryId !== 'all') e.currentTarget.style.backgroundColor = 'var(--color-neutral-100)'; }}
        onMouseLeave={(e) => { if (selectedCategoryId !== 'all') e.currentTarget.style.backgroundColor = 'transparent'; }}
        onClick={() => onSelectCategory('all')}
      >
        <FolderOpen size={16} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: '13px' }}>全部书签</span>
        <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
          {bookmarkCounts.get('__all__') || 0}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 8px',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background-color 0.15s',
          backgroundColor: selectedCategoryId === null ? 'var(--color-primary)' + '1a' : 'transparent',
          color: selectedCategoryId === null ? 'var(--color-primary)' : 'var(--color-text)'
        }}
        onMouseEnter={(e) => { if (selectedCategoryId !== null) e.currentTarget.style.backgroundColor = 'var(--color-neutral-100)'; }}
        onMouseLeave={(e) => { if (selectedCategoryId !== null) e.currentTarget.style.backgroundColor = 'transparent'; }}
        onClick={() => onSelectCategory(null)}
      >
        <FolderOpen size={16} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: '13px' }}>未分类</span>
        <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
          {uncategorizedCount}
        </span>
      </div>

      <div
        className="fp-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 0'
        }}
        onContextMenu={handleRootContextMenu}
        onDragOver={(e) => {
          e.preventDefault();
          if (draggingId && categories.some((c) => c.id === draggingId)) {
            setDropTargetId('__root__');
            setDropPosition('after');
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (draggingId && dropTargetId === '__root__') {
            onReorderCategory(draggingId, null, 'after');
          }
          handleDragEnd();
        }}
      >
        {categories.map((cat) => (
          <TreeNode
            key={cat.id}
            category={cat}
            level={0}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={onSelectCategory}
            onAddCategory={onAddCategory}
            onUpdateCategory={onUpdateCategory}
            onDeleteCategory={onDeleteCategory}
            onReorderCategory={onReorderCategory}
            bookmarkCounts={bookmarkCounts}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            draggingId={draggingId}
            dropTargetId={dropTargetId}
            dropPosition={dropPosition}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>

      {renderContextMenu()}
      {renderRootContextMenu()}
    </div>
  );
};

export default CategoryTree;