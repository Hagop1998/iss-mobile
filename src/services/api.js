import { API_CONFIG, EXTERNAL_CAMERA_CONFIG } from '../config/env';

export const apiConfig = {
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
};

export const endpoints = {
  auth: {
    signUp: '/auth/register',
    signIn: '/auth/login',
    signOut: '/auth/logout',
    status: '/auth/status',
    refreshToken: '/auth/refresh',
    verifyPhone: '/auth/verify-phone',
    resendCode: '/auth/resend-code',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  
  user: {
    profile: '/user/profile',
    updateProfile: '/user/profile',
    updateUserProfile: '/users/profile',
    updateUser: '/users',
    changePassword: '/users/change-password',
    deleteAccount: '/user/delete',
    getAllUsers: '/users',
    search: '/search',
    inviteFamilyMember: '/users/invite-family-member',
    removeFamilyMember: '/users/remove-family-member',
    getMyInvitations: '/users/invitation/me',
    acceptInvitation: '/users/invitation/accept',
  },
  
  verification: {
    sendCode: '/verification/send',
    verifyCode: '/verification/verify',
    resendCode: '/verification/resend',
  },
  
  home: {
    locations: '/home/locations',
    features: '/home/features',
    intercom: '/home/intercom',
    elevator: '/home/elevator',
    cameras: '/home/cameras',
    barrier: '/home/barrier',
  },
  
  externalCamera: {
    livePreview: '/frmLivePreview',
    startPlayback: '/frmStartPlayback',
    stopPlayback: '/frmStopPlayback',
    getChannelInfo: '/frmGetChannelInfo',
    ptzControl: '/frmPTZControl',
    getCruiseSettings: '/frmGetCruiseSettings',
    addCruisePreset: '/frmAddCruisePreset',
  },
  
  qr: {
    generate: '/middleware/qr_code',
    scan: '/qr/scan',
    history: '/qr/history',
  },
  
  middleware: {
    authCode: '/middleware/auth_code',
    unlock: '/middleware/unlock',
    regFace: '/middleware/reg_face',
  },
  
  media: {
    upload: '/medias/upload',
    list: '/medias',
  },
  
  services: {
    list: '/services',
    request: '/services/request',
    history: '/services/history',
  },
  
  notifications: {
    list: '/notifications',
    markRead: '/notifications/mark-read',
    settings: '/notifications/settings',
  },
  
  address: {
    list: '/address',
  },
  
  subscriptions: {
    list: '/subscriptions',
    userSubscriptions: '/subscriptions/user-subscriptions',
  },
  
  family: {
    remove: '/family/remove',
  },
  
  devices: {
    list: '/devices',
    getDevice: '/devices',
    create: '/devices',
    update: '/devices',
    delete: '/devices',
  },

  announcement: {
    list: '/announcement',
  },
};

class ApiClient {
  constructor(config) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.headers = config.headers;
  }

  async request(method, url, { data, headers, signal } = {}) {
    const controller = new AbortController();
    const isAuthEndpoint = url.includes('/auth/register') || url.includes('/auth/login');
    const requestTimeout = isAuthEndpoint ? 30000 : this.timeout;
    const timeout = setTimeout(() => controller.abort(), requestTimeout);

    try {
      const requestHeaders = { ...this.headers, ...headers };
      const isLoginApi = url.includes('/auth/login');
      const isSignUpApi = url.includes('/auth/register');
      
      if (isLoginApi || isSignUpApi) {
        delete requestHeaders.Authorization;
      }
      
      const res = await fetch(`${this.baseURL}${url}`, {
        method,
        headers: requestHeaders,
        body: data ? JSON.stringify(data) : undefined,
        signal: signal || controller.signal,
      });

      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const parsed = isJson ? await res.json() : await res.text();

      if (!res.ok) {
        const error = new Error(parsed?.message || parsed?.error || 'Request failed');
        error.status = res.status;
        error.data = parsed;
        throw error;
      }

      return parsed;
    } finally {
      clearTimeout(timeout);
    }
  }

  async get(url, options = {}) {
    return this.request('GET', url, options);
  }

  async post(url, data, options = {}) {
    return this.request('POST', url, { ...options, data });
  }

  async put(url, data, options = {}) {
    return this.request('PUT', url, { ...options, data });
  }

  async delete(url, options = {}) {
    return this.request('DELETE', url, options);
  }

  async uploadFile(url, formData, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);

    try {
      const requestHeaders = { ...this.headers };
      delete requestHeaders['Content-Type'];
      
      const headers = { ...requestHeaders, ...options.headers };

      const res = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers,
        body: formData,
        signal: options.signal || controller.signal,
      });

      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const parsed = isJson ? await res.json() : await res.text();

      if (!res.ok) {
        const error = new Error(parsed?.message || parsed?.error || 'Upload failed');
        error.status = res.status;
        error.data = parsed;
        throw error;
      }

      return parsed;
    } finally {
      clearTimeout(timeout);
    }
  }

  setAuthToken(token) {
    this.headers.Authorization = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.headers.Authorization;
  }
}

export const apiClient = new ApiClient(apiConfig);

const externalCameraApiConfig = {
  baseURL: `${EXTERNAL_CAMERA_CONFIG.BASE_URL}:${EXTERNAL_CAMERA_CONFIG.HTTP_PORT}`,
  timeout: EXTERNAL_CAMERA_CONFIG.TIMEOUT,
  headers: EXTERNAL_CAMERA_CONFIG.HEADERS,
};

const externalCameraClient = new ApiClient(externalCameraApiConfig);

export const apiService = {
  auth: {
    signUp: (userData) => apiClient.post(endpoints.auth.signUp, userData),
    signIn: (credentials) => apiClient.post(endpoints.auth.signIn, credentials),
    signOut: () => apiClient.post(endpoints.auth.signOut),
    getStatus: () => apiClient.get(endpoints.auth.status),
    refreshToken: () => apiClient.post(endpoints.auth.refreshToken),
    verifyPhone: (data) => apiClient.post(endpoints.auth.verifyPhone, data),
    resendCode: (phoneNumber) => apiClient.post(endpoints.auth.resendCode, { phoneNumber }),
    forgotPassword: (email) => apiClient.post(endpoints.auth.forgotPassword, { email }),
    resetPassword: (data) => apiClient.post(endpoints.auth.resetPassword, data),
  },

  user: {
    getProfile: () => apiClient.get(endpoints.user.profile),
    updateProfile: (data) => apiClient.put(endpoints.user.updateProfile, data),
    updateUserProfile: (data) => apiClient.request('PATCH', endpoints.user.updateUserProfile, { data }),
    updateUser: (userId, data) => apiClient.request('PATCH', `${endpoints.user.updateUser}/${userId}`, { data }),
    changePassword: (data) => apiClient.post(endpoints.user.changePassword, data),
    deleteAccount: () => apiClient.delete(endpoints.user.deleteAccount),
    getAllUsers: () => apiClient.get(endpoints.user.getAllUsers),
    getAllUsersWithParams: (params = {}) => {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.phone) queryParams.append('phone', params.phone);
      const queryString = queryParams.toString();
      return apiClient.get(`${endpoints.user.getAllUsers}${queryString ? `?${queryString}` : ''}`);
    },
    searchUsers: (email, phone) => {
      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (phone) params.append('phone', phone);
      const queryString = params.toString();
      return apiClient.get(`${endpoints.user.search}${queryString ? `?${queryString}` : ''}`);
    },
    inviteFamilyMember: (userId, data) => {
      return apiClient.post(`${endpoints.user.inviteFamilyMember}/${userId}`, data);
    },
    removeFamilyMember: (id) => {
      return apiClient.delete(`${endpoints.user.removeFamilyMember}/${id}`);
    },
    acceptInvitation: (invitationId, data = { status: 'accepted' }) => {
      return apiClient.request('PATCH', `${endpoints.user.acceptInvitation}/${invitationId}`, { data });
    },
    rejectInvitation: (invitationId) => {
      return apiClient.delete(`${endpoints.user.inviteFamilyMember}/${invitationId}`);
    },
    getMyInvitations: () => {
      return apiClient.get(endpoints.user.getMyInvitations);
    },
  },

  verification: {
    sendCode: (phoneNumber) => apiClient.post(endpoints.verification.sendCode, { phoneNumber }),
    verifyCode: (data) => apiClient.post(endpoints.verification.verifyCode, data),
    resendCode: (phoneNumber) => apiClient.post(endpoints.verification.resendCode, { phoneNumber }),
  },

  home: {
    getLocations: () => apiClient.get(endpoints.home.locations),
    getFeatures: () => apiClient.get(endpoints.home.features),
    controlIntercom: (data) => apiClient.post(endpoints.home.intercom, data),
    controlElevator: (data) => apiClient.post(endpoints.home.elevator, data),
    getCameras: () => apiClient.get(endpoints.home.cameras),
    controlBarrier: (data) => apiClient.post(endpoints.home.barrier, data),
  },

  externalCamera: {
    startLivePreview: (data) => externalCameraClient.post(endpoints.externalCamera.livePreview, data),
    startPlayback: (data) => externalCameraClient.post(endpoints.externalCamera.startPlayback, data),
    stopPlayback: (data) => externalCameraClient.post(endpoints.externalCamera.stopPlayback, data),
    getChannelInfo: (data) => externalCameraClient.post(endpoints.externalCamera.getChannelInfo, data),
    ptzControl: (data) => externalCameraClient.post(endpoints.externalCamera.ptzControl, data),
    getCruiseSettings: (data) => externalCameraClient.post(endpoints.externalCamera.getCruiseSettings, data),
    addCruisePreset: (data) => externalCameraClient.post(endpoints.externalCamera.addCruisePreset, data),
  },

  qr: {
    generateQR: (data) => apiClient.post(endpoints.qr.generate, data),
    scanQR: (data) => apiClient.post(endpoints.qr.scan, data),
    getHistory: () => apiClient.get(endpoints.qr.history),
  },

  services: {
    getServices: () => apiClient.get(endpoints.services.list),
    requestService: (data) => apiClient.post(endpoints.services.request, data),
    getHistory: () => apiClient.get(endpoints.services.history),
  },

  notifications: {
    getNotifications: () => apiClient.get(endpoints.notifications.list),
    markAsRead: (id) => apiClient.post(endpoints.notifications.markRead, { id }),
    getSettings: () => apiClient.get(endpoints.notifications.settings),
    updateSettings: (data) => apiClient.put(endpoints.notifications.settings, data),
  },

  address: {
    getAddresses: () => apiClient.get(endpoints.address.list),
  },

  subscriptions: {
    getSubscriptions: () => apiClient.get(endpoints.subscriptions.list),
    getUserSubscriptions: (userId) => apiClient.get(`${endpoints.subscriptions.userSubscriptions}/${userId}`),
  },

  family: {
    invite: (userId, data) => apiService.user.inviteFamilyMember(userId, data),
    removeMember: (id) => apiService.user.removeFamilyMember(id),
    acceptInvitation: (invitationId, data) => apiService.user.acceptInvitation(invitationId, data),
    rejectInvitation: (invitationId) => apiService.user.rejectInvitation(invitationId),
  },

  devices: {
    getDevices: () => apiClient.get(endpoints.devices.list),
    getDevice: (deviceId) => apiClient.get(`${endpoints.devices.getDevice}/${deviceId}`),
    createDevice: (data) => apiClient.post(endpoints.devices.create, data),
    updateDevice: (deviceId, data) => apiClient.request('PATCH', `${endpoints.devices.update}/${deviceId}`, { data }),
    deleteDevice: (deviceId) => apiClient.delete(`${endpoints.devices.delete}/${deviceId}`),
  },

  middleware: {
    getAuthCode: (data) => apiClient.post(endpoints.middleware.authCode, data),
    unlock: (data) => apiClient.post(endpoints.middleware.unlock, data),
    regFace: (data) => apiClient.post(endpoints.middleware.regFace, data),
  },

  media: {
    upload: (formData) => apiClient.uploadFile(endpoints.media.upload, formData),
    getList: (params = {}) => {
      const query = new URLSearchParams();
      if (params.page != null) query.append('page', params.page);
      if (params.limit != null) query.append('limit', params.limit);
      if (params.mediaType) query.append('mediaType', params.mediaType);
      if (params.entityType) query.append('entityType', params.entityType);
      if (params.entityId != null) query.append('entityId', params.entityId);
      const queryString = query.toString();
      return apiClient.get(`${endpoints.media.list}${queryString ? `?${queryString}` : ''}`);
    },
  },

  announcement: {
    getList: (params = {}) => {
      const query = new URLSearchParams();
      if (params.page != null) query.append('page', params.page);
      if (params.limit != null) query.append('limit', params.limit);
      if (params.search) query.append('search', params.search);
      const queryString = query.toString();
      return apiClient.get(`${endpoints.announcement.list}${queryString ? `?${queryString}` : ''}`);
    },
  },
};

export default apiService;
