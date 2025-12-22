import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../services/api';
import { imageSizeEnum, entityTypeEnum } from '../../constants/enums';
import * as ImageManipulator from 'expo-image-manipulator';

const initialState = {
  userProfile: {
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    profileImage: null,
    dateOfBirth: null,
    address: '',
    createdAt: null,
    updatedAt: null,
  },
  activeServices: [],
  paymentMethods: [],
  isLoading: false,
  error: null,
  isUpdating: false,
  updateError: null,
};

export const fetchUserProfile = createAsyncThunk(
  'profile/fetchUserProfile',
  async (userId, { rejectWithValue }) => {
    try {
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        id: userId,
        firstName: 'Alice',
        lastName: 'Vardanyan',
        email: 'alice.vardanyan@example.com',
        phoneNumber: '+37412345678',
        profileImage: null,
        dateOfBirth: '1990-05-15',
        address: '6 Vratsakan st., ap XX',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'profile/updateUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        ...profileData,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

export const uploadProfileImage = createAsyncThunk(
  'profile/uploadProfileImage',
  async (imageData, { rejectWithValue }) => {
    try {
      console.log('📤 Uploading profile image...');
      
      const targetSize = imageSizeEnum.medium; 
      const [targetWidth, targetHeight] = targetSize.split('x').map(Number);
      
      console.log('🔄 Resizing profile image to', targetSize, 'on frontend...');
      console.log('📐 Target dimensions from enum:', targetWidth, 'x', targetHeight);
      
      let resizedImage;
      try {
        resizedImage = await ImageManipulator.manipulateAsync(
          imageData.uri,
          [
            { resize: { width: targetWidth, height: targetHeight } },
          ],
          {
            compress: 0.8,
            format: ImageManipulator.SaveFormat.JPEG, 
          }
        );
        console.log('✅ Profile image resized:', resizedImage.width, 'x', resizedImage.height);
      } catch (resizeError) {
        console.error('❌ Error resizing profile image:', resizeError);
        throw new Error(`Failed to resize image: ${resizeError?.message || 'Unknown error'}`);
      }

      const formData = new FormData();
      
      const filename = resizedImage.uri.split('/').pop() || 'avatar.jpg';
      const fileExtension = 'jpg'; 
      
      formData.append('file', {
        uri: resizedImage.uri,
        type: `image/jpeg`,
        name: `avatar.${fileExtension}`,
      });
      
      formData.append('source', entityTypeEnum.AVATAR);
      
      console.log('📤 Uploading profile image with source:', entityTypeEnum.AVATAR);
      
      const uploadResponse = await apiService.media.upload(formData);
      console.log('📥 Profile image upload response:', uploadResponse);
      
      let imageUrl = '';
      if (typeof uploadResponse === 'string') {
        imageUrl = uploadResponse;
      } else if (uploadResponse?.data) {
        if (typeof uploadResponse.data === 'string') {
          imageUrl = uploadResponse.data;
        } else {
          imageUrl = uploadResponse.data?.imageUrl || 
                   uploadResponse.data?.url || 
                   uploadResponse.data?.file || 
                   uploadResponse.data?.id || 
                   '';
        }
      } else if (uploadResponse?.imageUrl || uploadResponse?.url || uploadResponse?.file || uploadResponse?.id) {
        imageUrl = uploadResponse.imageUrl || 
                  uploadResponse.url || 
                  uploadResponse.file || 
                  uploadResponse.id;
      }

      if (!imageUrl) {
        throw new Error('Failed to get image URL from upload response');
      }

      console.log('✅ Profile image uploaded successfully:', imageUrl);
      
      return {
        profileImage: imageUrl,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Profile image upload error:', error);
      return rejectWithValue(error?.message || 'Failed to upload image');
    }
  }
);

export const fetchActiveServices = createAsyncThunk(
  'profile/fetchActiveServices',
  async (userId, { rejectWithValue }) => {
    try {
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [
        {
          id: 1,
          name: 'Smart Intercom',
          type: 'intercom',
          status: 'active',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          price: 5000,
          currency: 'AMD',
        },
        {
          id: 2,
          name: 'Elevator Access',
          type: 'elevator',
          status: 'active',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          price: 3000,
          currency: 'AMD',
        },
        {
          id: 3,
          name: 'Security Cameras',
          type: 'security',
          status: 'active',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          price: 2000,
          currency: 'AMD',
        },
      ];
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch active services');
    }
  }
);

export const fetchPaymentMethods = createAsyncThunk(
  'profile/fetchPaymentMethods',
  async (userId, { rejectWithValue }) => {
    try {
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [
        {
          id: 1,
          type: 'card',
          lastFour: '1234',
          brand: 'Visa',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true,
        },
        {
          id: 2,
          type: 'card',
          lastFour: '5678',
          brand: 'Mastercard',
          expiryMonth: 8,
          expiryYear: 2026,
          isDefault: false,
        },
      ];
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch payment methods');
    }
  }
);

export const changePassword = createAsyncThunk(
  'profile/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await apiService.user.changePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        newPasswordConfirm: passwordData.confirmPassword,
      });
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to change password');
    }
  }
);

export const deletePaymentMethod = createAsyncThunk(
  'profile/deletePaymentMethod',
  async (methodId, { rejectWithValue }) => {
    try {
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      return methodId;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete payment method');
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.updateError = null;
    },
    clearUpdateError: (state) => {
      state.updateError = null;
    },
    setProfileImage: (state, action) => {
      state.userProfile.profileImage = action.payload;
    },
    updateProfileField: (state, action) => {
      const { field, value } = action.payload;
      state.userProfile[field] = value;
    },
    resetProfile: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userProfile = action.payload;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isUpdating = true;
        state.updateError = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.userProfile = { ...state.userProfile, ...action.payload };
        state.updateError = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload;
      });

    builder
      .addCase(uploadProfileImage.pending, (state) => {
        state.isUpdating = true;
        state.updateError = null;
      })
      .addCase(uploadProfileImage.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.userProfile.profileImage = action.payload.profileImage;
        state.userProfile.updatedAt = action.payload.updatedAt;
        state.updateError = null;
      })
      .addCase(uploadProfileImage.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload;
      });

    builder
      .addCase(fetchActiveServices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActiveServices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeServices = action.payload;
        state.error = null;
      })
      .addCase(fetchActiveServices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchPaymentMethods.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.isLoading = false;
        state.paymentMethods = action.payload;
        state.error = null;
      })
      .addCase(fetchPaymentMethods.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(changePassword.pending, (state) => {
        state.isUpdating = true;
        state.updateError = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.updateError = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload;
      });

    builder
      .addCase(deletePaymentMethod.pending, (state) => {
        state.isUpdating = true;
        state.updateError = null;
      })
      .addCase(deletePaymentMethod.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.paymentMethods = state.paymentMethods.filter(
          method => method.id !== action.payload
        );
        state.updateError = null;
      })
      .addCase(deletePaymentMethod.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload;
      });
  },
});

export const {
  clearError,
  clearUpdateError,
  setProfileImage,
  updateProfileField,
  resetProfile,
} = profileSlice.actions;

export default profileSlice.reducer;
