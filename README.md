# love_games

Çiftler için mini oyunlar uygulaması. Faz 1: kategori çarkı.

## Stack

- Expo SDK 57 + React Native 0.86
- TypeScript
- Reanimated 4 + react-native-worklets
- Shopify React Native Skia
- expo-haptics

## Çalıştırma

```bash
npm install
npx expo start
```

Telefondaki **Expo Go** uygulamasında QR kodu okut.

## Şu An Var Olan

- 6 kategorilik döner çark (Cesaret, Doğruluk, Sarılma, Anılar, Oyun, Derin)
- Ortadaki `ÇEVİR` butonuna basınca 4 saniyelik out-quart easing ile dönüş
- Dilim geçişlerinde haptic tick (`selectionAsync`)
- Bitişte "impact heavy" ve seçilen kategoriden rastgele prompt Alert'te
- Son 3 kategori tekrar edilmez

## Klasör

```
src/
├── components/Wheel/   # Wheel, Pointer, SpinButton
├── data/               # categories.ts (JSON şeklinde)
├── hooks/              # useWheelSpin
├── screens/            # WheelScreen
├── theme/              # colors, typography
└── types/              # Category tipi
```

## Sonraki Adım

Faz 2: seçilen kategori için Alert yerine animasyonlu kart reveal (flip + shimmer + typewriter).
