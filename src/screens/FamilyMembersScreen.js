import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useAppDispatch } from '../store/hooks';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { checkAuthStatus } from '../store/slices/authSlice';
import { parseApiResponse, filterUsers, getUserDisplayName } from '../utils/userHelpers';
import UserSearchInput from '../components/UserSearchInput';
import UserSearchResults from '../components/UserSearchResults';
import TabBar from '../components/TabBar';

const FamilyMembersScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const [familyMembers, setFamilyMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [phoneUsers, setPhoneUsers] = useState([]);
  const [selectedPhoneUser, setSelectedPhoneUser] = useState(null);
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [emailUsers, setEmailUsers] = useState([]);
  const [selectedEmailUser, setSelectedEmailUser] = useState(null);
  const [isSearchingEmail, setIsSearchingEmail] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Family');

  useEffect(() => {
    fetchFamilyMembers();
  }, []);


  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inviteEmail.trim().length > 0 && inviteEmail.includes('@')) {
        searchUserByEmail(inviteEmail.trim());
      } else {
        setEmailUsers([]);
        setSelectedEmailUser(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [inviteEmail]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (invitePhone.trim().length > 0) {
        searchUserByPhone(invitePhone.trim());
      } else {
        setPhoneUsers([]);
        setSelectedPhoneUser(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [invitePhone]);

  const fetchFamilyMembers = async () => {
    try {
      setIsLoading(true);
      const response = await dispatch(checkAuthStatus()).unwrap();
      const familyMembersData = response?.userSubscription?.familyMembers || [];

      const transformedMembers = familyMembersData.map(member => ({
        id: member.id,
        userId: member.userId,
        role: member.role,
        invitedAt: member.invitedAt,
        firstName: member.user?.firstName || '',
        lastName: member.user?.lastName || '',
        email: member.user?.email || '',
        phone: member.user?.phone || '',
        status: 'active',
      }));

      setFamilyMembers(transformedMembers);
    } catch (error) {
      setFamilyMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async (searchType, value, setUsers, setSelectedUser, setIsSearching, handleSelect) => {
    const minLength = searchType === 'phone' ? 3 : 3;
    const isValidEmail = searchType === 'email' && value.includes('@');

    if (!value || value.length < minLength || (searchType === 'email' && !isValidEmail)) {
      setUsers([]);
      setSelectedUser(null);
      return;
    }

    try {
      setIsSearching(true);
      const response = await apiService.user.getAllUsersWithParams(
        searchType === 'phone' ? { phone: value } : { search: value }
      );
      const results = parseApiResponse(response);
      const filteredResults = filterUsers(results, user?.id);
      setUsers(filteredResults);

      if (filteredResults.length === 1) {
        handleSelect(filteredResults[0]);
      } else {
        setSelectedUser(null);
      }
    } catch (error) {
      setUsers([]);
      setSelectedUser(null);
    } finally {
      setIsSearching(false);
    }
  };

  const searchUserByPhone = (phone) => {
    searchUsers(
      'phone',
      phone,
      setPhoneUsers,
      setSelectedPhoneUser,
      setIsSearchingPhone,
      handleSelectUser
    );
  };

  const searchUserByEmail = (email) => {
    searchUsers(
      'email',
      email,
      setEmailUsers,
      setSelectedEmailUser,
      setIsSearchingEmail,
      handleSelectUser
    );
  };

  const handleSelectUser = (userToSelect) => {
    if (userToSelect.email) {
      setSelectedEmailUser(userToSelect);
      setSelectedPhoneUser(null);
      setInviteEmail(userToSelect.email);
    } else {
      setSelectedPhoneUser(userToSelect);
      setSelectedEmailUser(null);
    }
    setInvitePhone(userToSelect.phone || '');
  };

  const handleCloseModal = () => {
    setShowInviteModal(false);
    setPhoneUsers([]);
    setSelectedPhoneUser(null);
    setEmailUsers([]);
    setSelectedEmailUser(null);
    setInviteEmail('');
    setInvitePhone('');
  };

  const handleInvite = async () => {
    if (!inviteEmail && !invitePhone) {
      Alert.alert(t('family.error'), t('family.emailOrPhoneRequired'));
      return;
    }

    if (inviteEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      Alert.alert(t('family.error'), t('family.invalidEmail'));
      return;
    }


    const selectedUser = selectedPhoneUser || selectedEmailUser;

    if (!selectedUser?.id) {
      Alert.alert(
        t('family.error'),
        t('family.selectUserFirst') || 'Please select a user from the list first'
      );
      return;
    }

    try {
      setIsInviting(true);
      await apiService.family.invite(selectedUser.id, {
        email: inviteEmail || undefined,
        phone: invitePhone || undefined,
      });

      Alert.alert(
        t('family.success'),
        t('family.inviteSuccess'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              setShowInviteModal(false);
              setInviteEmail('');
              setInvitePhone('');
              setPhoneUsers([]);
              setSelectedPhoneUser(null);
              setEmailUsers([]);
              setSelectedEmailUser(null);
              setTimeout(() => {
                fetchFamilyMembers();
              }, 500);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error inviting family member:', error);
      const errorMessage = error?.data?.message || error?.message || t('family.inviteError');
      Alert.alert(t('family.error'), errorMessage);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = (memberId) => {
    Alert.alert(
      t('family.removeMember'),
      t('family.removeConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.user.removeFamilyMember(memberId);
              Alert.alert(t('family.success'), t('family.removeSuccess'));
              fetchFamilyMembers();
            } catch (error) {
              const errorMessage = error?.data?.message || error?.message || t('family.removeError');
              Alert.alert(t('family.error'), errorMessage);
            }
          },
        },
      ]
    );
  };

  const renderMemberCard = (member) => {
    const isOwner = member.role === 'owner';
    const displayName = getUserDisplayName(member);

    return (
      <View key={member.id} style={styles.memberCard}>
        <View style={styles.memberInfo}>
          <View style={[styles.memberAvatar, isOwner && styles.memberAvatarOwner]}>
            <Ionicons name="person" size={28} color={isOwner ? colors.orange[500] : colors.primary} />
          </View>
          <View style={styles.memberDetails}>
            <View style={styles.memberNameRow}>
              <Text style={styles.memberName}>{displayName}</Text>
              {isOwner && (
                <View style={styles.ownerBadge}>
                  <Ionicons name="star" size={14} color={colors.orange[500]} />
                  <Text style={styles.ownerBadgeText}>{t('family.owner')}</Text>
                </View>
              )}
            </View>
            <View style={styles.memberContactContainer}>
              {member.email && (
                <View style={styles.contactRow}>
                  <Ionicons name="mail-outline" size={14} color={colors.text.secondary} />
                  <Text style={styles.memberContact}>{member.email}</Text>
                </View>
              )}
              {member.phone && (
                <View style={styles.contactRow}>
                  <Ionicons name="call-outline" size={14} color={colors.text.secondary} />
                  <Text style={styles.memberContact}>{member.phone}</Text>
                </View>
              )}
            </View>
            <View style={styles.memberStatus}>
              <View style={[styles.statusBadge, styles.statusActive]}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{t('family.active')}</Text>
              </View>
            </View>
          </View>
        </View>
        {!isOwner && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveMember(member.id)}
          >
            <Ionicons name="trash-outline" size={20} color={colors.red[500]} />
          </TouchableOpacity>
        )}
      </View>
    );
  };


  const renderInviteModal = () => (
    <Modal
      visible={showInviteModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowInviteModal(false)}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('family.inviteMember')}</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <UserSearchInput
                label={t('family.email')}
                placeholder={t('family.emailPlaceholder')}
                value={inviteEmail}
                onChangeText={setInviteEmail}
                keyboardType="email-address"
                isLoading={isSearchingEmail}
              >
                <UserSearchResults
                  users={emailUsers}
                  selectedUser={selectedEmailUser}
                  onSelectUser={handleSelectUser}
                />
              </UserSearchInput>

              <UserSearchInput
                label={t('family.phone')}
                placeholder={t('family.phonePlaceholder')}
                value={invitePhone}
                onChangeText={setInvitePhone}
                keyboardType="phone-pad"
                isLoading={isSearchingPhone}
              >
                <UserSearchResults
                  users={phoneUsers}
                  selectedUser={selectedPhoneUser}
                  onSelectUser={handleSelectUser}
                />
              </UserSearchInput>

              <Text style={styles.helpText}>{t('family.inviteHelp')}</Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowInviteModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.inviteButton, isInviting && styles.disabledButton]}
                onPress={handleInvite}
                disabled={isInviting}
              >
                {isInviting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.inviteButtonText}>{t('family.sendInvite')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>{t('family.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="people" size={32} color={colors.primary} />
          <Text style={styles.infoTitle}>{t('family.subtitle')}</Text>
          <Text style={styles.infoText}>{t('family.description')}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('family.members')}</Text>
          <TouchableOpacity
            style={styles.inviteButtonHeader}
            onPress={() => setShowInviteModal(true)}
          >
            <Ionicons name="person-add" size={20} color={colors.primary} />
            <Text style={styles.inviteButtonTextHeader}>{t('family.invite')}</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : familyMembers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.gray[400]} />
            <Text style={styles.emptyText}>{t('family.noMembers')}</Text>
            <Text style={styles.emptySubtext}>{t('family.inviteFirst')}</Text>
            <TouchableOpacity
              style={styles.emptyInviteButton}
              onPress={() => setShowInviteModal(true)}
            >
              <Ionicons name="person-add" size={20} color={colors.white} />
              <Text style={styles.emptyInviteButtonText}>{t('family.inviteMember')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.membersList}>
            {familyMembers.map(renderMemberCard)}
          </View>
        )}
      </ScrollView>

      <TabBar activeTab={selectedTab} onTabPress={setSelectedTab} navigation={navigation} />

      {renderInviteModal()}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  inviteButtonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inviteButtonTextHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyInviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyInviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 8,
  },
  membersList: {
    marginBottom: 20,
  },
  memberCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: colors.primary + '30',
  },
  memberAvatarOwner: {
    backgroundColor: colors.orange[500] + '15',
    borderColor: colors.orange[500] + '30',
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: 8,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.orange[500] + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ownerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.orange[700],
  },
  memberContactContainer: {
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  memberContact: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  memberStatus: {
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  statusActive: {
    backgroundColor: colors.green[500] + '15',
  },
  statusPending: {
    backgroundColor: colors.orange[500] + '15',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green[500],
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.green[700],
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: colors.red[500] + '10',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalBody: {
    padding: 20,
  },
  helpText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 8,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray[200],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  inviteButton: {
    backgroundColor: colors.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default FamilyMembersScreen;

