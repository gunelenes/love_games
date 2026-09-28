import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuroraBackground } from '@/components/Background/AuroraBackground';
import { BackButton } from '@/components/ui/BackButton';
import { SyncModal } from '@/components/Box/SyncModal';
import { useBoxes } from '@/hooks/useBoxes';
import type { RootStackParamList } from '@/navigation/RootNav';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { darken, lighten, withAlpha } from '@/utils/color';
import type { Box } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BoxList'>;

const { width, height } = Dimensions.get('window');

const PRESETS = [
  { icon: '🎬', color: '#7C3AED' },
  { icon: '🍕', color: '#FF7A45' },
  { icon: '🎁', color: '#EC4899' },
  { icon: '💬', color: '#3B82F6' },
  { icon: '🎯', color: '#10B981' },
  { icon: '💌', color: '#EF4444' },
];

export function BoxListScreen({ navigation }: Props) {
  const { boxes, createBox } = useBoxes();
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleCreate = (name: string, icon: string, color: string) => {
    const box = createBox(name, color, icon);
    setCreating(false);
    navigation.navigate('Box', { boxId: box.id });
  };

  const handleJoinSuccess = (boxId: string) => {
    setJoining(false);
    navigation.navigate('Box', { boxId });
  };

  return (
    <View style={styles.root}>
      <AuroraBackground width={width} height={height} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>KUTULAR</Text>
          <Text style={styles.title}>Ortak Kutular</Text>
          <Text style={styles.subtitle}>
            Notları gizlice yaz, karışık çıksın
          </Text>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topActionsRow}>
            <NewBoxButton onPress={() => setCreating(true)} />
            <JoinBoxButton onPress={() => setJoining(true)} />
          </View>

          {boxes.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>Henüz kutu yok</Text>
              <Text style={styles.emptyText}>
                Yeni bir kutu oluştur, notlarını ekle, partnerinle karıştır
              </Text>
            </View>
          ) : (
            boxes.map((b) => (
              <BoxCard
                key={b.id}
                box={b}
                onPress={() => navigation.navigate('Box', { boxId: b.id })}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      <CreateBoxModal
        visible={creating}
        onClose={() => setCreating(false)}
        onCreate={handleCreate}
      />

      <SyncModal
        visible={joining}
        onClose={() => setJoining(false)}
        onReceiveSuccess={handleJoinSuccess}
      />
    </View>
  );
}

function NewBoxButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    flex: 1,
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        onPressIn={() =>
          (scale.value = withSpring(0.96, { damping: 14, stiffness: 260 }))
        }
        onPressOut={() =>
          (scale.value = withSpring(1, { damping: 10, stiffness: 200 }))
        }
        style={styles.newBtn}
      >
        <Text style={styles.newIcon}>+</Text>
        <Text style={styles.newLabel}>Yeni Kutu</Text>
      </Pressable>
    </Animated.View>
  );
}

function JoinBoxButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    flex: 1,
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        onPressIn={() =>
          (scale.value = withSpring(0.96, { damping: 14, stiffness: 260 }))
        }
        onPressOut={() =>
          (scale.value = withSpring(1, { damping: 10, stiffness: 200 }))
        }
        style={styles.joinBtn}
      >
        <Text style={styles.joinIcon}>📥</Text>
        <Text style={styles.joinLabel}>Kutuya Katıl</Text>
      </Pressable>
    </Animated.View>
  );
}

function BoxCard({ box, onPress }: { box: Box; onPress: () => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bothConfirmed = box.myConfirmed && box.partnerConfirmed;
  const totalNotes = box.myNotes.length + box.partnerNotes.length;

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        onPressIn={() =>
          (scale.value = withSpring(0.97, { damping: 14, stiffness: 260 }))
        }
        onPressOut={() =>
          (scale.value = withSpring(1, { damping: 10, stiffness: 200 }))
        }
        style={[
          styles.card,
          {
            backgroundColor: darken(box.color, 0.15),
            borderColor: withAlpha(box.color, 0.5),
            shadowColor: box.color,
          },
        ]}
      >
        <View
          style={[
            styles.cardGlow,
            { backgroundColor: withAlpha(lighten(box.color, 0.35), 0.35) },
          ]}
        />
        <View style={styles.cardHead}>
          <View
            style={[
              styles.cardIcon,
              {
                backgroundColor: withAlpha('#FFFFFF', 0.15),
                borderColor: withAlpha('#FFFFFF', 0.3),
              },
            ]}
          >
            <Text style={styles.cardIconText}>{box.icon}</Text>
          </View>
          <View style={styles.cardMiddle}>
            <Text style={styles.cardName} numberOfLines={1}>
              {box.name}
            </Text>
            <Text style={styles.cardMeta}>
              {box.myNotes.length} senin · {box.partnerNotes.length} partner
            </Text>
          </View>
          <View
            style={[
              styles.stateChip,
              {
                backgroundColor: bothConfirmed
                  ? withAlpha('#10B981', 0.25)
                  : withAlpha('#FFFFFF', 0.12),
                borderColor: bothConfirmed
                  ? withAlpha('#10B981', 0.6)
                  : withAlpha('#FFFFFF', 0.2),
              },
            ]}
          >
            <Text
              style={[
                styles.stateText,
                { color: bothConfirmed ? '#6EE7B7' : 'rgba(255,255,255,0.7)' },
              ]}
            >
              {bothConfirmed ? 'Hazır' : `${totalNotes} not`}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function CreateBoxModal({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, icon: string, color: string) => void;
}) {
  const [name, setName] = useState('');
  const [themeIdx, setThemeIdx] = useState(0);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const theme = PRESETS[themeIdx];
    onCreate(trimmed, theme.icon, theme.color);
    setName('');
    setThemeIdx(0);
  };

  const handleClose = () => {
    setName('');
    setThemeIdx(0);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={handleClose}>
        <Pressable
          style={styles.modalCard}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.modalTitle}>Yeni Kutu</Text>
          <Text style={styles.modalSubtitle}>
            Kutunuza bir isim ve tema verin
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Örn. Sinema gecesi"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.input}
            maxLength={30}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={submit}
          />

          <View style={styles.themeGrid}>
            {PRESETS.map((p, i) => {
              const selected = i === themeIdx;
              return (
                <Pressable
                  key={i}
                  onPress={() => setThemeIdx(i)}
                  style={[
                    styles.themeChip,
                    {
                      backgroundColor: withAlpha(p.color, selected ? 0.5 : 0.2),
                      borderColor: withAlpha(
                        p.color,
                        selected ? 1 : 0.35
                      ),
                    },
                  ]}
                >
                  <Text style={styles.themeIcon}>{p.icon}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.modalActions}>
            <Pressable onPress={handleClose} style={styles.cancelBtn}>
              <Text style={styles.cancelLabel}>İptal</Text>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={!name.trim()}
              style={[
                styles.confirmBtn,
                {
                  backgroundColor: PRESETS[themeIdx].color,
                  opacity: name.trim() ? 1 : 0.4,
                },
              ]}
            >
              <Text style={styles.confirmLabel}>Oluştur</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safe: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  eyebrow: {
    ...typography.small,
    color: colors.accent,
    marginBottom: 6,
  },
  title: {
    ...typography.title,
    color: colors.fg,
    marginBottom: 6,
    fontSize: 30,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.fgDim,
    textAlign: 'center',
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  topActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  newIcon: {
    color: 'white',
    fontSize: 22,
    fontWeight: '400',
    marginTop: -2,
  },
  newLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: withAlpha('#10B981', 0.2),
    borderWidth: 1.5,
    borderColor: withAlpha('#10B981', 0.5),
  },
  joinIcon: {
    fontSize: 18,
  },
  joinLabel: {
    color: '#6EE7B7',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 12,
    opacity: 0.6,
  },
  emptyTitle: {
    ...typography.body,
    color: colors.fg,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  emptyText: {
    ...typography.small,
    color: colors.fgDim,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    fontSize: 26,
  },
  cardMiddle: {
    flex: 1,
  },
  cardName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardMeta: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  stateChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  stateText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    color: colors.fg,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  modalSubtitle: {
    color: colors.fgDim,
    fontSize: 13,
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.fg,
    marginBottom: 16,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
    justifyContent: 'space-between',
  },
  themeChip: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIcon: {
    fontSize: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  cancelLabel: {
    color: colors.fg,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  confirmBtn: {
    flex: 1.4,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmLabel: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
