import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

const LanguageSelector = ({ onLanguageChange }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('Eng');

  const languages = [
    { code: 'hy', name: 'Հայ' },
    { code: 'en', name: 'Eng' },
    { code: 'ru', name: 'Рус' },
  ];

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language.name);
    onLanguageChange && onLanguageChange(language.code);
  };

  return (
    <View style={styles.container}>
      {languages.map((language, index) => (
        <TouchableOpacity
          key={language.code}
          style={[
            styles.languageButton,
            selectedLanguage === language.name && styles.selectedLanguage,
          ]}
          onPress={() => handleLanguageSelect(language)}
        >
          <Text
            style={[
              styles.languageText,
              selectedLanguage === language.name && styles.selectedLanguageText,
            ]}
          >
            {language.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectedLanguage: {
    backgroundColor: colors.primary,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  selectedLanguageText: {
    color: colors.white,
  },
});

export default LanguageSelector;
