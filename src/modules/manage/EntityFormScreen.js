import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import ScreenHeader, { HEADER_HEIGHT } from '../../components/ScreenHeader';
import SharedBadge from '../../components/SharedBadge';
import SectionCard from '../../components/SectionCard';
import InputField from '../../components/InputField';
import SelectField from '../../components/SelectField';
import DateField from '../../components/DateField';
import PrimaryButton from '../../components/PrimaryButton';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import { useFeedback } from '../../components/Feedback';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { ENTITIES, LOOKUPS, itemOf, nameOf, toOptions } from './entities';

const blank = (fields) => Object.fromEntries(fields.map((f) => [f.key, f.default ?? '']));

// Purely a layout decision over the existing field metadata — no new config in entities.js.
// The name field and any "sentences" (long free-text) field take a full-width row of their own;
// everything else (selects included) pairs up two-to-a-row, same as AddStockScreen's cells.
const isWideField = (f, config) => f.autoCapitalize === 'sentences' || f.key === (config.nameKey ?? 'name');

const groupFieldRows = (fields, config) => {
  const rows = [];
  for (let i = 0; i < fields.length; ) {
    const f = fields[i];
    if (isWideField(f, config)) {
      rows.push([f]);
      i += 1;
      continue;
    }
    const next = fields[i + 1];
    if (next && !isWideField(next, config)) {
      rows.push([f, next]);
      i += 2;
    } else {
      rows.push([f]);
      i += 1;
    }
  }
  return rows;
};

// Generic add / edit form for any entity in ./entities.js. `id` in the route params means edit
// (the record is fetched first); singleton entities (store settings) always edit.
export default function EntityFormScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { entity, id } = route.params;
  const config = ENTITIES[entity];
  const { fields, api } = config;
  const editing = config.singleton || id != null;
  const { can } = useAuth();
  const canEdit = config.singleton ? can('save', 'shop') : editing ? can('update', entity) : can('create', entity);
  const { toast } = useFeedback();
  const [form, setForm] = useState(() => blank(fields));
  const [errors, setErrors] = useState({});
  const [options, setOptions] = useState({}); // lookup name → [{ value, label }]
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRecord = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const item = itemOf(await (config.singleton ? api.get() : api.get(id)));
      // The name field uses nameOf's fallback chain too — brand records currently come back
      // shaped as categories (see nameOf's comment in entities.js), so `item.brand_name` alone
      // would be blank for every existing brand.
      // `readKey` lets a field read from a differently-named attribute than the one it writes
      // (`key`/`writeKey`) — needed for the `branch` entity, where a live response showed the
      // stored record using different column names than the POST /branch/store request fields
      // (e.g. request `clinic_address1` is stored as `clinic_address`).
      setForm(Object.fromEntries(fields.map((f) => {
        const v = f.key === config.nameKey ? nameOf(item ?? {}, config.nameKey) : item?.[f.readKey ?? f.key];
        return [f.key, v == null ? '' : String(v)];
      })));
    } catch (e) {
      setLoadError(e.message || 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (editing) fetchRecord();
  }, []);

  // (Re)load each select's options when its parent value changes (countries → states → cities).
  const selects = fields.filter((f) => f.type === 'select');
  const parentValues = selects.map((f) => form[LOOKUPS[f.lookup].dep]).join('|');
  useEffect(() => {
    let live = true;
    selects.forEach(async (f) => {
      const { dep, load } = LOOKUPS[f.lookup];
      if (dep && !form[dep]) {
        setOptions((o) => ({ ...o, [f.lookup]: [] }));
        return;
      }
      try {
        const opts = toOptions(await load(dep ? form[dep] : undefined));
        if (live) setOptions((o) => ({ ...o, [f.lookup]: opts }));
      } catch (e) {
        if (live) setOptions((o) => ({ ...o, [f.lookup]: [] }));
      }
    });
    return () => { live = false; };
  }, [parentValues]);

  const set = (f, v) => {
    setForm((cur) => {
      const next = { ...cur, [f.key]: v };
      // Changing a parent select clears the ones below it (country → state → city).
      const cleared = new Set([f.key]);
      selects.forEach((s) => {
        if (cleared.has(LOOKUPS[s.lookup].dep)) {
          next[s.key] = '';
          cleared.add(s.key);
        }
      });
      return next;
    });
    if (errors[f.key]) setErrors((e) => ({ ...e, [f.key]: undefined }));
  };

  const onSave = async () => {
    const next = {};
    fields.forEach((f) => {
      if (f.required && !String(form[f.key]).trim()) next[f.key] = `Enter the ${f.label.toLowerCase()}`;
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = Object.fromEntries(fields.map((f) => {
      const key = f.writeKey ?? f.key;
      const value = String(form[f.key]).trim();
      // `asString` opts a select out of the usual id-as-number conversion — confirmed needed
      // for expense's category_id/branch_id by a live 422 ("The category must be a string.").
      if (f.type !== 'select' || !value || f.asString) return [key, value];
      const id = Number(value);
      return [key, Number.isFinite(id) ? id : value];
    }));
    setSaving(true);
    try {
      if (config.singleton) await api.save(payload);
      else if (id != null) await api.update(id, payload);
      else await api.create(payload);
      toast({ tone: 'success', title: `${config.singular} saved` });
      navigation.goBack();
    } catch (e) {
      // Surface Laravel's per-field 422 messages on the matching inputs.
      if (e.errors) {
        setErrors(Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, [].concat(v)[0]])));
      }
      toast({ tone: 'error', title: "Couldn't save", message: e.message || 'Try again.' });
    } finally {
      setSaving(false);
    }
  };

  const title = config.singleton ? config.title : `${id != null ? 'Edit' : 'Add'} ${config.singular.toLowerCase()}`;

  return (
    <Screen
      bottomSheet={!editing}
      header={
        <ScreenHeader
          title={title}
          backIcon={!editing ? 'close' : 'arrow-back'}
          onBack={() => navigation.goBack()}
          right={id != null ? <SharedBadge tag={`${entity}-${id}`} icon={config.icon} size={44} radius={14} /> : undefined}
        />
      }
    >
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : loadError ? (
        <EmptyState tone="error" icon="cloud-offline-outline" title="Can't load details" message={loadError} actionLabel="Try again" onAction={fetchRecord} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {!canEdit ? (
              <View style={styles.readOnlyBanner}>
                <Icon name="lock-closed-outline" size={15} color={colors.textMuted} />
                <Text style={styles.readOnlyText}>View only • Admin access required to make changes</Text>
              </View>
            ) : null}
            <SectionCard title="Details" icon={config.icon} index={0}>
              {groupFieldRows(fields, config).map((row, r) => (
                <View key={row.map((f) => f.key).join('-')} style={[styles.row, r > 0 && styles.rowSpacing]}>
                  {row.map((f) =>
                    f.type === 'select' ? (
                      <SelectField
                        key={f.key}
                        style={styles.cell}
                        label={f.label}
                        icon={f.icon}
                        value={form[f.key]}
                        options={options[f.lookup] ?? []}
                        disabled={!canEdit || (!!LOOKUPS[f.lookup].dep && !form[LOOKUPS[f.lookup].dep])}
                        error={errors[f.key]}
                        onChange={(v) => canEdit && set(f, v)}
                      />
                    ) : f.type === 'date' ? (
                      <DateField
                        key={f.key}
                        style={styles.cell}
                        label={f.label}
                        icon={f.icon}
                        value={form[f.key]}
                        disabled={!canEdit}
                        error={errors[f.key]}
                        onChange={(v) => canEdit && set(f, v)}
                      />
                    ) : (
                      <InputField
                        key={f.key}
                        style={styles.cell}
                        label={f.label}
                        icon={f.icon}
                        placeholder={f.placeholder}
                        value={form[f.key]}
                        error={errors[f.key]}
                        onChangeText={(v) => canEdit && set(f, v)}
                        keyboardType={f.keyboardType}
                        autoCapitalize={f.autoCapitalize}
                        maxLength={f.maxLength}
                        editable={canEdit}
                      />
                    )
                  )}
                </View>
              ))}
            </SectionCard>
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            {canEdit ? (
              <PrimaryButton title="Save" icon="checkmark" variant="light" onPress={onSave} loading={saving} />
            ) : (
              <PrimaryButton title="Done" icon="checkmark-outline" variant="light" onPress={() => navigation.goBack()} />
            )}
          </View>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT + spacing.sm, paddingBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.sm },
  rowSpacing: { marginTop: 2 },
  cell: { flex: 1 },
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.chip,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  readOnlyText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.inkLine,
  },
});
