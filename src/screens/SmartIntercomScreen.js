import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const SmartIntercomScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const accessOptions = [
    {
      id: 'qr',
      title: 'QR Code Access',
      subtitle: 'Generate a QR code for one-time access',
      icon: 'qr-code',
      iconColor: colors.blue[500],
      onPress: () => navigation.navigate('AccessByQRCode', { service: 'smart_intercom' }),
    },
    {
      id: 'pin',
      title: 'PIN Code Access',
      subtitle: 'Use a secure PIN code to unlock',
      icon: 'keypad',
      iconColor: colors.green[500],
      onPress: () => {
        // TODO: Navigate to PIN access screen
        navigation.navigate('PinAccess', { service: 'smart_intercom' });
      },
    },
    {
      id: 'face',
      title: 'Face Recognition',
      subtitle: 'Unlock using facial recognition',
      icon: 'person',
      iconColor: colors.orange[500],
      onPress: () => {
        // TODO: Navigate to face recognition screen
        navigation.navigate('FaceRecognition', { service: 'smart_intercom' });
      },
    },
  ];

  const renderOptionCard = (option) => (
    <TouchableOpacity
      key={option.id}
      style={styles.optionCard}
      onPress={option.onPress}
    >
      <View style={[styles.optionIcon, { backgroundColor: option.iconColor + '20' }]}>
        <Ionicons name={option.icon} size={32} color={option.iconColor} />
      </View>
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{option.title}</Text>
        <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.gray[400]} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Intercom</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoSection}>
          <View style={styles.infoIcon}>
            <Ionicons name="call" size={40} color={colors.primary} />
          </View>
          <Text style={styles.infoTitle}>Choose Access Method</Text>
          <Text style={styles.infoSubtitle}>
            Select how you want to access your smart intercom system
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {accessOptions.map(option => renderOptionCard(option))}
        </View>

        <View style={styles.helpSection}>
          <Ionicons name="information-circle" size={20} color={colors.blue[500]} />
          <Text style={styles.helpText}>
            Each access method provides secure entry to your building's intercom system
          </Text>
        </View>
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
  infoSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  infoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  infoSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.blue[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: colors.blue[700],
    marginLeft: 12,
    lineHeight: 20,
  },
});

export default SmartIntercomScreen;

