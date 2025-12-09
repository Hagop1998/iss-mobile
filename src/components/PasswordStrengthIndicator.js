import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

const PasswordStrengthIndicator = ({ strength, password }) => {
  const getStrengthBars = () => {
    const bars = [];
    const strengthLevel = strength.strength;
    
    for (let i = 0; i < 4; i++) {
      let barColor = colors.gray[200];
      
      if (strengthLevel === 'weak' && i < 1) {
        barColor = colors.red[500];
      } else if (strengthLevel === 'medium' && i < 2) {
        barColor = '#F59E0B';
      } else if (strengthLevel === 'good' && i < 3) {
        barColor = colors.primary;
      } else if (strengthLevel === 'strong' && i < 4) {
        barColor = colors.green[500];
      }
      
      bars.push(
        <View
          key={i}
          style={[
            styles.strengthBar,
            { backgroundColor: barColor }
          ]}
        />
      );
    }
    
    return bars;
  };

  if (!password || password.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Password strength:</Text>
      <View style={styles.barsContainer}>
        {getStrengthBars()}
      </View>
      <Text style={[styles.strengthText, { color: strength.color }]}>
        {strength.strength.charAt(0).toUpperCase() + strength.strength.slice(1)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    color: colors.text.secondary,
    marginRight: 8,
  },
  barsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  strengthBar: {
    width: 8,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PasswordStrengthIndicator;
