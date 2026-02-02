import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchUserProfile, updateUserProfile, uploadProfileImage, clearUpdateError } from '../store/slices/profileSlice';
import { updateUserData, checkAuthStatus } from '../store/slices/authSlice';
import { apiClient, apiService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { validateEmail } from '../utils/validation';

const PersonalInformationScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  
  const { user, isLoading } = useAppSelector(state => state.auth);
  const { userProfile, isUpdating, updateError } = useAppSelector(state => state.profile);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user?.token) {
      apiClient.setAuthToken(user.token);
      dispatch(checkAuthStatus()).unwrap().catch(() => {});
      if (user?.id) {
        dispatch(fetchUserProfile(user.id));
      }
    } else {
      Alert.alert('Error', 'Session expired. Please login again.');
    }
  }, [dispatch, user?.id, user?.token]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phone || '',
      });
    } else if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || '',
        phoneNumber: userProfile.phoneNumber || '',
        address: userProfile.address || '',
      });
    }
  }, [user, userProfile]);

  useEffect(() => {
    if (updateError) {
      Alert.alert(t('common.error'), updateError);
      dispatch(clearUpdateError());
    }
  }, [updateError, t, dispatch]);

  useEffect(() => {
    // Check for avatar in multiple possible locations
    const avatarUrl = user?.avatar || user?.profileImage || userProfile?.profileImage || userProfile?.avatar;
    if (avatarUrl) {
      setProfileImage(avatarUrl);
    }
  }, [user?.avatar, user?.profileImage, userProfile?.profileImage, userProfile?.avatar]);


  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    // Validate email if it's being edited
    if (formData.email && !validateEmail(formData.email)) {
      Alert.alert(
        t('common.error'),
        t('signUp.errors.invalidEmail') || 'Please enter a valid email address ending with .com'
      );
      return;
    }
    
    try {
      const updatePayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phoneNumber,
        // Address is read-only, don't include it in update
      };

      await dispatch(updateUserData({ 
        userId: user.id, 
        userData: updatePayload 
      })).unwrap();
      
      setIsEditing(false);
      Alert.alert(t('common.success'), t('profile.profileUpdated'));
    } catch (error) {
      Alert.alert(t('common.error'), error || t('profile.updateFailed'));
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phone || '',
      });
    } else if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || '',
        phoneNumber: userProfile.phoneNumber || '',
      });
    }
    setIsEditing(false);
  };

  const handleImagePicker = () => {
    Alert.alert(
      t('profile.selectImage'),
      t('profile.selectImageSource'),
      [
        { text: t('profile.cancel'), style: 'cancel' },
        { text: t('profile.camera'), onPress: () => handleImageSelection('camera') },
        { text: t('profile.gallery'), onPress: () => handleImageSelection('gallery') },
      ]
    );
  };

  const handleImageSelection = async (source) => {
    try {
      let result;
      
      if (source === 'camera') {
        const { status } = await Camera.requestCameraPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            t('common.error'),
            'Camera permission is required to take photos. Please enable camera access in your device settings.'
          );
          return;
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        if (Platform.OS !== 'web') {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          
          if (status !== 'granted') {
            Alert.alert(
              t('common.error'),
              'Gallery permission is required to select photos. Please enable gallery access in your device settings.'
            );
            return;
          }
        }

        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        // Show temporary preview
        setProfileImage(selectedImage.uri);
        
        try {
          const uploadResult = await dispatch(uploadProfileImage({ 
            uri: selectedImage.uri,
            type: selectedImage.type || 'image',
            fileName: selectedImage.fileName || 'profile.jpg'
          })).unwrap();
          
          // Update profile image with the URL from server
          if (uploadResult?.profileImage) {
            setProfileImage(uploadResult.profileImage);
          }
          
          // Refresh user data to get updated avatar
          await dispatch(checkAuthStatus()).unwrap();
          
          Alert.alert(t('common.success'), t('profile.imageUpdated'));
        } catch (uploadError) {
          // Revert to original image
          const originalImage = userProfile?.profileImage || user?.profileImage || user?.avatar;
          setProfileImage(originalImage);
          Alert.alert(t('common.error'), uploadError || t('profile.imageUpdateFailed'));
        }
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to select image. Please try again.');
    }
  };

  const renderProfileImage = () => {
    const imageUri = profileImage || userProfile?.profileImage || user?.profileImage;
    
    return (
      <View style={styles.profileImageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.profileImage} />
        ) : (
          <View style={styles.defaultProfileImage}>
            <Ionicons name="person" size={40} color={colors.white} />
          </View>
        )}
        <TouchableOpacity style={styles.editImageButton} onPress={handleImagePicker}>
          <Ionicons name="camera" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderFormField = (field, label, keyboardType = 'default') => (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>
        {label} {isEditing && <Text style={styles.editingIndicator}>(editing)</Text>}
      </Text>
      <TextInput
        style={[
          styles.formInput,
          !isEditing && styles.formInputDisabled,
          isEditing && styles.formInputEditing
        ]}
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        keyboardType={keyboardType}
        editable={isEditing}
        placeholder={isEditing ? `Enter ${label.toLowerCase()}` : label}
        placeholderTextColor={isEditing ? colors.gray[400] : colors.gray[300]}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.personalInformation')}</Text>
        <TouchableOpacity 
          onPress={isEditing ? handleSave : handleEdit}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>
            {isEditing ? t('profile.save') : t('profile.edit')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          {renderProfileImage()}
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading user data from server...</Text>
            </View>
          )}
          
          <View style={styles.form}>
            {renderFormField('firstName', t('profile.firstName'))}
            {renderFormField('lastName', t('profile.lastName'))}
            {renderFormField('email', t('profile.email'), 'email-address')}
            {renderFormField('phoneNumber', t('profile.phoneNumber'), 'phone-pad')}
          </View>

          {isEditing && (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>{t('profile.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]} 
                onPress={handleSave}
                disabled={isUpdating}
              >
                <Text style={styles.saveButtonText}>
                  {isUpdating ? t('common.loading') : t('profile.save')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  profileSection: {
    paddingVertical: 24,
  },
  loadingContainer: {
    padding: 16,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  form: {
    marginBottom: 24,
  },
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 8,
  },
  editingIndicator: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.primary,
    fontStyle: 'italic',
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.white,
  },
  formInputDisabled: {
    backgroundColor: colors.gray[50],
    color: colors.text.secondary,
    borderColor: colors.gray[200],
  },
  formInputEditing: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.white,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[300],
    marginRight: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  saveButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '500',
  },
});

export default PersonalInformationScreen;
