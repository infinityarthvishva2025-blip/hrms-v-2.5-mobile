import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

const Badge = ({ text, type = 'primary', style }) => {
  const getColors = () => {
    switch(type) {
      case 'success': return { bg: '#D1FAE5', text: '#065F46' }; // Green
      case 'error': return { bg: '#FEE2E2', text: '#991B1B' };   // Red
      case 'warning': return { bg: '#FEF3C7', text: '#92400E' }; // Yellow
      case 'info': return { bg: '#DBEAFE', text: '#1E40AF' };    // Blue
      default: return { bg: colors.surfaceAlt, text: colors.textSecondary };
    }
  };

  const { bg, text: textColor } = getColors();

  return (
    <View style={[styles.container, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: textColor }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  }
});

export default Badge;
