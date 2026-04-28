import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import Avatar from '../common/Avatar';
import { useAuth } from '../../hooks/useAuth';

const AppHeader = ({ onMenuPress }) => {
  const { user } = useAuth();
  
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color={colors.surface} />
        </TouchableOpacity>
        <Text style={styles.title}>HRMS</Text>
      </View>
      
      <View style={styles.right}>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color={colors.surface} />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
        <Avatar 
          url={user?.profileImageUrl} 
          name={user?.name} 
          size={36} 
          style={styles.avatar}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.primary,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.surface,
    letterSpacing: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    marginRight: 16,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  avatar: {
    borderWidth: 1,
    borderColor: colors.surface,
  }
});

export default AppHeader;
