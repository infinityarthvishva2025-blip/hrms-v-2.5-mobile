import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

const AppCard = ({ children, style, onPress, noPadding = false, gradientColors }) => {
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container 
      onPress={onPress} 
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.card, 
        !noPadding && styles.padding,
        style
      ]}
    >
      {gradientColors && (
        <LinearGradient
          colors={[gradientColors[0] + '08', gradientColors[1] || '#fff']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
      )}
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24, // Increased for premium feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  padding: {
    padding: 20,
  }
});

export default AppCard;

