import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import InputField from '../../components/InputField';
import SelectField from '../../components/SelectField';
import PrimaryButton from '../../components/PrimaryButton';
import EmptyState from '../../components/EmptyState';
import { useFeedback } from '../../components/Feedback';
import { colors, spacing } from '../../theme';
import { enter } from '../../theme/motion';
import { ENTITIES, LOOKUPS, itemOf, toOptions } from './entities';

const blank = (fields) => Object.fromEntries(fields.map((f) => [f.key, '']));

// Generic add / edit form for any entity in ./entities.js. `id` in the route params means edit
// (the record is fetched first); singleton entities (store settings) always edit.
export default function EntityFormScreen({ navigation, route }) {
  const { entity, id } = route.params;
  const config = ENTITIES[entity];
  const { fields, api } = config;
  const editing = config.singleton || id != null;
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
      setForm(Object.fromEntries(fields.map((f) => [f.key, item?.[f.key] == null ? '' : String(item[f.key])])));
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

    const payload = Object.fromEntries(fields.map((f) => [f.key, String(form[f.key]).trim()]));
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
    <Screen>
      <ScreenHeader title={title} onBack={() => navigation.goBack()} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : loadError ? (
        <EmptyState tone="error" icon="cloud-offline-outline" title="Can't load details" message={loadError} actionLabel="Try again" onAction={fetchRecord} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {fields.map((f, i) => (
              <Animated.View key={f.key} entering={enter(i)}>
                {f.type === 'select' ? (
                  <SelectField
                    label={f.label}
                    icon={f.icon}
                    value={form[f.key]}
                    options={options[f.lookup] ?? []}
                    disabled={!!LOOKUPS[f.lookup].dep && !form[LOOKUPS[f.lookup].dep]}
                    error={errors[f.key]}
                    onChange={(v) => set(f, v)}
                  />
                ) : (
                  <InputField
                    label={f.label}
                    icon={f.icon}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    error={errors[f.key]}
                    onChangeText={(v) => set(f, v)}
                    keyboardType={f.keyboardType}
                    autoCapitalize={f.autoCapitalize}
                    maxLength={f.maxLength}
                  />
                )}
              </Animated.View>
            ))}
          </ScrollView>
          <View style={styles.footer}>
            <PrimaryButton title="Save" icon="checkmark" variant="light" onPress={onSave} loading={saving} />
          </View>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, paddingTop: spacing.sm },
});
