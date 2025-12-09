import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const ServiceBenefitsModal = ({ visible, onClose, onContinue, service }) => {
  const { t } = useTranslation();

  const getServiceBenefits = () => {
    switch (service) {
      case 'smart_intercom':
        return {
          title: t('services.smartIntercom.title'),
          subtitle: t('services.smartIntercom.subtitle'),
          icon: 'call',
          color: colors.primary,
          benefits: [
            {
              icon: 'shield-checkmark',
              title: t('services.smartIntercom.benefit1.title'),
              description: t('services.smartIntercom.benefit1.description'),
            },
            {
              icon: 'videocam',
              title: t('services.smartIntercom.benefit2.title'),
              description: t('services.smartIntercom.benefit2.description'),
            },
            {
              icon: 'time',
              title: t('services.smartIntercom.benefit3.title'),
              description: t('services.smartIntercom.benefit3.description'),
            },
            {
              icon: 'people',
              title: t('services.smartIntercom.benefit4.title'),
              description: t('services.smartIntercom.benefit4.description'),
            },
          ],
        };
      case 'elevator':
        return {
          title: t('services.elevator.title'),
          subtitle: t('services.elevator.subtitle'),
          icon: 'business',
          color: colors.blue[500],
          benefits: [
            {
              icon: 'speedometer',
              title: t('services.elevator.benefit1.title'),
              description: t('services.elevator.benefit1.description'),
            },
            {
              icon: 'lock-closed',
              title: t('services.elevator.benefit2.title'),
              description: t('services.elevator.benefit2.description'),
            },
            {
              icon: 'analytics',
              title: t('services.elevator.benefit3.title'),
              description: t('services.elevator.benefit3.description'),
            },
            {
              icon: 'settings',
              title: t('services.elevator.benefit4.title'),
              description: t('services.elevator.benefit4.description'),
            },
          ],
        };
      case 'surveillance_cameras':
        return {
          title: t('services.surveillanceCameras.title'),
          subtitle: t('services.surveillanceCameras.subtitle'),
          icon: 'videocam',
          color: colors.green[500],
          benefits: [
            {
              icon: 'eye',
              title: t('services.surveillanceCameras.benefit1.title'),
              description: t('services.surveillanceCameras.benefit1.description'),
            },
            {
              icon: 'cloud-upload',
              title: t('services.surveillanceCameras.benefit2.title'),
              description: t('services.surveillanceCameras.benefit2.description'),
            },
            {
              icon: 'notifications',
              title: t('services.surveillanceCameras.benefit3.title'),
              description: t('services.surveillanceCameras.benefit3.description'),
            },
            {
              icon: 'recording',
              title: t('services.surveillanceCameras.benefit4.title'),
              description: t('services.surveillanceCameras.benefit4.description'),
            },
          ],
        };
      case 'barrier':
        return {
          title: t('services.barrier.title'),
          subtitle: t('services.barrier.subtitle'),
          icon: 'car',
          color: colors.orange[500],
          benefits: [
            {
              icon: 'shield',
              title: t('services.barrier.benefit1.title'),
              description: t('services.barrier.benefit1.description'),
            },
            {
              icon: 'flash',
              title: t('services.barrier.benefit2.title'),
              description: t('services.barrier.benefit2.description'),
            },
            {
              icon: 'stats-chart',
              title: t('services.barrier.benefit3.title'),
              description: t('services.barrier.benefit3.description'),
            },
            {
              icon: 'phone-portrait',
              title: t('services.barrier.benefit4.title'),
              description: t('services.barrier.benefit4.description'),
            },
          ],
        };
      default:
        return null;
    }
  };

  const serviceData = getServiceBenefits();

  if (!serviceData) return null;

  const handleContinue = () => {
    onContinue();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modal}>
              <View style={styles.header}>
                <View style={[styles.serviceIcon, { backgroundColor: serviceData.color + '20' }]}>
                  <Ionicons name={serviceData.icon} size={32} color={serviceData.color} />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.title}>{serviceData.title}</Text>
                  <Text style={styles.subtitle}>{serviceData.subtitle}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.benefitsContainer}>
                  {serviceData.benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <View style={[styles.benefitIcon, { backgroundColor: serviceData.color + '20' }]}>
                        <Ionicons name={benefit.icon} size={20} color={serviceData.color} />
                      </View>
                      <View style={styles.benefitContent}>
                        <Text style={styles.benefitTitle}>{benefit.title}</Text>
                        <Text style={styles.benefitDescription}>{benefit.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.continueButton, { backgroundColor: serviceData.color }]} 
                  onPress={handleContinue}
                >
                  <Text style={styles.continueButtonText}>{t('services.continue')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  benefitsContainer: {
    paddingVertical: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[300],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  continueButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default ServiceBenefitsModal;
