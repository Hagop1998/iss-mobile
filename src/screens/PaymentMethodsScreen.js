import React, { useEffect } from 'react';
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
import { fetchPaymentMethods, deletePaymentMethod } from '../store/slices/profileSlice';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const PaymentMethodsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  
  const { user } = useAppSelector(state => state.auth);
  const { paymentMethods, isLoading } = useAppSelector(state => state.profile);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchPaymentMethods(user.id));
    }
  }, [user?.id, dispatch]);

  const getCardIcon = (brand) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return 'card';
      case 'mastercard':
        return 'card';
      case 'amex':
        return 'card';
      default:
        return 'card';
    }
  };

  const getCardColor = (brand) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return colors.blue[500];
      case 'mastercard':
        return colors.red[500];
      case 'amex':
        return colors.green[500];
      default:
        return colors.gray[500];
    }
  };

  const formatExpiryDate = (month, year) => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  const handleDeletePaymentMethod = (methodId, methodName) => {
    Alert.alert(
      t('profile.deletePaymentMethod'),
      t('profile.deletePaymentMethodConfirm', { method: methodName }),
      [
        { text: t('profile.cancel'), style: 'cancel' },
        { 
          text: t('profile.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deletePaymentMethod(methodId)).unwrap();
              Alert.alert(t('common.success'), t('profile.paymentMethodDeleted'));
            } catch (error) {
              Alert.alert(t('common.error'), error || t('profile.deleteFailed'));
            }
          }
        }
      ]
    );
  };

  const handleAddPaymentMethod = () => {
    Alert.alert(t('profile.addPaymentMethod'), t('profile.addPaymentMethodComingSoon'));
  };

  const renderPaymentMethodCard = (method) => (
    <View key={method.id} style={styles.paymentCard}>
      <View style={styles.paymentCardHeader}>
        <View style={styles.paymentCardInfo}>
          <View style={[styles.paymentCardIcon, { backgroundColor: getCardColor(method.brand) + '20' }]}>
            <Ionicons 
              name={getCardIcon(method.brand)} 
              size={24} 
              color={getCardColor(method.brand)} 
            />
          </View>
          <View style={styles.paymentCardDetails}>
            <Text style={styles.paymentCardBrand}>{method.brand}</Text>
            <Text style={styles.paymentCardNumber}>
              •••• •••• •••• {method.lastFour}
            </Text>
            <Text style={styles.paymentCardExpiry}>
              {t('profile.expires')} {formatExpiryDate(method.expiryMonth, method.expiryYear)}
            </Text>
          </View>
        </View>
        <View style={styles.paymentCardActions}>
          {method.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>{t('profile.default')}</Text>
            </View>
          )}
          <TouchableOpacity 
            onPress={() => handleDeletePaymentMethod(method.id, `${method.brand} •••• ${method.lastFour}`)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color={colors.red[500]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="card-outline" size={64} color={colors.gray[300]} />
      <Text style={styles.emptyStateTitle}>{t('profile.noPaymentMethods')}</Text>
      <Text style={styles.emptyStateSubtitle}>{t('profile.noPaymentMethodsSubtitle')}</Text>
      <TouchableOpacity style={styles.addButton} onPress={handleAddPaymentMethod}>
        <Text style={styles.addButtonText}>{t('profile.addPaymentMethod')}</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile.paymentMethods')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.paymentMethods')}</Text>
        <TouchableOpacity onPress={handleAddPaymentMethod} style={styles.addButton}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.paymentMethodsHeader}>
          <Text style={styles.paymentMethodsTitle}>
            {t('profile.yourPaymentMethods')} ({paymentMethods.length})
          </Text>
          <Text style={styles.paymentMethodsSubtitle}>
            {t('profile.paymentMethodsSubtitle')}
          </Text>
        </View>

        {paymentMethods.length > 0 ? (
          <View style={styles.paymentMethodsList}>
            {paymentMethods.map(renderPaymentMethodCard)}
          </View>
        ) : (
          renderEmptyState()
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  paymentMethodsHeader: {
    paddingVertical: 24,
  },
  paymentMethodsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  paymentMethodsSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  paymentMethodsList: {
    paddingBottom: 24,
  },
  paymentCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentCardDetails: {
    flex: 1,
  },
  paymentCardBrand: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  paymentCardNumber: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  paymentCardExpiry: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  paymentCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultBadge: {
    backgroundColor: colors.green[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  defaultBadgeText: {
    fontSize: 12,
    color: colors.green[700],
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '500',
  },
});

export default PaymentMethodsScreen;
