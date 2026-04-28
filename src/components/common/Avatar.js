import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../constants/colors';

const Avatar = ({ url, name, size = 40, style }) => {
  const getInitials = () => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[
          styles.container,
          { width: size, height: size, borderRadius: size / 2 },
          style
        ]}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View style={[
      styles.container,
      styles.placeholder,
      { width: size, height: size, borderRadius: size / 2 },
      style
    ]}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>
        {getInitials()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: colors.primaryLight,
  },
  text: {
    color: colors.surface,
    fontWeight: '600',
  }
});

export default Avatar;
