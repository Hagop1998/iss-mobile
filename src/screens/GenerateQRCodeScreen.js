import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  setSelectedService, 
  setSelectedVisitorIdentity, 
  setSelectedTimePeriod, 
  setAddress,
  clearQRData
} from '../store/slices/qrSlice';
import { 
  useGenerateQRCodeMutation,
  visitorIdentities,
  getTimePeriodsByVisitorType,
  services
} from '../services/qrApi';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { DEFAULT_VALUES } from '../config/env';
import { QrCodeTypeEnum, QrValidityTimeEnum } from '../constants/enums';
import { getLocalIdByService } from '../utils/userHelpers';

const GenerateQRCodeScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  
  const { 
    selectedService, 
    selectedVisitorIdentity, 
    selectedTimePeriod, 
    address
  } = useAppSelector(state => state.qr);
  
  const { user } = useAppSelector(state => state.auth);
  
  const [generateQRCode, { isLoading: isGenerating, error }] = useGenerateQRCodeMutation();
  
  const [availableTimePeriods, setAvailableTimePeriods] = useState([]);

  const serviceFromRoute = route?.params?.service;

  const getUserAddress = () => {
    const deviceAddress = user?.userSubscription?.device?.address;
    if (deviceAddress) {
      const address = deviceAddress.address || '';
      const city = deviceAddress.city || '';
      if (address && city) {
        return `${address}, ${city}`;
      } else if (address) {
        return address;
      } else if (city) {
        return city;
      }
    }
    return user?.bio || user?.address || DEFAULT_VALUES.LOCATION;
  };

  useEffect(() => {
    if (serviceFromRoute) {
      dispatch(setSelectedService(serviceFromRoute));
    }
    const userAddress = getUserAddress();
    dispatch(setAddress(userAddress));
  }, [serviceFromRoute, dispatch, user?.userSubscription?.device?.address]);

  useEffect(() => {
    if (selectedVisitorIdentity) {
      const periods = getTimePeriodsByVisitorType(selectedVisitorIdentity.id);
      setAvailableTimePeriods(periods);
      
      if (!selectedTimePeriod || !periods.find(p => p.id === selectedTimePeriod?.id)) {
        if (periods.length > 0) {
          dispatch(setSelectedTimePeriod(periods[0]));
        } else {
          dispatch(setSelectedTimePeriod(null));
        }
      }
    } else {
      setAvailableTimePeriods([]);
      dispatch(setSelectedTimePeriod(null));
    }
  }, [selectedVisitorIdentity?.id, dispatch]);

  useEffect(() => {
    if (error) {
      console.log('QR Generation Error:', error);
      const errorMessage = error.data?.error || error.message || 'Failed to generate QR code';
      Alert.alert(t('common.error'), errorMessage);
    }
  }, [error, t]);

  const handleVisitorIdentitySelect = (identity) => {
    dispatch(setSelectedVisitorIdentity(identity));
  };

  const handleTimePeriodSelect = (period) => {
    dispatch(setSelectedTimePeriod(period));
  };

  const isFormValid = () => {
    const currentAddress = address || getUserAddress();
    return selectedService && selectedVisitorIdentity && selectedTimePeriod && currentAddress?.trim();
  };

  const handleGenerate = async () => {
  
    console.log('Current State:', {
      selectedService,
      selectedVisitorIdentity,
      selectedTimePeriod,
      address,
    });
    
    if (!selectedService) {
      console.error('❌ No service selected');
      Alert.alert(
        t('common.error') || 'Error',
        'Please select a service first',
        [{ text: t('common.ok') || 'OK' }]
      );
      return;
    }
    
    if (!isFormValid()) {
      console.log('❌ Form validation failed');
      Alert.alert(t('common.error'), 'Please fill all required fields');
      return;
    }

    try {
      const visitorIdentityId = selectedVisitorIdentity?.id || selectedVisitorIdentity;
      const qrType = visitorIdentityId === 'friends_family' 
        ? QrCodeTypeEnum.VALID_PERIOD 
        : QrCodeTypeEnum.VALID_ONCE;
      
      const timePeriodHours = selectedTimePeriod?.value || selectedTimePeriod || 2;
      let qrDate = QrValidityTimeEnum.oneHour; 
      
      if (timePeriodHours === 1) qrDate = QrValidityTimeEnum.oneHour;
      else if (timePeriodHours === 4) qrDate = QrValidityTimeEnum.fourHours;
      else if (timePeriodHours === 8) qrDate = QrValidityTimeEnum.eightHours;
      else if (timePeriodHours === 12) qrDate = QrValidityTimeEnum.twelveHours;
      else if (timePeriodHours === 24) qrDate = QrValidityTimeEnum.oneDay;
      else if (timePeriodHours === 72) qrDate = QrValidityTimeEnum.threeDays;
      else if (timePeriodHours === 168) qrDate = QrValidityTimeEnum.oneWeek;
      else if (timePeriodHours === 336) qrDate = QrValidityTimeEnum.twoWeeks;
      else if (timePeriodHours === 720) qrDate = QrValidityTimeEnum.oneMonth;
      
      const localIds = getLocalIdByService(selectedService, user);
      
      const qrData = {
        qrType: qrType,
        qrDate: qrDate,
        localIds: localIds, 
      };
      
      if (selectedService === 'smart_intercom') {
      } else if (selectedService === 'elevator') {
      } else if (selectedService === 'barrier') {
      }
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📤 QR CODE GENERATION PAYLOAD');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🔹 Full Payload Object:', JSON.stringify(qrData, null, 2));
      console.log('🔹 qrType:', qrType, `(${qrType === QrCodeTypeEnum.VALID_PERIOD ? 'VALID_PERIOD' : 'VALID_ONCE'})`);
      console.log('🔹 qrDate:', qrDate, 'hours');
      console.log('🔹 localIds:', localIds, `(type: ${typeof localIds})`);
      console.log('🔹 Service:', selectedService);
      console.log('🔹 Payload Keys:', Object.keys(qrData));
      console.log('🔹 Payload Size:', JSON.stringify(qrData).length, 'bytes');
      console.log('═══════════════════════════════════════════════════════════');
      
      console.log('📤 Transformed QR Data:', JSON.stringify(qrData, null, 2));
      console.log('📤 Service:', selectedService);
      console.log('📤 Visitor Identity:', selectedVisitorIdentity);
      console.log('📤 QR Type (enum):', qrType, qrType === QrCodeTypeEnum.VALID_PERIOD ? 'VALID_PERIOD' : 'VALID_ONCE');
      console.log('📤 QR Date (enum):', qrDate, 'hours');
      console.log('📤 Time period (hours):', timePeriodHours);
      console.log('📤 Local IDs:', localIds);
            
      let result;
      try {
        result = await generateQRCode(qrData).unwrap();
      } catch (unwrapError) {
        if (unwrapError?.status === 201 && unwrapError?.data?.success === true) {
          console.log('✅ QR code was generated successfully (201), treating as success');
          result = unwrapError.data; 
        } else {
          throw unwrapError;
        }
      }
      
      console.log('📥 API Response:', JSON.stringify(result, null, 2));
      
      if (result?.code && result.code !== 200 && result.code !== 201) {
        throw {
          status: result.code,
          data: {
            code: result.code,
            message: result.msg || result.message || 'QR code generation failed',
            error: result.msg || result.message || 'QR code generation failed',
          },
        };
      }
      
      if (result?.code === 201 || result?.status === 201 || result?.success === true) {
        console.log('✅ QR code generated successfully (201)');
      }
      
      if (!result?.data && !result?.qrCode && !result?.qrData && !result?.code) {
        console.warn('⚠️ Response does not contain QR code data');
      }
      
      console.log('✅ QR Generated successfully!');
      console.log('📥 QR Code Data:', result?.data || result?.qrCode || result);
   
      try {
        navigation.navigate('QRCodeResult', { 
          qrData: {
            ...result,
            service: selectedService || 'barrier', 
            visitorIdentity: selectedVisitorIdentity?.id || selectedVisitorIdentity,
            timePeriod: selectedTimePeriod?.value || selectedTimePeriod,
            address: address || getUserAddress(),
          }
        });
      } catch (navError) {
        console.error('❌ Navigation error:', navError);
        Alert.alert(
          t('common.error') || 'Error',
          'Failed to navigate to QR code result. Please try again.',
          [{ text: t('common.ok') || 'OK' }]
        );
      }
      
    } catch (error) {
      if (error?.status === 201 && error?.data?.success === true) {
        console.log('✅ QR code was generated successfully (201), navigating to result screen');
        try {
          navigation.navigate('QRCodeResult', {
            qrData: {
              code: 201,
              success: true,
              message: error.data.message || 'QR code generated successfully',
              service: selectedService || 'smart_intercom',
              visitorIdentity: selectedVisitorIdentity?.id || selectedVisitorIdentity,
              timePeriod: selectedTimePeriod?.value || selectedTimePeriod,
              address: address || getUserAddress(),
            },
            selectedService: selectedService || 'smart_intercom',
            selectedVisitorIdentity: selectedVisitorIdentity,
            selectedTimePeriod: selectedTimePeriod,
          });
        } catch (navError) {
          console.error('Error navigating to QR result:', navError);
          Alert.alert(
            t('common.error') || 'Error',
            'Failed to navigate to QR code result. Please try again.',
            [{ text: t('common.ok') || 'OK' }]
          );
        }
        return; 
      }
      
      console.error('❌ Error generating QR code:', error);
      console.error('Error object:', JSON.stringify(error, null, 2));
      console.error('Error stack:', error?.stack);
      
      let errorMessage = 'Failed to generate QR code. Please try again.';
      
      try {
        if (error?.data?.message) {
          if (typeof error.data.message === 'string') {
            errorMessage = error.data.message;
          } else if (typeof error.data.message === 'object' && error.data.message !== null) {
            const errorMessages = Object.values(error.data.message).filter(msg => msg);
            if (errorMessages.length > 0) {
              errorMessage = errorMessages.join('\n');
            } else {
              errorMessage = 'Validation failed. Please check your input.';
            }
          }
        } else if (error?.message) {
          errorMessage = typeof error.message === 'string' ? error.message : 'An error occurred';
        } else if (error?.data?.error) {
          errorMessage = typeof error.data.error === 'string' ? error.data.error : 'An error occurred';
        } else if (error?.data?.msg) {
          errorMessage = typeof error.data.msg === 'string' ? error.data.msg : 'An error occurred';
        }
      } catch (parseError) {
        console.error('Error parsing error message:', parseError);
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
      
      if (typeof errorMessage !== 'string') {
        errorMessage = 'An error occurred. Please try again.';
      }
      
      try {
        Alert.alert(
          t('common.error') || 'Error',
          errorMessage,
          [{ text: t('common.ok') || 'OK', style: 'default' }]
        );
      } catch (alertError) {
        console.error('❌ Error showing alert:', alertError);
        console.error('Error message that could not be displayed:', errorMessage);
      }
    }
  };

  const renderPillButton = (item, isSelected, onPress, icon = null) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.pillButton,
        isSelected && styles.pillButtonSelected
      ]}
      onPress={onPress}
    >
      {icon && (
        <Ionicons 
          name={icon} 
          size={16} 
          color={isSelected ? colors.white : colors.text.secondary} 
          style={styles.pillIcon}
        />
      )}
      <Text style={[
        styles.pillButtonText,
        isSelected && styles.pillButtonTextSelected
      ]}>
        {item.name}
      </Text>
      {isSelected && (
        <Ionicons name="checkmark" size={16} color={colors.white} style={styles.checkIcon} />
      )}
    </TouchableOpacity>
  );

  const getServiceInfo = () => {
    const service = services.find(s => s.id === selectedService);
    return service || { name: t('qr.service'), icon: 'settings' };
  };

  const getSelectedServiceObject = () => {
    return services.find(s => s.id === selectedService);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('qr.generateQRCode')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('qr.service')}</Text>
          <View style={styles.serviceCard}>
            <View style={styles.serviceInfo}>
              <View style={styles.serviceIcon}>
                <Ionicons name={getServiceInfo().icon} size={24} color={colors.primary} />
              </View>
              <Text style={styles.serviceName}>{getServiceInfo().name}</Text>
            </View>
          </View>
        </View>

        {/* Address Display (Read-only from Status Response) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('qr.address')}</Text>
          <View style={styles.inputContainer}>
            <View style={styles.disabledInput}>
              <Ionicons name="location" size={16} color={colors.gray[400]} style={styles.addressIcon} />
              <Text style={styles.disabledInputText}>
                {getUserAddress() || 'No address available'}
              </Text>
            </View>
          </View>
        </View>

        {/* Visitor Identity Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('qr.visitorIdentity')}</Text>
          <View style={styles.pillContainer}>
            {visitorIdentities.map((identity) =>
              renderPillButton(
                identity,
                selectedVisitorIdentity?.id === identity.id,
                () => handleVisitorIdentitySelect(identity),
                identity.icon
              )
            )}
          </View>
        </View>

        {/* Time Period Selection */}
        {selectedVisitorIdentity && availableTimePeriods.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('qr.timePeriod')}</Text>
            <View style={styles.pillContainer}>
              {availableTimePeriods.map((period) =>
                renderPillButton(
                  period,
                  selectedTimePeriod?.id === period.id,
                  () => handleTimePeriodSelect(period)
                )
              )}
            </View>
          </View>
        )}

        {/* Generate Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.generateButton,
              isFormValid() && styles.generateButtonActive,
              isGenerating && styles.generateButtonDisabled
            ]}
            onPress={handleGenerate}
            disabled={!isFormValid() || isGenerating}
          >
            <Text style={[
              styles.generateButtonText,
              isFormValid() && styles.generateButtonTextActive
            ]}>
              {isGenerating ? t('qr.generating') : t('qr.generate')}
            </Text>
          </TouchableOpacity>
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
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  inputContainer: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.white,
  },
  disabledInput: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.gray[50],
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressIcon: {
    marginRight: 8,
  },
  disabledInputText: {
    color: colors.text.primary,
    fontSize: 16,
    flex: 1,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  pillButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillIcon: {
    marginRight: 8,
  },
  pillButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  pillButtonTextSelected: {
    color: colors.white,
  },
  checkIcon: {
    marginLeft: 8,
  },
  buttonContainer: {
    paddingVertical: 24,
    paddingBottom: 40,
  },
  generateButton: {
    backgroundColor: colors.gray[300],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateButtonActive: {
    backgroundColor: colors.primary,
  },
  generateButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  generateButtonTextActive: {
    color: colors.white,
  },
});

export default GenerateQRCodeScreen;
