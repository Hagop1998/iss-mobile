import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const CustomInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  error = null,
  onFocus,
  onBlur,
  isFocused = false,
  showClearButton = false,
  onClear,
  multiline = false,
  numberOfLines = 1,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getInputStyle = () => {
    if (error) {
      return [styles.input, styles.inputError];
    }
    if (isFocused) {
      return [styles.input, styles.inputFocused];
    }
    return styles.input;
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          style={getInputStyle()}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          onFocus={onFocus}
          onBlur={onBlur}
          multiline={multiline}
          numberOfLines={numberOfLines}
          placeholderTextColor={colors.gray[400]}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={togglePasswordVisibility}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.gray[500]}
            />
          </TouchableOpacity>
        )}
        {showClearButton && value && (
          <TouchableOpacity style={styles.clearIcon} onPress={onClear}>
            <Ionicons name="close-circle" size={20} color={colors.gray[500]} />
          </TouchableOpacity>
        )}
        {error && (
          <Ionicons
            name="alert-circle"
            size={20}
            color={colors.red[500]}
            style={styles.errorIcon}
          />
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.white,
    paddingRight: 50, // Space for icons
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.red[500],
    borderWidth: 2,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  clearIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  errorIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  errorText: {
    color: colors.text.error,
    fontSize: 14,
    marginTop: 4,
  },
});

export default CustomInput;
