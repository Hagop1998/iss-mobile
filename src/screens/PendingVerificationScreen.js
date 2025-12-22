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
import { colors } from '../constants/colors';

const PendingVerificationScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const pollingIntervalRef = useRef(null);
  const errorCountRef = useRef(0);
  const lastErrorLogRef = useRef(0);

  useEffect(() => {
    const isVerified = user?.isVerified === true || user?.isVerified === 'true';
    if (isVerified) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  }, [user?.isVerified, navigation]);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        await dispatch(checkAuthStatus()).unwrap();
        errorCountRef.current = 0;
      } catch (error) {
        errorCountRef.current += 1;
        
        const now = Date.now();
        const shouldLog = errorCountRef.current === 1 || 
                         (errorCountRef.current % 6 === 0 && now - lastErrorLogRef.current > 30000);
        
        if (shouldLog) {
          const errorMessage = error?.message || String(error);
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
  }, [dispatch]);

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

