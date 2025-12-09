import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../constants/colors';

const CustomButton = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
}) => {
  const getButtonStyle = () => {
    if (variant === 'primary') {
      return [
        styles.button,
        styles.primaryButton,
        disabled && styles.disabledButton,
        style,
      ];
    }
    return [styles.button, style];
  };

  const getTextStyle = () => {
    if (variant === 'primary') {
      return [
        styles.buttonText,
        styles.primaryButtonText,
        disabled && styles.disabledButtonText,
      ];
    }
    return styles.buttonText;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} size="small" />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  disabledButton: {
    backgroundColor: colors.gray[300],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: colors.white,
  },
  disabledButtonText: {
    color: colors.gray[500],
  },
});

export default CustomButton;
