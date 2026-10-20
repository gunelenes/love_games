import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { colors } from '@/theme/colors';
import { withAlpha } from '@/utils/color';

const DANGER = '#FF6B6B';

type Confirm = 'block' | 'leave' | null;

/**
 * Room actions: report, remove + block partner, leave. The two
 * irreversible ones go through an in-sheet confirm step.
 */
export function RoomMenuSheet({
  visible,
  onClose,
  hasPartner,
  isHost,
  onReport,
  onBlock,
  onLeave,
}: {
  visible: boolean;
  onClose: () => void;
  hasPartner: boolean;
  isHost: boolean;
  onReport: () => void;
  onBlock: () => Promise<void>;
  onLeave: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setConfirm(null);
      setBusy(false);
    }
  }, [visible]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await fn();
    } finally {
      setBusy(false);
      onClose();
    }
  };

  const leaveText = isHost
    ? hasPartner
      ? t('safety.leaveHostHandover')
      : t('safety.leaveHostClose')
    : t('safety.leaveGuest');

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {confirm ? (
        <Animated.View key={confirm} entering={FadeInRight.springify().damping(18)} style={styles.confirm}>
          <Text style={styles.title}>
            {confirm === 'block' ? t('safety.blockTitle') : t('safety.leaveTitle')}
          </Text>
          <Text style={styles.body}>
            {confirm === 'block'
              ? isHost
                ? t('safety.blockTextHost')
                : t('safety.blockTextGuest')
              : leaveText}
          </Text>
          <Pressable
            onPress={() => run(confirm === 'block' ? onBlock : onLeave)}
            disabled={busy}
            style={[styles.dangerBtn, { opacity: busy ? 0.6 : 1 }]}
          >
            <Text style={styles.dangerLabel}>
              {busy
                ? t('safety.working')
                : confirm === 'block'
                  ? t('safety.blockConfirm')
                  : t('boxes.leave')}
            </Text>
          </Pressable>
          <Pressable onPress={() => setConfirm(null)} disabled={busy} style={styles.secondaryBtn}>
            <Text style={styles.secondaryLabel}>{t('boxes.cancel')}</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(160)} style={styles.list}>
          <Text style={styles.title}>{t('safety.menuTitle')}</Text>
          <Row
            icon="⚑"
            label={t('safety.reportProblem')}
            sub={t('safety.reportProblemSub')}
            onPress={onReport}
          />
          {hasPartner ? (
            <Row
              icon="⛔"
              label={t('safety.blockPartner')}
              sub={t('safety.blockPartnerSub')}
              danger
              onPress={() => setConfirm('block')}
            />
          ) : null}
          <Row
            icon="↩"
            label={t('boxes.leaveRoom')}
            sub={t('safety.leaveSub')}
            danger
            onPress={() => setConfirm('leave')}
          />
        </Animated.View>
      )}
    </BottomSheet>
  );
}

function Row({
  icon,
  label,
  sub,
  danger,
  onPress,
}: {
  icon: string;
  label: string;
  sub: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}
    >
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: withAlpha(danger ? DANGER : '#FFFFFF', danger ? 0.16 : 0.08),
            borderColor: withAlpha(danger ? DANGER : '#FFFFFF', danger ? 0.45 : 0.15),
          },
        ]}
      >
        <Text style={[styles.rowIconText, { color: danger ? DANGER : colors.fg }]}>{icon}</Text>
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: danger ? '#FFB4B4' : colors.fg }]}>{label}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  confirm: { gap: 12 },
  title: { color: colors.fg, fontSize: 20, fontWeight: '800', letterSpacing: -0.2, marginBottom: 4 },
  body: { color: colors.fgDim, fontSize: 14, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 60,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconText: { fontSize: 18, fontWeight: '700' },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15, fontWeight: '800' },
  rowSub: { color: colors.fgDim, fontSize: 12, lineHeight: 16 },
  dangerBtn: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DANGER,
  },
  dangerLabel: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.4 },
  secondaryBtn: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  secondaryLabel: { color: colors.fg, fontSize: 15, fontWeight: '700' },
});
