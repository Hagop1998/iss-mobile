import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import appReducer from './slices/appSlice';
import profileReducer from './slices/profileSlice';
import qrReducer from './slices/qrSlice';
import { qrApi } from '../services/qrApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    app: appReducer,
    profile: profileReducer,
    qr: qrReducer,
    [qrApi.reducerPath]: qrApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(qrApi.middleware),
});

