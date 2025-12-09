import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const AccessByQRCodeScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const service = route?.params?.service;
  const handleCreateQRCode = () => {
    navigation.navigate('GenerateQRCode', { service });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('qr.accessByQRCode')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.qrIconContainer}>
          <View style={styles.qrIcon}>
            <Ionicons name="qr-code" size={80} color={colors.gray[400]} />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{t('qr.createOneTimeQR')}</Text>
          <Text style={styles.subtitle}>{t('qr.createOneTimeQRSubtitle')}</Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={24} color={colors.green[500]} />
            <Text style={styles.featureText}>{t('qr.secureAccess')}</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="time" size={24} color={colors.blue[500]} />
            <Text style={styles.featureText}>{t('qr.timeLimited')}</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="people" size={24} color={colors.orange[500]} />
            <Text style={styles.featureText}>{t('qr.visitorTypes')}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.createButton} onPress={handleCreateQRCode}>
          <Text style={styles.createButtonText}>{t('qr.createQRCode')}</Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrIconContainer: {
    marginBottom: 40,
  },
  qrIcon: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 12,
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
});

export default AccessByQRCodeScreen;