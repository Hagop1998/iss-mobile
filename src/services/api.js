import { API_CONFIG } from '../config/env';

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
    updateUser: '/users',
    changePassword: '/users/change-password',
    deleteAccount: '/user/delete',
    getAllUsers: '/users',
    search: '/search',
    inviteFamilyMember: '/users/invite-family-member',
    removeFamilyMember: '/users/remove-family-member',
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
};

class ApiClient {
  constructor(config) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.headers = config.headers;
  }

  async request(method, url, { data, headers, signal } = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);

    try {
      const requestHeaders = { ...this.headers, ...headers };
      const isLoginApi = url.includes('/auth/login');
      
      if (isLoginApi) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🌐 LOGIN API REQUEST (from ApiClient.request)');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📍 Method:', method);
        console.log('📍 Full URL:', `${this.baseURL}${url}`);
        console.log('📍 Endpoint:', url);
        console.log('📤 Has Auth Token:', !!requestHeaders.Authorization);
        console.log('📤 Auth Token Preview:', requestHeaders.Authorization 
          ? requestHeaders.Authorization.substring(0, 30) + '...' 
          : 'No token (expected for login)');
        console.log('📤 Request Headers:', requestHeaders);
        console.log('📤 Has Body:', !!data);
        if (data) {
          console.log('📤 Request Body:', JSON.stringify(data, null, 2));
        }
        console.log('═══════════════════════════════════════════════════════════');
      } else {
        console.log('🌐 API Request:', {
          method,
          url: `${this.baseURL}${url}`,
          hasAuthToken: !!requestHeaders.Authorization,
          authTokenPreview: requestHeaders.Authorization 
            ? requestHeaders.Authorization.substring(0, 20) + '...' 
            : 'No token',
          headers: requestHeaders,
          hasBody: !!data,
        });
        
        if (data) {
          console.log('Request body:', JSON.stringify(data, null, 2));
        }
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

      if (isLoginApi) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔐 LOGIN API RESPONSE RECEIVED');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📍 URL:', `${this.baseURL}${url}`);
        console.log('📊 Status:', res.status, res.statusText);
        console.log('✅ Success:', res.ok);
        console.log('📥 Response Headers:', Object.fromEntries(res.headers.entries()));
        console.log('📦 Response Body:', JSON.stringify(parsed, null, 2));
        if (parsed?.token || parsed?.data?.token) {
          console.log('🔑 Token detected in response:', {
            hasToken: !!parsed?.token,
            hasDataToken: !!parsed?.data?.token,
            tokenLength: parsed?.token?.length || parsed?.data?.token?.length,
          });
        }
        console.log('═══════════════════════════════════════════════════════════');
      } else {
        console.log('📥 API Response:', {
          url: `${this.baseURL}${url}`,
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
        });
        console.log('Response body:', JSON.stringify(parsed, null, 2));
      }

      if (!res.ok) {
        if (isLoginApi) {
          console.log('═══════════════════════════════════════════════════════════');
        } else {
          console.warn('⚠️ API error', { 
            url: `${this.baseURL}${url}`, 
            status: res.status, 
            body: parsed 
          });
        }
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

      console.log('📤 File Upload Request:', {
        method: 'POST',
        url: `${this.baseURL}${url}`,
        hasAuthToken: !!headers.Authorization,
        formDataKeys: formData ? Object.keys(formData._parts || {}) : [],
      });

      const res = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers,
        body: formData,
        signal: options.signal || controller.signal,
      });

      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const parsed = isJson ? await res.json() : await res.text();

      console.log('📥 File Upload Response:', {
        url: `${this.baseURL}${url}`,
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        response: parsed,
      });

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

export const apiService = {
  auth: {
    signUp: (userData) => apiClient.post(endpoints.auth.signUp, userData),
    signIn: (credentials) => {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🔐 LOGIN API CALL INITIATED');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📍 Endpoint:', endpoints.auth.signIn);
      console.log('📍 Full URL:', `${apiConfig.baseURL}${endpoints.auth.signIn}`);
      console.log('📤 Request Method: POST');
      console.log('📤 Request Credentials:', {
        email: credentials.email,
        password: credentials.password ? '***' : 'NOT PROVIDED',
        hasEmail: !!credentials.email,
        hasPassword: !!credentials.password,
      });
      console.log('📤 Request Headers:', apiConfig.headers);
      console.log('═══════════════════════════════════════════════════════════');
      return apiClient.post(endpoints.auth.signIn, credentials);
    },
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
    updateUser: (userId, data) => {
      console.log(`🔄 Updating user ${userId} with data:`, data);
      return apiClient.request('PATCH', `${endpoints.user.updateUser}/${userId}`, { data });
    },
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
  },
};

export default apiService;
