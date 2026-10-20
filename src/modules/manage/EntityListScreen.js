import React, { useCallback, useState } from 'react';
import { Linking, Platform, RefreshControl, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useTabBarScrollHandler } from '../../components/tabBarScroll';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../../components/Icon';
import Screen from '../../components/Screen';
import ScreenHeader, { HEADER_HEIGHT_LARGE } from '../../components/ScreenHeader';
import SharedBadge from '../../components/SharedBadge';
import IconButton from '../../components/IconButton';
import AddButton from '../../components/AddButton';
import PressableScale from '../../components/PressableScale';
import EmptyState from '../../components/EmptyState';
import { useFeedback } from '../../components/Feedback';
import { colors, radius, shadows, spacing, fonts } from '../../theme';
import { enter, fadeOut, layout } from '../../theme/motion';
import { useAuth } from '../../context/AuthContext';
import { ENTITIES, isActive, listOf, nameOf } from './entities';

// Generic list for branches / categories / brands / suppliers: search, tap to edit,
// status switch (when the API has one) and delete with confirmation.
export default function EntityListScreen({ navigation, route }) {
  const config = ENTITIES[route.params.entity];
  const { api } = config;
  const { toast, confirm } = useFeedback();
  const { can } = useAuth();
  const canCreate = can('create', route.params.entity);
  const canUpdate = can('update', route.params.entity);
  const canDelete = can('delete', route.params.entity);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [runningAction, setRunningAction] = useState(null);
  const scrollY = useSharedValue(0);
  const onScroll = useTabBarScrollHandler(scrollY);

  const load = async () => {
    try {
      // Rows show `name`; categories and brands carry it as category_name / brand_name (and
      // brand rows currently come back shaped as categories — see nameOf's comment in entities.js).
      setItems(listOf(await api.list()).map((o) => ({ ...o, name: config.displayName ? config.displayName(o) : nameOf(o, config.nameKey) })));
      setError('');
    } catch (e) {
      setError(e.message || 'Check your connection and try again.');
    } finally {
      setLoaded(true);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const open = (id) => navigation.navigate('EntityForm', { entity: route.params.entity, id });

  const toggle = async (item) => {
    const was = isActive(item);
    setItems((all) => all.map((i) => (i.id === item.id ? { ...i, status: was ? 0 : 1, is_active: was ? 0 : 1 } : i)));
    try {
      await api.toggle(item.id);
    } catch (e) {
      setItems((all) => all.map((i) => (i.id === item.id ? item : i)));
      toast({ tone: 'error', title: "Couldn't change status", message: e.message });
    }
  };

  const remove = async (item) => {
    const ok = await confirm({
      title: `Delete ${config.singular.toLowerCase()}?`,
      message: `"${item.name}" will be removed.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.remove(item.id);
      setItems((all) => all.filter((i) => i.id !== item.id));
      toast({ tone: 'success', title: `${config.singular} deleted` });
    } catch (e) {
      toast({ tone: 'error', title: "Couldn't delete", message: e.message });
    }
  };

  const runRowAction = async (item) => {
    if (!config.rowAction) return;
    setRunningAction(item.id);
    try {
      const res = await config.rowAction.run(item.id);
      // Response shape for this endpoint isn't documented yet; open it if it looks like a
      // printable file/link, otherwise just confirm the call succeeded.
      const url = res?.url ?? res?.data?.url ?? res?.barcode_url ?? res?.path;
      if (typeof url === 'string' && /^https?:\/\//.test(url)) await Linking.openURL(url);
      else toast({ tone: 'success', title: config.rowAction.label });
    } catch (e) {
      toast({ tone: 'error', title: `Couldn't ${config.rowAction.label.toLowerCase()}`, message: e.message });
    } finally {
      setRunningAction(null);
    }
  };

  const q = search.trim().toLowerCase();
  const shown = q ? items.filter((i) => String(i.name ?? '').toLowerCase().includes(q)) : items;

  return (
    <Screen
      header={<ScreenHeader large title={config.title} onBack={() => navigation.goBack()} />}
    >
      <Animated.FlatList
        data={shown}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        itemLayoutAnimation={layout}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        ListHeaderComponent={
          <Animated.View entering={enter(1)} style={styles.searchBox}>
            <Icon name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${config.title.toLowerCase()}`}
              placeholderTextColor={colors.textFaint}
              value={search}
              onChangeText={setSearch}
              accessibilityLabel={`Search ${config.title}`}
            />
          </Animated.View>
        }
        renderItem={({ item, index }) => {
          const sub = config.subtitle?.(item);
          return (
            <Animated.View entering={enter(index + 2)} exiting={fadeOut} style={styles.card}>
              <PressableScale style={styles.main} scaleTo={0.98} onPress={() => open(item.id)} accessibilityLabel={`Edit ${item.name}`}>
                <SharedBadge tag={`${route.params.entity}-${item.id}`} icon={config.icon} size={44} radius={14} />
                <View style={styles.text}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  {sub ? <Text style={styles.sub} numberOfLines={1}>{sub}</Text> : null}
                </View>
              </PressableScale>
              {api.toggle && canUpdate ? (
                <Switch
                  value={isActive(item)}
                  onValueChange={() => toggle(item)}
                  trackColor={{ true: colors.accent, false: colors.elevated3 }}
                  accessibilityLabel={`${item.name} active`}
                />
              ) : null}
              {config.rowAction ? (
                <IconButton
                  icon={config.rowAction.icon}
                  variant="light"
                  disabled={runningAction === item.id}
                  accessibilityLabel={`${config.rowAction.label} for ${item.name}`}
                  onPress={() => runRowAction(item)}
                />
              ) : null}
              {canDelete ? (
                <IconButton icon="trash-outline" variant="light" accessibilityLabel={`Delete ${item.name}`} onPress={() => remove(item)} />
              ) : null}
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          !loaded ? null : error ? (
            <EmptyState tone="error" icon="cloud-offline-outline" title={`Can't load ${config.title.toLowerCase()}`} message={error} actionLabel="Try again" onAction={onRefresh} />
          ) : q ? (
            <EmptyState icon="search-outline" title="No matches" message={`Nothing matches "${search}".`} />
          ) : (
            <EmptyState icon={config.icon} title={`No ${config.title.toLowerCase()} yet`} message={`Add your first ${config.singular.toLowerCase()}.`} actionLabel={canCreate ? `Add ${config.singular.toLowerCase()}` : undefined} onAction={canCreate ? () => open(undefined) : undefined} />
          )
        }
      />
      {canCreate ? (
        <AddButton accessibilityLabel={`Add ${config.singular}`} scrollY={scrollY} onPress={() => open(undefined)} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT_LARGE, paddingBottom: 112 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated2,
    height: 52,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, marginLeft: spacing.md },
  name: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
