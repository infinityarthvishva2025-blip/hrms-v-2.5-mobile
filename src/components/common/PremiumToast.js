import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const PremiumToast = ({ type, text1, text2 }) => {
  const handleDismiss = () => {
    Toast.hide();
  };

  // Determine styling based on toast type
  let iconName = 'checkmark-circle';
  let iconColor = '#10B981'; // Emerald
  let badgeBg = 'rgba(16, 185, 129, 0.1)';
  let accentColor = '#10B981';

  if (type === 'error') {
    iconName = 'alert-circle';
    iconColor = '#EF4444'; // Rose/Red
    badgeBg = 'rgba(239, 68, 68, 0.1)';
    accentColor = '#EF4444';
  } else if (type === 'info') {
    iconName = 'information-circle';
    iconColor = colors.primary || '#3B82F6'; // Royal Blue
    badgeBg = 'rgba(59, 130, 246, 0.15)';
    accentColor = colors.primary || '#3B82F6';
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handleDismiss}
      style={[styles.card, { borderLeftColor: accentColor }]}
    >
      {/* Icon Badge */}
      <View style={[styles.iconContainer, { backgroundColor: badgeBg }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {text1 || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice')}
        </Text>
        {text2 ? (
          <Text style={styles.message} numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>

      {/* Elegant Close Icon */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleDismiss}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={16} color="#94A3B8" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width * 0.90, // Premium modern pill width
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    borderLeftWidth: 5,
    // Premium soft modern drop shadow
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A', // Slate 900
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 12,
    color: '#475569', // Slate 600
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
  },
  closeButton: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(PremiumToast);
