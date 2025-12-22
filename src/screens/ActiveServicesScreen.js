import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../store/hooks';
import { apiService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { formatDate, formatPrice } from '../utils/formatters';
import { getServiceIcon, getServiceColor } from '../utils/serviceHelpers';

const ActiveServicesScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAppSelector(state => state.auth);
  
  const [subscriptions, setSubscriptions] = useState([]);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchSubscriptionsData();
    }
  }, [user?.id]);

  const fetchSubscriptionsData = async () => {
    try {
      setIsLoading(true);
      console.log('📡 Fetching all subscriptions and user subscriptions...');
      
      let allSubs = [];
      try {
        const allSubscriptionsResponse = await apiService.subscriptions.getSubscriptions();
        console.log('✅ All subscriptions:', allSubscriptionsResponse);
        
        if (Array.isArray(allSubscriptionsResponse)) {
          allSubs = allSubscriptionsResponse;
        } else if (Array.isArray(allSubscriptionsResponse?.data)) {
          allSubs = allSubscriptionsResponse.data;
        } else if (Array.isArray(allSubscriptionsResponse?.results)) {
          allSubs = allSubscriptionsResponse.results;
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch all subscriptions:', error);
      }
      
      let userSubs = [];
      try {
        const userSubscriptionsResponse = await apiService.subscriptions.getUserSubscriptions(user.id);
        console.log('✅ User subscriptions:', userSubscriptionsResponse);
        
        if (Array.isArray(userSubscriptionsResponse)) {
          userSubs = userSubscriptionsResponse;
        } else if (Array.isArray(userSubscriptionsResponse?.data)) {
          userSubs = userSubscriptionsResponse.data;
        } else if (userSubscriptionsResponse && typeof userSubscriptionsResponse === 'object') {
          userSubs = [userSubscriptionsResponse];
        }
      } catch (error) {
        if (error?.status === 404 || error?.data?.statusCode === 404) {
          console.log('ℹ️ User has no subscriptions (404) - treating as empty array');
          userSubs = [];
        } else {
          console.warn('⚠️ Failed to fetch user subscriptions:', error);
        }
      }
      
      setSubscriptions(allSubs);
      setUserSubscriptions(userSubs);
      
      console.log(`✅ Loaded ${allSubs.length} total subscriptions, ${userSubs.length} user subscriptions`);
    } catch (error) {
      console.error('❌ Failed to fetch subscriptions:', error);
      Alert.alert(
        t('common.error'),
        'Failed to load subscriptions. Please try again.'
      );
      setSubscriptions([]);
      setUserSubscriptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const isUserSubscribed = (subscriptionId) => {
    return userSubscriptions.some(userSub => 
      userSub.subscriptionId === subscriptionId || userSub.subscription?.id === subscriptionId
    );
  };

  const getUserSubscriptionDetails = (subscriptionId) => {
    return userSubscriptions.find(userSub => 
      userSub.subscriptionId === subscriptionId || userSub.subscription?.id === subscriptionId
    );
  };


  const renderServiceCard = (subscription) => {
    const isActive = isUserSubscribed(subscription.id);
    const userSubDetails = getUserSubscriptionDetails(subscription.id);
    
    const serviceName = subscription.name || subscription.service_name || 'Service';
    const serviceColor = getServiceColor(serviceName);
    const statusColor = isActive ? colors.green?.[100] || '#D1FAE5' : colors.gray?.[100] || '#F3F4F6';
    const statusTextColor = isActive ? colors.green?.[700] || '#047857' : colors.gray?.[500] || '#6B7280';
    
    return (
      <View key={subscription.id} style={styles.serviceCard}>
        <View style={styles.serviceHeader}>
          <View style={[styles.serviceIcon, { backgroundColor: serviceColor + '20' }]}>
            <Ionicons 
              name={getServiceIcon(serviceName)} 
              size={24} 
              color={serviceColor} 
            />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{serviceName}</Text>
            <Text style={styles.serviceType}>{subscription.description || ''}</Text>
          </View>
          <View style={styles.serviceStatus}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={[styles.statusText, { color: statusTextColor }]}>
                {isActive ? t('profile.active') : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
        
        {isActive && userSubDetails && (
          <View style={styles.serviceDetails}>
            <View style={styles.serviceDetailRow}>
              <Text style={styles.serviceDetailLabel}>{t('profile.startDate')}:</Text>
              <Text style={styles.serviceDetailValue}>
                {formatDate(userSubDetails.createdAt || userSubDetails.start_date)}
              </Text>
            </View>
            <View style={styles.serviceDetailRow}>
              <Text style={styles.serviceDetailLabel}>{t('profile.endDate')}:</Text>
              <Text style={styles.serviceDetailValue}>
                {formatDate(userSubDetails.expireDate || userSubDetails.end_date)}
              </Text>
            </View>
            <View style={styles.serviceDetailRow}>
              <Text style={styles.serviceDetailLabel}>{t('profile.price')}:</Text>
              <Text style={[styles.serviceDetailValue, styles.priceText]}>
                {formatPrice(subscription.price, 'AMD')}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="settings-outline" size={64} color={colors.gray[300]} />
      <Text style={styles.emptyStateTitle}>{t('profile.noServices')}</Text>
      <Text style={styles.emptyStateSubtitle}>{t('profile.noServicesSubtitle')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.activeServices')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.servicesHeader}>
            <Text style={styles.servicesTitle}>
              {t('profile.yourServices')} ({subscriptions.length})
            </Text>
            <Text style={styles.servicesSubtitle}>
              {t('profile.servicesSubtitle')}
            </Text>
          </View>

          {subscriptions.length > 0 ? (
            <View style={styles.servicesList}>
              {subscriptions.map(renderServiceCard)}
            </View>
          ) : (
            renderEmptyState()
          )}
        </ScrollView>
      )}
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
  servicesHeader: {
    paddingVertical: 24,
  },
  servicesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  servicesSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  servicesList: {
    paddingBottom: 24,
  },
  serviceCard: {
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
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  serviceStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  serviceDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: 16,
  },
  serviceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceDetailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  serviceDetailValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  priceText: {
    color: colors.green[600],
    fontWeight: '600',
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
  },
});

export default ActiveServicesScreen;
