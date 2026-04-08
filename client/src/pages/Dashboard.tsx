import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { setTodos, addTodo, updateTodo, removeTodo } from '../store/slices/todoSlice';
import { setTodoLists, addTodoList, updateTodoList, removeTodoList, setCurrentListId } from '../store/slices/todoListSlice';
import { toggleDarkMode } from '../store/slices/themeSlice';
import api from '../services/api';
import socketService from '../services/socket';
import TodoItem from '../components/TodoItem';
import TodoListItem from '../components/TodoListItem';
import SettingsModal from '../components/SettingsModal';
import './Dashboard.css';

export default function Dashboard() {
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newListTitle, setNewListTitle] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [editingListId, setEditingListId] = useState<number | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { todos } = useSelector((state: RootState) => state.todo);
  const { lists, currentListId } = useSelector((state: RootState) => state.todoList);
  const { isDarkMode } = useSelector((state: RootState) => state.theme);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (user) {
      // Connect to socket
      const socket = socketService.connect();

      // Load todo lists and todos
      loadTodoLists();

      // Socket listeners for todo lists
      socket.on('todoList:created', (todoList) => {
        dispatch(addTodoList(todoList));
      });

      socket.on('todoList:updated', (todoList) => {
        dispatch(updateTodoList(todoList));
      });

      socket.on('todoList:deleted', ({ id }) => {
        dispatch(removeTodoList(id));
      });

      // Socket listeners for todos
      socket.on('todo:created', (todo) => {
        if (todo.list_id === currentListId) {
          dispatch(addTodo(todo));
        }
      });

      socket.on('todo:updated', (todo) => {
        dispatch(updateTodo(todo));
      });

      socket.on('todo:deleted', ({ id }) => {
        dispatch(removeTodo(id));
      });

      socket.on('todos:reordered', ({ listId, todos }) => {
        if (listId === currentListId) {
          dispatch(setTodos(todos));
        }
      });

      socket.on('todoLists:reordered', (todoLists) => {
        dispatch(setTodoLists(todoLists));
      });

      return () => {
        socket.off('todoList:created');
        socket.off('todoList:updated');
        socket.off('todoList:deleted');
        socket.off('todo:created');
        socket.off('todo:updated');
        socket.off('todo:deleted');
        socket.off('todos:reordered');
        socket.off('todoLists:reordered');
      };
    }
  }, [user, currentListId]);

  useEffect(() => {
    if (currentListId) {
      loadTodos(currentListId);
    }
  }, [currentListId]);

  // Keyboard shortcuts for list management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in input/textarea and a list is selected
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA' ||
          !currentListId) {
        return;
      }

      // Delete key - delete current list
      if (e.key === 'Delete') {
        e.preventDefault();
        handleDeleteList(currentListId);
      }

      // F2 key - rename current list
      if (e.key === 'F2') {
        e.preventDefault();
        setEditingListId(currentListId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentListId]);

  const loadTodoLists = async () => {
    try {
      const response = await api.get('/todo-lists');
      dispatch(setTodoLists(response.data));
    } catch (error) {
      console.error('Failed to load todo lists:', error);
    }
  };

  const loadTodos = async (listId: number) => {
    try {
      const response = await api.get(`/todos/${listId}`);
      dispatch(setTodos(response.data));
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim() || !currentListId) return;

    try {
      await api.post('/todos', { listId: currentListId, title: newTodoTitle });
      setNewTodoTitle('');
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    try {
      await api.post('/todo-lists', { title: newListTitle });
      setNewListTitle('');
      setIsCreatingList(false);
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  };

  const handleUpdateListTitle = async (listId: number, title: string) => {
    if (!title.trim()) return;

    try {
      await api.put(`/todo-lists/${listId}`, { title });
    } catch (error) {
      console.error('Failed to update list:', error);
    }
  };

  const handleDeleteList = async (listId: number) => {
    if (window.confirm('이 리스트와 모든 할 일을 삭제하시겠습니까?')) {
      try {
        await api.delete(`/todo-lists/${listId}`);
      } catch (error) {
        console.error('Failed to delete list:', error);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        await api.delete('/auth/delete');
        socketService.disconnect();
        dispatch(logout());
        navigate('/login');
      } catch (error) {
        console.error('계정 삭제 실패:', error);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && currentListId) {
      const oldIndex = todos.findIndex((todo) => todo.id === active.id);
      const newIndex = todos.findIndex((todo) => todo.id === over.id);

      const newTodos = arrayMove(todos, oldIndex, newIndex);
      dispatch(setTodos(newTodos));

      // Update order on server
      try {
        const todoIds = newTodos.map(todo => todo.id);
        await api.put(`/todos/order/${currentListId}`, { todoIds });
      } catch (error) {
        console.error('Failed to update order:', error);
        // Reload todos if update fails
        loadTodos(currentListId);
      }
    }
  };

  const handleListDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = lists.findIndex((list) => list.id === active.id);
      const newIndex = lists.findIndex((list) => list.id === over.id);

      const newLists = arrayMove(lists, oldIndex, newIndex);
      dispatch(setTodoLists(newLists));

      // Update order on server
      try {
        const listIds = newLists.map(list => list.id);
        await api.put('/todo-lists/order/update', { listIds });
      } catch (error) {
        console.error('Failed to update list order:', error);
        // Reload lists if update fails
        loadTodoLists();
      }
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            aria-label="메뉴 열기"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <Link to="/" className="dashboard-logo">
            <h1>클라우드 TODO</h1>
          </Link>
        </div>
        <div className="user-info">
          <span className="user-name">{user?.username}님, 환영합니다!</span>
          <button 
            onClick={() => dispatch(toggleDarkMode())} 
            className="btn-dark-mode"
            aria-label={isDarkMode ? '라이트 모드' : '다크 모드'}
            title={isDarkMode ? '라이트 모드' : '다크 모드'}
          >
            {isDarkMode ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)} 
            className="btn-settings"
            aria-label="설정"
            title="설정"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>
      </header>

      <div className="dashboard-body">
        {/* Mobile sidebar overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="sidebar-overlay"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar with lists */}
        <aside className={`sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <h2>내 리스트</h2>
            <div className="sidebar-header-actions">
              <button 
                onClick={() => setIsCreatingList(true)} 
                className="btn-add-list"
                title="새 리스트"
              >
                +
              </button>
              <button 
                className="btn-close-sidebar"
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-label="사이드바 닫기"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <div className="list-items">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleListDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={lists.map(list => list.id)}
                strategy={verticalListSortingStrategy}
              >
                {lists.map((list) => (
                  <TodoListItem
                    key={list.id}
                    list={list}
                    isActive={currentListId === list.id}
                    isEditing={editingListId === list.id}
                    onSelect={() => {
                      dispatch(setCurrentListId(list.id));
                      setIsMobileSidebarOpen(false);
                    }}
                    onUpdateTitle={handleUpdateListTitle}
                    onDelete={handleDeleteList}
                    onStartEdit={() => setEditingListId(list.id)}
                    onCancelEdit={() => setEditingListId(null)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {isCreatingList && (
              <form onSubmit={handleCreateList} className="list-item new-list">
                <input
                  type="text"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  maxLength={255}
                  onBlur={() => {
                    if (!newListTitle.trim()) setIsCreatingList(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setNewListTitle('');
                      setIsCreatingList(false);
                    }
                  }}
                  placeholder="리스트 이름..."
                  className="list-title-input"
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                />
              </form>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="dashboard-main">
          {currentListId ? (
            <>
              <form onSubmit={handleAddTodo} className="add-todo-form">
                <input
                  type="text"
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  maxLength={1000}
                  placeholder="새로운 할 일을 추가하세요..."
                  className="todo-input"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button type="submit" className="btn-primary" title="추가">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </form>

              <div className="todo-list">
                {todos.length === 0 ? (
                  <p className="no-todos">아직 할 일이 없습니다. 위에서 추가해보세요!</p>
                ) : (
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                  >
                    <SortableContext 
                      items={todos.map(todo => todo.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {todos.map((todo) => <TodoItem key={todo.id} todo={todo} />)}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </>
          ) : (
            <div className="no-list-selected">
              <p>왼쪽에서 리스트를 선택하거나 새로 만들어보세요!</p>
            </div>
          )}
        </main>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDeleteAccount={handleDeleteAccount}
      />
    </div>
  );
}
