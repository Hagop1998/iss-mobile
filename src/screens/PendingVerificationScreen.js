import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkAuthStatus } from '../store/slices/authSlice';
import { apiClient } from '../services/api';
import { colors } from '../constants/colors';

const PendingVerificationScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const pollingIntervalRef = useRef(null);
  const errorCountRef = useRef(0);
  const lastErrorLogRef = useRef(0);

  useEffect(() => {
    console.log('🔍 PendingVerification - User Verification Check:', {
      hasUser: !!user,
      isVerified: user?.isVerified,
      status: user?.status,
      isVerifiedType: typeof user?.isVerified,
      statusType: typeof user?.status,
      isAuthenticated,
      hasToken: !!user?.token,
    });
    
    const isVerified = (user?.isVerified === true || user?.isVerified === 'true') && (user?.status === 1 || user?.status === '1');
    console.log('🔍 Verification Check Result:', {
      isVerified,
      check1: user?.isVerified === true || user?.isVerified === 'true',
      check2: user?.status === 1 || user?.status === '1',
      isAuthenticated,
      hasToken: !!user?.token,
    });
    
    // Navigate to Home when user is verified AND authenticated (isAuthenticated is set by Redux when verified)
    if (isVerified && isAuthenticated && user?.token) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      // Once verified, navigate directly to Home
      console.log('✅ User is now verified and authenticated! Navigating to Home...');
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } else if (isVerified && !isAuthenticated) {
      console.log('⚠️ User is verified but not authenticated yet. Waiting for Redux state update...');
    }
  }, [user?.isVerified, user?.status, navigation]);

  useEffect(() => {
    // Poll /auth/status using the token from signup
    // We need the token to check verification status
    if (!user?.token) {
      console.log('ℹ️ PendingVerification: No token available, skipping status polling');
      return;
    }

    const checkVerificationStatus = async () => {
      try {
        const statusResponse = await dispatch(checkAuthStatus()).unwrap();
        errorCountRef.current = 0;
        
        // Log the response to see if isVerified is being returned
        console.log('📊 Verification status check response:', JSON.stringify(statusResponse, null, 2));
        console.log('📊 User isVerified from response:', statusResponse?.user?.isVerified || statusResponse?.isVerified);
      } catch (error) {
        errorCountRef.current += 1;
        
        const errorMessage = error?.message || String(error);
        const errorStatus = error?.status || (errorMessage.includes('401') ? 401 : null);
        
        // If token doesn't work (401), the signup token might not be valid for checking status
        // In this case, we can't poll automatically - user needs to try logging in manually
        if (errorStatus === 401 || errorMessage.includes('authorization token')) {
          console.log('ℹ️ Signup token doesn\'t work for /auth/status. User should try logging in after admin approval.');
          // Don't spam errors - just log once
          if (errorCountRef.current === 1) {
            console.warn('⚠️ Cannot check verification status automatically. Please try logging in after admin approves your account.');
          }
          // Slow down polling if token doesn't work
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = setInterval(checkVerificationStatus, 30000); // Check every 30 seconds instead
          }
          return;
        }
        
        const now = Date.now();
        const shouldLog = errorCountRef.current === 1 || 
                         (errorCountRef.current % 6 === 0 && now - lastErrorLogRef.current > 30000);
        
        if (shouldLog) {
          if (errorMessage.includes('500') || errorMessage.includes('server')) {
            console.warn(`⚠️ Verification status check failed (attempt ${errorCountRef.current}). Server error. Continuing to check...`);
          } else {
            console.warn(`⚠️ Verification status check failed (attempt ${errorCountRef.current}):`, errorMessage);
          }
          lastErrorLogRef.current = now;
        }
        
        if (errorCountRef.current > 10) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = setInterval(checkVerificationStatus, 30000);
          }
        }
      }
    };

    checkVerificationStatus();

    pollingIntervalRef.current = setInterval(checkVerificationStatus, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      errorCountRef.current = 0;
    };
  }, [dispatch, isAuthenticated, user?.token]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/Logo.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>{t('pendingVerification.title')}</Text>
        
        <Text style={styles.message}>
          {t('pendingVerification.message')}
        </Text>
        
        <Text style={styles.subMessage}>
          {t('pendingVerification.subMessage')}
        </Text>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {t('pendingVerification.checking')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  subMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
  },
});

export default PendingVerificationScreen;

