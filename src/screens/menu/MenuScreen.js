import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/common/Avatar';
import { isManagement } from '../../utils/roleUtils';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const MenuSection = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

const MenuItem = ({ icon, label, onPress, subLabel, color = colors.primary, badge }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuItemLeft}>
      <View style={[styles.iconChip, { backgroundColor: color + '10' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View>
        <Text style={styles.menuItemLabel}>{label}</Text>
        {subLabel && <Text style={styles.menuItemSubLabel}>{subLabel}</Text>}
      </View>
    </View>
    <View style={styles.menuItemRight}>
      {badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </View>
  </TouchableOpacity>
);

const MenuScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const isAdmin = useMemo(() => isManagement(user?.role), [user]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Module Master Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <LinearGradient
          colors={colors.gradients.primary}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <View style={styles.headerTop}>
          <TouchableOpacity 
          //  onPress={() => navigation.getParent()?.openDrawer()} 
            style={styles.headerBtn}
          >
            <Ionicons name="menu-outline" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>System Settings</Text>
          <View style={styles.headerBtn}>
             <Ionicons name="settings-outline" size={22} color="#fff" />
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Hero Unit */}
        <TouchableOpacity 
          style={styles.userHero}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#fff', colors.surfaceAlt]}
            style={StyleSheet.absoluteFill}
          />
          <Avatar url={user?.profileImageUrl} name={user?.name} size={64} style={styles.heroAvatar} />
          <View style={styles.heroMeta}>
            <Text style={styles.heroName}>{user?.name}</Text>
            <Text style={styles.heroRole}>{user?.position || 'Employee'}</Text>
            <View style={styles.heroBadge}>
               <Text style={styles.heroBadgeText}>{user?.employeeCode}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        {/* 1. Personal & Security */}
        <MenuSection title="Account & Security">
           <MenuItem 
             icon="person-outline" 
             label="My Profile" 
             subLabel="Personal info & documents"
             onPress={() => navigation.navigate('Profile')}
           />
           <MenuItem 
             icon="shield-checkmark-outline" 
             label="Security" 
             subLabel="Change password & access"
             color={colors.accent}
             onPress={() => navigation.navigate('Profile', { screen: 'ChangePassword' })}
           />
        </MenuSection>

        {/* 2. Workplace */}
        <MenuSection title="Workplace">
           <MenuItem 
             icon="megaphone-outline" 
             label="Announcements" 
             subLabel="Company news & updates"
             color={colors.warning}
             onPress={() => navigation.navigate('Announcements')}
           />
           <MenuItem 
             icon="calendar-outline" 
             label="Holiday Calendar" 
             subLabel="Upcoming public holidays"
             color={colors.info}
             onPress={() => navigation.navigate('Holidays')}
           />
           <MenuItem 
             icon="school-outline" 
             label="Gurukul Learning" 
             subLabel="Skill development & courses"
             color={colors.secondary}
             onPress={() => navigation.navigate('Gurukul')}
           />
        </MenuSection>

        {/* 3. Reporting & Finance */}
        <MenuSection title="Finance & Reports">
           <MenuItem 
             icon="receipt-outline" 
             label={isAdmin ? "Payroll Management" : "My Pay Slips"} 
             subLabel={isAdmin ? "Process company salaries" : "View your monthly earnings"}
             color={colors.success}
             onPress={() => navigation.navigate('Payroll')}
           />
           {isAdmin && (
             <MenuItem 
               icon="analytics-outline" 
               label="Leave Analysis" 
               subLabel="Team leave trends & data"
               color={colors.primary}
               onPress={() => navigation.navigate('LeavesTab', { screen: 'LeaveDashboard' })}
             />
           )}
        </MenuSection>

        {/* 4. Support & About */}
        <MenuSection title="Application">
           <MenuItem 
             icon="help-circle-outline" 
             label="Help & Support" 
             subLabel="Contact HR or IT support"
             color={colors.textTertiary}
           />
           <MenuItem 
             icon="information-circle-outline" 
             label="About App" 
             subLabel="v2.1.0 • Stable Build"
             color={colors.textTertiary}
           />
        </MenuSection>

        {/* Logout Action */}
        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={logout}
          activeOpacity={0.8}
        >
          <View style={styles.logoutIconBg}>
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
          </View>
          <Text style={styles.logoutText}>Terminate Session</Text>
        </TouchableOpacity>

        <View style={styles.legalFooter}>
           <Text style={styles.legalText}>Licensed to Enterprise HRMS</Text>
           <Text style={styles.legalText}>Cloud Terminal v2.1.0_A</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8, zIndex: 100,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 15 },
  headerBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 1 },

  scrollContent: { padding: 16 },
  
  userHero: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: colors.surface, 
    borderRadius: 28, padding: 24, 
    marginBottom: 24, elevation: 4, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12,
    overflow: 'hidden', borderWidth: 1, borderColor: colors.border
  },
  heroAvatar: { borderWidth: 2, borderColor: colors.primary + '20' },
  heroMeta: { flex: 1, marginLeft: 16 },
  heroName: { fontSize: 18, fontWeight: '900', color: colors.text },
  heroRole: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: colors.primary + '10', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 6 },
  heroBadgeText: { fontSize: 10, fontWeight: '800', color: colors.primary },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: colors.textTertiary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, marginLeft: 8 },
  sectionContent: { backgroundColor: colors.surface, borderRadius: 24, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconChip: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuItemLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  menuItemSubLabel: { fontSize: 12, fontWeight: '500', color: colors.textTertiary, marginTop: 2 },
  menuItemRight: { flexDirection: 'row', alignItems: 'center' },
  badge: { backgroundColor: colors.error, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginRight: 8 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },

  logoutBtn: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: colors.error + '10', 
    padding: 20, borderRadius: 20, 
    marginTop: 8, borderWidth: 1, borderColor: colors.error + '20'
  },
  logoutIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  logoutText: { fontSize: 16, fontWeight: '900', color: colors.error },

  legalFooter: { marginTop: 32, alignItems: 'center', gap: 4 },
  legalText: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1 }
});

export default MenuScreen;
