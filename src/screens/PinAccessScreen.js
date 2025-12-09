import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../constants/colors';
import apiService from '../services/api';
import { AuthCodeTypeEnum } from '../constants/enums';

const PinAccessScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { service } = route?.params || {};
  const [authCode, setAuthCode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAuthCode();
  }, []);

  const fetchAuthCode = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use static localId for now
      const localId = '2136131714170315';
      
      // Use TWENTY_FOUR_HOURS (3) as the type based on Swagger example
      const type = AuthCodeTypeEnum.TWENTY_FOUR_HOURS;

      console.log('📤 Sending auth code request:', {
        localId,
        type,
        service,
      });

      // Call the middleware auth_code endpoint
      const response = await apiService.middleware.getAuthCode({
        localId,
        type,
      });

      console.log('✅ Auth code response:', JSON.stringify(response, null, 2));

      // Extract the code from response
      // Response structure: { status: "ok", data: { code: 10000, msg: "ok", data: { code: "57542692" } } }
      // Or: response.data.data.data.code
      const code = response?.data?.data?.data?.code || 
                   response?.data?.data?.code || 
                   response?.data?.code ||
                   response?.code;
      
      console.log('🔍 Extracted code:', code);
      
      if (code) {
        setAuthCode(String(code));
      } else {
        console.error('❌ No code found in response structure');
        throw new Error('No code received from server');
      }
    } catch (error) {
      console.error('❌ Error getting auth code:', error);
      
      // Extract error message
      const errorMessage = 
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        t('pin.error') || 'Failed to get auth code';
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (authCode) {
      try {
        await Clipboard.setStringAsync(authCode);
        Alert.alert(
          t('pin.codeCopied') || 'Code Copied',
          t('pin.codeCopiedMessage') || 'Access code copied to clipboard'
        );
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        Alert.alert(
          t('common.error') || 'Error',
          t('pin.copyFailed') || 'Failed to copy code'
        );
      }
    }
  };

  const handleRefresh = () => {
    fetchAuthCode();
  };

  const renderAuthCode = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {t('pin.generating') || 'Generating access code...'}
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.red[500]} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>
              {t('common.retry') || 'Retry'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (authCode) {
      return (
        <View style={styles.codeContainer}>
          <View style={styles.codeIconContainer}>
            <Ionicons name="keypad" size={64} color={colors.primary} />
          </View>
          <Text style={styles.codeLabel}>
            {t('pin.yourCode') || 'Your Access Code'}
          </Text>
          <View style={styles.codeDisplay}>
            <Text style={styles.codeText}>{authCode}</Text>
          </View>
          <Text style={styles.codeHint}>
            {t('pin.codeHint') || 'Use this code to access the system'}
          </Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyCode}
            >
              <Ionicons name="copy-outline" size={20} color={colors.primary} />
              <Text style={styles.copyButtonText}>
                {t('common.copy') || 'Copy'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <Ionicons name="refresh" size={20} color={colors.white} />
              <Text style={styles.refreshButtonText}>
                {t('common.refresh') || 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('pin.title') || 'PIN Access'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.topSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="keypad" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>{t('pin.title') || 'PIN Code Access'}</Text>
          <Text style={styles.subtitle}>
            {t('pin.subtitle') || 'Your access code is ready'}
          </Text>
        </View>

        {renderAuthCode()}
      </View>
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
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.red[500],
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  codeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  codeIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  codeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 16,
  },
  codeDisplay: {
    backgroundColor: colors.gray[50],
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 24,
    marginBottom: 16,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  codeText: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  codeHint: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    paddingHorizontal: 24,
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  refreshButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default PinAccessScreen;

