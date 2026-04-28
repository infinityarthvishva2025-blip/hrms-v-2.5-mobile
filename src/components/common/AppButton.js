import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/colors';

const AppButton = ({ 
  title, 
  onPress, 
  variant = 'primary', // primary, secondary, outline, text
  size = 'medium', // small, medium, large
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon
}) => {
  const getBackgroundColor = () => {
    if (disabled) return colors.borderDark;
    if (variant === 'primary') return colors.primary;
    if (variant === 'secondary') return colors.secondary;
    if (variant === 'outline' || variant === 'text') return 'transparent';
    return colors.primary;
  };

  const getTextColor = () => {
    if (disabled && variant !== 'primary' && variant !== 'secondary') return colors.textTertiary;
    if (variant === 'primary' || variant === 'secondary') return colors.surface;
    if (variant === 'outline' || variant === 'text') return colors.primary;
    return colors.surface;
  };

  const getBorderColor = () => {
    if (variant === 'outline') return disabled ? colors.borderDark : colors.primary;
    return 'transparent';
  };

  const getSizeStyle = () => {
    if (size === 'small') return { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 };
    if (size === 'large') return { paddingVertical: 18, paddingHorizontal: 32, borderRadius: 16 };
    return { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 };
  };

  const getTextSize = () => {
    if (size === 'small') return 14;
    if (size === 'large') return 18;
    return 16;
  };

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.container,
        getSizeStyle(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon && icon}
          <Text style={[styles.text, { color: getTextColor(), fontSize: getTextSize() }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  }
});

export default AppButton;
