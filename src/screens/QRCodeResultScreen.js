import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Share,
  Image,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../store/hooks';
import { clearQRData } from '../store/slices/qrSlice';
import { useShareQRCodeMutation } from '../services/qrApi';
import { visitorIdentities, timePeriods, services, deliveryTimePeriods, friendsFamilyTimePeriods } from '../services/qrApi';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const QRCodeResultScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  
  // RTK Query hooks
  const [shareQRCode, { isLoading: isSharing }] = useShareQRCodeMutation();
  
  // Get QR data from route params
  const qrData = route?.params?.qrData;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📄 QRCodeResultScreen Loaded');
  console.log('QR Data received:', JSON.stringify(qrData, null, 2));
  console.log('═══════════════════════════════════════════════════════════');

  // Check if response indicates an error
  if (!qrData) {
    console.error('❌ No QR data received, going back');
    Alert.alert(
      t('common.error') || 'Error',
      'No QR code data received',
      [{ text: t('common.ok') || 'OK', onPress: () => navigation.goBack() }]
    );
    return null;
  }

  // Check if API returned an error code (accept 200 and 201 as success)
  if (qrData?.code && qrData.code !== 200 && qrData.code !== 201) {
    console.error('❌ API returned error code:', qrData.code, qrData.msg);
    Alert.alert(
      t('common.error') || 'Error',
      qrData.msg || qrData.message || 'Failed to generate QR code',
      [{ text: t('common.ok') || 'OK', onPress: () => navigation.goBack() }]
    );
    return null;
  }

  // Check if we have actual QR code data (image or QR code string)
  const hasQRCodeData = qrData?.imageData ||
                       qrData?.data?.qrCode || 
                       qrData?.data?.qrData || 
                       qrData?.qrCode || 
                       qrData?.qrData ||
                       qrData?.data?.qrUrl ||
                       qrData?.qrUrl;

  if (!hasQRCodeData) {
    console.warn('⚠️ No QR code data in response, showing placeholder');
  }

  const getServiceInfo = () => {
    try {
      const serviceId = qrData?.service || 'barrier'; // Default to barrier if not set
      const service = services.find(s => s.id === serviceId);
    return service || { name: t('qr.service'), icon: 'settings' };
    } catch (error) {
      console.error('Error getting service info:', error);
      return { name: t('qr.service'), icon: 'settings' };
    }
  };

  const getVisitorIdentityInfo = () => {
    try {
      const identityId = qrData?.visitorIdentity;
      if (!identityId) {
        return { name: t('qr.visitor'), icon: 'person' };
      }
      const identity = visitorIdentities.find(i => i.id === identityId);
    return identity || { name: t('qr.visitor'), icon: 'person' };
    } catch (error) {
      console.error('Error getting visitor identity info:', error);
      return { name: t('qr.visitor'), icon: 'person' };
    }
  };

  const getTimePeriodInfo = () => {
    try {
    // Check all time period arrays (combined)
    const allTimePeriods = [...deliveryTimePeriods, ...friendsFamilyTimePeriods];
      const period = allTimePeriods.find(p => p.value === qrData?.timePeriod);
    
    if (period) {
      return period;
    }
    
    // Fallback: create a period object from the value
      const hours = qrData?.timePeriod || 0;
    if (hours >= 720) {
      return { name: '1 month', value: hours };
    } else if (hours >= 336) {
      return { name: '2 weeks', value: hours };
    } else if (hours >= 168) {
      return { name: '1 week', value: hours };
    } else if (hours >= 24) {
      return { name: '24 hours', value: hours };
    } else {
      return { name: `${hours} hours`, value: hours };
      }
    } catch (error) {
      console.error('Error getting time period info:', error);
      return { name: 'N/A', value: 0 };
    }
  };

  const formatExpiryTime = () => {
    try {
      // If expiresAt is provided by the API
      if (qrData.expiresAt) {
        const expiryDate = new Date(qrData.expiresAt);
        const now = new Date();
        const diffMs = expiryDate - now;
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
        
        if (diffHours <= 0) {
          return t('qr.expired');
        } else if (diffHours === 1) {
          return t('qr.expiresIn1Hour');
        } else {
          return t('qr.expiresInHours', { hours: diffHours });
        }
      } else {
        // Fallback: calculate from timePeriod
        const hours = qrData.timePeriod || 0;
        if (hours === 1) {
          return t('qr.expiresIn1Hour');
        } else {
          return t('qr.expiresInHours', { hours });
        }
      }
    } catch (error) {
      console.error('Error formatting expiry time:', error);
      return t('qr.timePeriod');
    }
  };

  const handleShare = async () => {
    try {
      // Check if we have an image to share
      if (qrData?.imageData) {
        console.log('📤 Sharing QR code image...');
        
        // Create a temporary file path
        const fileName = `qr_code_${Date.now()}.jpg`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        
        // Ensure we have a proper data URL
        let dataUrl = qrData.imageData;
        if (!dataUrl.startsWith('data:')) {
          dataUrl = `data:image/jpeg;base64,${qrData.imageData}`;
        }
        
        // Use downloadAsync to save the image from data URL
        // This is the recommended way for expo-file-system v19+
        console.log('💾 Downloading image from data URL to:', fileUri);
        const downloadResult = await FileSystem.downloadAsync(dataUrl, fileUri);
        
        if (!downloadResult.uri) {
          throw new Error('Failed to download image file');
        }
        
        console.log('✅ Image downloaded successfully to:', downloadResult.uri);
        
        console.log('✅ QR code image saved to:', fileUri);
        
        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert(
            t('common.error') || 'Error',
            'Sharing is not available on this device'
          );
          return;
        }
        
        // Share the image file
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/jpeg',
          dialogTitle: t('qr.share') || 'Share QR Code',
        });
        
        console.log('✅ QR code image shared successfully');
        
        // Also call RTK Query mutation for tracking
        try {
          await shareQRCode(qrData).unwrap();
        } catch (trackingError) {
          console.warn('⚠️ Share tracking failed:', trackingError);
          // Don't show error to user, sharing was successful
        }
      } else {
        // Fallback: Share text/URL if no image available
        console.log('📤 Sharing QR code as text (no image available)...');
        const shareContent = {
          message: t('qr.shareMessage', {
            service: getServiceInfo().name,
            address: qrData.address,
            visitor: getVisitorIdentityInfo().name,
            time: getTimePeriodInfo().name,
          }),
          url: `https://qr.issapp.com/${qrData.id}`,
        };

        await Share.share(shareContent);
        
        // Also call RTK Query mutation for tracking
        try {
          await shareQRCode(qrData).unwrap();
        } catch (trackingError) {
          console.warn('⚠️ Share tracking failed:', trackingError);
        }
      }
    } catch (error) {
      console.error('❌ Error sharing QR code:', error);
      Alert.alert(
        t('common.error') || 'Error',
        t('qr.shareFailed') || 'Failed to share QR code'
      );
    }
  };

  const handleCreateNew = () => {
    dispatch(clearQRData());
    navigation.navigate('GenerateQRCode');
  };

  const handleGoHome = () => {
    dispatch(clearQRData());
    navigation.navigate('Home');
  };

  const renderQRCode = () => {
    try {
      // Check if we have an image from the backend (JPEG response)
      if (qrData?.imageData) {
        console.log('✅ Rendering QR code image from backend');
        return (
          <View style={styles.qrCodeContainer}>
            <Image
              source={{ uri: qrData.imageData }}
              style={styles.qrCodeImage}
              resizeMode="contain"
            />
            <Text style={styles.qrCodeText}>{t('qr.scanToAccess')}</Text>
          </View>
        );
      }

      // Get QR code data from backend response (fallback for string-based QR codes)
      const qrCodeData = qrData?.data?.qrCode || 
                        qrData?.data?.qrData || 
                        qrData?.qrCode || 
                        qrData?.qrData ||
                        qrData?.data?.qrUrl ||
                        qrData?.qrUrl ||
                        qrData?.id; // QR code ID to generate QR code from
      
      // If no QR code data from backend, show error message
      if (!qrCodeData && !hasQRCodeData) {
        return (
          <View style={styles.qrCodeContainer}>
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color={colors.red[500]} />
              <Text style={styles.errorText}>No QR code data received</Text>
              <Text style={styles.errorSubtext}>Please try generating again</Text>
            </View>
          </View>
        );
      }
      
      // TODO: Install and use a QR code library like 'react-native-qrcode-svg' or 'react-native-qrcode-generator'
      // For now, show placeholder with note that real QR code will come from backend
      return (
        <View style={styles.qrCodeContainer}>
          <View style={styles.qrCode}>
            {/* Placeholder QR Code - Replace with real QR code library */}
            <View style={styles.qrCodeGrid}>
              {Array.from({ length: 25 }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.qrCodeCell,
                    { backgroundColor: Math.random() > 0.5 ? colors.black : colors.white }
                  ]}
                />
              ))}
            </View>
            {/* Show QR code data if available */}
            {qrCodeData && (
              <View style={styles.qrCodeDataContainer}>
                <Text style={styles.qrCodeDataText} numberOfLines={1}>
                  {typeof qrCodeData === 'string' ? qrCodeData.substring(0, 20) + '...' : JSON.stringify(qrCodeData).substring(0, 20) + '...'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.qrCodeText}>{t('qr.scanToAccess')}</Text>
          {!hasQRCodeData && (
            <Text style={styles.warningText}>⚠️ Using placeholder QR code - backend did not return QR data</Text>
          )}
        </View>
      );
    } catch (error) {
      console.error('Error rendering QR code:', error);
      return (
        <View style={styles.qrCodeContainer}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={colors.red[500]} />
            <Text style={styles.errorText}>Error loading QR code</Text>
          </View>
        </View>
      );
    }
  };

  const renderQRDetails = () => {
    try {
      return (
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Ionicons name={getServiceInfo().icon} size={20} color={colors.primary} />
            </View>
            <Text style={styles.detailText}>{getServiceInfo().name}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Ionicons name="location" size={20} color={colors.primary} />
            </View>
            <Text style={styles.detailText}>{qrData.address || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Ionicons name={getVisitorIdentityInfo().icon} size={20} color={colors.primary} />
            </View>
            <Text style={styles.detailText}>{getVisitorIdentityInfo().name}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Ionicons name="time" size={20} color={colors.primary} />
            </View>
            <Text style={styles.detailText}>{getTimePeriodInfo().name}</Text>
          </View>
        </View>
      );
    } catch (error) {
      console.error('Error rendering QR details:', error);
      return <Text>Loading details...</Text>;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('qr.qrCodeGenerated')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {renderQRCode()}
        
        {renderQRDetails()}
        
        <View style={styles.expiryContainer}>
          <Text style={styles.expiryText}>{formatExpiryTime()}</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
            onPress={handleShare}
            disabled={isSharing}
          >
            <Ionicons name="share" size={20} color={colors.white} />
            <Text style={styles.shareButtonText}>
              {isSharing ? t('qr.sharing') : t('qr.share')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.createNewButton} onPress={handleCreateNew}>
            <Text style={styles.createNewButtonText}>{t('qr.createNew')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleGoHome}>
        <Ionicons name="add" size={24} color={colors.white} />
      </TouchableOpacity>
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
    paddingVertical: 32,
    alignItems: 'center',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrCode: {
    width: 200,
    height: 200,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  qrCodeImage: {
    width: 250,
    height: 250,
    borderRadius: 16,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  qrCodeGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  qrCodeCell: {
    width: '20%',
    height: '20%',
  },
  qrCodeText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  qrCodeDataContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
  qrCodeDataText: {
    fontSize: 10,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 12,
    color: colors.orange[700],
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  expiryContainer: {
    backgroundColor: colors.orange[100],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 32,
  },
  expiryText: {
    fontSize: 14,
    color: colors.orange[700],
    fontWeight: '500',
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  shareButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  createNewButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createNewButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default QRCodeResultScreen;
