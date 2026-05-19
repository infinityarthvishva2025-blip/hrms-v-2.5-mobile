import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import Avatar from './Avatar';

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
  children,
  variant = 'default',
  greeting,
  scrollY,
}) => {
  const insets = useSafeAreaInsets();

  // Animations
  const gradientOpacity = scrollY
    ? scrollY.interpolate({ inputRange: [0, 40], outputRange: [0, 1], extrapolate: 'clamp' })
    : 0;

  const textColor = scrollY
    ? scrollY.interpolate({ inputRange: [0, 40], outputRange: ['#0F172A', '#FFFFFF'], extrapolate: 'clamp' })
    : '#0F172A';

  const subTextColor = scrollY
    ? scrollY.interpolate({ inputRange: [0, 40], outputRange: ['#64748B', 'rgba(255,255,255,0.85)'], extrapolate: 'clamp' })
    : '#64748B';

  const iconBg = scrollY
    ? scrollY.interpolate({ inputRange: [0, 40], outputRange: ['#F8FAFC', 'rgba(255,255,255,0.15)'], extrapolate: 'clamp' })
    : '#F8FAFC';

  const iconBorder = scrollY
    ? scrollY.interpolate({ inputRange: [0, 40], outputRange: ['#E2E8F0', 'rgba(255,255,255,0.2)'], extrapolate: 'clamp' })
    : '#E2E8F0';

  const avatarBorder = scrollY
    ? scrollY.interpolate({ inputRange: [0, 40], outputRange: ['#E2E8F0', 'rgba(255,255,255,0.8)'], extrapolate: 'clamp' })
    : '#E2E8F0';

  const iconOpacityDark = scrollY
    ? scrollY.interpolate({ inputRange: [0, 40], outputRange: [1, 0], extrapolate: 'clamp' })
    : 1;

  const iconOpacityWhite = scrollY
    ? scrollY.interpolate({ inputRange: [0, 40], outputRange: [0, 1], extrapolate: 'clamp' })
    : 0;

  const renderDashboardVariant = () => (
    <View style={styles.dashboardTop}>
      <TouchableOpacity 
        onPress={() => navigation?.navigate('Profile')}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.avatarWrapper, { borderColor: avatarBorder }]}>
          <Avatar name={user?.name} url={user?.profileImageUrl} size={42} />
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.welcomeBox}>
        <Animated.Text style={[styles.greetingText, { color: subTextColor }]}>
          {greeting || 'Good Morning 👋'}
        </Animated.Text>
        <Animated.Text style={[styles.userName, { color: textColor }]} numberOfLines={1}>
          {user?.name || 'User'}
        </Animated.Text>
      </View>

      <TouchableOpacity
        onPress={() => navigation?.navigate('Announcements')}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.notifBtn, { backgroundColor: iconBg, borderColor: iconBorder }]}>
          <Animated.View style={{ position: 'absolute', opacity: iconOpacityDark, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="notifications-outline" size={22} color="#475569" />
          </Animated.View>
          <Animated.View style={{ position: 'absolute', opacity: iconOpacityWhite, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
          </Animated.View>
          <View style={styles.notifBadge} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );

  const renderDefaultVariant = () => (
    <View style={styles.defaultTop}>
      <TouchableOpacity 
        onPress={showBack ? (onBack || (() => navigation?.goBack())) : (() => navigation?.navigate('MenuTab'))} 
        style={styles.iconBtn}
      >
        <Ionicons name={showBack ? "arrow-back" : "menu-outline"} size={24} color="#0F172A" />
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
          <TouchableOpacity style={styles.iconBtn} onPress={rightAction}>
            <Ionicons name={rightActionIcon} size={22} color="#0F172A" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation?.navigate('Announcements')}>
            <Ionicons name="notifications-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[
      styles.masterHeader, 
      { paddingTop: insets.top + 8 },
      variant === 'dashboard' && styles.dashboardMasterHeader,
    ]}>
      
      {/* Peacock Gradient Background Fade-in */}
      {variant === 'dashboard' && scrollY && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: gradientOpacity }]}>
          <LinearGradient 
            colors={colors.gradients.primary} 
            style={StyleSheet.absoluteFill} 
            start={{x: 0, y: 0}} 
            end={{x: 1, y: 0}} 
          />
        </Animated.View>
      )}

      {variant === 'dashboard' ? renderDashboardVariant() : renderDefaultVariant()}
      {children && <View style={styles.bottomContent}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  masterHeader: { 
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dashboardMasterHeader: {
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 10,
  },
  
  // Dashboard Variant
  dashboardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  avatarWrapper: {
    padding: 2,
    borderWidth: 2,
    borderRadius: 30,
  },
  welcomeBox: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },

  // Default Variant
  defaultTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerTitleCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerMainTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  moduleBadge: { 
    backgroundColor: '#EFF6FF', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6, 
    marginTop: 2,
  },
  moduleBadgeText: { 
    fontSize: 9, 
    fontWeight: '800', 
    color: '#3B82F6', 
    letterSpacing: 0.5 
  },
  subtitleText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#64748B', 
    marginTop: 2 
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomContent: { marginTop: 12, zIndex: 2 },
});

export default PremiumHeader;
