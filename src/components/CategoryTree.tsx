import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, FolderOpen, Folder, ChevronRight, ChevronDown, Tag } from 'lucide-react';
import type { CategoryNode, CategoryColor } from '../types';
import '../styles.css';

const CATEGORY_COLORS: { key: CategoryColor; label: string; value: string }[] = [
  { key: 'red', label: '红色', value: '#ef4444' },
  { key: 'orange', label: '橙色', value: '#f97316' },
  { key: 'yellow', label: '黄色', value: '#eab308' },
  { key: 'green', label: '绿色', value: '#22c55e' },
  { key: 'blue', label: '蓝色', value: '#3b82f6' },
  { key: 'purple', label: '紫色', value: '#a855f7' },
  { key: 'pink', label: '粉色', value: '#ec4899' },
];

const getColorValue = (color?: CategoryColor): string => {
  if (!color) return '#9ca3af';
  return CATEGORY_COLORS.find((c) => c.key === color)?.value || '#9ca3af';
};

interface CategoryTreeProps {
  categories: CategoryNode[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onAddCategory: (name: string, parentId: string | null) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onReorderCategory: (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'child') => void;
  onUpdateCategoryColor: (id: string, color: CategoryColor) => void;
  bookmarkCounts: Map<string | null, number>;
  renamingCategoryId?: string | null;
  onStartRename?: (id: string) => void;
  onFinishRename?: () => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  categoryId: string | null;
  isRoot: boolean;
  showColorMenu: boolean;
}

interface TreeNodeProps {
  category: CategoryNode;
  level: number;
  defaultExpanded?: boolean;
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
  renamingCategoryId?: string | null;
  onFinishRename?: () => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  category,
  level,
  defaultExpanded = false,
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
  onContextMenu,
  renamingCategoryId,
  onFinishRename
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);

  useEffect(() => {
    if (renamingCategoryId === category.id && !isEditing) {
      setIsEditing(true);
    }
  }, [renamingCategoryId, category.id, isEditing]);

  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedCategoryId === category.id;
  const count = bookmarkCounts.get(category.id) || 0;
  const isDragging = draggingId === category.id;
  const isDropTarget = dropTargetId === category.id;
  const colorValue = getColorValue(category.color);

  const handleSaveRename = useCallback(() => {
    if (editName.trim()) {
      onUpdateCategory(category.id, editName.trim());
    }
    setIsEditing(false);
    onFinishRename?.();
  }, [editName, category.id, onUpdateCategory, onFinishRename]);

  return (
    <div
      style={{ userSelect: 'none' }}
      onDragOver={(e) => onDragOver(e, category.id)}
      onDrop={(e) => onDrop(e, category.id)}
    >
      <div
        draggable
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 8px',
          borderRadius: '6px',
          cursor: isEditing ? 'text' : 'pointer',
          transition: 'background-color 0.15s',
          backgroundColor: isDropTarget && dropPosition === 'child'
            ? 'var(--color-primary)' + '33'
            : (isSelected ? 'var(--color-primary)' + '1a' : 'transparent'),
          color: isSelected ? 'var(--color-primary-text)' : 'var(--color-text)',
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
        onClick={() => {
          onSelectCategory(category.id);
          if (hasChildren) setExpanded(!expanded);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, category.id);
        }}
        onDragStart={(e) => {
          e.stopPropagation();
          onDragStart(category.id);
        }}
        onDragEnd={onDragEnd}
      >
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
        {expanded ? (
          <FolderOpen size={16} style={{ flexShrink: 0, color: colorValue }} />
        ) : (
          <Folder size={16} style={{ flexShrink: 0, color: colorValue }} />
        )}

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

        {category.color && (
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: colorValue,
              flexShrink: 0
            }}
          />
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
              defaultExpanded={false}
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
              renamingCategoryId={renamingCategoryId}
              onFinishRename={onFinishRename}
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
  onUpdateCategoryColor,
  bookmarkCounts,
  renamingCategoryId,
  onStartRename,
  onFinishRename
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<string | null>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, categoryId: null, isRoot: false, showColorMenu: false
  });

  const [rootContextMenu, setRootContextMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, categoryId: null, isRoot: true, showColorMenu: false
  });

  const contextMenuRef = useRef<HTMLDivElement>(null);

  const closeAllMenus = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false, showColorMenu: false }));
    setRootContextMenu((prev) => ({ ...prev, visible: false, showColorMenu: false }));
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
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, categoryId, isRoot: false, showColorMenu: false });
    setRootContextMenu((prev) => ({ ...prev, visible: false, showColorMenu: false }));
  }, []);

  const handleRootContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setRootContextMenu({ visible: true, x: e.clientX, y: e.clientY, categoryId: null, isRoot: true, showColorMenu: false });
    setContextMenu((prev) => ({ ...prev, visible: false, showColorMenu: false }));
  }, []);

  const uncategorizedCount = bookmarkCounts.get(null) || 0;

  const findCategoryById = useCallback((id: string): CategoryNode | undefined => {
    const find = (nodes: CategoryNode[]): CategoryNode | undefined => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = find(node.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return find(categories);
  }, [categories]);

  const renderColorMenu = (categoryId: string, currentColor?: CategoryColor) => (
    <div
      className="fp-context-menu"
      style={{
        position: 'absolute',
        left: '100%',
        top: 0,
        minWidth: '120px',
        marginLeft: '4px'
      }}
    >
      {CATEGORY_COLORS.map((c) => (
        <div
          key={c.key}
          className="fp-context-menu-item"
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onUpdateCategoryColor(categoryId, c.key);
            closeAllMenus();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px'
          }}
        >
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: c.value,
              flexShrink: 0,
              border: currentColor === c.key ? '2px solid var(--color-text)' : 'none'
            }}
          />
          <span style={{ fontSize: '13px' }}>{c.label}</span>
        </div>
      ))}
      {currentColor && (
        <>
          <div className="fp-context-menu-separator" />
          <div
            className="fp-context-menu-item"
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onUpdateCategoryColor(categoryId, null);
              closeAllMenus();
            }}
            style={{ padding: '6px 12px' }}
          >
            清除标记
          </div>
        </>
      )}
    </div>
  );

  const renderContextMenu = () => {
    if (!contextMenu.visible) return null;
    const category = contextMenu.categoryId ? findCategoryById(contextMenu.categoryId) : undefined;
    const currentColor = category?.color;

    return (
      <div
        ref={contextMenuRef}
        style={{
          position: 'fixed',
          left: contextMenu.x,
          top: contextMenu.y,
          zIndex: 9999
        }}
      >
        <div
          className="fp-context-menu"
          style={{ position: 'relative' }}
        >
          <div
            className="fp-context-menu-item"
            onClick={() => {
              if (contextMenu.categoryId) {
                onSelectCategory(contextMenu.categoryId);
                onStartRename?.(contextMenu.categoryId);
              }
              closeAllMenus();
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
          <div
            className="fp-context-menu-item"
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu((prev) => ({ ...prev, showColorMenu: !prev.showColorMenu }));
            }}
            style={{ justifyContent: 'space-between' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={14} /> 标记
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
              ▶
            </span>
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
          {contextMenu.showColorMenu && contextMenu.categoryId && renderColorMenu(contextMenu.categoryId, currentColor)}
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
        style={{
          position: 'fixed',
          left: rootContextMenu.x,
          top: rootContextMenu.y,
          zIndex: 9999
        }}
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
          paddingLeft: '28px',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background-color 0.15s',
          backgroundColor: selectedCategoryId === 'all' ? 'var(--color-primary)' + '1a' : 'transparent',
          color: selectedCategoryId === 'all' ? 'var(--color-primary-text)' : 'var(--color-text)'
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
          paddingLeft: '28px',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background-color 0.15s',
          backgroundColor: selectedCategoryId === null ? 'var(--color-primary)' + '1a' : 'transparent',
          color: selectedCategoryId === null ? 'var(--color-primary-text)' : 'var(--color-text)'
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
            defaultExpanded={true}
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
            renamingCategoryId={renamingCategoryId}
            onFinishRename={onFinishRename}
          />
        ))}
      </div>

      {renderContextMenu()}
      {renderRootContextMenu()}
    </div>
  );
};

export default CategoryTree;
