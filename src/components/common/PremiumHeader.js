import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import Avatar from './Avatar';

const { width } = Dimensions.get('window');

const PremiumHeader = ({ 
  title = 'HRMS', 
  subtitle, 
  moduleBadge, 
  showBack = false, 
  onBack, 
  rightAction, 
  rightActionIcon = 'notifications-outline',
  user,
  navigation,
  children
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.masterHeader, { paddingTop: insets.top + 10 }]}>
      <LinearGradient
        colors={colors.gradients.primary}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      />
      
      <View style={styles.headerTop}>
        <TouchableOpacity 
          onPress={showBack ? (onBack || (() => navigation?.goBack())) : (() => navigation?.navigate('MenuTab'))} 
          style={styles.headerBtn}
        >
          <Ionicons name={showBack ? "arrow-back" : "menu-outline"} size={26} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTitleCenter}>
          <Text style={styles.headerMainTitle}>{title}</Text>
          {moduleBadge && (
            <View style={styles.moduleBadge}>
               <Text style={styles.moduleBadgeText}>{moduleBadge.toUpperCase()}</Text>
            </View>
          )}
          {subtitle && !moduleBadge && <Text style={styles.subtitleText}>{subtitle}</Text>}
        </View>

        <View style={styles.headerRight}>
          {rightAction ? (
            <TouchableOpacity 
               style={styles.headerBtn}
               onPress={rightAction}
            >
              <Ionicons name={rightActionIcon} size={22} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
               style={styles.headerBtn}
               onPress={() => navigation?.navigate('MenuTab', { screen: 'Announcements' })}
            >
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity onPress={() => navigation?.navigate('MenuTab', { screen: 'Profile' })}>
            <Avatar 
              name={user?.name} 
              url={user?.profileImageUrl} 
              size={34} 
              style={styles.headerAvatar} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {children && <View style={styles.bottomContent}>{children}</View>}
    </View>
  );
};


const styles = StyleSheet.create({
  masterHeader: { 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitleCenter: { alignItems: 'center' },
  headerMainTitle: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  moduleBadge: { 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 2,
  },
  moduleBadgeText: { fontSize: 8, fontWeight: '900', color: 'rgba(255,255,255,0.8)', letterSpacing: 1 },
  subtitleText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  headerAvatar: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  bottomContent: { marginTop: 10 },
});


export default PremiumHeader;
