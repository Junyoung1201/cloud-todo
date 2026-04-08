import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import todoReducer from './slices/todoSlice';
import todoListReducer from './slices/todoListSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    todo: todoReducer,
    todoList: todoListReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
