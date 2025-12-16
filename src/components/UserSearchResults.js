import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../constants/colors';
import UserListItem from './UserListItem';

const UserSearchResults = ({ users, selectedUser, onSelectUser }) => {
  const { t } = useTranslation();

  if (users.length === 0) {
    return null;
  }

  return (
    <View style={styles.resultsList}>
      <Text style={styles.resultsTitle}>
        {users.length === 1
          ? t('family.userFound')
          : `${users.length} ${t('family.usersFound')}`}
      </Text>
      {users.map((user) => (
        <UserListItem
          key={user.id}
          user={user}
          isSelected={selectedUser?.id === user.id}
          onSelect={onSelectUser}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  resultsList: {
    marginTop: 12,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
});

export default UserSearchResults;

