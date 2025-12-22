import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../store/hooks';
import { apiService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { formatDate, formatPrice } from '../utils/formatters';
import { getServiceIcon, getServiceColor, getStatusColor } from '../utils/serviceHelpers';

const SubscriptionsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAppSelector(state => state.auth);
  
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, [user?.id]);

  const fetchSubscriptions = async () => {
    if (!user?.id) {
      console.error('❌ No user ID available - User needs to sign in');
      Alert.alert(
        'Authentication Required',
        'Please sign in to view your subscriptions.',
        [
          {
            text: 'Sign In',
            onPress: () => navigation.navigate('SignIn')
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('📡 Fetching subscriptions for user:', user.id);
      
      const response = await apiService.subscriptions.getUserSubscriptions(user.id);
      console.log('✅ Subscriptions response:', response);
      
      let subscriptionsData = [];
      
      if (Array.isArray(response)) {
        subscriptionsData = response;
      } else if (Array.isArray(response?.data)) {
        subscriptionsData = response.data;
      } else if (Array.isArray(response?.subscriptions)) {
        subscriptionsData = response.subscriptions;
      } else if (response && typeof response === 'object') {
        const subscription = {
          id: response.id,
          service_name: response.subscription?.name || 'Service',
          service_type: response.subscription?.name?.toLowerCase() || 'service',
          status: response.expireDate ? (new Date(response.expireDate) > new Date() ? 'active' : 'expired') : 'active',
          start_date: response.createdAt,
          end_date: response.expireDate,
          price: response.subscription?.price || 0,
          currency: 'AMD',
          description: response.subscription?.description || '',
          device: response.device,
        };
        subscriptionsData = [subscription];
      }
      
      setSubscriptions(subscriptionsData);
      console.log(`✅ Loaded ${subscriptionsData.length} subscriptions`);
    } catch (error) {
      if (error?.status === 404 || error?.data?.statusCode === 404) {
        console.log('ℹ️ User has no subscriptions (404) - treating as empty array');
        setSubscriptions([]);
        return;
      }
      
      console.error('❌ Failed to fetch subscriptions:', error);
      Alert.alert(
        t('common.error'),
        'Failed to load subscriptions. Please try again.'
      );
      setSubscriptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSubscriptions();
    setIsRefreshing(false);
  };

  const renderSubscriptionCard = (subscription) => {
    const statusColors = getStatusColor(subscription.status);
    
    return (
      <View key={subscription.id} style={styles.subscriptionCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.serviceIcon, { backgroundColor: getServiceColor(subscription.service_type) + '20' }]}>
            <Ionicons 
              name={getServiceIcon(subscription.service_type)} 
              size={24} 
              color={getServiceColor(subscription.service_type)} 
            />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{subscription.service_name || subscription.name || 'Service'}</Text>
            <Text style={styles.serviceType}>{subscription.service_type || 'N/A'}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {subscription.status || 'Unknown'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.gray?.[500] || '#6B7280'} />
            <Text style={styles.detailLabel}>{t('profile.startDate')}:</Text>
            <Text style={styles.detailValue}>{formatDate(subscription.start_date || subscription.startDate)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.gray?.[500] || '#6B7280'} />
            <Text style={styles.detailLabel}>{t('profile.endDate')}:</Text>
            <Text style={styles.detailValue}>{formatDate(subscription.end_date || subscription.endDate)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color={colors.gray?.[500] || '#6B7280'} />
            <Text style={styles.detailLabel}>{t('profile.price')}:</Text>
            <Text style={styles.detailValue}>
              {formatPrice(subscription.price, subscription.currency || 'AMD')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={64} color={colors.gray?.[300] || '#D1D5DB'} />
      <Text style={styles.emptyTitle}>{t('profile.noServices')}</Text>
      <Text style={styles.emptySubtitle}>{t('profile.noServicesSubtitle')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text?.primary || '#111827'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscriptions</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={colors.primary || '#3C0056'} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary || '#3C0056'} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary || '#3C0056'}
            />
          }
        >
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('profile.yourServices')}</Text>
            <Text style={styles.subtitle}>{t('profile.servicesSubtitle')}</Text>
          </View>

          {subscriptions.length > 0 ? (
            subscriptions.map(subscription => renderSubscriptionCard(subscription))
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  refreshButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleContainer: {
    paddingVertical: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
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
    color: '#111827',
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  statusContainer: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default SubscriptionsScreen;

