import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService, apiClient } from '../../services/api';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  signUpData: null, // Temporary data before verification
};

// Async thunks for API calls (ready for backend integration)
export const signUpUser = createAsyncThunk(
  'auth/signUpUser',
  async (userData, { rejectWithValue }) => {
    try {
      const payload = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        bio: userData.bio || '',
        role: userData.role || 'user',
      };
      
      console.log('Registration payload:', { ...payload, password: '***' });
      
      const response = await apiService.auth.signUp(payload);
      console.log('Registration API Response:', JSON.stringify(response, null, 2));
      
      const token = response?.token || response?.data?.token;
      const user = response?.user || response?.data?.user || response;
      
      console.log('Extracted token:', token ? 'Token received (length: ' + token.length + ')' : 'No token');
      console.log('Extracted user data:', JSON.stringify(user, null, 2));
      
      if (token) {
        apiClient.setAuthToken(token);
        console.log('✅ Token set globally in API client after signup');
        
        try {
          console.log('Calling /auth/status to verify token after signup...');
          const statusResponse = await apiService.auth.getStatus();
          console.log('✅ Auth status verified after signup:', JSON.stringify(statusResponse, null, 2));
        } catch (statusError) {
          console.warn('⚠️ Failed to verify auth status after signup:', statusError);
        }
      } else {
        console.warn('⚠️ No token received from registration API');
      }
      
      const finalData = response?.data || response;
      console.log('Final signup data to store in Redux:', JSON.stringify(finalData, null, 2));
      console.log('=== SIGN UP END ===');
      
      return finalData;
    } catch (error) {
      console.error('❌ SIGN UP ERROR:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return rejectWithValue(error?.data?.message || error.message || 'Sign up failed');
    }
  }
);

export const signInUser = createAsyncThunk(
  'auth/signInUser',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('=== SIGN IN START ===');
      console.log('Login credentials:', { email: credentials.email, password: '***' });
      
      const response = await apiService.auth.signIn({
        email: credentials.email,
        password: credentials.password,
      });
      
      console.log('Login API Response:', JSON.stringify(response, null, 2));
      console.log('Response keys:', Object.keys(response || {}));
      
      // Try to extract token from various possible locations
      const token = response?.token 
        || response?.access_token 
        || response?.accessToken
        || response?.data?.token 
        || response?.data?.access_token
        || response?.data?.accessToken
        || response?.user?.token;
      
      console.log('🔍 Token extraction attempts:');
      console.log('  - response?.token:', !!response?.token);
      console.log('  - response?.access_token:', !!response?.access_token);
      console.log('  - response?.data?.token:', !!response?.data?.token);
      console.log('  - response?.user?.token:', !!response?.user?.token);
      console.log('Final extracted token:', token ? 'Token received (length: ' + token.length + ')' : '❌ NO TOKEN FOUND IN RESPONSE!');
      
      // Extract user data
      const user = response?.user || response?.data?.user || response?.data || response;
      console.log('Extracted user data:', JSON.stringify(user, null, 2));
      
      if (token) {
        // Set token globally for all API requests
        apiClient.setAuthToken(token);
        console.log('✅ Token set globally in API client');
        
        // Verify token by calling /auth/status
        try {
          console.log('Calling /auth/status to verify token...');
          const statusResponse = await apiService.auth.getStatus();
          console.log('✅ Auth status verified:', JSON.stringify(statusResponse, null, 2));
        } catch (statusError) {
          console.warn('⚠️ Failed to verify auth status:', statusError);
          // Don't fail the login if status check fails
        }
      } else {
        console.warn('⚠️ No token received from login API');
      }
      
      const finalUserData = { ...user, token };
      console.log('Final user data to store in Redux:', JSON.stringify(finalUserData, null, 2));
      console.log('=== SIGN IN END ===');
      
      return finalUserData;
    } catch (error) {
      console.error('❌ SIGN IN ERROR:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return rejectWithValue(error?.data?.message || error.message || 'Sign in failed');
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      console.log('=== CHECK AUTH STATUS START ===');
      console.log('Calling /auth/status endpoint...');
      
      const response = await apiService.auth.getStatus();
      
      console.log('✅ Auth status response:', JSON.stringify(response, null, 2));
      console.log('=== CHECK AUTH STATUS END ===');
      
      return response?.data || response;
    } catch (error) {
      console.error('❌ AUTH STATUS CHECK ERROR:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return rejectWithValue(error?.data?.message || error.message || 'Auth status check failed');
    }
  }
);

export const updateUserData = createAsyncThunk(
  'auth/updateUserData',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      console.log('=== UPDATE USER DATA START ===');
      console.log('User ID:', userId);
      console.log('Update data:', JSON.stringify(userData, null, 2));
      
      const response = await apiService.user.updateUser(userId, userData);
      
      console.log('✅ User updated successfully:', JSON.stringify(response, null, 2));
      console.log('=== UPDATE USER DATA END ===');
      
      return response?.data || response;
    } catch (error) {
      console.error('❌ UPDATE USER DATA ERROR:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return rejectWithValue(error?.data?.message || error.message || 'Update failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // Clear token from API client
      apiClient.removeAuthToken();
      // Optionally call backend logout endpoint if it exists
      // await apiService.auth.signOut();
      return true;
    } catch (error) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.post('/auth/refresh');
      // return response.data;
      
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSignUpData: (state, action) => {
      state.signUpData = action.payload;
    },
    clearSignUpData: (state) => {
      state.signUpData = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.signUpData = null;
    },
  },
  extraReducers: (builder) => {
    // Sign Up
    builder
      .addCase(signUpUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUpUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.signUpData = action.payload;
        state.error = null;
      })
      .addCase(signUpUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Sign In
    builder
      .addCase(signInUser.pending, (state) => {
        console.log('🔄 Sign In - Pending...');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInUser.fulfilled, (state, action) => {
        console.log('✅ Sign In - Fulfilled');
        console.log('User data stored in Redux:', JSON.stringify(action.payload, null, 2));
        console.log('CRITICAL CHECK - Does payload have token?:', !!action.payload?.token);
        console.log('Token value:', action.payload?.token ? 'Token present (length: ' + action.payload.token.length + ')' : 'NO TOKEN IN PAYLOAD!');
        
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        
        console.log('Redux auth state updated:', { 
          isAuthenticated: true, 
          hasUser: !!state.user,
          hasToken: !!state.user?.token,
          tokenInState: state.user?.token ? 'Yes (length: ' + state.user.token.length + ')' : 'NO TOKEN IN STATE!'
        });
      })
      .addCase(signInUser.rejected, (state, action) => {
        console.error('❌ Sign In - Rejected:', action.payload);
        state.isLoading = false;
        state.error = action.payload;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.signUpData = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Refresh Token
    builder
      .addCase(refreshToken.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshToken.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      });

    // Check Auth Status
    builder
      .addCase(checkAuthStatus.pending, (state) => {
        console.log('🔄 Check Auth Status - Pending...');
        state.isLoading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        console.log('✅ Check Auth Status - Fulfilled');
        console.log('Status response:', JSON.stringify(action.payload, null, 2));
        state.isLoading = false;
        // Update user data if provided in status response
        if (action.payload?.user) {
          console.log('Updating user data from status response');
          // Preserve the token when updating user data
          const currentToken = state.user?.token;
          state.user = { ...state.user, ...action.payload.user, token: currentToken };
          console.log('Token preserved:', currentToken ? 'Yes (length: ' + currentToken.length + ')' : 'No token found');
        }
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        console.error('❌ Check Auth Status - Rejected:', action.payload);
        console.warn('⚠️ Auth status check failed, but keeping user logged in if token exists');
        state.isLoading = false;
        
      });

    // Update User Data
    builder
      .addCase(updateUserData.pending, (state) => {
        console.log('🔄 Update User Data - Pending...');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserData.fulfilled, (state, action) => {
        console.log('✅ Update User Data - Fulfilled');
        console.log('Updated user data:', JSON.stringify(action.payload, null, 2));
        state.isLoading = false;
        // Merge updated data with existing user data
        const updatedUser = action.payload?.user || action.payload;
        // Preserve the token when updating user data
        const currentToken = state.user?.token;
        state.user = { ...state.user, ...updatedUser, token: currentToken };
        state.error = null;
        console.log('User state after update:', JSON.stringify(state.user, null, 2));
        console.log('Token preserved in update:', currentToken ? 'Yes (length: ' + currentToken.length + ')' : 'No token found');
      })
      .addCase(updateUserData.rejected, (state, action) => {
        console.error('❌ Update User Data - Rejected:', action.payload);
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setSignUpData,
  clearSignUpData,
  setUser,
  clearUser,
} = authSlice.actions;

export default authSlice.reducer;
