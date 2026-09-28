@AGENTS.md

# love_games

Çiftler için animasyon-ağırlıklı mini oyunlar. **Expo SDK 57 + React Native 0.86 + Reanimated 4 + Skia 2.6**. Offline-first, backend yok. Türkçe UI.

## Kritik Kısıtlar

- **Expo 57 API'leri değişti** — kod yazmadan önce https://docs.expo.dev/versions/v57.0.0/ üzerinden doğrula (AGENTS.md).
- **`transform: translateZ` RN 0.86'da rejected** — 3D için `matrix` transform ya da faux-3D kullan.
- **Skia'da `Ellipse` yok**, `Oval` kullan.
- **`StyleSheet.absoluteFillObject` tip hatası verir** — `position: 'absolute', top: 0, left: 0, right: 0, bottom: 0` inline yaz.

## Mimari Kararlar

- **Offline-first, backend yok**. Statik veri: `src/data/*.json`. Kullanıcı state: AsyncStorage.
- **Expo Go uyumlu kalınacak**. Native module gerektiren şeyler (Rive, Bluetooth) için önce kullanıcıya sor — dev client'a geçmek istemiyor.
- **Cross-device sync** (Kutular feature): QR/base64 kod ile offline. Backend önerisi (Firebase) reddedildi. `LG1:` prefix + short-key JSON + base64 UTF-8. Bakış: `src/utils/boxSync.ts`.
- **Store dağıtımı**: `eas build --platform ios/android`. Expo Go sadece dev için.

## Mevcut Oyunlar

- **Çark** — `src/screens/WheelScreen.tsx` + `src/components/Wheel/`. Skia canvas, dim + winner glow + sparkle burst reveal, `useCategoryPrefs` (min 3 aktif kilidi).
- **Zar** — `src/screens/DiceScreen.tsx` + `src/components/Dice/`. 2 küp side-by-side, arc + tumble + Skia zemin gölgesi (`DiceShadow`), roulette-style face content cycling (`useDualDiceRoll`).
- **Kutular** — `src/screens/BoxListScreen.tsx` + `BoxScreen.tsx` + `src/components/Box/SyncModal.tsx`. QR/kod ile 2 telefon arası sync, `useBoxes` context provider, solo mod dahil.

## Kullanıcı Tercihleri (Bunları Bil)

- **Animasyon çıtası yüksek**. "Amatör" görünen düz çözüm reddedilir. Konfeti, glow, particle, spring, Skia efektleri standart. Detay: `.claude/.../memory/feedback_animation_bar.md`.
- **Backend kullanmıyor** — cross-device özellikler için QR/offline sync tercih ediliyor.
- **Türkçe UI** — tüm kullanıcıya görünen metinler Türkçe.
- **Deneyimli geliştirici** — teknik detaylara girilebilir, "amateur" gerekçesi kabul edilir.

## Test / Çalıştırma

- `npm start` — LAN mode (aynı WiFi'de telefon)
- `npx expo start --tunnel` — farklı ağlardaki telefonlar için (gunelenes hesabıyla `expo login` gerek; tarayan taraf hesapsız çalışır)
- `npx tsc --noEmit` — TS check
- `npx expo export --platform android --output-dir .metro-check` — bundle sanity

## Dizin Rehberi

```
src/
  data/                # categories.json, placeCategories.json (statik veri)
  hooks/               # useWheelSpin, useDualDiceRoll, useCategoryPrefs, useBoxes
  utils/               # boxSync (codec), color (lighten/darken/withAlpha)
  components/
    Wheel/, Dice/, Box/
    Background/AuroraBackground
    Confetti/ConfettiBurst  # imperative ref API
    ResultCard/, ui/
  screens/             # HomeScreen + Wheel, Dice, BoxList, Box
  navigation/RootNav.tsx
  theme/               # colors, typography
```

## Yapılacaklar / Bilinen Eksikler

- Kutular: `expo-clipboard` ile "Kodu kopyala" butonu (şu an long-press + select)
- Kutular: in-place not düzenleme (şu an sil + yeniden ekle)
- Kutular: kutu adı rename UI'ı (hook `renameBox` sağlıyor, UI yok)
- Wheel: outer glow wheel container'a sınırlı — halo dışa taşmıyor
- Store için EAS build henüz yapılmadı
