import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchUserProfile, fetchActiveServices, fetchPaymentMethods } from '../store/slices/profileSlice';
import { logoutUser } from '../store/slices/authSlice';
import { setLanguage, showModal, hideModal } from '../store/slices/appSlice';
import { useAuth } from '../hooks/useAuth';
import LanguageSelectorModal from '../components/LanguageSelectorModal';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const ProfileScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, verifyAuthStatus } = useAuth();
  const { userProfile, activeServices, paymentMethods, isLoading } = useAppSelector(state => state.profile);
  const { language, modals } = useAppSelector(state => state.app);
  
  const [selectedTab, setSelectedTab] = useState('Profile');
  
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserProfile(user.id));
      dispatch(fetchActiveServices(user.id));
      dispatch(fetchPaymentMethods(user.id));
    } else {
      console.warn('⚠️ No user ID available, skipping profile fetch');
    }
  }, [user?.id, dispatch]);

  const handlePersonalInformation = () => {
    navigation.navigate('PersonalInformation');
  };

  const handleActiveServices = () => {
    navigation.navigate('ActiveServices');
  };

  const handlePaymentMethods = () => {
    navigation.navigate('PaymentMethods');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleFamilyMembers = () => {
    navigation.navigate('FamilyMembers');
  };

  const handleLanguageChange = () => {
    dispatch(showModal({ modalName: 'languageSelector' }));
  };

  const handleLanguageSelect = (languageCode) => {
    i18n.changeLanguage(languageCode);
    dispatch(setLanguage(languageCode));
  };

  const handleCloseLanguageModal = () => {
    dispatch(hideModal({ modalName: 'languageSelector' }));
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('profile.cancel'), style: 'cancel' },
        { 
          text: t('profile.logout'), 
          style: 'destructive',
          onPress: () => {
            dispatch(logoutUser());
            navigation.reset({
              index: 0,
              routes: [{ name: 'SignUp' }],
            });
          }
        }
      ]
    );
  };

  // Support/Contact functions
  const SUPPORT_PHONE = '+37441051020';
  const SUPPORT_PHONE_CLEAN = '37441051020'; // Without + for some apps

  const handleCall = async () => {
    const phoneUrl = `tel:${SUPPORT_PHONE}`;
    try {
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert(t('profile.support.error'), t('profile.support.cannotMakeCall'));
      }
    } catch (error) {
      console.error('Error opening phone:', error);
      Alert.alert(t('profile.support.error'), t('profile.support.cannotMakeCall'));
    }
  };

  const handleWhatsApp = async () => {
    const whatsappUrl = `whatsapp://send?phone=${SUPPORT_PHONE_CLEAN}`;
    const whatsappWebUrl = `https://wa.me/${SUPPORT_PHONE_CLEAN}`;
    
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web version
        await Linking.openURL(whatsappWebUrl);
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      Alert.alert(
        t('profile.support.error'),
        t('profile.support.whatsappNotInstalled')
      );
    }
  };

  const handleViber = async () => {
    const viberUrl = `viber://chat?number=${SUPPORT_PHONE_CLEAN}`;
    const viberPublicUrl = `viber://public?number=${SUPPORT_PHONE_CLEAN}`;
    
    try {
      const canOpen = await Linking.canOpenURL(viberUrl);
      if (canOpen) {
        await Linking.openURL(viberUrl);
      } else {
        // Try public chat
        const canOpenPublic = await Linking.canOpenURL(viberPublicUrl);
        if (canOpenPublic) {
          await Linking.openURL(viberPublicUrl);
        } else {
          Alert.alert(
            t('profile.support.error'),
            t('profile.support.viberNotInstalled')
          );
        }
      }
    } catch (error) {
      console.error('Error opening Viber:', error);
      Alert.alert(
        t('profile.support.error'),
        t('profile.support.viberNotInstalled')
      );
    }
  };

  const handleTelegram = async () => {
    // Telegram uses phone number in format: tg://resolve?phone=37441051020
    const telegramUrl = `tg://resolve?phone=${SUPPORT_PHONE_CLEAN}`;
    const telegramWebUrl = `https://t.me/${SUPPORT_PHONE_CLEAN}`;
    
    try {
      const canOpen = await Linking.canOpenURL(telegramUrl);
      if (canOpen) {
        await Linking.openURL(telegramUrl);
      } else {
        // Fallback to web version
        await Linking.openURL(telegramWebUrl);
      }
    } catch (error) {
      console.error('Error opening Telegram:', error);
      Alert.alert(
        t('profile.support.error'),
        t('profile.support.telegramNotInstalled')
      );
    }
  };

  const handleSupport = () => {
    Alert.alert(
      t('profile.support.title'),
      t('profile.support.chooseMethod'),
      [
        {
          text: t('profile.support.whatsapp'),
          onPress: handleWhatsApp,
        },
        {
          text: t('profile.support.viber'),
          onPress: handleViber,
        },
        {
          text: t('profile.support.telegram'),
          onPress: handleTelegram,
        },
        {
          text: t('profile.support.call'),
          onPress: handleCall,
        },
        {
          text: t('profile.cancel') || t('common.cancel') || 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const renderProfileHeader = () => {
    // Use user data from auth state (most up-to-date), fallback to userProfile
    const firstName = user?.firstName || userProfile?.firstName || '';
    const lastName = user?.lastName || userProfile?.lastName || '';
    const profileImage = user?.profileImage || userProfile?.profileImage;
    const displayName = firstName && lastName ? `${firstName} ${lastName}` : user?.email || 'User';
    
    return (
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.defaultProfileImage}>
              <Ionicons name="person" size={40} color={colors.white} />
            </View>
          )}
        </View>
        <Text style={styles.profileName}>
          {displayName}
        </Text>
      </View>
    );
  };

  const renderProfileOption = (icon, title, subtitle, onPress, badge = null) => (
    <TouchableOpacity style={styles.profileOption} onPress={onPress}>
      <View style={styles.profileOptionContent}>
        <View style={styles.profileOptionIcon}>
          <Ionicons name={icon} size={24} color={colors.text.primary} />
        </View>
        <View style={styles.profileOptionText}>
          <Text style={styles.profileOptionTitle}>{title}</Text>
          {subtitle && <Text style={styles.profileOptionSubtitle}>{subtitle}</Text>}
        </View>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
      </View>
    </TouchableOpacity>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity 
        style={[styles.tab]}
        onPress={() => {
          setSelectedTab('Home');
          navigation.navigate('Home');
        }}
      >
        <Ionicons name="home" size={24} color={colors.gray[400]} />
        <Text style={styles.tabText}>{t('home.title')}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab]}
        onPress={() => {
          setSelectedTab('Family');
          navigation.navigate('FamilyMembers');
        }}
      >
        <Ionicons name="people" size={24} color={colors.gray[400]} />
        <Text style={styles.tabText}>{t('family.title')}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab]}
        onPress={() => setSelectedTab('Payment')}
      >
        <Ionicons name="card" size={24} color={colors.gray[400]} />
        <Text style={styles.tabText}>{t('profile.payment')}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, selectedTab === 'Profile' && styles.activeTab]}
        onPress={() => setSelectedTab('Profile')}
      >
        <Ionicons 
          name="person" 
          size={24} 
          color={selectedTab === 'Profile' ? colors.white : colors.gray[400]} 
        />
        <Text style={[styles.tabText, selectedTab === 'Profile' && styles.activeTabText]}>
          {t('home.profile')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('home.profile')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderProfileHeader()}
        
        <View style={styles.profileOptions}>
          {renderProfileOption(
            'person-outline',
            t('profile.personalInformation'),
            null,
            handlePersonalInformation
          )}
          
          {renderProfileOption(
            'people-outline',
            t('profile.activeServices'),
            null,
            handleActiveServices,
            `+${activeServices.length}`
          )}
          
          {renderProfileOption(
            'card-outline',
            t('profile.paymentMethods'),
            null,
            handlePaymentMethods,
            `+${paymentMethods.length}`
          )}
          
          {renderProfileOption(
            'lock-closed-outline',
            t('profile.changePassword'),
            null,
            handleChangePassword
          )}
          
          {renderProfileOption(
            'people-outline',
            t('profile.familyMembers'),
            null,
            handleFamilyMembers
          )}
          
          {renderProfileOption(
            'language-outline',
            t('profile.changeLanguage'),
            t(`profile.languages.${language}`),
            handleLanguageChange
          )}
          
          {renderProfileOption(
            'help-circle-outline',
            t('profile.support.title'),
            t('profile.support.subtitle'),
            handleSupport
          )}
          
          {renderProfileOption(
            'log-out-outline',
            t('profile.logout'),
            null,
            handleLogout
          )}
        </View>
      </ScrollView>

      {renderTabBar()}

      <LanguageSelectorModal
        visible={modals.languageSelector}
        onClose={handleCloseLanguageModal}
        onLanguageSelect={handleLanguageSelect}
        currentLanguage={language}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  defaultProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  profileOptions: {
    marginTop: 16,
  },
  profileOption: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  profileOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileOptionText: {
    flex: 1,
  },
  profileOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  profileOptionSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
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
});

export default ProfileScreen;
