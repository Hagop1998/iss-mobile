import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService, apiClient } from '../../services/api';

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  signUpData: null, 
};

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
        role: 'user',
      };

      const response = await apiService.auth.signUp(payload);
      const token = response?.token || response?.data?.token;
      const user = response?.user || response?.data?.user || response;
      if (token) {
        apiClient.setAuthToken(token);
      }
      const finalData = { ...(response?.data || response), token, user };
      return finalData;
    } catch (error) {
      return rejectWithValue(error?.data?.message || error.message || 'Sign up failed');
    }
  }
);

export const signInUser = createAsyncThunk(
  'auth/signInUser',
  async (credentials, { rejectWithValue }) => {
    try {
      apiClient.removeAuthToken();

      const response = await apiService.auth.signIn({
        email: credentials.email,
        password: credentials.password,
      });

      const token = response?.token 
        || response?.access_token 
        || response?.accessToken
        || response?.data?.token 
        || response?.data?.access_token
        || response?.data?.accessToken
        || response?.user?.token;

      const user = response?.user || response?.data?.user || response?.data || response;

      if (token) {
        apiClient.setAuthToken(token);
        try {
          await apiService.auth.getStatus();
        } catch (statusError) {
          // Status check failed; token still valid for subsequent requests
        }
      }

      const finalUserData = { ...user, token };
      return finalUserData;
    } catch (error) {
      return rejectWithValue(error?.data?.message || error.message || 'Sign in failed');
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.auth.getStatus();
      return response?.data || response;
    } catch (error) {
      const errorMessage = error?.data?.message || error?.message || String(error);
      const isServerError = error?.status >= 500 || errorMessage.includes('Internal server error') || errorMessage.includes('500');
      

      
      return rejectWithValue(errorMessage || 'Auth status check failed');
    }
  }
);

export const updateUserData = createAsyncThunk(
  'auth/updateUserData',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const response = await apiService.user.updateUser(userId, userData);
      return response?.data || response;
    } catch (error) {
      return rejectWithValue(error?.data?.message || error.message || 'Update failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      apiClient.removeAuthToken();
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
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

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
    builder
      .addCase(signUpUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUpUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.signUpData = action.payload;
        // Store user temporarily for verification polling (not authenticated yet)
        if (action.payload?.user || action.payload) {
          state.user = action.payload?.user || action.payload;
          // Don't set isAuthenticated = true yet - user needs admin approval first
        }
        state.error = null;
      })
      .addCase(signUpUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(signInUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signInUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

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

    builder
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        
        const currentToken = state.user?.token || action.payload?.token;
        let updatedUser;
        
        if (action.payload?.user) {
          updatedUser = { ...state.user, ...action.payload.user, token: currentToken };
        } else if (action.payload) {
          const currentUserId = action.payload.id || state.user?.id;
          if (action.payload.userSubscription) {
            const userSubscription = action.payload.userSubscription;
            const isOwner = userSubscription.userId === currentUserId;
            if (isOwner) {
              updatedUser = { ...state.user, ...action.payload, token: currentToken };
            } else {
              const familyMembers = userSubscription?.familyMembers || [];
              const memberRecord = familyMembers.find(m => m.userId === currentUserId);
              if (memberRecord?.acceptedAt) {
                updatedUser = { ...state.user, ...action.payload, token: currentToken };
              } else {
                updatedUser = { ...state.user, ...action.payload, token: currentToken };
                delete updatedUser.userSubscription;
              }
            }
          } else if (action.payload.member?.userSubscription) {
            const memberUserSubscription = action.payload.member.userSubscription;
            const familyMembers = memberUserSubscription?.familyMembers || [];
            const memberRecord = familyMembers.find(m => m.userId === currentUserId);
            if (memberRecord?.acceptedAt) {
              updatedUser = {
                ...state.user,
                ...action.payload,
                userSubscription: action.payload.member.userSubscription,
                token: currentToken
              };
              if (updatedUser.member) {
                delete updatedUser.member;
              }
            } else {
              updatedUser = { ...state.user, ...action.payload, token: currentToken };
              if (updatedUser.userSubscription) {
                delete updatedUser.userSubscription;
              }
            }
          } else {
            updatedUser = { ...state.user, ...action.payload, token: currentToken };
            if (updatedUser.userSubscription) {
              delete updatedUser.userSubscription;
            }
          }
        } else {
          state.error = null;
          return;
        }
        state.user = updatedUser;
        const isVerified = (updatedUser.isVerified === true || updatedUser.isVerified === 'true') && (updatedUser.status === 1 || updatedUser.status === '1');
        if (isVerified && currentToken) {
          state.isAuthenticated = true;
        }
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isLoading = false;
      });

    builder
      .addCase(updateUserData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserData.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedUser = action.payload?.user || action.payload;
        const currentToken = state.user?.token;
        state.user = { ...state.user, ...updatedUser, token: currentToken };
        state.error = null;
      })
      .addCase(updateUserData.rejected, (state, action) => {
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
