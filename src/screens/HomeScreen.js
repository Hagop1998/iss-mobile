import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import ServiceBenefitsModal from '../components/ServiceBenefitsModal';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutUser } from '../store/slices/authSlice';

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
  const { user } = useAppSelector(state => state.auth);
  
  const [selectedTab, setSelectedTab] = useState('Home');
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [filteredAddresses, setFilteredAddresses] = useState(MOCK_ADDRESSES);
  const [selectedAddress, setSelectedAddress] = useState(MOCK_ADDRESSES[0]); // Default to first address

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

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity 
        style={[styles.tab, selectedTab === 'Home' && styles.activeTab]}
        onPress={() => setSelectedTab('Home')}
      >
        <Ionicons 
          name="home" 
          size={24} 
          color={selectedTab === 'Home' ? colors.white : colors.gray[400]} 
        />
        <Text style={[styles.tabText, selectedTab === 'Home' && styles.activeTabText]}>
          {t('home.title')}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab]}
        onPress={() => setSelectedTab('QR')}
      >
        <Ionicons name="qr-code" size={24} color={colors.gray[400]} />
        <Text style={styles.tabText}>{t('home.qrCodes')}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab]}
        onPress={() => {
          setSelectedTab('Services');
          navigation.navigate('Subscriptions');
        }}
      >
        <Ionicons name="shield-checkmark" size={24} color={colors.gray[400]} />
        <Text style={styles.tabText}>{t('home.services')}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab]}
        onPress={() => {
          setSelectedTab('Profile');
          navigation.navigate('Profile');
        }}
      >
        <View style={styles.profileIcon}>
          <Ionicons name="person" size={20} color={colors.white} />
        </View>
        <Text style={styles.tabText}>{t('home.profile')}</Text>
      </TouchableOpacity>
    </View>
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

      {renderTabBar()}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50], // Light grey background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.gray[50],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  locationCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 16,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
  },
  locationId: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  featuresContainer: {
    marginTop: 8,
    paddingBottom: 20,
  },
  featureCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  featureIconImage: {
    width: 40,
    height: 40,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  comingSoonBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  comingSoonText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.white,
  },
  profileIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.orange[500],
    justifyContent: 'center',
    alignItems: 'center',
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
  addressItemSelected: {
    backgroundColor: colors.primary + '10', // 10% opacity
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
  addressItemTitleSelected: {
    color: colors.primary,
    fontWeight: '600',
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

export default HomeScreen;
