import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Icon from '../components/Icon';
import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import IconButton from '../components/IconButton';
import PressableScale from '../components/PressableScale';
import { GlassBackdrop, GlassCard } from '../components/Glass';
import { useFeedback } from '../components/Feedback';
import { colors, spacing, radius, fonts } from '../theme';
import { enter } from '../theme/motion';
import { useAuth } from '../context/AuthContext';

const SECTIONS = [
  {
    title: 'Business',
    items: [
      { key: 'Reports', label: 'Reports', icon: 'bar-chart-outline' },
      { key: 'Refunds', label: 'Manage Refunds', icon: 'return-down-back-outline' },
      { key: 'Branches', label: 'Manage Branches', icon: 'business-outline', to: ['EntityList', { entity: 'branch' }] },
      { key: 'Categories', label: 'Categories', icon: 'grid-outline', to: ['EntityList', { entity: 'category' }] },
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

// A menu row: on tap the label shrinks and shakes while its icon plays its animation; once the
// label is back in place the row's action runs.
function MenuRow({ item, last, onOpen }) {
  const [pulse, setPulse] = useState(0);
  const busy = useRef(false);
  const scale = useSharedValue(1);
  const shakeX = useSharedValue(0);

  const done = () => {
    busy.current = false;
    onOpen(item.label, item.to);
  };

  const press = () => {
    if (busy.current) return;
    busy.current = true;
    setPulse((n) => n + 1);
    scale.value = withSequence(
      withTiming(0.88, { duration: 110 }),
      withTiming(0.94, { duration: 100 }),
      withTiming(1, { duration: 120 })
    );
    shakeX.value = withSequence(
      withTiming(-4, { duration: 55 }),
      withTiming(4, { duration: 55 }),
      withTiming(-3, { duration: 55 }),
      withTiming(3, { duration: 55 }),
      withTiming(-1.5, { duration: 55 }),
      withTiming(0, { duration: 55 }, (finished) => {
        if (finished) runOnJS(done)();
      })
    );
  };

  const labelStyle = useAnimatedStyle(() => ({
    transformOrigin: 'left center',
    transform: [{ translateX: shakeX.value }, { scale: scale.value }],
  }));

  return (
    <PressableScale
      scaleTo={0.98}
      style={[styles.row, last && { borderBottomWidth: 0 }]}
      onPress={press}
      accessibilityLabel={item.label}
    >
      <View style={styles.rowIcon}>
        <Icon name={item.icon} size={18} color={colors.text} animate={pulse} />
      </View>
      <Animated.Text style={[styles.rowLabel, labelStyle]}>{item.label}</Animated.Text>
      <Icon name="chevron-forward" size={18} color={colors.textFaint} />
    </PressableScale>
  );
}

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
      <GlassBackdrop />
      <ScreenHeader
        large
        title="More"
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={enter(1)} style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'A').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{user?.name || 'Admin'}</Text>
            <View style={styles.roleBadge}>
              <Icon name="shield-checkmark-outline" size={11} color={colors.ink} />
              <Text style={styles.roleText}>{(user?.role || 'admin').toUpperCase()}</Text>
            </View>
          </View>
          <IconButton
            icon="create-outline"
            variant="light"
            onPress={() => openItem('Edit Profile')}
            accessibilityLabel="Edit profile"
          />
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
              <Icon name="log-out-outline" size={20} color={colors.danger} />
              <Text style={styles.logoutText}>Log Out</Text>
            </PressableScale>
          </GlassCard>
        </Animated.View>

        <Text style={styles.version}>Grocery App • v1.0.0</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },

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
    gap: 4,
    backgroundColor: colors.card,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  roleText: { fontSize: 10, fontWeight: '700', color: colors.ink, letterSpacing: 0.5 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
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
  rowLabel: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 48,
  },
  logoutCard: { marginTop: spacing.md, borderRadius: radius.pill },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', color: colors.textFaint, fontSize: 12, marginTop: spacing.lg },
});
