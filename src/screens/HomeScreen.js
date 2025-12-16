import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import ServiceBenefitsModal from '../components/ServiceBenefitsModal';
import TabBar from '../components/TabBar';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutUser, checkAuthStatus } from '../store/slices/authSlice';
import { homeScreenStyles as styles } from '../styles/HomeScreen.styles';

// Import images
const smartLockerIcon = require('../../assets/smart_locker.png');
const elevatorIcon = require('../../assets/elavator.png');
const cameraIcon = require('../../assets/camera.png');
const barrierIcon = require('../../assets/barrier.png');

// Mock addresses data
const MOCK_ADDRESSES = [
  { id: 1, address: 'Vratsakan 6', city: 'Yerevan', apartmentId: '123456' },
  { id: 2, address: 'Kanaker Zeytun 1', city: 'Yerevan', apartmentId: '234567' },
  { id: 3, address: 'Komitas 30', city: 'Yerevan', apartmentId: '345678' },
  { id: 4, address: 'Artsakh 16', city: 'Yerevan', apartmentId: '456789' },
];

const HomeScreen = ({ navigation, route }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  
  // Get user from Redux state
  const { user, isAuthenticated, isLoading } = useAppSelector(state => state.auth);
  
  const [selectedTab, setSelectedTab] = useState('Home');
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [filteredAddresses, setFilteredAddresses] = useState(MOCK_ADDRESSES);
  const [selectedAddress, setSelectedAddress] = useState(MOCK_ADDRESSES[0]); // Default to first address

  // Check verification status whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const checkVerification = async () => {
        if (isAuthenticated && user?.token) {
          // Refresh auth status to get latest isVerified value
          try {
            await dispatch(checkAuthStatus()).unwrap();
          } catch (error) {
            // Silently handle errors - don't spam console
            // The verification check will use the current user state anyway
            const errorMessage = error?.message || String(error);
            if (!errorMessage.includes('Internal server error')) {
              console.warn('⚠️ Could not refresh auth status:', errorMessage);
            }
          }
        }
      };
      
      checkVerification();
    }, [dispatch, isAuthenticated, user?.token])
  );

  // Check if user is verified, redirect to PendingVerification if not
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check isVerified explicitly - handle both boolean false and string "false"
      const isVerified = user.isVerified === true || user.isVerified === 'true';
      
      console.log('🔍 HomeScreen - Verification Check:', {
        userId: user.id,
        email: user.email,
        isVerified: user.isVerified,
        isVerifiedType: typeof user.isVerified,
        verified: isVerified,
      });
      
      if (!isVerified) {
        console.log('❌ User is not verified, redirecting to PendingVerification');
        // Immediately redirect if not verified
        navigation.reset({
          index: 0,
          routes: [{ name: 'PendingVerification' }],
        });
      } else {
        console.log('✅ User is verified, allowing access to Home');
      }
    }
  }, [isAuthenticated, user, user?.isVerified, navigation]);

  // Don't render content if user is not verified
  if (isAuthenticated && user) {
    const isVerified = user.isVerified === true || user.isVerified === 'true';
    if (!isVerified) {
      console.log('⏳ Blocking HomeScreen render - user not verified');
      return null; // Return null while redirecting
    }
  }

  // Update selected address when user data changes
  useEffect(() => {
    if (user?.bio) {
      setSelectedAddress({
        id: user.id,
        address: user.bio,
        city: '',
        apartmentId: user.id?.toString() || '000000'
      });
    }
  }, [user?.bio, user?.id]);

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
  };

  const handleLogout = () => {
    Alert.alert(
      t('home.logout'),
      t('home.logoutConfirm'),
      [
        { text: t('home.cancel'), style: 'cancel' },
        { 
          text: t('home.logout'), 
          style: 'destructive',
          onPress: async () => {
            await dispatch(logoutUser());
            navigation.reset({
              index: 0,
              routes: [{ name: 'SignIn' }],
            });
          }
        }
      ]
    );
  };

  const handleFeaturePress = (feature) => {
    if (feature === 'Smart Intercom') {
      navigation.navigate('SmartIntercom');
    } else if (feature === 'Elevator') {
      navigation.navigate('Elevator');
    } else if (feature === 'Surveillance Cameras') {
      // Navigate to camera live view
      navigation.navigate('Camera');
    } else if (feature === 'Barrier') {
      // Navigate to QR code generation for Barrier (same as Elevator)
      navigation.navigate('AccessByQRCode', { service: 'barrier' });
    } else {
      Alert.alert(feature, `${feature} feature coming soon!`);
    }
  };

  const handleContinueToService = () => {
    if (selectedService === 'smart_intercom' || selectedService === 'elevator' || selectedService === 'barrier') {
      // Navigate to QR code generation for these services
      navigation.navigate('AccessByQRCode', { service: selectedService });
    } else {
      // For other services, show coming soon message
      Alert.alert(
        'Surveillance Cameras',
        'Surveillance Cameras feature coming soon!'
      );
    }
  };

  const handleCloseBenefitsModal = () => {
    setShowBenefitsModal(false);
    setSelectedService(null);
  };

  // Address search and filter
  useEffect(() => {
    if (addressSearchQuery === '') {
      setFilteredAddresses(MOCK_ADDRESSES);
    } else {
      const filtered = MOCK_ADDRESSES.filter(item =>
        item.address.toLowerCase().includes(addressSearchQuery.toLowerCase()) ||
        item.city.toLowerCase().includes(addressSearchQuery.toLowerCase()) ||
        item.apartmentId.includes(addressSearchQuery)
      );
      setFilteredAddresses(filtered);
    }
  }, [addressSearchQuery]);

  const handleAddressSelect = (address) => {
    console.log('📍 Address selected:', address.address);
    setSelectedAddress(address);
    setShowAddressModal(false);
    setAddressSearchQuery('');
  };

  const handleOpenAddressModal = () => {
    console.log('📍 Opening address selector modal');
    setShowAddressModal(true);
  };

  const handleCloseAddressModal = () => {
    setShowAddressModal(false);
    setAddressSearchQuery('');
  };

  const renderLocationCard = () => {
    // Use user's actual address from profile, fallback to selected address
    const userAddress = user?.bio || user?.address;
    const displayAddress = userAddress || selectedAddress.address || 'No address';
    const apartmentId = user?.id || selectedAddress.apartmentId || '000000';
    
    return (
      <TouchableOpacity style={styles.locationCard} onPress={handleOpenAddressModal}>
        <View style={styles.locationHeader}>
          <Ionicons name="location" size={24} color={colors.black} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationAddress}>{displayAddress}</Text>
            <Text style={styles.locationId}>ID: {apartmentId}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderFeatureCard = (iconSource, title, subtitle, isComingSoon = false) => (
    <TouchableOpacity 
      style={styles.featureCard} 
      onPress={() => !isComingSoon && handleFeaturePress(title)}
      disabled={isComingSoon}
    >
      <View style={styles.featureContent}>
        <View style={styles.featureIcon}>
          {iconSource ? (
            <Image 
              source={iconSource} 
              style={styles.featureIconImage}
              resizeMode="contain"
              onError={(error) => {
                console.error('Image load error:', error.nativeEvent.error);
              }}
            />
          ) : (
            <Ionicons name="settings" size={24} color={colors.black} />
          )}
        </View>
        <View style={styles.featureText}>
          <Text style={styles.featureTitle}>{title}</Text>
          {subtitle && <Text style={styles.featureSubtitle}>{subtitle}</Text>}
        </View>
        {isComingSoon ? (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>{t('home.comingSoon')}</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        )}
      </View>
    </TouchableOpacity>
  );


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('home.title')}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="notifications" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderLocationCard()}
        
        <View style={styles.featuresContainer}>
          {renderFeatureCard(smartLockerIcon, t('home.smartIntercom'))}
          {renderFeatureCard(elevatorIcon, t('home.elevator'), 'With profile picture')}
          {renderFeatureCard(cameraIcon, t('home.surveillanceCameras'))}
          {renderFeatureCard(barrierIcon, t('home.barrier'))}
        </View>
      </ScrollView>

      <TabBar activeTab={selectedTab} onTabPress={setSelectedTab} navigation={navigation} />

      <ServiceBenefitsModal
        visible={showBenefitsModal}
        onClose={handleCloseBenefitsModal}
        onContinue={handleContinueToService}
        service={selectedService}
      />

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
                placeholder="Search address or ID..."
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
            <FlatList
              data={filteredAddresses}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.addressItem,
                    selectedAddress.id === item.id && styles.addressItemSelected
                  ]}
                  onPress={() => handleAddressSelect(item)}
                >
                  <Ionicons 
                    name="location" 
                    size={20} 
                    color={selectedAddress.id === item.id ? colors.primary : colors.text.primary} 
                  />
                  <View style={styles.addressItemText}>
                    <Text style={[
                      styles.addressItemTitle,
                      selectedAddress.id === item.id && styles.addressItemTitleSelected
                    ]}>
                      {item.address}
                    </Text>
                    <Text style={styles.addressItemSubtitle}>
                      {item.city} • ID: {item.apartmentId}
                    </Text>
                  </View>
                  {selectedAddress.id === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyListContainer}>
                  <Ionicons name="location-outline" size={48} color={colors.gray[300]} />
                  <Text style={styles.emptyListText}>No addresses found</Text>
                  <Text style={styles.emptyListSubtext}>Try a different search term</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


export default HomeScreen;
