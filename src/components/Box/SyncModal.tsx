import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import { useBoxes } from '@/hooks/useBoxes';
import type { Box } from '@/types';
import {
  buildBlobFromBox,
  decodeSyncBlob,
  encodeSyncBlob,
} from '@/utils/boxSync';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { withAlpha } from '@/utils/color';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Mode = 'idle' | 'showQR' | 'scanQR' | 'showCode' | 'enterCode';
type Feedback =
  | { type: 'none' }
  | { type: 'success'; created: boolean }
  | { type: 'stale' }
  | { type: 'invalid' };

type Props = {
  visible: boolean;
  onClose: () => void;
  /** If undefined, only receive modes are shown (join-a-box flow). */
  box?: Box;
  /** Fired after a successful receive. Useful for the join-a-box flow to navigate. */
  onReceiveSuccess?: (boxId: string, wasCreated: boolean) => void;
};

export function SyncModal({
  visible,
  onClose,
  box,
  onReceiveSuccess,
}: Props) {
  const { applySyncBlob } = useBoxes();
  const [mode, setMode] = useState<Mode>('idle');
  const [feedback, setFeedback] = useState<Feedback>({ type: 'none' });
  const [codeInput, setCodeInput] = useState('');
  const [kbHeight, setKbHeight] = useState(0);
  const [justReceived, setJustReceived] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const receiveOnly = !box;

  const slideY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKbHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKbHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      slideY.value = withTiming(0, {
        duration: 320,
        easing: Easing.out(Easing.cubic),
      });
      backdropOpacity.value = withTiming(0.7, { duration: 240 });
    } else {
      slideY.value = withTiming(SCREEN_HEIGHT, {
        duration: 260,
        easing: Easing.in(Easing.cubic),
      });
      backdropOpacity.value = withTiming(0, { duration: 220 });
    }
  }, [visible, slideY, backdropOpacity]);

  useEffect(() => {
    if (!visible) {
      // reset on close
      const t = setTimeout(() => {
        setMode('idle');
        setFeedback({ type: 'none' });
        setCodeInput('');
        setJustReceived(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [visible]);

  const encoded = useMemo(
    () => (box ? encodeSyncBlob(buildBlobFromBox(box)) : ''),
    [box]
  );

  const applyBlob = (raw: string) => {
    const decoded = decodeSyncBlob(raw);
    if (!decoded) {
      setFeedback({ type: 'invalid' });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const result = applySyncBlob(decoded);
    if (result.status === 'invalid') {
      setFeedback({ type: 'invalid' });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (result.status === 'stale') {
      setFeedback({ type: 'stale' });
      return;
    }
    const wasCreated = result.status === 'created';
    setFeedback({ type: 'success', created: wasCreated });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (onReceiveSuccess && 'boxId' in result) {
      // Join flow: hand off to caller (typically navigates to the box)
      setTimeout(() => {
        onReceiveSuccess(result.boxId, wasCreated);
      }, 1200);
      return;
    }

    if (box) {
      // Existing box: prompt user to send their side back
      setTimeout(() => {
        setFeedback({ type: 'none' });
        setJustReceived(true);
        setMode('showQR');
      }, 1200);
      return;
    }

    // Fallback: just close
    setTimeout(() => onClose(), 1500);
  };

  const handleScan = ({ data }: { data: string }) => {
    if (feedback.type === 'success') return;
    applyBlob(data);
  };

  const handleEnterSubmit = () => {
    Keyboard.dismiss();
    applyBlob(codeInput);
  };

  const handleTryScanAgain = () => {
    setFeedback({ type: 'none' });
  };

  const handleCloseModal = () => {
    Keyboard.dismiss();
    onClose();
  };

  const goToScan = async () => {
    if (!permission || !permission.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setFeedback({ type: 'none' });
    setMode('scanQR');
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableWithoutFeedback onPress={handleCloseModal}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>

        <Animated.View style={[styles.panel, { bottom: kbHeight }, panelStyle]}>
          <SafeAreaView edges={['bottom']} style={styles.safe}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View>
                <Text style={styles.title}>
                  {receiveOnly ? 'Kutuya Katıl' : 'Sync'}
                </Text>
                <Text style={styles.subtitle}>
                  {mode === 'idle'
                    ? receiveOnly
                      ? 'Partnerin QR/kod paylaşımıyla kutuyu al'
                      : 'Karşılıklı QR paylaşımı'
                    : mode === 'showQR'
                      ? justReceived
                        ? '✨ Aldın — şimdi partnerine göster'
                        : 'Partnerin tarasın'
                      : mode === 'scanQR'
                        ? 'QR kodu kameraya göster'
                        : mode === 'showCode'
                          ? 'Kodu paylaş'
                          : 'Aldığın kodu yapıştır'}
                </Text>
              </View>
              <Pressable
                onPress={handleCloseModal}
                style={styles.closeBtn}
                hitSlop={10}
              >
                <Text style={styles.closeIcon}>×</Text>
              </Pressable>
            </View>

            <View style={styles.body}>
              {mode === 'idle' ? (
                <IdleGrid
                  receiveOnly={receiveOnly}
                  onPick={(m) =>
                    m === 'scanQR' ? goToScan() : setMode(m)
                  }
                />
              ) : mode === 'showQR' ? (
                <ShowQRView
                  value={encoded}
                  justReceived={justReceived}
                  onBack={() => {
                    setJustReceived(false);
                    setMode('idle');
                  }}
                  onDone={handleCloseModal}
                />
              ) : mode === 'scanQR' ? (
                <ScanQRView
                  feedback={feedback}
                  onScan={handleScan}
                  onBack={() => {
                    setFeedback({ type: 'none' });
                    setMode('idle');
                  }}
                  onRetry={handleTryScanAgain}
                />
              ) : mode === 'showCode' ? (
                <ShowCodeView code={encoded} onBack={() => setMode('idle')} />
              ) : (
                <EnterCodeView
                  value={codeInput}
                  onChange={setCodeInput}
                  onSubmit={handleEnterSubmit}
                  feedback={feedback}
                  onBack={() => {
                    Keyboard.dismiss();
                    setFeedback({ type: 'none' });
                    setMode('idle');
                  }}
                />
              )}
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function IdleGrid({
  receiveOnly,
  onPick,
}: {
  receiveOnly: boolean;
  onPick: (m: Exclude<Mode, 'idle'>) => void;
}) {
  const all: Array<{
    mode: Exclude<Mode, 'idle'>;
    icon: string;
    title: string;
    desc: string;
    kind: 'send' | 'receive';
  }> = [
    {
      mode: 'showQR',
      icon: '📤',
      title: 'QR göster',
      desc: 'Partnerin telefonu tarasın',
      kind: 'send',
    },
    {
      mode: 'scanQR',
      icon: '📷',
      title: 'QR tara',
      desc: 'Partnerin QR\'ını kameraya göster',
      kind: 'receive',
    },
    {
      mode: 'showCode',
      icon: '🔗',
      title: 'Kod paylaş',
      desc: 'WhatsApp gibi bir yerden gönder',
      kind: 'send',
    },
    {
      mode: 'enterCode',
      icon: '📥',
      title: 'Kod gir',
      desc: 'Aldığın kodu yapıştır',
      kind: 'receive',
    },
  ];
  const items = receiveOnly ? all.filter((it) => it.kind === 'receive') : all;
  return (
    <View>
      <View
        style={[
          styles.hintCard,
          { borderColor: withAlpha(colors.accent, 0.35) },
        ]}
      >
        <Text style={styles.hintTitle}>🔁 İki taraf da paylaşır</Text>
        <Text style={styles.hintText}>
          {receiveOnly
            ? 'Partnerin QR/kod paylaşımıyla kutuyu al. Sonrasında kendi notlarını ekleyip aynı yolla ona da göndereceksin.'
            : 'Biri QR gösterir, diğeri tarar → veriler karşı tarafa geçer. Sonra rolleri değiştirirsiniz — iki telefonda da tüm notlar oluşur.'}
        </Text>
      </View>
      <View style={styles.grid}>
        {items.map((it) => (
          <Pressable
            key={it.mode}
            onPress={() => onPick(it.mode)}
            style={styles.gridCell}
          >
            <Text style={styles.gridIcon}>{it.icon}</Text>
            <Text style={styles.gridTitle}>{it.title}</Text>
            <Text style={styles.gridDesc}>{it.desc}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ShowQRView({
  value,
  justReceived,
  onBack,
  onDone,
}: {
  value: string;
  justReceived: boolean;
  onBack: () => void;
  onDone: () => void;
}) {
  return (
    <View style={styles.centered}>
      {justReceived ? (
        <View
          style={[
            styles.hintCard,
            {
              borderColor: withAlpha('#10B981', 0.5),
              backgroundColor: withAlpha('#10B981', 0.12),
              marginBottom: 12,
            },
          ]}
        >
          <Text style={styles.hintTitle}>✨ Partnerin notları alındı</Text>
          <Text style={styles.hintText}>
            Şimdi de senin notların onun telefonuna geçsin — bu QR'ı ona
            tarat.
          </Text>
        </View>
      ) : null}
      <View style={styles.qrFrame}>
        <QRCode
          value={value}
          size={220}
          backgroundColor="white"
          color="black"
          ecl="L"
        />
      </View>
      {!justReceived ? (
        <Text style={styles.helperText}>
          Partnerin QR tara moduna geçsin ve bu kodu okutsun.
        </Text>
      ) : null}
      <View style={styles.scanActions}>
        {justReceived ? (
          <Pressable onPress={onDone} style={styles.retryBtn}>
            <Text style={styles.retryLabel}>Tamamdır</Text>
          </Pressable>
        ) : null}
        <BackToIdleBtn onPress={onBack} />
      </View>
    </View>
  );
}

function ScanQRView({
  feedback,
  onScan,
  onBack,
  onRetry,
}: {
  feedback: Feedback;
  onScan: (r: { data: string }) => void;
  onBack: () => void;
  onRetry: () => void;
}) {
  const showFeedback = feedback.type !== 'none';
  return (
    <View style={styles.centered}>
      <View style={styles.cameraFrame}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          autofocus="on"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={
            feedback.type === 'success' ? undefined : onScan
          }
        />
        <View style={styles.scanOverlay} pointerEvents="none">
          <View style={styles.scanBox} />
        </View>
      </View>
      {showFeedback ? (
        <FeedbackBanner feedback={feedback} />
      ) : (
        <Text style={styles.helperText}>QR'ı çerçeveye getir</Text>
      )}
      <View style={styles.scanActions}>
        {feedback.type === 'invalid' || feedback.type === 'stale' ? (
          <Pressable onPress={onRetry} style={styles.retryBtn}>
            <Text style={styles.retryLabel}>Tekrar Dene</Text>
          </Pressable>
        ) : null}
        <BackToIdleBtn onPress={onBack} />
      </View>
    </View>
  );
}

function ShowCodeView({ code, onBack }: { code: string; onBack: () => void }) {
  return (
    <View style={styles.centered}>
      <ScrollView
        style={styles.codeBox}
        contentContainerStyle={styles.codeContent}
      >
        <Text style={styles.codeText} selectable>
          {code}
        </Text>
      </ScrollView>
      <Text style={styles.helperText}>
        Kodu uzun bas + kopyala; partnerine WhatsApp'tan gönder.
      </Text>
      <BackToIdleBtn onPress={onBack} />
    </View>
  );
}

function EnterCodeView({
  value,
  onChange,
  onSubmit,
  feedback,
  onBack,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  feedback: Feedback;
  onBack: () => void;
}) {
  return (
    <View style={styles.centered}>
      <View style={styles.enterActionsRow}>
        <BackToIdleBtn onPress={onBack} />
        <Pressable
          onPress={onSubmit}
          disabled={!value.trim()}
          style={[
            styles.retryBtn,
            {
              backgroundColor: value.trim()
                ? colors.accent
                : 'rgba(255,255,255,0.1)',
              flex: 1,
            },
          ]}
        >
          <Text style={styles.retryLabel}>Uygula</Text>
        </Pressable>
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Kodu buraya yapıştır…"
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={styles.pasteInput}
        multiline
        autoCorrect={false}
        autoCapitalize="none"
      />
      {feedback.type !== 'none' ? <FeedbackBanner feedback={feedback} /> : null}
    </View>
  );
}

function FeedbackBanner({ feedback }: { feedback: Feedback }) {
  if (feedback.type === 'none') return null;
  const isSuccess = feedback.type === 'success';
  const isStale = feedback.type === 'stale';
  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isSuccess
            ? withAlpha('#10B981', 0.22)
            : isStale
              ? withAlpha('#F59E0B', 0.22)
              : withAlpha('#EF4444', 0.22),
          borderColor: isSuccess
            ? withAlpha('#10B981', 0.5)
            : isStale
              ? withAlpha('#F59E0B', 0.5)
              : withAlpha('#EF4444', 0.5),
        },
      ]}
    >
      <Text style={styles.bannerText}>
        {isSuccess
          ? feedback.created
            ? '✨ Kutu alındı ve oluşturuldu'
            : '✨ Kutu güncellendi'
          : isStale
            ? '⏳ Bu kod eski, daha yenisi elimizde'
            : '⚠️ Kod geçersiz veya bozuk'}
      </Text>
    </View>
  );
}

function BackToIdleBtn({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.backBtn}>
      <Text style={styles.backBtnLabel}>‹ Geri</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: SCREEN_HEIGHT * 0.9,
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  safe: {
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  title: {
    ...typography.title,
    color: colors.fg,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    ...typography.small,
    color: colors.fgDim,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: colors.fg,
    fontSize: 22,
    marginTop: -2,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: 320,
  },
  hintCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  hintTitle: {
    color: colors.fg,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  hintText: {
    color: colors.fgDim,
    fontSize: 12,
    lineHeight: 17,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  gridCell: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    minHeight: 128,
    justifyContent: 'center',
  },
  gridIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  gridTitle: {
    color: colors.fg,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  gridDesc: {
    color: colors.fgDim,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  centered: {
    alignItems: 'center',
    paddingTop: 8,
  },
  qrFrame: {
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 16,
  },
  cameraFrame: {
    width: 260,
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'black',
    marginBottom: 16,
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBox: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  helperText: {
    color: colors.fgDim,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  scanActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  enterActionsRow: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  retryLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  backBtnLabel: {
    color: colors.fg,
    fontSize: 14,
    fontWeight: '700',
  },
  codeBox: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  codeContent: {
    paddingBottom: 4,
  },
  codeText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 15,
  },
  pasteInput: {
    width: '100%',
    minHeight: 120,
    maxHeight: 220,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 12,
    color: colors.fg,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  banner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignSelf: 'stretch',
  },
  bannerText: {
    color: colors.fg,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});

