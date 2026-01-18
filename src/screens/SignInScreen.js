import React, { useEffect, useState } from 'react';
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
import LanguageSelector from '../components/LanguageSelector';
import { colors } from '../constants/colors';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { signInUser, clearError } from '../store/slices/authSlice';
import { validateEmail, validatePassword } from '../utils/validation';

const SignInScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, error, user } = useAppSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const isVerified = (user.isVerified === true || user.isVerified === 'true') && (user.status === 1 || user.status === '1');
      
      console.log('🔍 SignInScreen - Verification Check:', {
        userId: user.id,
        email: user.email,
        isVerified: user.isVerified,
        status: user.status,
        isVerifiedType: typeof user.isVerified,
        verified: isVerified,
      });
      
      if (isVerified) {
        console.log('✅ User is verified, navigating to Home');
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } else {
        console.log('❌ User is not verified, navigating to PendingVerification');
        navigation.reset({ index: 0, routes: [{ name: 'PendingVerification' }] });
      }
    }
  }, [isAuthenticated, user, user?.isVerified, navigation]);

  useEffect(() => {
    if (error) {
      Alert.alert(t('common.error'), String(error));
      dispatch(clearError());
    }
  }, [error, dispatch, t]);

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
      case 'email':
        if (value && !validateEmail(value)) {
          error = t('signIn.errors.invalidEmail');
        }
        break;
      case 'password':
        if (value && !validatePassword(value)) {
          error = t('signIn.errors.weakPassword');
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
      formData.email.trim() &&
      formData.password.trim() &&
      !errors.email &&
      !errors.password
    );
  };

  const handleSignIn = async () => {
 
    const emailValid = validateField('email', formData.email);
    const passwordValid = validateField('password', formData.password);

    if (!emailValid || !passwordValid) {
      console.log('❌ Validation failed:', { emailValid, passwordValid });
      return;
    }

    if (!isFormValid()) {
      console.log('❌ Form is not valid');
      return;
    }

    console.log('✅ Form validation passed, dispatching signInUser action...');
    setLoading(true);
    try {
      const result = await dispatch(signInUser({ email: formData.email, password: formData.password })).unwrap();
      console.log('✅ Sign in successful! Result:', result);
    } catch (e) {
      console.error('❌ Sign in failed:', e);
      const errorMessage = String(e).toLowerCase();
      
      // If user needs admin approval, navigate to verification screen instead of showing error
      if (errorMessage.includes('admin') || errorMessage.includes('verficication') || errorMessage.includes('verification')) {
        console.log('ℹ️ User needs admin approval, navigating to PendingVerification screen');
        navigation.reset({
          index: 0,
          routes: [{ name: 'PendingVerification' }],
        });
      } else {
        // For other errors, show the alert (handled by useEffect below)
        setErrors({ general: String(e) });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleForgotPassword = () => {
    Alert.alert(t('signIn.forgotPassword'), 'Open forgot password screen');
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
            <Text style={styles.title}>{t('signIn.title')}</Text>
            <Text style={styles.subtitle}>
              {t('signIn.subtitle')}
            </Text>
          </View>

          <View style={styles.form}>
            <CustomInput
              label={focusedField === 'email' ? t('signIn.email') : null}
              placeholder={t('signIn.email')}
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
              label={focusedField === 'password' ? t('signIn.password') : null}
              placeholder={t('signIn.password')}
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

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>{t('signIn.forgotPassword')}</Text>
            </TouchableOpacity>
          </View>

          <CustomButton
            title={t('signIn.signInButton')}
            onPress={handleSignIn}
            disabled={!isFormValid()}
            loading={loading}
            style={styles.signInButton}
          />

          <TouchableOpacity style={styles.signUpLink} onPress={handleSignUp}>
            <Text style={styles.signUpText}>
              {t('signIn.noAccount')} <Text style={styles.signUpLinkText}>{t('signIn.signUp')}</Text>
            </Text>
          </TouchableOpacity>

          <LanguageSelector onLanguageChange={handleLanguageChange} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('signUp.footerText')}{' '}
              <Text style={styles.linkText} onPress={handlePrivacyPolicy}>
                {t('signUp.privacyPolicy')}
              </Text>
              {' '}{t('signUp.and')}{' '}
              <Text style={styles.linkText} onPress={handleTermsConditions}>
                {t('signUp.termsConditions')}
              </Text>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  signInButton: {
    marginBottom: 16,
  },
  signUpLink: {
    alignItems: 'center',
    marginBottom: 24,
  },
  signUpText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  signUpLinkText: {
    color: colors.primary,
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default SignInScreen;

