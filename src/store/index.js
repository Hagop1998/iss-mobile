import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import appReducer from './slices/appSlice';
import profileReducer from './slices/profileSlice';
import qrReducer from './slices/qrSlice';
import announcementReducer from './slices/announcementSlice';
import mediaReducer from './slices/mediaSlice';
import { fetchAnnouncements, clearAnnouncements } from './slices/announcementSlice';
import { clearAds } from './slices/mediaSlice';
import { signInUser, checkAuthStatus, logoutUser } from './slices/authSlice';
import { qrApi } from '../services/qrApi';

// Fetch announcements when user logs in or auth status is refreshed; clear on logout
const announcementListener = createListenerMiddleware();
announcementListener.startListening({
  predicate: (action) =>
    action.type === signInUser.fulfilled.type || action.type === checkAuthStatus.fulfilled.type,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState();
    const user = state.auth?.user;
    if (user?.token) {
      listenerApi.dispatch(fetchAnnouncements());
    }
  },
});
announcementListener.startListening({
  predicate: (action) => action.type === logoutUser.fulfilled.type,
  effect: (action, listenerApi) => {
    listenerApi.dispatch(clearAnnouncements());
    listenerApi.dispatch(clearAds());
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    app: appReducer,
    profile: profileReducer,
    qr: qrReducer,
    announcement: announcementReducer,
    media: mediaReducer,
    [qrApi.reducerPath]: qrApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
      .prepend(announcementListener.middleware)
      .concat(qrApi.middleware),
});

