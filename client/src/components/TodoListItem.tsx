import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TodoList {
    id: number;
    title: string;
    user_id: number;
    created_at: string;
    updated_at: string;
    list_order?: number;
}

interface TodoListItemProps {
    list: TodoList;
    isActive: boolean;
    isEditing: boolean;
    onSelect: () => void;
    onUpdateTitle: (id: number, title: string) => void;
    onDelete: (id: number) => void;
    onStartEdit: () => void;
    onCancelEdit: () => void;
}

export default function TodoListItem({
    list,
    isActive,
    isEditing,
    onSelect,
    onUpdateTitle,
    onDelete,
    onStartEdit,
    onCancelEdit
}: TodoListItemProps) {
    const [editTitle, setEditTitle] = useState(list.title);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: list.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleUpdateTitle = () => {
        if (editTitle.trim() && editTitle !== list.title) {
            onUpdateTitle(list.id, editTitle);
        }
        onCancelEdit();
    };

    const handleCancel = () => {
        setEditTitle(list.title);
        onCancelEdit();
    };

    // Reset edit title when editing starts
    React.useEffect(() => {
        if (isEditing) {
            setEditTitle(list.title);
        }
    }, [isEditing, list.title]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`list-item ${isActive ? 'active' : ''}`}
            onClick={!isEditing ? onSelect : undefined}
            onDoubleClick={!isEditing ? onStartEdit : undefined}
        >
            <div 
                className="drag-handle" 
                {...attributes} 
                {...listeners}
                onClick={(e) => e.stopPropagation()}
            >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="4" cy="4" r="1.5" />
                    <circle cx="12" cy="4" r="1.5" />
                    <circle cx="4" cy="8" r="1.5" />
                    <circle cx="12" cy="8" r="1.5" />
                    <circle cx="4" cy="12" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                </svg>
            </div>

            {isEditing ? (
                <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleUpdateTitle}
                    maxLength={255}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateTitle();
                        if (e.key === 'Escape') handleCancel();
                    }}
                    className="list-title-input"
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                />
            ) : (
                <>
                    <span className="list-title">
                        {list.title}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(list.id);
                        }}
                        className="btn-delete-list"
                        title="리스트 삭제"
                    >
                        ×
                    </button>
                </>
            )}
        </div>
    );
}
