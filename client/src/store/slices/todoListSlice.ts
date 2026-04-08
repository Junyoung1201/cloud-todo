import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TodoList {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

interface TodoListState {
  lists: TodoList[];
  currentListId: number | null;
}

const initialState: TodoListState = {
  lists: [],
  currentListId: null,
};

const todoListSlice = createSlice({
  name: 'todoList',
  initialState,
  reducers: {
    setTodoLists: (state, action: PayloadAction<TodoList[]>) => {
      state.lists = action.payload;
      // Set first list as current if no list is selected
      if (state.currentListId === null && action.payload.length > 0) {
        state.currentListId = action.payload[0].id;
      }
    },
    addTodoList: (state, action: PayloadAction<TodoList>) => {
      state.lists.push(action.payload);
    },
    updateTodoList: (state, action: PayloadAction<TodoList>) => {
      const index = state.lists.findIndex(list => list.id === action.payload.id);
      if (index !== -1) {
        state.lists[index] = action.payload;
      }
    },
    removeTodoList: (state, action: PayloadAction<number>) => {
      state.lists = state.lists.filter(list => list.id !== action.payload);
      // If deleted list was current, select first available list
      if (state.currentListId === action.payload) {
        state.currentListId = state.lists.length > 0 ? state.lists[0].id : null;
      }
    },
    setCurrentListId: (state, action: PayloadAction<number>) => {
      state.currentListId = action.payload;
    },
  },
});

export const {
  setTodoLists,
  addTodoList,
  updateTodoList,
  removeTodoList,
  setCurrentListId,
} = todoListSlice.actions;

export default todoListSlice.reducer;
