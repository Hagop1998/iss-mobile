import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import LanguageSelector from '../components/LanguageSelector';
import { colors } from '../constants/colors';
import { validateEmail, validatePassword, getPasswordStrength, formatPhoneNumber, validatePhoneNumber } from '../utils/validation';
import { useAppDispatch } from '../store/hooks';
import { signUpUser, signInUser } from '../store/slices/authSlice';

const SignUpScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
  });
  
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
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
      case 'email':
        if (value && !validateEmail(value)) {
          error = t('signUp.errors.invalidEmail');
        }
        break;
      case 'password':
        if (value && !validatePassword(value)) {
          error = t('signUp.errors.weakPassword');
        }
        break;
      case 'phoneNumber':
        if (value && !validatePhoneNumber(value)) {
          error = t('signUp.errors.invalidPhone');
        }
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleClearInput = (field) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const isFormValid = () => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.phoneNumber.trim() &&
      formData.email.trim() &&
      formData.password.trim() &&
      !errors.firstName &&
      !errors.lastName &&
      !errors.phoneNumber &&
      !errors.email &&
      !errors.password
    );
  };

  const handleSignUp = async () => {
    // Validate all fields
    const phoneValid = validateField('phoneNumber', formData.phoneNumber);
    const emailValid = validateField('email', formData.email);
    const passwordValid = validateField('password', formData.password);

    if (!phoneValid || !emailValid || !passwordValid) {
      return;
    }

    if (!isFormValid()) {
      return;
    }

    setLoading(true);
    try {
      // Register the user
      await dispatch(signUpUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phoneNumber,
        email: formData.email,
        password: formData.password,
        role: 'user',
        bio: '',
      })).unwrap();
      
      // Auto-login after successful registration
      await dispatch(signInUser({
        email: formData.email,
        password: formData.password,
      })).unwrap();
      
      // Navigate to Home (handled by SignIn useEffect)
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (e) {
      Alert.alert(t('common.error'), String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    navigation.navigate('SignIn');
  };

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(t('signUp.privacyPolicy'), 'Open privacy policy');
  };

  const handleTermsConditions = () => {
    Alert.alert(t('signUp.termsConditions'), 'Open terms and conditions');
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t('signUp.title')}</Text>
            <Text style={styles.subtitle}>
              {t('signUp.subtitle')}
            </Text>
          </View>

          <View style={styles.form}>
            <CustomInput
              label={focusedField === 'firstName' ? 'First Name' : null}
              placeholder="First Name"
              value={formData.firstName}
              onChangeText={(value) => handleInputChange('firstName', value)}
              onFocus={() => handleInputFocus('firstName')}
              onBlur={() => handleInputBlur('firstName')}
              isFocused={focusedField === 'firstName'}
              error={errors.firstName}
              showClearButton={!!formData.firstName}
              onClear={() => handleClearInput('firstName')}
            />

            <CustomInput
              label={focusedField === 'lastName' ? 'Last Name' : null}
              placeholder="Last Name"
              value={formData.lastName}
              onChangeText={(value) => handleInputChange('lastName', value)}
              onFocus={() => handleInputFocus('lastName')}
              onBlur={() => handleInputBlur('lastName')}
              isFocused={focusedField === 'lastName'}
              error={errors.lastName}
              showClearButton={!!formData.lastName}
              onClear={() => handleClearInput('lastName')}
            />

            <CustomInput
              label={focusedField === 'phoneNumber' ? t('signUp.phoneNumber') : null}
              placeholder="+374"
              value={formData.phoneNumber}
              onChangeText={(value) => handleInputChange('phoneNumber', formatPhoneNumber(value))}
              onFocus={() => handleInputFocus('phoneNumber')}
              onBlur={() => handleInputBlur('phoneNumber')}
              isFocused={focusedField === 'phoneNumber'}
              keyboardType="phone-pad"
              error={errors.phoneNumber}
              showClearButton={!!formData.phoneNumber}
              onClear={() => handleClearInput('phoneNumber')}
            />

            <CustomInput
              label={focusedField === 'email' ? t('signUp.email') : null}
              placeholder={t('signUp.email')}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              onFocus={() => handleInputFocus('email')}
              onBlur={() => handleInputBlur('email')}
              isFocused={focusedField === 'email'}
              keyboardType="email-address"
              error={errors.email}
              showClearButton={!!formData.email}
              onClear={() => handleClearInput('email')}
            />

            <CustomInput
              label={focusedField === 'password' ? t('signUp.password') : null}
              placeholder={t('signUp.password')}
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              onFocus={() => handleInputFocus('password')}
              onBlur={() => handleInputBlur('password')}
              isFocused={focusedField === 'password'}
              secureTextEntry={true}
              error={errors.password}
              showClearButton={!!formData.password}
              onClear={() => handleClearInput('password')}
            />

            {formData.password && (
              <PasswordStrengthIndicator
                strength={passwordStrength}
                password={formData.password}
              />
            )}
          </View>

          <CustomButton
            title={t('signUp.signUpButton')}
            onPress={handleSignUp}
            disabled={!isFormValid()}
            loading={loading}
            style={styles.signUpButton}
          />

          <TouchableOpacity style={styles.signInLink} onPress={handleSignIn}>
            <Text style={styles.signInText}>
              {t('signUp.haveAccount')} <Text style={styles.signInLinkText}>{t('signUp.signIn')}</Text>
            </Text>
          </TouchableOpacity>

          <LanguageSelector onLanguageChange={handleLanguageChange} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('signUp.footerText')}{' '}
              <TouchableOpacity onPress={handlePrivacyPolicy}>
                <Text style={styles.linkText}>{t('signUp.privacyPolicy')}</Text>
              </TouchableOpacity>
              {' '}{t('signUp.and')}{' '}
              <TouchableOpacity onPress={handleTermsConditions}>
                <Text style={styles.linkText}>{t('signUp.termsConditions')}</Text>
              </TouchableOpacity>
              .
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  form: {
    marginBottom: 24,
  },
  signUpButton: {
    marginBottom: 16,
  },
  signInLink: {
    alignItems: 'center',
    marginBottom: 24,
  },
  signInText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  signInLinkText: {
    color: colors.primary,
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  linkText: {
    color: colors.primary,
    fontWeight: '500',
  },
});

export default SignUpScreen;
