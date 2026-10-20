import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from '../components/Icon';
import Screen from '../components/Screen';
import { HEADER_HEIGHT_LARGE_NO_BACK } from '../components/ScreenHeader';
import PressableScale from '../components/PressableScale';
import { GlassCard } from '../components/Glass';
import { useFeedback } from '../components/Feedback';
import { colors, spacing, radius, fonts } from '../theme';
import { enter } from '../theme/motion';
import { useAuth } from '../context/AuthContext';

const SECTIONS = [
  {
    title: 'Business',
    items: [
      { key: 'Reports', label: 'Reports', icon: 'bar-chart-outline', to: ['ReportsHome'] },
      { key: 'Refunds', label: 'Manage Refunds', icon: 'return-down-back-outline' },
      { key: 'Branches', label: 'Manage Branches', icon: 'business-outline', to: ['EntityList', { entity: 'branch' }], adminOnly: true },
      { key: 'Categories', label: 'Categories', icon: 'grid-outline', to: ['EntityList', { entity: 'category' }] },
      { key: 'Brands', label: 'Brands', icon: 'ribbon-outline', to: ['EntityList', { entity: 'brand' }] },
      { key: 'Suppliers', label: 'Suppliers', icon: 'people-outline', to: ['EntityList', { entity: 'supplier' }] },
      { key: 'StockDetails', label: 'Stock details', icon: 'pricetags-outline', to: ['EntityList', { entity: 'productBatch' }] },
      { key: 'StockLedger', label: 'Stock ledger', icon: 'book-outline', to: ['StockLedger'] },
      { key: 'PurchaseRequests', label: 'Purchase requests', icon: 'clipboard-outline', to: ['PurchaseRequestList'] },
      { key: 'SupplierPayments', label: 'Supplier payments', icon: 'wallet-outline', to: ['SupplierPaymentList'] },
      { key: 'ExpenseCategories', label: 'Expense categories', icon: 'pricetags-outline', to: ['EntityList', { entity: 'expenseCategory' }] },
      { key: 'Expenses', label: 'Expenses', icon: 'card-outline', to: ['EntityList', { entity: 'expense' }] },
    ],
  },
  {
    title: 'People',
    items: [
      { key: 'Staff', label: 'Manage Staff', icon: 'people-outline', to: ['EntityList', { entity: 'staff' }], adminOnly: true },
      { key: 'Roles', label: 'Roles', icon: 'shield-checkmark-outline', to: ['EntityList', { entity: 'role' }], adminOnly: true },
      { key: 'Permissions', label: 'Permissions', icon: 'key-outline', to: ['EntityList', { entity: 'permission' }], adminOnly: true },
      { key: 'Customers', label: 'Customers', icon: 'person-circle-outline' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { key: 'Settings', label: 'Store settings', icon: 'settings-outline', to: ['EntityForm', { entity: 'shop' }], adminOnly: true },
      { key: 'Notifications', label: 'Notifications', icon: 'notifications-outline' },
      { key: 'Help', label: 'Help & Support', icon: 'help-circle-outline' },
    ],
  },
];

// A menu row. Opens straight away — the icon plays its own small animation as feedback.
// `locked` rows (admin-only, viewed by staff) and `soon` rows (no screen yet) stay tappable so
// they can explain themselves, but read as unavailable at a glance.
function MenuRow({ item, last, locked, onOpen }) {
  const [pulse, setPulse] = useState(0);
  const soon = !item.to;
  const muted = locked || soon;

  return (
    <PressableScale
      scaleTo={0.98}
      style={[styles.row, last && { borderBottomWidth: 0 }]}
      onPress={() => {
        setPulse((n) => n + 1);
        onOpen(item);
      }}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityHint={locked ? 'Needs admin access' : soon ? 'Not available yet' : undefined}
    >
      <View style={[styles.rowIcon, muted && styles.rowIconMuted]}>
        <Icon name={item.icon} size={18} color={muted ? colors.textMuted : colors.text} animate={pulse} />
      </View>
      <Text style={[styles.rowLabel, muted && styles.rowLabelMuted]}>{item.label}</Text>
      {locked ? (
        <Icon name="lock-closed-outline" size={15} color={colors.textMuted} />
      ) : soon ? (
        <Text style={styles.soon}>Soon</Text>
      ) : (
        <Icon name="chevron-forward" size={18} color={colors.textFaint} />
      )}
    </PressableScale>
  );
}

export default function MoreScreen({ navigation }) {
  const { user, logout, isAdmin } = useAuth();
  const { toast, confirm } = useFeedback();

  const openItem = (item) => {
    if (item.adminOnly && !isAdmin) {
      toast({
        tone: 'info',
        title: 'Admin access required',
        message: `${item.label} requires administrator permissions.`,
      });
      return;
    }
    item.to
      ? navigation.navigate(...item.to)
      : toast({ tone: 'info', title: `${item.label} isn't available yet`, message: 'It will appear here once it is ready.' });
  };

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
      {/* Title now lives in AppHeader.js, rendered once at the tab-navigator level so it stays
          fixed across tab switches instead of remounting with this screen. */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={enter(1)} style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'A').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{user?.name || 'Admin'}</Text>
            <View style={styles.roleBadge}>
              <Icon
                name={isAdmin ? 'shield-checkmark-outline' : 'person-outline'}
                size={11}
                color={isAdmin ? colors.accentStrong : colors.textMuted}
              />
              <Text style={styles.roleText}>
                {isAdmin ? 'Admin' : 'Staff'}{user?.loginId ? ` · ID ${user.loginId}` : ''}
              </Text>
            </View>
          </View>
        </Animated.View>

        {SECTIONS.map((section, s) => (
          <View key={section.title}>
            <Animated.Text entering={enter(s + 2)} style={styles.sectionTitle}>
              {section.title}
            </Animated.Text>
            <Animated.View entering={enter(s + 2)}>
              <GlassCard style={styles.groupCard}>
              {section.items.map((item, idx) => (
                <MenuRow
                  key={item.key}
                  item={item}
                  last={idx === section.items.length - 1}
                  locked={item.adminOnly && !isAdmin}
                  onOpen={openItem}
                />
              ))}
              </GlassCard>
            </Animated.View>
          </View>
        ))}

        <Animated.View entering={enter(6)}>
          <GlassCard style={styles.logoutCard}>
            <PressableScale style={styles.logoutBtn} onPress={confirmLogout} accessibilityLabel="Log out">
              <Icon name="log-out-outline" size={20} color={colors.dangerStrong} />
              <Text style={styles.logoutText}>Log out</Text>
            </PressableScale>
          </GlassCard>
        </Animated.View>

        <Text style={styles.version}>Grocery App • v1.0.0</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT_LARGE_NO_BACK + spacing.sm, paddingBottom: 112 },

  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.sm },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.ink, fontSize: 20, fontFamily: fonts.display },
  profileInfo: { flex: 1, alignItems: 'flex-start', gap: 2 },
  profileName: { fontSize: 18, fontFamily: fonts.display, letterSpacing: -0.5, color: colors.text },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  roleText: { fontSize: 12, fontFamily: fonts.bodySemiBold, color: colors.ink },

  sectionTitle: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  groupCard: { paddingVertical: 4, paddingHorizontal: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(29,29,35,0.08)',
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowLabel: { flex: 1, fontSize: 15, color: colors.text, fontFamily: fonts.bodyMedium },
  rowLabelMuted: { color: colors.textMuted },
  rowIconMuted: { backgroundColor: 'transparent' },
  soon: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.bodySemiBold },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 48,
  },
  logoutCard: { marginTop: spacing.md, borderRadius: radius.pill },
  logoutText: { color: colors.dangerStrong, fontFamily: fonts.bodyBold, fontSize: 15 },
  version: { textAlign: 'center', color: colors.textFaint, fontSize: 12, marginTop: spacing.lg },
});
