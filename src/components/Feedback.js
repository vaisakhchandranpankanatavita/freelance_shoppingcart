import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut, FadeOutUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import PressableScale from './PressableScale';
import { colors, fonts, radius, spacing } from '../theme';

// In-app replacement for Alert.alert (a silent no-op on web):
//   toast({ title, message?, tone: 'success' | 'error' | 'info' })  — brief, non-blocking
//   confirm({ title, message?, confirmLabel?, destructive? })       — resolves true / false
const FeedbackContext = createContext(null);

export const useFeedback = () => useContext(FeedbackContext);

const TONES = {
  success: { icon: 'checkmark', color: colors.green },
  error: { icon: 'alert', color: colors.danger },
  info: { icon: 'information', color: colors.accent },
};

const TOAST_MS = 3400;

export function FeedbackProvider({ children }) {
  const insets = useSafeAreaInsets();
  const [toastState, setToastState] = useState(null);
  const [dialog, setDialog] = useState(null);
  const timer = useRef(null);
  const seq = useRef(0);

  const toast = useCallback(({ title, message, tone = 'info' }) => {
    clearTimeout(timer.current);
    setToastState({ id: ++seq.current, title, message, tone });
    timer.current = setTimeout(() => setToastState(null), TOAST_MS);
  }, []);

  const confirm = useCallback(
    (options) => new Promise((resolve) => setDialog({ ...options, resolve })),
    []
  );

  const closeDialog = (result) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const api = useMemo(() => ({ toast, confirm }), [toast, confirm]);
  const tone = toastState ? TONES[toastState.tone] : null;

  return (
    <FeedbackContext.Provider value={api}>
      {children}

      <View style={styles.layer} pointerEvents="box-none">
        {toastState ? (
          <Animated.View
            key={toastState.id}
            entering={FadeInUp.springify().damping(18).stiffness(200)}
            exiting={FadeOutUp.duration(180)}
            style={[styles.toastWrap, { top: insets.top + spacing.sm }]}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={() => setToastState(null)}
              style={styles.toast}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              accessibilityLabel={[toastState.title, toastState.message].filter(Boolean).join('. ')}
            >
              <View style={[styles.toastIcon, { backgroundColor: tone.color }]}>
                <Icon name={tone.icon} size={16} color={colors.paperInk} />
              </View>
              <View style={styles.toastText}>
                <Text style={styles.toastTitle}>{toastState.title}</Text>
                {toastState.message ? <Text style={styles.toastMessage}>{toastState.message}</Text> : null}
              </View>
            </Pressable>
          </Animated.View>
        ) : null}

        {dialog ? (
          <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(140)} style={styles.scrim}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => closeDialog(false)} accessibilityLabel="Dismiss" />
            <Animated.View
              entering={ZoomIn.springify().damping(18).stiffness(220)}
              style={styles.dialog}
              accessibilityRole="alert"
              accessibilityViewIsModal
            >
              <Text style={styles.dialogTitle}>{dialog.title}</Text>
              {dialog.message ? <Text style={styles.dialogMessage}>{dialog.message}</Text> : null}
              <View style={styles.dialogActions}>
                <PressableScale style={[styles.dialogBtn, styles.dialogCancel]} onPress={() => closeDialog(false)}>
                  <Text style={styles.dialogCancelText}>{dialog.cancelLabel || 'Cancel'}</Text>
                </PressableScale>
                <PressableScale
                  style={[styles.dialogBtn, dialog.destructive ? styles.dialogDanger : styles.dialogPrimary]}
                  onPress={() => closeDialog(true)}
                >
                  <Text style={styles.dialogConfirmText}>{dialog.confirmLabel || 'Confirm'}</Text>
                </PressableScale>
              </View>
            </Animated.View>
          </Animated.View>
        ) : null}
      </View>
    </FeedbackContext.Provider>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFillObject, zIndex: 100 },

  toastWrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  toastIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toastText: { flex: 1 },
  toastTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  toastMessage: { color: colors.inkMuted, fontSize: 13, marginTop: 2, lineHeight: 18 },

  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(29,29,35,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.elevated,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  dialogTitle: { color: colors.text, fontSize: 22, lineHeight: 28, fontFamily: fonts.displayBold, letterSpacing: -0.4 },
  dialogMessage: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: spacing.sm },
  dialogActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  dialogBtn: { flex: 1, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  dialogCancel: { backgroundColor: colors.elevated2 },
  dialogPrimary: { backgroundColor: colors.card },
  dialogDanger: { backgroundColor: colors.danger },
  dialogCancelText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  dialogConfirmText: { color: colors.ink, fontSize: 15, fontWeight: '700' },
});
