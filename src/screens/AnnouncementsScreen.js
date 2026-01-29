import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { markAnnouncementsViewed } from '../store/slices/announcementSlice';

const AnnouncementsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { items, isLoading, error } = useAppSelector((state) => state.announcement);

  useEffect(() => {
    dispatch(markAnnouncementsViewed());
  }, [dispatch]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.title != null && item.title !== '' && (
        <Text style={styles.cardTitle}>{item.title}</Text>
      )}
      {(item.message != null && item.message !== '') && (
        <Text style={styles.cardMessage}>{item.message}</Text>
      )}
      {item.createdAt && (
        <Text style={styles.cardDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="notifications-off-outline" size={48} color={colors.gray[400]} />
      <Text style={styles.emptyText}>
        {t('announcements.empty') || 'No announcements'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('announcements.title') || 'Announcements'}
          {items.length > 0 ? ` (${items.length})` : ''}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {t('common.loading') || 'Loading...'}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.error}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.red[500]} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item?.id ?? item?.title ?? Math.random())}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={items.length === 0 ? styles.listEmpty : styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  listEmpty: {
    flexGrow: 1,
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  cardMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 12,
    color: colors.gray[400],
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 16,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.red[500],
    textAlign: 'center',
  },
});

export default AnnouncementsScreen;
