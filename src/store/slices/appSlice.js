import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  language: 'en',
  theme: 'light',
  isLoading: false,
  networkStatus: 'online',
  notifications: [],
  currentScreen: 'SignUp',
  isFirstLaunch: true,
  appVersion: '1.0.0',
  lastSyncTime: null,
  modals: {
    languageSelector: false,
  },
  settings: {
    notifications: true,
    biometrics: false,
    autoLock: true,
    language: 'en',
    theme: 'light',
  },
};

// App slice
const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.language = action.payload;
      state.settings.language = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      state.settings.theme = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setNetworkStatus: (state, action) => {
      state.networkStatus = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setCurrentScreen: (state, action) => {
      state.currentScreen = action.payload;
    },
    setFirstLaunch: (state, action) => {
      state.isFirstLaunch = action.payload;
    },
    setLastSyncTime: (state, action) => {
      state.lastSyncTime = action.payload;
    },
    updateSettings: (state, action) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },
    showModal: (state, action) => {
      const { modalName } = action.payload;
      state.modals[modalName] = true;
    },
    hideModal: (state, action) => {
      const { modalName } = action.payload;
      state.modals[modalName] = false;
    },
    resetApp: (state) => {
      return {
        ...initialState,
        language: state.language,
        theme: state.theme,
        settings: state.settings,
      };
    },
  },
});

export const {
  setLanguage,
  setTheme,
  setLoading,
  setNetworkStatus,
  addNotification,
  removeNotification,
  clearNotifications,
  setCurrentScreen,
  setFirstLaunch,
  setLastSyncTime,
  updateSettings,
  showModal,
  hideModal,
  resetApp,
} = appSlice.actions;

export default appSlice.reducer;
