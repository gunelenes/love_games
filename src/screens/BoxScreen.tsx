import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuroraBackground } from '@/components/Background/AuroraBackground';
import {
  ConfettiBurst,
  type ConfettiBurstRef,
} from '@/components/Confetti/ConfettiBurst';
import { BackButton } from '@/components/ui/BackButton';
import { useAuth } from '@/hooks/useAuth';
import { useBoxDoc } from '@/hooks/useBoxDoc';
import { useRoom } from '@/hooks/useRoom';
import {
  addNote,
  deleteBox,
  deleteNote,
  setConfirmation,
} from '@/services/boxService';
import type { RootStackParamList } from '@/navigation/RootNav';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { darken, lighten, withAlpha } from '@/utils/color';
import type { BoxNote } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Box'>;

const { width, height } = Dimensions.get('window');

export function BoxScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { boxId } = route.params;
  const { uid } = useAuth();
  const { code, room } = useRoom();
  const { box, loading } = useBoxDoc(code, boxId);

  const [draft, setDraft] = useState('');
  const [revealed, setRevealed] = useState<BoxNote | null>(null);
  const confettiRef = useRef<ConfettiBurstRef | null>(null);

  const revealProgress = useSharedValue(0);
  const shuffleScale = useSharedValue(1);

  const myNotes = useMemo(
    () => (box && uid ? box.notes.filter((n) => n.authorUid === uid) : []),
    [box, uid]
  );
  const partnerNotes = useMemo(
    () =>
      box && uid ? box.notes.filter((n) => n.authorUid !== uid) : box?.notes ?? [],
    [box, uid]
  );

  const myConfirmed = uid ? !!box?.confirmations?.[uid] : false;
  const partnerUid =
    uid && room
      ? [room.hostUid, room.guestUid].find((u) => u && u !== uid) ?? null
      : null;
  const partnerConfirmed = partnerUid ? !!box?.confirmations?.[partnerUid] : false;

  const totalNotes = box?.notes.length ?? 0;
  const canShuffle = myConfirmed && totalNotes > 0;

  const handleAdd = useCallback(async () => {
    if (!box || !uid || !code) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    setDraft('');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addNote(code, box.id, uid, trimmed, box.notes);
  }, [box, uid, code, draft]);

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      if (!box || !uid || !code) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await deleteNote(code, box.id, noteId, uid, box.notes);
    },
    [box, uid, code]
  );

  const handleToggleConfirm = useCallback(async () => {
    if (!box || !uid || !code) return;
    const next = !myConfirmed;
    void Haptics.notificationAsync(
      next
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );
    await setConfirmation(code, box.id, uid, next);
  }, [box, uid, code, myConfirmed]);

  const handleShuffle = useCallback(() => {
    if (!canShuffle || !box || box.notes.length === 0) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    shuffleScale.value = withSequence(
      withTiming(0.9, { duration: 120 }),
      withSpring(1, { damping: 12, stiffness: 220 })
    );
    const idx = Math.floor(Math.random() * box.notes.length);
    const pick = box.notes[idx];
    setTimeout(() => {
      setRevealed(pick);
      revealProgress.value = 0;
      revealProgress.value = withTiming(1, {
        duration: 460,
        easing: Easing.out(Easing.cubic),
      });
      confettiRef.current?.burst();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 220);
  }, [canShuffle, box, revealProgress, shuffleScale]);

  const handleCloseReveal = useCallback(() => {
    revealProgress.value = withTiming(0, {
      duration: 220,
      easing: Easing.in(Easing.cubic),
    });
    setTimeout(() => setRevealed(null), 240);
  }, [revealProgress]);

  const handleDeleteBox = useCallback(() => {
    if (!box || !code) return;
    Alert.alert(
      t('boxes.deleteBoxTitle'),
      t('boxes.deleteBoxText', { name: box.name }),
      [
        { text: t('boxes.cancel'), style: 'cancel' },
        {
          text: t('boxes.leave'),
          style: 'destructive',
          onPress: async () => {
            await deleteBox(code, box.id);
            navigation.goBack();
          },
        },
      ]
    );
  }, [box, code, navigation, t]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: revealProgress.value,
    transform: [
      { translateY: (1 - revealProgress.value) * 40 },
      { scale: 0.9 + revealProgress.value * 0.1 },
    ],
  }));

  const revealBackdropStyle = useAnimatedStyle(() => ({
    opacity: revealProgress.value * 0.75,
  }));

  const shuffleBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shuffleScale.value }],
  }));

  if (loading && !box) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.topBar}>
            <BackButton onPress={() => navigation.goBack()} />
          </View>
          <View style={styles.missingCard}>
            <Text style={styles.missingText}>Yükleniyor…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }
  if (!box) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.topBar}>
            <BackButton onPress={() => navigation.goBack()} />
          </View>
          <View style={styles.missingCard}>
            <Text style={styles.missingText}>{t('boxes.boxNotFound')}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const accent = box.color;

  return (
    <View style={styles.root}>
      <AuroraBackground width={width} height={height} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <BackButton onPress={() => navigation.goBack()} />
          <Pressable
            onPress={handleDeleteBox}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <Text style={styles.iconBtnText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.header}>
          <View
            style={[
              styles.iconBubble,
              {
                backgroundColor: withAlpha(accent, 0.22),
                borderColor: withAlpha(accent, 0.6),
              },
            ]}
          >
            <Text style={styles.headerIcon}>{box.icon}</Text>
          </View>
          <Text style={styles.headerName} numberOfLines={1}>
            {box.name}
          </Text>
          <View style={styles.statusRow}>
            <StatusPill
              label={
                myConfirmed
                  ? `Sen ✓ (${myNotes.length})`
                  : `Sen ${myNotes.length}`
              }
              active={myConfirmed}
              color={accent}
            />
            <StatusPill
              label={
                partnerUid
                  ? partnerConfirmed
                    ? `Partner ✓ (${partnerNotes.length})`
                    : `Partner ${partnerNotes.length}`
                  : 'Partner bekleniyor'
              }
              active={partnerConfirmed}
              color={accent}
            />
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.sectionTitle}>{t('boxes.yours')}</Text>
            <View style={styles.addRow}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={t('boxes.newNotePlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.addInput}
                maxLength={200}
                returnKeyType="done"
                onSubmitEditing={handleAdd}
                multiline
              />
              <Pressable
                onPress={handleAdd}
                disabled={!draft.trim()}
                style={[
                  styles.addBtn,
                  { backgroundColor: accent, opacity: draft.trim() ? 1 : 0.35 },
                ]}
              >
                <Text style={styles.addBtnText}>{t('boxes.add')}</Text>
              </Pressable>
            </View>

            <View style={styles.notesList}>
              {myNotes.length === 0 ? (
                <Text style={styles.emptyNote}>
                  {t('boxes.emptyNote')}
                </Text>
              ) : (
                myNotes.map((note) => (
                  <View key={note.id} style={styles.noteRow}>
                    <View
                      style={[styles.noteDot, { backgroundColor: accent }]}
                    />
                    <Text style={styles.noteText}>{note.text}</Text>
                    <Pressable
                      onPress={() => handleDeleteNote(note.id)}
                      hitSlop={8}
                      style={styles.noteDelete}
                    >
                      <Text style={styles.noteDeleteIcon}>×</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>

            <View style={styles.partnerCard}>
              <Text style={styles.partnerLabel}>{t('boxes.partner')}</Text>
              <Text style={styles.partnerCount}>
                {t('boxes.partnerNotesCount', { count: partnerNotes.length })}
              </Text>
              <Text style={styles.partnerHint}>
                {!partnerUid
                  ? t('boxes.partnerNotJoined')
                  : partnerConfirmed
                    ? t('boxes.partnerReady')
                    : partnerNotes.length > 0
                      ? t('boxes.partnerNotConfirmed')
                      : t('boxes.partnerNoNotes')}
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          {!myConfirmed ? (
            <Pressable
              onPress={handleToggleConfirm}
              disabled={myNotes.length === 0}
              style={[
                styles.confirmBtn,
                {
                  backgroundColor: accent,
                  opacity: myNotes.length === 0 ? 0.4 : 1,
                },
              ]}
            >
              <Text style={[styles.confirmLabel, { color: 'white' }]}>
                {t('boxes.notesDone')}
              </Text>
            </Pressable>
          ) : (
            <>
              <Animated.View style={shuffleBtnStyle}>
                <Pressable
                  onPress={handleShuffle}
                  disabled={!canShuffle}
                  style={[
                    styles.shuffleBtn,
                    {
                      backgroundColor: accent,
                      shadowColor: accent,
                      opacity: canShuffle ? 1 : 0.5,
                    },
                  ]}
                >
                  <Text style={styles.shuffleIcon}>🎲</Text>
                  <Text style={styles.shuffleLabel}>{t('boxes.shuffle')}</Text>
                </Pressable>
              </Animated.View>
              <Pressable
                onPress={handleToggleConfirm}
                style={styles.editLink}
                hitSlop={8}
              >
                <Text style={styles.editLinkText}>
                  {partnerConfirmed
                    ? t('boxes.editNotes')
                    : t('boxes.editNotesWaiting')}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>

      {revealed ? (
        <>
          <Animated.View
            pointerEvents="auto"
            style={[styles.revealBackdrop, revealBackdropStyle]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={handleCloseReveal}
            />
          </Animated.View>

          <Animated.View
            pointerEvents="box-none"
            style={[styles.revealWrap, revealStyle]}
          >
            <View
              style={[
                styles.revealCard,
                {
                  backgroundColor: darken(accent, 0.12),
                  borderColor: withAlpha(lighten(accent, 0.3), 0.6),
                  shadowColor: accent,
                },
              ]}
            >
              <View
                style={[
                  styles.revealGlow,
                  { backgroundColor: withAlpha(lighten(accent, 0.5), 0.4) },
                ]}
              />
              <Text style={styles.revealEyebrow}>{t('boxes.revealEyebrow')}</Text>
              <Text style={styles.revealText}>{revealed.text}</Text>
              <View style={styles.revealActions}>
                <Pressable
                  onPress={handleCloseReveal}
                  style={styles.revealCloseBtn}
                >
                  <Text style={styles.revealCloseLabel}>{t('boxes.close')}</Text>
                </Pressable>
                <Pressable
                  onPress={handleShuffle}
                  style={[styles.revealAgainBtn, { backgroundColor: accent }]}
                >
                  <Text style={styles.revealAgainLabel}>{t('boxes.shuffleAgain')}</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </>
      ) : null}

      <ConfettiBurst
        ref={confettiRef}
        originX={width / 2}
        originY={height / 2 - 20}
        width={width}
        height={height}
        count={70}
        colors={[accent, '#FFD166', '#FFFFFF', '#F472B6', lighten(accent, 0.3)]}
      />
    </View>
  );
}

function StatusPill({
  label,
  active,
  color,
}: {
  label: string;
  active: boolean;
  color: string;
}) {
  return (
    <View
      style={[
        pillStyles.pill,
        {
          backgroundColor: active
            ? withAlpha(color, 0.22)
            : 'rgba(255,255,255,0.08)',
          borderColor: active
            ? withAlpha(color, 0.55)
            : 'rgba(255,255,255,0.18)',
        },
      ]}
    >
      <Text
        style={[
          pillStyles.text,
          { color: active ? lighten(color, 0.35) : 'rgba(255,255,255,0.78)' },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  text: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { color: 'white', fontSize: 18, fontWeight: '600' },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 14,
  },
  iconBubble: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  headerIcon: { fontSize: 30 },
  headerName: {
    ...typography.title,
    fontSize: 24,
    color: colors.fg,
    marginBottom: 10,
  },
  statusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  sectionTitle: {
    ...typography.small,
    color: colors.fgDim,
    marginBottom: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  addInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: colors.fg,
    maxHeight: 100,
    minHeight: 44,
  },
  addBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  addBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  notesList: { gap: 8, marginBottom: 20 },
  emptyNote: {
    ...typography.small,
    color: colors.fgDim,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  noteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 10,
  },
  noteText: {
    ...typography.body,
    flex: 1,
    color: colors.fg,
    fontSize: 14,
    lineHeight: 20,
  },
  noteDelete: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  noteDeleteIcon: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 18,
    fontWeight: '400',
  },
  partnerCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  partnerLabel: {
    ...typography.small,
    color: colors.fgDim,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  partnerCount: {
    color: colors.fg,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  partnerHint: {
    ...typography.small,
    color: colors.fgDim,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 6,
    alignItems: 'center',
  },
  confirmBtn: {
    minWidth: 240,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  shuffleBtn: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    minWidth: 240,
  },
  shuffleIcon: { fontSize: 22 },
  shuffleLabel: {
    color: 'white',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  editLink: {
    marginTop: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editLinkText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  revealBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  revealWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  revealCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
    minHeight: 200,
  },
  revealGlow: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  revealEyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 12,
  },
  revealText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 24,
  },
  revealActions: { flexDirection: 'row', gap: 10 },
  revealCloseBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
  },
  revealCloseLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  revealAgainBtn: {
    flex: 1.4,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  revealAgainLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  missingCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingText: { color: colors.fgDim, fontSize: 16 },
});
