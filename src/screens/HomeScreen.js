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
import { apiService } from '../services/api';
import { getServiceIcon, getServiceColor } from '../utils/serviceHelpers';
import { homeScreenStyles as styles } from '../styles/HomeScreen.styles';

// Import images
const smartLockerIcon = require('../../assets/smart_locker.png');
const elevatorIcon = require('../../assets/elavator.png');
const cameraIcon = require('../../assets/camera.png');
const barrierIcon = require('../../assets/barrier.png');


const HomeScreen = ({ navigation, route }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  
  // Get user from Redux state
  const { user, isAuthenticated, isLoading } = useAppSelector(state => state.auth);
  
  const [selectedTab, setSelectedTab] = useState('Home');
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [allSubscriptions, setAllSubscriptions] = useState([]); 

  useFocusEffect(
    React.useCallback(() => {
      const checkVerification = async () => {
        if (isAuthenticated && user?.token) {
          try {
            await dispatch(checkAuthStatus()).unwrap();
          } catch (error) {
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
      // User is verified only if isVerified === true AND status === 1
      const isVerified = (user.isVerified === true || user.isVerified === 'true') && (user.status === 1 || user.status === '1');
      
      console.log('🔍 HomeScreen - Verification Check:', {
        userId: user.id,
        email: user.email,
        isVerified: user.isVerified,
        status: user.status,
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
  }, [isAuthenticated, user, user?.isVerified, user?.status, navigation]);

  // Don't render content if user is not verified
  if (isAuthenticated && user) {
    const isVerified = (user.isVerified === true || user.isVerified === 'true') && user.status === 1;
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

  // Fetch owner's subscriptions - only if user has no subscription (user.userSubscription is null)
  useEffect(() => {
    const fetchOwnerSubscriptions = async () => {
      if (!user?.id) return;
      
      // If user has subscription (admin selected "yes"), don't fetch owner subscriptions
      if (user?.userSubscription != null) {
        setAllSubscriptions([]);
        return;
      }

      // If user has no subscription (admin selected "no"), fetch owner's subscriptions to show
      try {
        const allSubscriptionsResponse = await apiService.subscriptions.getSubscriptions();
        console.log('✅ All subscriptions (owner):', allSubscriptionsResponse);
        
        let allSubs = [];
        if (Array.isArray(allSubscriptionsResponse)) {
          allSubs = allSubscriptionsResponse;
        } else if (Array.isArray(allSubscriptionsResponse?.data)) {
          allSubs = allSubscriptionsResponse.data;
        } else if (Array.isArray(allSubscriptionsResponse?.results)) {
          allSubs = allSubscriptionsResponse.results;
        }
        
        setAllSubscriptions(allSubs);
        console.log(`✅ Loaded ${allSubs.length} owner subscriptions`);
      } catch (error) {
        console.warn('⚠️ Failed to fetch all subscriptions:', error);
        setAllSubscriptions([]);
      }
    };

    fetchOwnerSubscriptions();
  }, [user?.id, user?.userSubscription]);

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
      // Navigate to external camera live view
      navigation.navigate('ExternalCamera', { channel: 0, streamType: 0 });
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

  const renderLocationCard = () => {
    // Get address from userSubscription.device.address
    // Only show if user has subscription
    if (!user?.userSubscription?.device?.address) {
      return null; // Don't render address card if no subscription
    }
    
    const deviceAddress = user.userSubscription.device.address;
    const addressText = deviceAddress.address || '';
    const cityText = deviceAddress.city || '';
    const displayAddress = cityText ? `${addressText}, ${cityText}` : addressText;
    
    return (
      <View style={[styles.locationCard, styles.locationCardDisabled]}>
        <View style={styles.locationHeader}>
          <Ionicons name="location" size={24} color={colors.black} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationAddress}>{displayAddress || 'No address'}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Check if user has subscription from /auth/status response
  // If user.userSubscription exists → admin selected "yes" → enable features
  // If user.userSubscription is null/undefined → admin selected "no" → disable features
  const hasSubscription = user?.userSubscription != null;
  
  console.log('🔍 Subscription Check:', {
    hasUserSubscription: hasSubscription,
    userSubscription: user?.userSubscription ? {
      id: user.userSubscription.id,
      status: user.userSubscription.status,
      subscriptionId: user.userSubscription.subscriptionId,
      expireDate: user.userSubscription.expireDate,
    } : null,
  });
  
  const shouldDisableFeature = (title) => {
    // If user has no subscription (admin selected "no"), disable features
    if (!hasSubscription) {
      // Check against translated feature names
      const disabledFeatures = [
        t('home.smartIntercom'),
        t('home.elevator'),
        t('home.surveillanceCameras'),
        t('home.barrier')
      ];
      return disabledFeatures.includes(title);
    }
    return false;
  };

  const renderFeatureCard = (iconSource, title, subtitle, isComingSoon = false) => {
    const isDisabled = shouldDisableFeature(title);
    
    return (
    <TouchableOpacity 
      style={[styles.featureCard, isDisabled && styles.featureCardDisabled]} 
      onPress={() => {
        if (!isComingSoon && !isDisabled) {
          handleFeaturePress(title);
        } else if (isDisabled) {
          Alert.alert(
            t('home.noSubscription'),
            t('home.contactOwnerMessage')
          );
        }
      }}
      disabled={isComingSoon || isDisabled}
    >
      <View style={styles.featureContent}>
        <View style={[styles.featureIcon, isDisabled && styles.featureIconDisabled]}>
          {iconSource ? (
            <Image 
              source={iconSource} 
              style={[styles.featureIconImage, isDisabled && styles.featureIconImageDisabled]}
              resizeMode="contain"
              onError={(error) => {
                console.error('Image load error:', error.nativeEvent.error);
              }}
            />
          ) : (
            <Ionicons name="settings" size={24} color={isDisabled ? colors.gray[400] : colors.black} />
          )}
          {isDisabled && (
            <View style={styles.lockIconOverlay}>
              <Ionicons name="lock-closed" size={20} color={colors.gray[500]} />
            </View>
          )}
        </View>
        <View style={styles.featureText}>
          <Text style={[styles.featureTitle, isDisabled && styles.featureTitleDisabled]}>{title}</Text>
          {subtitle && <Text style={[styles.featureSubtitle, isDisabled && styles.featureSubtitleDisabled]}>{subtitle}</Text>}
        </View>
        {isComingSoon ? (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>{t('home.comingSoon')}</Text>
          </View>
        ) : isDisabled ? (
          <Ionicons name="lock-closed" size={20} color={colors.gray[400]} />
        ) : (
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        )}
      </View>
    </TouchableOpacity>
    );
  };


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
        
        {/* Show message and owner subscriptions if user has no subscription */}
        {!hasSubscription && allSubscriptions.length > 0 && (
          <View style={styles.noSubscriptionContainer}>
            <View style={styles.messageBanner}>
              <Ionicons name="information-circle" size={24} color={colors.primary} />
              <View style={styles.messageContent}>
                <Text style={styles.messageTitle}>{t('home.noSubscription')}</Text>
                <Text style={styles.messageText}>{t('home.contactOwnerMessage')}</Text>
              </View>
            </View>
            
            <View style={styles.ownerSubscriptionsContainer}>
              <Text style={styles.ownerSubscriptionsTitle}>{t('home.ownerSubscriptions')}</Text>
              {allSubscriptions.map((subscription) => {
                const serviceName = subscription.name || subscription.service_name || 'Service';
                const serviceIcon = getServiceIcon(serviceName);
                const serviceColor = getServiceColor(serviceName);
                
                return (
                  <View key={subscription.id} style={styles.ownerSubscriptionCard}>
                    <View style={[styles.ownerSubscriptionIcon, { backgroundColor: serviceColor + '20' }]}>
                      <Ionicons name={serviceIcon} size={24} color={serviceColor} />
                    </View>
                    <View style={styles.ownerSubscriptionInfo}>
                      <Text style={styles.ownerSubscriptionName}>{serviceName}</Text>
                      {subscription.description && (
                        <Text style={styles.ownerSubscriptionDescription}>{subscription.description}</Text>
                      )}
                    </View>
                    <View style={styles.ownerSubscriptionBadge}>
                      <Ionicons name="lock-closed" size={16} color={colors.gray[500]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
        
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
    </SafeAreaView>
  );
};


export default HomeScreen;
