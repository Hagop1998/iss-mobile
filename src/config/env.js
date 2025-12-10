// Environment Configuration
// This file reads from .env file and provides typed configuration

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://138.68.88.206:9001',
  // BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://3wqx9scw-9001.euw.devtunnels.ms',
  TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT) || 10000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export const APP_CONFIG = {
  NAME: process.env.EXPO_PUBLIC_APP_NAME || 'ISSApp',
  VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  BUNDLE_ID: 'com.anonymous.ISSApp',
};

export const FEATURE_FLAGS = {
  ENABLE_FACE_RECOGNITION: process.env.EXPO_PUBLIC_ENABLE_FACE_RECOGNITION === 'true',
  ENABLE_PIN_ACCESS: process.env.EXPO_PUBLIC_ENABLE_PIN_ACCESS === 'true',
  ENABLE_QR_ACCESS: process.env.EXPO_PUBLIC_ENABLE_QR_ACCESS === 'true',
  ENABLE_CAMERA: process.env.EXPO_PUBLIC_ENABLE_CAMERA === 'true',
  ENABLE_BARRIER: false, // Coming soon
};

export const CAMERA_CONFIG = {
  QUALITY: parseFloat(process.env.EXPO_PUBLIC_CAMERA_QUALITY) || 0.7,
  VIDEO_MAX_DURATION: parseInt(process.env.EXPO_PUBLIC_VIDEO_MAX_DURATION) || 60,
  PHOTO_INTERVAL_MS: parseInt(process.env.EXPO_PUBLIC_PHOTO_INTERVAL_MS) || 500,
};

export const DEFAULT_VALUES = {
  LOCATION: process.env.EXPO_PUBLIC_DEFAULT_LOCATION || 'Azatutyun 20',
  LANGUAGE: process.env.EXPO_PUBLIC_DEFAULT_LANGUAGE || 'en',
};

export const DEBUG_CONFIG = {
  ENABLE_LOGS: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true' || __DEV__,
  ENABLE_REDUX_LOGGER: __DEV__,
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY_PHONE: '/auth/verify-phone',
    RESEND_CODE: '/auth/resend-code',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    CHANGE_PASSWORD: '/user/change-password',
    DELETE_ACCOUNT: '/user/delete',
  },
  VERIFICATION: {
    SEND_CODE: '/verification/send',
    VERIFY_CODE: '/verification/verify',
    RESEND_CODE: '/verification/resend',
  },
  HOME: {
    LOCATIONS: '/home/locations',
    FEATURES: '/home/features',
    INTERCOM: '/home/intercom',
    ELEVATOR: '/home/elevator',
    CAMERAS: '/home/cameras',
    BARRIER: '/home/barrier',
  },
  QR: {
    GENERATE: '/qr/generate',
    SCAN: '/qr/scan',
    HISTORY: '/qr/history',
  },
  SERVICES: {
    LIST: '/services',
    REQUEST: '/services/request',
    HISTORY: '/services/history',
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/mark-read',
    SETTINGS: '/notifications/settings',
  },
};

export default {
  API_CONFIG,
  APP_CONFIG,
  FEATURE_FLAGS,
  CAMERA_CONFIG,
  DEFAULT_VALUES,
  DEBUG_CONFIG,
  API_ENDPOINTS,
};

