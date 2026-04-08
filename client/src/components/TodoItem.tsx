import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Todo } from '../store/slices/todoSlice';
import api from '../services/api';
import './TodoItem.css';

interface TodoItemProps {
  todo: Todo;
}

export default function TodoItem({ todo }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleToggleComplete = async () => {
    try {
      await api.put(`/todos/${todo.id}`, { completed: !todo.completed });
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/todos/${todo.id}`);
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handleEdit = async () => {
    if (isEditing) {
      if (editTitle.trim() && editTitle !== todo.title) {
        try {
          await api.put(`/todos/${todo.id}`, { title: editTitle });
        } catch (error) {
          console.error('Failed to update todo:', error);
        }
      }
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setEditTitle(todo.title);
    setIsEditing(false);
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`todo-item ${todo.completed ? 'completed' : ''}`}
    >
      <div className="drag-handle" {...attributes} {...listeners}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="4" cy="4" r="1.5"/>
          <circle cx="12" cy="4" r="1.5"/>
          <circle cx="4" cy="8" r="1.5"/>
          <circle cx="12" cy="8" r="1.5"/>
          <circle cx="4" cy="12" r="1.5"/>
          <circle cx="12" cy="12" r="1.5"/>
        </svg>
      </div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggleComplete}
        className="todo-checkbox"
      />
      
      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={1000}
          className="todo-edit-input"
          autoFocus
        />
      ) : (
        <span className="todo-title" onDoubleClick={handleDoubleClick}>{todo.title}</span>
      )}

      <div className="todo-actions">
        {isEditing ? (
          <>
            <button onClick={handleEdit} className="btn-save" title="저장">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
            <button onClick={handleCancel} className="btn-cancel" title="취소">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </>
        ) : (
          <>
            <button onClick={handleEdit} className="btn-edit" title="수정">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button onClick={handleDelete} className="btn-delete" title="삭제">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
