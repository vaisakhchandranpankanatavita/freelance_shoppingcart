import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from '../components/Icon';
import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import IconButton from '../components/IconButton';
import PressableScale from '../components/PressableScale';
import SectionCard from '../components/SectionCard';
import { useFeedback } from '../components/Feedback';
import { colors, spacing, radius, fonts } from '../theme';
import { enter } from '../theme/motion';
import { useAuth } from '../context/AuthContext';

const SECTIONS = [
  {
    title: 'Business',
    items: [
      { key: 'Reports', label: 'Reports', icon: 'bar-chart-outline' },
      { key: 'Refunds', label: 'Manage Refunds', icon: 'refresh-outline' },
      { key: 'Branches', label: 'Manage Branches', icon: 'business-outline', to: ['EntityList', { entity: 'branch' }] },
      { key: 'Categories', label: 'Categories', icon: 'albums-outline', to: ['EntityList', { entity: 'category' }] },
      { key: 'Brands', label: 'Brands', icon: 'ribbon-outline', to: ['EntityList', { entity: 'brand' }] },
      { key: 'Suppliers', label: 'Suppliers', icon: 'people-outline', to: ['EntityList', { entity: 'supplier' }] },
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
      { key: 'Settings', label: 'Store settings', icon: 'settings-outline', to: ['EntityForm', { entity: 'shop' }] },
      { key: 'Notifications', label: 'Notifications', icon: 'notifications-outline' },
      { key: 'Help', label: 'Help & Support', icon: 'help-circle-outline' },
    ],
  },
];

export default function MoreScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { toast, confirm } = useFeedback();

  const openItem = (label, to) =>
    to ? navigation.navigate(...to) : toast({ tone: 'info', title: label, message: 'This section is coming soon.' });

  const confirmLogout = async () => {
    const ok = await confirm({
      title: 'Log out?',
      message: 'You will need your Login ID or username to sign back in.',
      confirmLabel: 'Log out',
      destructive: true,
    });
    if (ok) logout();
  };

  return (
    <Screen>
      <ScreenHeader
        large
        title="More"
        onBack={() => navigation.navigate('Dashboard')}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionCard tone="light" fade index={1} style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.name || 'A').charAt(0).toUpperCase()}</Text>
            </View>
            <IconButton
              icon="create-outline"
              variant="ink"
              onPress={() => openItem('Edit Profile')}
              accessibilityLabel="Edit profile"
            />
          </View>
          <Text style={styles.profileName}>{user?.name || 'Admin'}</Text>
          <View style={styles.roleBadge}>
            <Icon name="shield-checkmark-outline" size={12} color={colors.ink} />
            <Text style={styles.roleText}>{(user?.role || 'admin').toUpperCase()}</Text>
          </View>
        </SectionCard>

        {SECTIONS.map((section, s) => (
          <View key={section.title}>
            <Animated.Text entering={enter(s + 2)} style={styles.sectionTitle}>
              {section.title}
            </Animated.Text>
            <SectionCard index={s + 2} style={styles.groupCard}>
              {section.items.map((item, idx) => (
                <PressableScale
                  key={item.key}
                  scaleTo={0.98}
                  style={[styles.row, idx === section.items.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => openItem(item.label, item.to)}
                  accessibilityLabel={item.label}
                >
                  <View style={styles.rowIcon}>
                    <Icon name={item.icon} size={18} color={colors.text} />
                  </View>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Icon name="chevron-forward" size={18} color={colors.textFaint} />
                </PressableScale>
              ))}
            </SectionCard>
          </View>
        ))}

        <Animated.View entering={enter(6)}>
          <PressableScale style={styles.logoutBtn} onPress={confirmLogout} accessibilityLabel="Log out">
            <Icon name="log-out-outline" size={20} color={colors.danger} />
            <Text style={styles.logoutText}>Log Out</Text>
          </PressableScale>
        </Animated.View>

        <Text style={styles.version}>Grocery App • v1.0.0</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },

  profileCard: { padding: 24 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.ink, fontSize: 30, fontFamily: fonts.display },
  profileName: { fontSize: 30, fontFamily: fonts.display, letterSpacing: -1, color: colors.ink, marginTop: spacing.xl },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  roleText: { fontSize: 11, fontWeight: '700', color: colors.ink, letterSpacing: 0.5 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  groupCard: { paddingVertical: 4, paddingHorizontal: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.elevated3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowLabel: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.elevated2,
  },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', color: colors.textFaint, fontSize: 12, marginTop: spacing.lg },
});
