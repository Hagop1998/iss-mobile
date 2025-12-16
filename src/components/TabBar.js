import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const TabBar = ({ activeTab, onTabPress, navigation }) => {
  const { t } = useTranslation();

  const tabs = [
    {
      id: 'Home',
      icon: 'home',
      label: t('home.title'),
      route: 'Home',
    },
    {
      id: 'Family',
      icon: 'people',
      label: t('family.title'),
      route: 'FamilyMembers',
    },
    {
      id: 'Payment',
      icon: 'card',
      label: t('profile.payment'),
      route: 'PaymentMethods',
    },
    {
      id: 'Profile',
      icon: 'person',
      label: t('home.profile'),
      route: 'Profile',
      isProfile: true,
    },
  ];

  const handleTabPress = (tab) => {
    if (tab.route && navigation) {
      navigation.navigate(tab.route);
    }
    if (onTabPress) {
      onTabPress(tab.id);
    }
  };

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => handleTabPress(tab)}
          >
            {tab.isProfile ? (
              <View style={styles.profileIcon}>
                <Ionicons name={tab.icon} size={20} color={colors.white} />
              </View>
            ) : (
              <Ionicons
                name={tab.icon}
                size={24}
                color={isActive ? colors.white : colors.gray[400]}
              />
            )}
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.white,
  },
  profileIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.orange[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TabBar;

