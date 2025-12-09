import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useAuth } from '../hooks/useAuth';
import { apiClient, apiService } from '../services/api';
import { checkAuthStatus } from '../store/slices/authSlice';

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
  const [allUsers, setAllUsers] = useState([]);
  const [phoneUsers, setPhoneUsers] = useState([]);
  const [selectedPhoneUser, setSelectedPhoneUser] = useState(null);
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [emailUsers, setEmailUsers] = useState([]);
  const [selectedEmailUser, setSelectedEmailUser] = useState(null);
  const [isSearchingEmail, setIsSearchingEmail] = useState(false);

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  useEffect(() => {
    if (showInviteModal) {
      fetchAllUsers();
    }
  }, [showInviteModal]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inviteEmail.trim().length > 0 && inviteEmail.includes('@')) {
        searchUserByEmail(inviteEmail.trim());
      } else {
        setEmailUsers([]);
        setSelectedEmailUser(null);
      }
    }, 500); // Debounce email search by 500ms

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
    }, 500); // Debounce phone search by 500ms

    return () => clearTimeout(timeoutId);
  }, [invitePhone]);

  const fetchFamilyMembers = async () => {
    try {
      setIsLoading(true);
      console.log('📞 Calling /auth/status to get family members...');
      
      // Call auth status endpoint to get user data including family members
      const response = await dispatch(checkAuthStatus()).unwrap();
      console.log('📋 Auth status response:', response);
      
      // Extract family members from userSubscription.familyMembers
      const familyMembersData = response?.userSubscription?.familyMembers || [];
      console.log('👨‍👩‍👧‍👦 Family members found:', familyMembersData.length);
      
      // Transform the data to include user info and role
      const transformedMembers = familyMembersData.map(member => ({
        id: member.id,
        userId: member.userId,
        role: member.role, // 'owner' or 'member'
        invitedAt: member.invitedAt,
        firstName: member.user?.firstName || '',
        lastName: member.user?.lastName || '',
        email: member.user?.email || '',
        phone: member.user?.phone || '',
        status: member.role === 'owner' ? 'active' : 'active', // All are active
      }));
      
      setFamilyMembers(transformedMembers);
    } catch (error) {
      console.error('Error fetching family members:', error);
      setFamilyMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await apiService.user.getAllUsers();
      console.log('📋 All users response:', response);
      
      // Handle different response structures
      let users = [];
      if (Array.isArray(response)) {
        users = response;
      } else if (response?.data && Array.isArray(response.data)) {
        users = response.data;
      } else if (response?.data?.users && Array.isArray(response.data.users)) {
        users = response.data.users;
      } else if (response?.users && Array.isArray(response.users)) {
        users = response.users;
      }
      
      // Filter out current user
      if (Array.isArray(users)) {
        const filteredUsers = users.filter(u => u && u.id !== user.id);
        setAllUsers(filteredUsers);
      } else {
        console.warn('⚠️ Users data is not an array:', users);
        setAllUsers([]);
      }
    } catch (error) {
      console.error('Error fetching all users:', error);
      setAllUsers([]);
    }
  };

  const searchUserByPhone = async (phone) => {
    if (!phone || phone.length < 3) {
      setPhoneUsers([]);
      setSelectedPhoneUser(null);
      return;
    }

    try {
      setIsSearchingPhone(true);
      // Call /users endpoint with phone query parameter
      const response = await apiService.user.getAllUsersWithParams({ phone });
      console.log('📞 Phone search response:', response);
      
      // Handle response structure: { results: [...], pages: {...}, totalCount: ... }
      let results = [];
      if (response?.results && Array.isArray(response.results)) {
        results = response.results;
      } else if (Array.isArray(response)) {
        results = response;
      } else if (response?.data && Array.isArray(response.data)) {
        results = response.data;
      } else if (response?.data?.users && Array.isArray(response.data.users)) {
        results = response.data.users;
      } else if (response?.users && Array.isArray(response.users)) {
        results = response.users;
      }
      
      console.log('📋 All results from API:', results);
      console.log('👤 Current user ID:', user?.id);
      console.log('👤 Current user object:', user);
      
      // Filter out current user, but allow super admins to be shown
      const filteredResults = results.filter(u => {
        if (!u) return false;
        // Don't filter out super admins - they should always be available to invite
        if (u.role === 'superAdmin' || u.role === 'admin') {
          console.log('✅ Keeping admin/superAdmin user:', u.id, u.role);
          return true;
        }
        // Filter out current user for regular users
        if (u.id === user?.id) {
          console.log('⚠️ Filtering out current user:', u.id);
          return false;
        }
        return true;
      });
      
      console.log('✅ Filtered results:', filteredResults);
      setPhoneUsers(filteredResults);
      
      // If only one user found, auto-select it
      if (filteredResults.length === 1) {
        handleSelectPhoneUser(filteredResults[0]);
      } else {
        setSelectedPhoneUser(null);
      }
    } catch (error) {
      console.error('Error searching user by phone:', error);
      setPhoneUsers([]);
      setSelectedPhoneUser(null);
    } finally {
      setIsSearchingPhone(false);
    }
  };

  const searchUserByEmail = async (email) => {
    if (!email || !email.includes('@') || email.length < 3) {
      setEmailUsers([]);
      setSelectedEmailUser(null);
      return;
    }

    try {
      setIsSearchingEmail(true);
      // Call /users endpoint with search query parameter (for email)
      const response = await apiService.user.getAllUsersWithParams({ search: email });
      console.log('📧 Email search response:', response);
      
      // Handle response structure: { results: [...], pages: {...}, totalCount: ... }
      let results = [];
      if (response?.results && Array.isArray(response.results)) {
        results = response.results;
      } else if (Array.isArray(response)) {
        results = response;
      } else if (response?.data && Array.isArray(response.data)) {
        results = response.data;
      } else if (response?.data?.users && Array.isArray(response.data.users)) {
        results = response.data.users;
      } else if (response?.users && Array.isArray(response.users)) {
        results = response.users;
      }
      
      console.log('📋 All results from API:', results);
      console.log('👤 Current user ID:', user?.id);
      
      // Filter out current user, but allow super admins to be shown
      const filteredResults = results.filter(u => {
        if (!u) return false;
        // Don't filter out super admins - they should always be available to invite
        if (u.role === 'superAdmin' || u.role === 'admin') {
          console.log('✅ Keeping admin/superAdmin user:', u.id, u.role);
          return true;
        }
        // Filter out current user for regular users
        if (u.id === user?.id) {
          console.log('⚠️ Filtering out current user:', u.id);
          return false;
        }
        return true;
      });
      
      console.log('✅ Filtered results:', filteredResults);
      setEmailUsers(filteredResults);
      
      // If only one user found, auto-select it
      if (filteredResults.length === 1) {
        handleSelectEmailUser(filteredResults[0]);
      } else {
        setSelectedEmailUser(null);
      }
    } catch (error) {
      console.error('Error searching user by email:', error);
      setEmailUsers([]);
      setSelectedEmailUser(null);
    } finally {
      setIsSearchingEmail(false);
    }
  };

  const handleSelectPhoneUser = (userToSelect) => {
    setSelectedPhoneUser(userToSelect);
    setInviteEmail(userToSelect.email || '');
    setInvitePhone(userToSelect.phone || '');
  };

  const handleSelectEmailUser = (userToSelect) => {
    setSelectedEmailUser(userToSelect);
    setInviteEmail(userToSelect.email || '');
    setInvitePhone(userToSelect.phone || '');
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

    // If a user was selected from phone or email search, use their ID in the URL path
    // The endpoint is: POST /users/invite-family-member/{userId}
    // userId in path should be the selected user's ID (the one being invited)
    
    const selectedUser = selectedPhoneUser || selectedEmailUser;
    
    if (!selectedUser?.id) {
      Alert.alert(
        t('family.error'), 
        t('family.selectUserFirst') || 'Please select a user from the list first'
      );
      return;
    }
    
    console.log('📤 Inviting user:', {
      selectedUserId: selectedUser.id,
      selectedUserName: `${selectedUser.firstName} ${selectedUser.lastName}`,
      email: inviteEmail,
      phone: invitePhone,
    });

    try {
      setIsInviting(true);
      // Use selected user's ID in the URL path
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
              // Refresh family members after successful invite
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
              console.log('🗑️ Removing family member with ID:', memberId);
              await apiService.user.removeFamilyMember(memberId);
              Alert.alert(t('family.success'), t('family.removeSuccess'));
              // Refresh family members after removal
              fetchFamilyMembers();
            } catch (error) {
              console.error('Error removing family member:', error);
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
    const displayName = member.firstName && member.lastName
      ? `${member.firstName} ${member.lastName}`
      : member.firstName || member.lastName || member.email || 'User';
    
    return (
      <View key={member.id} style={styles.memberCard}>
        <View style={styles.memberInfo}>
          <View style={styles.memberAvatar}>
            <Ionicons name="person" size={24} color={colors.primary} />
          </View>
          <View style={styles.memberDetails}>
            <View style={styles.memberNameRow}>
              <Text style={styles.memberName}>{displayName}</Text>
              {isOwner && (
                <View style={styles.ownerBadge}>
                  <Ionicons name="star" size={12} color={colors.orange[500]} />
                  <Text style={styles.ownerBadgeText}>{t('family.owner')}</Text>
                </View>
              )}
            </View>
            {member.email && <Text style={styles.memberContact}>{member.email}</Text>}
            {member.phone && <Text style={styles.memberContact}>{member.phone}</Text>}
            <View style={styles.memberStatus}>
              <View style={[styles.statusBadge, styles.statusActive]}>
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
            <Ionicons name="close-circle" size={24} color={colors.red[500]} />
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
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('family.inviteMember')}</Text>
            <TouchableOpacity onPress={() => {
              setShowInviteModal(false);
              setPhoneUsers([]);
              setSelectedPhoneUser(null);
              setEmailUsers([]);
              setSelectedEmailUser(null);
            }}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('family.email')}</Text>
              <View style={styles.phoneInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('family.emailPlaceholder')}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {isSearchingEmail && (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.phoneSearchLoader} />
                )}
              </View>
              
              {emailUsers.length > 0 && (
                <View style={styles.phoneUsersList}>
                  <Text style={styles.phoneUsersTitle}>
                    {emailUsers.length === 1 
                      ? t('family.userFound') 
                      : `${emailUsers.length} ${t('family.usersFound')}`}
                  </Text>
                  {emailUsers.map((emailUser) => (
                    <TouchableOpacity
                      key={emailUser.id}
                      style={[
                        styles.phoneUserItem,
                        selectedEmailUser?.id === emailUser.id && styles.phoneUserItemSelected
                      ]}
                      onPress={() => handleSelectEmailUser(emailUser)}
                    >
                      <View style={styles.phoneUserItemContent}>
                        <View style={styles.phoneUserAvatar}>
                          <Ionicons name="person" size={20} color={colors.primary} />
                        </View>
                        <View style={styles.phoneUserDetails}>
                          <Text style={styles.phoneUserName}>
                            {emailUser.firstName && emailUser.lastName
                              ? `${emailUser.firstName} ${emailUser.lastName}`
                              : emailUser.firstName || emailUser.lastName || 'User'}
                          </Text>
                          {emailUser.email && (
                            <Text style={styles.phoneUserEmail}>{emailUser.email}</Text>
                          )}
                        </View>
                        {selectedEmailUser?.id === emailUser.id && (
                          <Ionicons name="checkmark-circle" size={20} color={colors.green[500]} />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('family.phone')}</Text>
              <View style={styles.phoneInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('family.phonePlaceholder')}
                  value={invitePhone}
                  onChangeText={setInvitePhone}
                  keyboardType="phone-pad"
                />
                {isSearchingPhone && (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.phoneSearchLoader} />
                )}
              </View>
              
              {phoneUsers.length > 0 && (
                <View style={styles.phoneUsersList}>
                  <Text style={styles.phoneUsersTitle}>
                    {phoneUsers.length === 1 
                      ? t('family.userFound') 
                      : `${phoneUsers.length} ${t('family.usersFound')}`}
                  </Text>
                  {phoneUsers.map((phoneUser) => (
                    <TouchableOpacity
                      key={phoneUser.id}
                      style={[
                        styles.phoneUserItem,
                        selectedPhoneUser?.id === phoneUser.id && styles.phoneUserItemSelected
                      ]}
                      onPress={() => handleSelectPhoneUser(phoneUser)}
                    >
                      <View style={styles.phoneUserItemContent}>
                        <View style={styles.phoneUserAvatar}>
                          <Ionicons name="person" size={20} color={colors.primary} />
                        </View>
                        <View style={styles.phoneUserDetails}>
                          <Text style={styles.phoneUserName}>
                            {phoneUser.firstName && phoneUser.lastName
                              ? `${phoneUser.firstName} ${phoneUser.lastName}`
                              : phoneUser.firstName || phoneUser.lastName || 'User'}
                          </Text>
                          {phoneUser.email && (
                            <Text style={styles.phoneUserEmail}>{phoneUser.email}</Text>
                          )}
                        </View>
                        {selectedPhoneUser?.id === phoneUser.id && (
                          <Ionicons name="checkmark-circle" size={20} color={colors.green[500]} />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

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
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
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
            onPress={() => {
              fetchAllUsers();
              setShowInviteModal(true);
            }}
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
              onPress={() => {
                fetchAllUsers();
                setShowInviteModal(true);
              }}
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
  backButton: {
    padding: 4,
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
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  memberContact: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  memberStatus: {
    marginTop: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: colors.green[500] + '20',
  },
  statusPending: {
    backgroundColor: colors.orange[500] + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.primary,
  },
  removeButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  helpText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 8,
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  searchLoader: {
    marginLeft: 8,
  },
  searchResultsContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  searchResultContact: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneSearchLoader: {
    marginLeft: 8,
  },
  phoneUsersList: {
    marginTop: 12,
  },
  phoneUsersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  phoneUserItem: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  phoneUserItemSelected: {
    backgroundColor: colors.green[500] + '15',
    borderColor: colors.green[500],
  },
  phoneUserItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  phoneUserDetails: {
    flex: 1,
  },
  phoneUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  phoneUserEmail: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 20,
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

