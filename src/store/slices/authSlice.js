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
      
      console.log('Registration payload:', { ...payload, password: '***' });
      
      const response = await apiService.auth.signUp(payload);
      console.log('Registration API Response:', JSON.stringify(response, null, 2));
      
      const token = response?.token || response?.data?.token;
      const user = response?.user || response?.data?.user || response;
      
      console.log('Extracted token:', token ? 'Token received (length: ' + token.length + ')' : 'No token');
      console.log('Extracted user data:', JSON.stringify(user, null, 2));
      
      // Set token temporarily to check verification status in PendingVerificationScreen
      // This token will be used only to poll /auth/status until admin approves
      if (token) {
        apiClient.setAuthToken(token);
        console.log('✅ Token set temporarily for verification status checking');
      } else {
        console.warn('⚠️ No token received from registration API');
      }
      
      // Store user data with token for verification polling
      const finalData = { ...(response?.data || response), token, user };
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
      
      // CRITICAL: Clear any existing token before login - login should NOT have Authorization header
      apiClient.removeAuthToken();
      console.log('🔑 Cleared any existing auth token before login');
      
      const response = await apiService.auth.signIn({
        email: credentials.email,
        password: credentials.password,
      });
      
      console.log('Login API Response:', JSON.stringify(response, null, 2));
      console.log('Response keys:', Object.keys(response || {}));
      
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
      
      const user = response?.user || response?.data?.user || response?.data || response;
      console.log('Extracted user data:', JSON.stringify(user, null, 2));
      
      if (token) {
        apiClient.setAuthToken(token);
        console.log('✅ Token set globally in API client');
        
        try {
          console.log('Calling /auth/status to verify token...');
          const statusResponse = await apiService.auth.getStatus();
          console.log('✅ Auth status verified:', JSON.stringify(statusResponse, null, 2));
        } catch (statusError) {
          console.warn('⚠️ Failed to verify auth status:', statusError);
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
        console.log('🔄 Check Auth Status - Pending...');
        state.isLoading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        console.log('✅ Check Auth Status - Fulfilled');
        console.log('Status response:', JSON.stringify(action.payload, null, 2));
        state.isLoading = false;
        
        const currentToken = state.user?.token || action.payload?.token;
        let updatedUser;
        
        if (action.payload?.user) {
          console.log('Updating user data from status response (with user object)');
          updatedUser = { ...state.user, ...action.payload.user, token: currentToken };
        } else if (action.payload) {
          console.log('Updating user data from status response (flat structure)');
          const currentUserId = action.payload.id || state.user?.id;
          
          // First, check if userSubscription exists directly in payload
          if (action.payload.userSubscription) {
            const userSubscription = action.payload.userSubscription;
            const isOwner = userSubscription.userId === currentUserId;
            
            if (isOwner) {
              console.log('✅ User is owner - setting userSubscription directly');
              updatedUser = { ...state.user, ...action.payload, token: currentToken };
            } else {
              // User has userSubscription but is not owner - check if they're an accepted member
              const familyMembers = userSubscription?.familyMembers || [];
              const memberRecord = familyMembers.find(m => m.userId === currentUserId);
              
              console.log('🔍 Checking if user is accepted member:', {
                currentUserId,
                ownerId: userSubscription.userId,
                familyMembersCount: familyMembers.length,
                memberRecord: memberRecord ? {
                  id: memberRecord.id,
                  userId: memberRecord.userId,
                  acceptedAt: memberRecord.acceptedAt,
                  role: memberRecord.role
                } : null
              });
              
              if (memberRecord?.acceptedAt) {
                console.log('✅ User is accepted member - setting userSubscription');
                updatedUser = { ...state.user, ...action.payload, token: currentToken };
              } else {
                console.log('⚠️ User has userSubscription but is NOT accepted member - clearing it');
                updatedUser = { ...state.user, ...action.payload, token: currentToken };
                delete updatedUser.userSubscription;
              }
            }
          } 
          // Handle case where userSubscription is nested in member object (for non-owner members)
          else if (action.payload.member?.userSubscription) {
            const memberUserSubscription = action.payload.member.userSubscription;
            // Check if member has accepted invitation by checking familyMembers in the member's userSubscription
            const familyMembers = memberUserSubscription?.familyMembers || [];
            const memberRecord = familyMembers.find(m => m.userId === currentUserId);
            
            console.log('🔍 Checking member acceptance in nested structure:', {
              currentUserId,
              familyMembersCount: familyMembers.length,
              memberRecord: memberRecord ? {
                id: memberRecord.id,
                userId: memberRecord.userId,
                acceptedAt: memberRecord.acceptedAt,
                role: memberRecord.role
              } : null
            });
            
            // Only set subscription if member has accepted (acceptedAt is not null)
            if (memberRecord?.acceptedAt) {
              console.log('✅ Found userSubscription in member object, member has accepted - moving to top level');
              updatedUser = { 
                ...state.user, 
                ...action.payload, 
                userSubscription: action.payload.member.userSubscription,
                token: currentToken 
              };
              // Remove member object if it's not needed elsewhere
              if (updatedUser.member) {
                delete updatedUser.member;
              }
            } else {
              console.log('⚠️ Member has NOT accepted invitation yet (acceptedAt is null) - NOT setting userSubscription');
              // Don't set userSubscription if invitation not accepted
              updatedUser = { ...state.user, ...action.payload, token: currentToken };
              // Clear any existing userSubscription if invitation was not accepted
              if (updatedUser.userSubscription) {
                delete updatedUser.userSubscription;
              }
            }
          } 
          else {
            // No userSubscription found - user doesn't have subscription
            console.log('⚠️ No userSubscription found in response');
            updatedUser = { ...state.user, ...action.payload, token: currentToken };
            // Clear any existing userSubscription
            if (updatedUser.userSubscription) {
              delete updatedUser.userSubscription;
            }
          }
        } else {
          console.warn('⚠️ No payload received from checkAuthStatus');
          state.error = null;
          return;
        }
        
        state.user = updatedUser;
        
        // Check if user is verified (isVerified === true AND status === 1)
        const isVerified = (updatedUser.isVerified === true || updatedUser.isVerified === 'true') && (updatedUser.status === 1 || updatedUser.status === '1');
        console.log('🔍 Verification Check:', {
          isVerified: updatedUser.isVerified,
          status: updatedUser.status,
          hasToken: !!currentToken,
          isVerifiedCheck: isVerified,
        });
        
        if (isVerified && currentToken) {
          state.isAuthenticated = true;
          console.log('✅ User is verified (isVerified=true, status=1) and has token - setting as authenticated');
        } else {
          console.log('⚠️ User not verified or missing token:', {
            isVerified: isVerified,
            hasToken: !!currentToken,
            reason: !isVerified ? 'Not verified or status !== 1' : 'Missing token',
          });
        }
        
        console.log('Token preserved:', currentToken ? 'Yes (length: ' + currentToken.length + ')' : 'No token found');
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        const errorMessage = action.payload || 'Unknown error';
        if (!errorMessage.toString().includes('Internal server error')) {
          console.warn('⚠️ Auth status check failed:', errorMessage);
        }
        state.isLoading = false;
      });

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
        const updatedUser = action.payload?.user || action.payload;
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
