import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { getUserDisplayName } from '../utils/userHelpers';

const UserListItem = ({ user, isSelected, onSelect }) => {
  const displayName = getUserDisplayName(user);

  return (
    <TouchableOpacity
      style={[styles.userItem, isSelected && styles.userItemSelected]}
      onPress={() => onSelect(user)}
    >
      <View style={styles.userItemContent}>
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={20} color={colors.primary} />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{displayName}</Text>
          {user.email && (
            <Text style={styles.userEmail}>{user.email}</Text>
          )}
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={colors.green[500]} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  userItem: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  userItemSelected: {
    backgroundColor: colors.green[500] + '15',
    borderColor: colors.green[500],
  },
  userItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});

export default UserListItem;

