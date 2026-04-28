import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Dimensions,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, roleColors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/common/Avatar';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const InfoCard = ({ title, icon, children }) => (
  <View style={styles.infoCard}>
    <View style={styles.cardHeader}>
       <View style={styles.cardHeaderLeft}>
          <Ionicons name={icon} size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>{title}</Text>
       </View>
    </View>
    <View style={styles.cardBody}>{children}</View>
  </View>
);

const InfoRow = ({ icon, label, value, isLast }) => (
  <View style={[styles.infoRow, isLast && { borderBottomWidth: 0, paddingBottom: 0 }]}>
    <View style={styles.iconChip}>
       <Ionicons name={icon} size={18} color={colors.textSecondary} />
    </View>
    <View style={styles.rowText}>
       <Text style={styles.rowLabel}>{label}</Text>
       <Text style={styles.rowValue}>{value || 'Not provided'}</Text>
    </View>
  </View>
);

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const roleStyle = useMemo(() => roleColors[user?.role] || roleColors.Employee, [user?.role]);

  const handleLogout = () => {
    Alert.alert(
      'Terminate Session',
      'Are you sure you want to log out of the HRMS portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            Toast.show({ type: 'info', text1: 'Session Terminated', text2: 'You have been logged out.' });
          }
        }
      ]
    );
  };

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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Portal</Text>
          <TouchableOpacity style={styles.headerBtn}>
             <Ionicons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Hero Portal */}
        <View style={styles.heroPortal}>
          <LinearGradient
            colors={['#fff', colors.surfaceAlt]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroHeader}>
             <View style={styles.avatarGlow}>
                <Avatar url={user?.profileImageUrl} name={user?.name} size={90} />
             </View>
             <Text style={styles.heroName}>{user?.name}</Text>
             <Text style={styles.heroPosition}>{user?.position || 'Employee'}</Text>
             <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
                <Text style={[styles.roleBadgeText, { color: roleStyle.text }]}>{user?.role}</Text>
             </View>
          </View>

          <View style={styles.heroStats}>
             <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.employeeCode}</Text>
                <Text style={styles.statLabel}>Member ID</Text>
             </View>
             <View style={styles.statDivider} />
             <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.department || 'Staff'}</Text>
                <Text style={styles.statLabel}>Department</Text>
             </View>
          </View>
        </View>

        {/* Contact Hub */}
        <InfoCard title="Contact Hub" icon="mail-outline">
           <InfoRow icon="mail-unread-outline" label="Professional Email" value={user?.email} />
           <InfoRow icon="call-outline" label="Direct Hotline" value={user?.mobileNumber} isLast />
        </InfoCard>

        {/* Security & Access Protection */}
        <InfoCard title="Account Protection" icon="shield-checkmark-outline">
           <View style={[styles.securityItem, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View style={styles.securityHeader}>
                 <View style={[styles.securityIconBg, { backgroundColor: colors.accent + '10' }]}>
                    <Ionicons name="key-outline" size={20} color={colors.accent} />
                 </View>
                 <View style={styles.securityText}>
                    <Text style={styles.securityTitle}>Portal Password</Text>
                    <Text style={styles.securityStatus}>Last updated recently</Text>
                 </View>
                 <TouchableOpacity 
                   style={[styles.securityBtn, { borderColor: colors.accent }]}
                   onPress={() => navigation.navigate('ChangePassword')}
                 >
                    <Text style={[styles.securityBtnText, { color: colors.accent }]}>Modify</Text>
                 </TouchableOpacity>
              </View>
           </View>
        </InfoCard>

        {/* Danger Zone */}
        <TouchableOpacity 
          style={styles.logoutAction}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.logoutText}>Terminate Portal Session</Text>
        </TouchableOpacity>

        <View style={styles.legalBranding}>
           <Text style={styles.legalText}>Licensed Workforce Protection</Text>
           <Text style={styles.legalText}>HRMS Secure Terminal v2.1.0</Text>
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
  
  heroPortal: { 
    backgroundColor: '#fff', 
    borderRadius: 32, padding: 32, 
    marginBottom: 20, elevation: 4, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12,
    overflow: 'hidden', borderWidth: 1, borderColor: colors.border
  },
  heroHeader: { alignItems: 'center', marginBottom: 24 },
  avatarGlow: { 
    borderWidth: 2, borderColor: colors.primary + '20', 
    borderRadius: 50, padding: 4,
    marginBottom: 16, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15
  },
  heroName: { fontSize: 22, fontWeight: '900', color: colors.text },
  heroPosition: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginTop: 4 },
  roleBadge: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 10 },
  roleBadgeText: { fontSize: 11, fontWeight: '800' },

  heroStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 20 },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 16, fontWeight: '900', color: colors.primary },
  statLabel: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', marginTop: 4 },
  statDivider: { width: 1, height: 24, backgroundColor: colors.border },

  infoCard: { backgroundColor: colors.surface, borderRadius: 28, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  cardHeader: { marginBottom: 20 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 13, fontWeight: '900', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  cardBody: { gap: 16 },

  infoRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 16 },
  iconChip: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase' },
  rowValue: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 2 },

  securityItem: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 16 },
  securityHeader: { flexDirection: 'row', alignItems: 'center' },
  securityIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  securityText: { flex: 1 },
  securityTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  securityStatus: { fontSize: 12, fontWeight: '600', color: colors.textTertiary, marginTop: 2 },
  securityBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.primary },
  securityBtnText: { fontSize: 12, fontWeight: '800', color: colors.primary },

  logoutAction: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.error + '10', 
    padding: 20, borderRadius: 24, 
    marginTop: 10, borderWidth: 1, borderColor: colors.error + '20'
  },
  logoutText: { fontSize: 16, fontWeight: '900', color: colors.error, marginLeft: 12 },

  legalBranding: { marginTop: 40, alignItems: 'center', gap: 4 },
  legalText: { fontSize: 10, fontWeight: '800', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1 }
});

export default ProfileScreen;