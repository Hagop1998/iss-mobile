import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { changePassword, clearUpdateError } from '../store/slices/profileSlice';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { validatePassword } from '../utils/validation';

const ChangePasswordScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  
  const { isUpdating, updateError } = useAppSelector(state => state.profile);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  React.useEffect(() => {
    if (updateError) {
      Alert.alert(t('common.error'), updateError);
      dispatch(clearUpdateError());
    }
  }, [updateError, t, dispatch]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleInputFocus = (field) => {
    setFocusedField(field);
  };

  const handleInputBlur = (field) => {
    setFocusedField(null);
    validateField(field, formData[field]);
  };

  const validateField = (field, value) => {
    let error = null;

    switch (field) {
      case 'currentPassword':
        if (value && value.length < 8) {
          error = t('profile.passwordTooShort');
        }
        break;
      case 'newPassword':
        if (value && !validatePassword(value)) {
          error = t('profile.passwordRequirements');
        }
        break;
      case 'confirmPassword':
        if (value && value !== formData.newPassword) {
          error = t('profile.passwordsDoNotMatch');
        }
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const isFormValid = () => {
    return (
      formData.currentPassword.trim() &&
      formData.newPassword.trim() &&
      formData.confirmPassword.trim() &&
      !errors.currentPassword &&
      !errors.newPassword &&
      !errors.confirmPassword &&
      formData.newPassword === formData.confirmPassword
    );
  };

  const handleChangePassword = async () => {
    const currentValid = validateField('currentPassword', formData.currentPassword);
    const newValid = validateField('newPassword', formData.newPassword);
    const confirmValid = validateField('confirmPassword', formData.confirmPassword);

    if (!currentValid || !newValid || !confirmValid) {
      return;
    }

    if (!isFormValid()) {
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      Alert.alert(t('common.error'), t('profile.samePasswordError'));
      return;
    }

    try {
      await dispatch(changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      })).unwrap();
      
      Alert.alert(
        t('common.success'),
        t('profile.passwordChangedSuccess'),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert(t('common.error'), error || t('profile.passwordChangeFailed'));
    }
  };

  const renderPasswordInput = (field, label, placeholder) => (
    <CustomInput
      label={focusedField === field ? label : null}
      placeholder={placeholder}
      value={formData[field]}
      onChangeText={(value) => handleInputChange(field, value)}
      onFocus={() => handleInputFocus(field)}
      onBlur={() => handleInputBlur(field)}
      isFocused={focusedField === field}
      secureTextEntry={!showPasswords[field]}
      error={errors[field]}
      showClearButton={!!formData[field]}
      onClear={() => handleInputChange(field, '')}
      rightIcon={
        <TouchableOpacity
          onPress={() => togglePasswordVisibility(field)}
          style={styles.eyeButton}
        >
          <Ionicons
            name={showPasswords[field] ? 'eye-off' : 'eye'}
            size={20}
            color={colors.gray[500]}
          />
        </TouchableOpacity>
      }
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.changePassword')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Text style={styles.formTitle}>{t('profile.changePasswordTitle')}</Text>
          <Text style={styles.formSubtitle}>{t('profile.changePasswordSubtitle')}</Text>

          {renderPasswordInput(
            'currentPassword',
            t('profile.currentPassword'),
            t('profile.currentPasswordPlaceholder')
          )}

          {renderPasswordInput(
            'newPassword',
            t('profile.newPassword'),
            t('profile.newPasswordPlaceholder')
          )}

          {renderPasswordInput(
            'confirmPassword',
            t('profile.confirmPassword'),
            t('profile.confirmPasswordPlaceholder')
          )}

          <View style={styles.passwordRequirements}>
            <Text style={styles.requirementsTitle}>{t('profile.passwordRequirementsTitle')}:</Text>
            <Text style={styles.requirementItem}>• {t('profile.passwordRequirement1')}</Text>
            <Text style={styles.requirementItem}>• {t('profile.passwordRequirement2')}</Text>
            <Text style={styles.requirementItem}>• {t('profile.passwordRequirement3')}</Text>
          </View>

          <CustomButton
            title={t('profile.changePassword')}
            onPress={handleChangePassword}
            disabled={!isFormValid()}
            loading={isUpdating}
            style={styles.changePasswordButton}
          />
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
  form: {
    paddingVertical: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 32,
  },
  eyeButton: {
    padding: 8,
  },
  passwordRequirements: {
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  changePasswordButton: {
    marginTop: 16,
  },
});

export default ChangePasswordScreen;
