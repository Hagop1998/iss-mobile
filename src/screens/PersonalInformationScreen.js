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
  Modal,
  FlatList,
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

const PersonalInformationScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  
  // Redux state
  const { user, isLoading } = useAppSelector(state => state.auth);
  const { userProfile, isUpdating, updateError } = useAppSelector(state => state.profile);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [filteredAddresses, setFilteredAddresses] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  // Fetch latest user data from /auth/status when screen loads
  useEffect(() => {
    console.log('🔄 PersonalInformationScreen mounted - fetching user data from /auth/status');
    console.log('Current user state:', { 
      hasUser: !!user, 
      userId: user?.id, 
      hasToken: !!user?.token,
      tokenLength: user?.token?.length 
    });
    
    // IMPORTANT: Ensure token is set in API client before making requests
    if (user?.token) {
      console.log('✅ Setting token in API client...');
      apiClient.setAuthToken(user.token);
      console.log('Token set successfully, now calling /auth/status');
      
      // Call /auth/status to get latest user data
      dispatch(checkAuthStatus())
        .unwrap()
        .then((response) => {
          console.log('✅ User data fetched from /auth/status:', response);
        })
        .catch((error) => {
          console.error('❌ Failed to fetch user data:', error);
        });
      
      // Also fetch user profile
      if (user?.id) {
        dispatch(fetchUserProfile(user.id));
      }
    } else {
      console.error('❌ No token found in user state! Cannot fetch data.');
      console.error('User object:', JSON.stringify(user, null, 2));
      Alert.alert('Error', 'Session expired. Please login again.');
    }
  }, [dispatch, user?.id, user?.token]);

  useEffect(() => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📝 Populating Form Fields with User Data');
    console.log('═══════════════════════════════════════════════════════════');
    
    // Initialize form data from auth user state (most up-to-date from /auth/status)
    if (user) {
      console.log('✅ Using data from auth state (from /auth/status):');
      console.log('  • First Name:', user.firstName || '(empty)');
      console.log('  • Last Name:', user.lastName || '(empty)');
      console.log('  • Email:', user.email || '(empty)');
      console.log('  • Phone:', user.phone || '(empty)');
      console.log('  • Bio:', user.bio || '(empty)');
      
      const newFormData = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phone || '',
        address: user.bio || '',
      };
      
      console.log('📋 Form data to be populated:', newFormData);
      setFormData(newFormData);
      console.log('✅ Form fields populated successfully!');
    } else if (userProfile) {
      // Fallback to profile data if user state not available
      console.log('⚠️ Using fallback data from profile state:');
      console.log('  • First Name:', userProfile.firstName || '(empty)');
      console.log('  • Last Name:', userProfile.lastName || '(empty)');
      console.log('  • Email:', userProfile.email || '(empty)');
      console.log('  • Phone:', userProfile.phoneNumber || '(empty)');
      console.log('  • Address:', userProfile.address || '(empty)');
      
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || '',
        phoneNumber: userProfile.phoneNumber || '',
        address: userProfile.address || '',
      });
    } else {
      console.log('⚠️ No user data available yet');
    }
    console.log('═══════════════════════════════════════════════════════════');
  }, [user, userProfile]);

  useEffect(() => {
    if (updateError) {
      Alert.alert(t('common.error'), updateError);
      dispatch(clearUpdateError());
    }
  }, [updateError, t, dispatch]);

  // Sync profile image from backend
  useEffect(() => {
    if (userProfile?.profileImage) {
      setProfileImage(userProfile.profileImage);
    } else if (user?.profileImage) {
      setProfileImage(user.profileImage);
    }
  }, [userProfile?.profileImage, user?.profileImage]);

  // Fetch addresses from API
  const fetchAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      console.log('📍 Fetching addresses from API...');
      
      const response = await apiService.address.getAddresses();
      console.log('✅ Addresses fetched:', response);
      
      // Handle paginated response format
      let addressData = [];
      if (response?.results && Array.isArray(response.results)) {
        addressData = response.results;
      } else if (response?.data?.results && Array.isArray(response.data.results)) {
        addressData = response.data.results;
      } else if (Array.isArray(response?.data)) {
        addressData = response.data;
      } else if (Array.isArray(response)) {
        addressData = response;
      }
      
      setAddresses(addressData);
      setFilteredAddresses(addressData);
      
      console.log(`✅ Loaded ${addressData.length} addresses`);
    } catch (error) {
      console.error('❌ Failed to fetch addresses:', error);
      Alert.alert(
        t('common.error'),
        'Failed to load addresses. Please try again.'
      );
      setAddresses([]);
      setFilteredAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Address search and filter
  useEffect(() => {
    // Safety check: ensure addresses is an array
    const addressList = Array.isArray(addresses) ? addresses : [];
    
    if (addressSearchQuery === '') {
      setFilteredAddresses(addressList);
    } else {
      const filtered = addressList.filter(item => {
        const searchLower = addressSearchQuery.toLowerCase();
        // Support different field names the API might return
        const address = item.address || item.street || item.name || '';
        const city = item.city || item.location || '';
        const description = item.description || '';
        
        return (
          address.toLowerCase().includes(searchLower) ||
          city.toLowerCase().includes(searchLower) ||
          description.toLowerCase().includes(searchLower)
        );
      });
      setFilteredAddresses(filtered);
    }
  }, [addressSearchQuery, addresses]);

  const handleAddressSelect = (selectedAddress) => {
    // Support different field names the API might return
    const address = selectedAddress.address || selectedAddress.street || selectedAddress.name || '';
    const city = selectedAddress.city || selectedAddress.location || '';
    const fullAddress = city ? `${address}, ${city}` : address;
    
    console.log('📍 Address selected:', fullAddress);
    setFormData(prev => ({ ...prev, address: fullAddress }));
    setShowAddressModal(false);
    setAddressSearchQuery('');
  };

  const handleOpenAddressModal = async () => {
    if (isEditing) {
      console.log('📍 Opening address selector modal');
      setShowAddressModal(true);
      
      // Fetch addresses if not already loaded
      if (addresses.length === 0) {
        await fetchAddresses();
      }
    }
  };

  const handleCloseAddressModal = () => {
    setShowAddressModal(false);
    setAddressSearchQuery('');
  };

  const handleEdit = () => {
    console.log('✏️ Edit button pressed - enabling editing mode');
    setIsEditing(true);
  };

  const handleSave = async () => {
    console.log('💾 Saving user profile...');
    console.log('User ID:', user?.id);
    console.log('Form data to save:', formData);
    
    try {
      // Use PATCH /users/{id} endpoint
      const updatePayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phoneNumber,
        bio: formData.address, // Using address field as bio for now
      };
      
      console.log('Update payload:', updatePayload);
      
      await dispatch(updateUserData({ 
        userId: user.id, 
        userData: updatePayload 
      })).unwrap();
      
      setIsEditing(false);
      Alert.alert(t('common.success'), t('profile.profileUpdated'));
      console.log('✅ Profile updated successfully!');
    } catch (error) {
      console.error('❌ Failed to update profile:', error);
      Alert.alert(t('common.error'), error || t('profile.updateFailed'));
    }
  };

  const handleCancel = () => {
    console.log('❌ Cancel pressed - restoring original data');
    // Restore from user state (most up-to-date)
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phone || '',
        address: user.bio || '',
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
        // Request camera permissions
        const { status } = await Camera.requestCameraPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            t('common.error'),
            'Camera permission is required to take photos. Please enable camera access in your device settings.'
          );
          return;
        }

        // Launch camera
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        // Request gallery permissions
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

        // Launch image picker
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      // Check if user cancelled
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        console.log('📸 Image selected:', selectedImage.uri);
        
        // Update local state immediately for UI feedback
        setProfileImage(selectedImage.uri);
        
        // Upload to backend
        try {
          await dispatch(uploadProfileImage({ 
            uri: selectedImage.uri,
            type: selectedImage.type || 'image',
            fileName: selectedImage.fileName || 'profile.jpg'
          })).unwrap();
          
          Alert.alert(t('common.success'), t('profile.imageUpdated'));
          console.log('✅ Profile image uploaded successfully');
        } catch (uploadError) {
          console.error('❌ Failed to upload image:', uploadError);
          Alert.alert(t('common.error'), uploadError || t('profile.imageUpdateFailed'));
          // Revert local state if upload fails
          setProfileImage(userProfile.profileImage);
        }
      } else {
        console.log('📸 Image selection cancelled');
      }
    } catch (error) {
      console.error('❌ Image selection error:', error);
      Alert.alert(t('common.error'), 'Failed to select image. Please try again.');
    }
  };

  const renderProfileImage = () => {
    // Use local state first, fallback to userProfile
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
            
            {/* Address Selector Field */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>
                {t('profile.address')} {isEditing && <Text style={styles.editingIndicator}>(editing)</Text>}
              </Text>
              <TouchableOpacity
                style={[
                  styles.formInput,
                  styles.addressSelector,
                  !isEditing && styles.formInputDisabled,
                  isEditing && styles.formInputEditing
                ]}
                onPress={handleOpenAddressModal}
                disabled={!isEditing}
              >
                <Text style={[
                  styles.addressText,
                  !formData.address && styles.placeholderText
                ]}>
                  {formData.address || (isEditing ? 'Select address' : 'No address')}
                </Text>
                {isEditing && (
                  <Ionicons name="chevron-down" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
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

      {/* Address Selection Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseAddressModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Address</Text>
              <TouchableOpacity onPress={handleCloseAddressModal}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.gray[400]} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search address..."
                value={addressSearchQuery}
                onChangeText={setAddressSearchQuery}
                autoFocus={true}
              />
              {addressSearchQuery !== '' && (
                <TouchableOpacity onPress={() => setAddressSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
                </TouchableOpacity>
              )}
            </View>

            {/* Address List */}
            {isLoadingAddresses ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading addresses...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredAddresses}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={({ item }) => {
                  // Support different field names the API might return
                  const address = item.address || item.street || item.name || 'Unknown Address';
                  const city = item.city || item.location || '';
                  
                  return (
                    <TouchableOpacity
                      style={styles.addressItem}
                      onPress={() => handleAddressSelect(item)}
                    >
                      <Ionicons name="location" size={20} color={colors.primary} />
                      <View style={styles.addressItemText}>
                        <Text style={styles.addressItemTitle}>{address}</Text>
                        {city && <Text style={styles.addressItemSubtitle}>{city}</Text>}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={() => (
                  <View style={styles.emptyListContainer}>
                    <Ionicons name="location-outline" size={48} color={colors.gray[300]} />
                    <Text style={styles.emptyListText}>
                      {addressSearchQuery ? 'No addresses found' : 'No addresses available'}
                    </Text>
                    <Text style={styles.emptyListSubtext}>
                      {addressSearchQuery ? 'Try a different search term' : 'Addresses will appear here when available'}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
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
  // Address Selector Styles
  addressSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressText: {
    fontSize: 16,
    color: colors.text.primary,
    flex: 1,
  },
  placeholderText: {
    color: colors.gray[400],
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  // Address List Styles
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  addressItemText: {
    flex: 1,
    marginLeft: 12,
  },
  addressItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 4,
  },
  addressItemSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  // Empty List Styles
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyListText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.secondary,
    marginTop: 16,
  },
  emptyListSubtext: {
    fontSize: 14,
    color: colors.gray[400],
    marginTop: 8,
  },
});

export default PersonalInformationScreen;
