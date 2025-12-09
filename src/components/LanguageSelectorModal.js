import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const LanguageSelectorModal = ({ visible, onClose, onLanguageSelect, currentLanguage }) => {
  const { t } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hy', name: 'Հայերեն', flag: '🇦🇲' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  ];

  const handleLanguageSelect = (languageCode) => {
    onLanguageSelect(languageCode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modal}>
              <View style={styles.header}>
                <Text style={styles.title}>{t('profile.selectLanguage')}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.languageList}>
                {languages.map((language) => (
                  <TouchableOpacity
                    key={language.code}
                    style={[
                      styles.languageOption,
                      currentLanguage === language.code && styles.selectedLanguageOption
                    ]}
                    onPress={() => handleLanguageSelect(language.code)}
                  >
                    <View style={styles.languageInfo}>
                      <Text style={styles.flag}>{language.flag}</Text>
                      <Text style={[
                        styles.languageName,
                        currentLanguage === language.code && styles.selectedLanguageName
                      ]}>
                        {language.name}
                      </Text>
                    </View>
                    {currentLanguage === language.code && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  languageList: {
    paddingVertical: 8,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  selectedLanguageOption: {
    backgroundColor: colors.primary + '10',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  selectedLanguageName: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default LanguageSelectorModal;
