import React, { useCallback, useState } from 'react';
import { Platform, RefreshControl, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../../components/Icon';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import SharedBadge from '../../components/SharedBadge';
import IconButton from '../../components/IconButton';
import AddButton from '../../components/AddButton';
import PressableScale from '../../components/PressableScale';
import EmptyState from '../../components/EmptyState';
import { useFeedback } from '../../components/Feedback';
import { colors, radius, spacing } from '../../theme';
import { enter, fadeOut, layout } from '../../theme/motion';
import { ENTITIES, isActive, listOf } from './entities';

// Generic list for branches / categories / brands / suppliers: search, tap to edit,
// status switch (when the API has one) and delete with confirmation.
export default function EntityListScreen({ navigation, route }) {
  const config = ENTITIES[route.params.entity];
  const { api } = config;
  const { toast, confirm } = useFeedback();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      // Rows show `name`; categories and brands carry it as category_name / brand_name.
      setItems(listOf(await api.list()).map((o) => ({ ...o, name: o[config.nameKey ?? 'name'] ?? o.name })));
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

  const q = search.trim().toLowerCase();
  const shown = q ? items.filter((i) => String(i.name ?? '').toLowerCase().includes(q)) : items;

  return (
    <Screen>
      <ScreenHeader
        large
        title={config.title}
        onBack={() => navigation.goBack()}
      />
      <Animated.FlatList
        data={shown}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
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
              {api.toggle ? (
                <Switch
                  value={isActive(item)}
                  onValueChange={() => toggle(item)}
                  trackColor={{ true: colors.accent, false: colors.elevated3 }}
                  accessibilityLabel={`${item.name} active`}
                />
              ) : null}
              <IconButton icon="trash-outline" variant="light" accessibilityLabel={`Delete ${item.name}`} onPress={() => remove(item)} />
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          !loaded ? null : error ? (
            <EmptyState tone="error" icon="cloud-offline-outline" title={`Can't load ${config.title.toLowerCase()}`} message={error} actionLabel="Try again" onAction={onRefresh} />
          ) : q ? (
            <EmptyState icon="search-outline" title="No matches" message={`Nothing matches "${search}".`} />
          ) : (
            <EmptyState icon={config.icon} title={`No ${config.title.toLowerCase()} yet`} message={`Add your first ${config.singular.toLowerCase()}.`} actionLabel={`Add ${config.singular.toLowerCase()}`} onAction={() => open(undefined)} />
          )
        }
      />
      <AddButton label="Add" accessibilityLabel={`Add ${config.singular}`} onPress={() => open(undefined)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingBottom: 112 },
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
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, marginLeft: spacing.md },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
