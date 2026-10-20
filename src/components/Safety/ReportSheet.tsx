import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import {
  REPORT_DETAILS_MAX,
  REPORT_REASONS,
  submitReport,
  type ReportReason,
} from '@/services/safetyService';
import { colors } from '@/theme/colors';
import { withAlpha } from '@/utils/color';

const ACCENT = '#FF6B6B';

type Props = {
  visible: boolean;
  onClose: () => void;
  roomCode: string;
  reportedUid: string | null;
  /** Set when reporting a specific note. */
  noteText?: string;
  /** Offered after sending; omitted when there is no partner to block. */
  onBlock?: () => Promise<void>;
};

export function ReportSheet({
  visible,
  onClose,
  roomCode,
  reportedUid,
  noteText,
  onBlock,
}: Props) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [state, setState] = useState<'form' | 'sending' | 'sent' | 'error'>('form');
  const [blocking, setBlocking] = useState(false);

  // Fresh form every time the sheet opens.
  useEffect(() => {
    if (visible) {
      setReason(null);
      setDetails('');
      setState('form');
      setBlocking(false);
    }
  }, [visible]);

  const send = async () => {
    if (!reason || state === 'sending') return;
    setState('sending');
    try {
      await submitReport({ roomCode, reportedUid, reason, details, noteText });
      setState('sent');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setState('error');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const block = async () => {
    if (!onBlock || blocking) return;
    setBlocking(true);
    try {
      await onBlock();
    } finally {
      setBlocking(false);
      onClose();
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {state === 'sent' ? (
        <Animated.View entering={FadeIn.duration(200)} style={styles.sent}>
          <Animated.View
            entering={ZoomIn.springify().damping(12)}
            style={styles.sentBadge}
          >
            <Text style={styles.sentBadgeText}>✓</Text>
          </Animated.View>
          <Text style={styles.title}>{t('safety.reportSentTitle')}</Text>
          <Text style={styles.body}>{t('safety.reportSentText')}</Text>
          {onBlock ? (
            <Pressable
              onPress={block}
              disabled={blocking}
              style={[styles.primaryBtn, { backgroundColor: ACCENT, opacity: blocking ? 0.6 : 1 }]}
            >
              <Text style={styles.primaryLabel}>
                {blocking ? t('safety.blocking') : t('safety.alsoBlock')}
              </Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onClose} style={styles.secondaryBtn}>
            <Text style={styles.secondaryLabel}>{t('safety.done')}</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <>
          <Text style={styles.title}>
            {noteText ? t('safety.reportNoteTitle') : t('safety.reportTitle')}
          </Text>
          {noteText ? (
            <View style={styles.quote}>
              <Text style={styles.quoteText} numberOfLines={3}>
                “{noteText}”
              </Text>
            </View>
          ) : null}
          <Text style={styles.label}>{t('safety.reasonLabel')}</Text>
          <View style={styles.reasons}>
            {REPORT_REASONS.map((r) => {
              const active = r === reason;
              return (
                <Pressable
                  key={r}
                  onPress={() => {
                    setReason(r);
                    void Haptics.selectionAsync();
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.reason,
                    {
                      borderColor: active ? withAlpha(ACCENT, 0.9) : 'rgba(255,255,255,0.14)',
                      backgroundColor: active ? withAlpha(ACCENT, 0.2) : 'rgba(255,255,255,0.04)',
                    },
                  ]}
                >
                  <Text style={[styles.reasonLabel, { color: active ? '#fff' : colors.fgDim }]}>
                    {t(`safety.reason.${r}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder={t('safety.detailsPlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.input}
            multiline
            maxLength={REPORT_DETAILS_MAX}
            accessibilityLabel={t('safety.detailsPlaceholder')}
          />
          {state === 'error' ? (
            <Text style={styles.error}>{t('safety.reportError')}</Text>
          ) : null}
          <Pressable
            onPress={send}
            disabled={!reason || state === 'sending'}
            style={[
              styles.primaryBtn,
              { backgroundColor: ACCENT, opacity: !reason || state === 'sending' ? 0.45 : 1 },
            ]}
          >
            <Text style={styles.primaryLabel}>
              {state === 'sending' ? t('safety.sending') : t('safety.sendReport')}
            </Text>
          </Pressable>
          <Text style={styles.footnote}>{t('safety.reportFootnote')}</Text>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.fg, fontSize: 20, fontWeight: '800', letterSpacing: -0.2 },
  body: { color: colors.fgDim, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  label: {
    color: colors.fgDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  quote: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  quoteText: { color: colors.fg, fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reason: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
  },
  reasonLabel: { fontSize: 14, fontWeight: '700' },
  input: {
    minHeight: 72,
    maxHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: colors.fg,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  error: { color: '#FCA5A5', fontSize: 13 },
  primaryBtn: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  primaryLabel: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.4 },
  secondaryBtn: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  secondaryLabel: { color: colors.fg, fontSize: 15, fontWeight: '700' },
  footnote: { color: colors.fgDim, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  sent: { alignItems: 'center', gap: 12, paddingTop: 4 },
  sentBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha('#10B981', 0.2),
    borderWidth: 1.5,
    borderColor: withAlpha('#10B981', 0.7),
  },
  sentBadgeText: { color: '#6EE7B7', fontSize: 30, fontWeight: '800' },
});
