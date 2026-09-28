import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';
import { useAuth } from '../context/AuthContext';

const SECTIONS = [
  {
    title: 'Business',
    items: [
      { key: 'Reports', label: 'Reports', icon: 'bar-chart-outline' },
      { key: 'Refunds', label: 'Manage Refunds', icon: 'refresh-outline' },
      { key: 'Branches', label: 'Manage Branches', icon: 'business-outline' },
    ],
  },
  {
    title: 'People',
    items: [
      { key: 'Staff', label: 'Manage Staff', icon: 'people-outline' },
      { key: 'Customers', label: 'Customers', icon: 'person-circle-outline' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { key: 'Settings', label: 'Settings', icon: 'settings-outline' },
      { key: 'Notifications', label: 'Notifications', icon: 'notifications-outline' },
      { key: 'Help', label: 'Help & Support', icon: 'help-circle-outline' },
    ],
  },
];

export default function MoreScreen({ navigation }) {
  const { user, logout } = useAuth();

  const goBack = () => {
    const parent = navigation.getParent?.();
    parent?.navigate?.('Dashboard') || navigation.navigate?.('Dashboard');
  };

  const openItem = (label) => {
    Alert.alert(label, 'Coming soon.');
  };

  const confirmLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>More</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'A').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.profileName}>{user?.name || 'Admin'}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark-outline" size={11} color={colors.primaryDark} />
              <Text style={styles.roleText}>{(user?.role || 'admin').toUpperCase()}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => openItem('Edit Profile')}>
            <Ionicons name="create-outline" size={18} color={colors.primaryDark} />
          </TouchableOpacity>
        </View>

        {/* Grouped sections */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={{ marginTop: spacing.lg }}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.groupCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.row,
                    idx === section.items.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => openItem(item.label)}
                >
                  <View style={styles.rowIcon}>
                    <Ionicons name={item.icon} size={18} color={colors.primaryDark} />
                  </View>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Log out */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={confirmLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Grocery App • v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceAlt },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.text },

  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 999,
    backgroundColor: colors.primaryDark,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  profileName: { fontSize: 16, fontWeight: '700', color: colors.text },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.pill,
  },
  roleText: { fontSize: 10, fontWeight: '700', color: colors.primaryDark, letterSpacing: 0.5 },
  editBtn: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 32, height: 32, borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowLabel: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#FEE2E2',
  },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 14 },

  version: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 11,
    marginTop: spacing.lg,
  },
});
