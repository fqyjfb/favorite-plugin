import React, { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, FolderOpen, ChevronRight, ChevronDown, GripVertical } from 'lucide-react';
import type { CategoryNode } from '../types';

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
  onDrop
}) => {
  const [expanded, setExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

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

  const handleAddSubCategory = useCallback(() => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim(), category.id);
    }
    setNewCategoryName('');
    setShowAddInput(false);
    setExpanded(true);
  }, [newCategoryName, category.id, onAddCategory]);

  const handleCancelAdd = useCallback(() => {
    setShowAddInput(false);
    setNewCategoryName('');
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubCategory();
    }
    if (e.key === 'Escape') {
      handleCancelAdd();
    }
  }, [handleAddSubCategory, handleCancelAdd]);

  return (
    <div
      className="select-none"
      onDragOver={(e) => onDragOver(e, category.id)}
      onDrop={(e) => onDrop(e, category.id)}
    >
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group transition-colors ${
          isSelected
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
        } ${isDragging ? 'opacity-50' : ''} ${
          isDropTarget && dropPosition === 'before' ? 'border-t-2 border-primary' : ''
        } ${isDropTarget && dropPosition === 'after' ? 'border-b-2 border-primary' : ''} ${
          isDropTarget && dropPosition === 'child' ? 'bg-primary/20' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelectCategory(category.id)}
      >
        <span
          className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            onDragStart(category.id);
          }}
          onDragEnd={onDragEnd}
        >
          <GripVertical className="w-3 h-3 text-gray-400" />
        </span>

        <button
          className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )
          ) : (
            <span className="w-3 h-3" />
          )}
        </button>

        <FolderOpen className="w-4 h-4 flex-shrink-0" />

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
            className="flex-1 px-1 py-0.5 text-sm border border-primary rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-sm truncate">{category.name}</span>
        )}

        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
          {count}
        </span>

        <div className="hidden group-hover:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
            title="添加子分类"
            onClick={(e) => {
              e.stopPropagation();
              setShowAddInput(true);
              setExpanded(true);
            }}
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
            title="重命名"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-500"
            title="删除"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCategory(category.id);
            }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {showAddInput && (
        <div
          className="flex items-center gap-1 px-2 py-1"
          style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
        >
          <input
            autoFocus
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleAddSubCategory}
            placeholder="分类名称"
            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary"
          />
        </div>
      )}

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
  const [showRootAdd, setShowRootAdd] = useState(false);
  const [rootName, setRootName] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<string | null>(null);

  const uncategorizedCount = bookmarkCounts.get(null) || 0;

  const handleDragStart = useCallback((id: string) => {
    setDraggingId(id);
  }, []);

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
    if (y < height * 0.25) {
      position = 'before';
    } else if (y > height * 0.75) {
      position = 'after';
    } else {
      position = 'child';
    }

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

  const handleRootDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (draggingId && categories.some((c) => c.id === draggingId)) {
      setDropTargetId('__root__');
      setDropPosition('after');
    }
  }, [draggingId, categories]);

  const handleRootDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (draggingId && dropTargetId === '__root__') {
      onReorderCategory(draggingId, null, 'after');
    }
    handleDragEnd();
  }, [draggingId, dropTargetId, onReorderCategory, handleDragEnd]);

  return (
    <div className="flex flex-col h-full">
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group transition-colors ${
          selectedCategoryId === 'all'
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}
        onClick={() => onSelectCategory('all')}
      >
        <FolderOpen className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-sm">全部书签</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {bookmarkCounts.get('__all__') || 0}
        </span>
      </div>

      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group transition-colors ${
          selectedCategoryId === null
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}
        onClick={() => onSelectCategory(null)}
      >
        <FolderOpen className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-sm">未分类</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {uncategorizedCount}
        </span>
      </div>

      <div
        className="flex-1 overflow-y-auto py-1"
        onDragOver={handleRootDragOver}
        onDrop={handleRootDrop}
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
          />
        ))}
      </div>

      {showRootAdd ? (
        <div className="flex items-center gap-1 px-2 py-1">
          <input
            autoFocus
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (rootName.trim()) {
                  onAddCategory(rootName.trim(), null);
                }
                setShowRootAdd(false);
                setRootName('');
              }
              if (e.key === 'Escape') {
                setShowRootAdd(false);
                setRootName('');
              }
            }}
            onBlur={() => {
              if (rootName.trim()) {
                onAddCategory(rootName.trim(), null);
              }
              setShowRootAdd(false);
              setRootName('');
            }}
            placeholder="根分类名称"
            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary"
          />
        </div>
      ) : (
        <button
          onClick={() => setShowRootAdd(true)}
          className="flex items-center gap-1 px-2 py-1.5 w-full text-xs text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <Plus className="w-3 h-3" />
          添加分类
        </button>
      )}
    </div>
  );
};

export default CategoryTree;