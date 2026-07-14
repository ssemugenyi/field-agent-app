import { configureStore } from '@reduxjs/toolkit';
import { api } from '../api/apiSlice';
import authReducer from '../auth/authSlice';
import syncStatusReducer from '../sync/syncStatusSlice';
import connectivityReducer from '../sync/connectivitySlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    syncStatus: syncStatusReducer,
    connectivity: connectivityReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
