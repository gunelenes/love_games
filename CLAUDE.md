@AGENTS.md

# love_games

Yetişkin çiftler için sensuel + kink-yönelimli mini oyunlar. **Expo SDK 57 + React Native 0.86 + Reanimated 4 + Skia 2.6 + Firebase 12 + i18next**. Cloud-backed (Firestore), 2 dil (English default, Türkçe secondary). 18+ yaş kapılı.

## Kritik Kısıtlar

- **Expo 57 API'leri değişti** — kod yazmadan önce https://docs.expo.dev/versions/v57.0.0/ üzerinden doğrula (AGENTS.md).
- **`transform: translateZ` RN 0.86'da rejected** — 3D için `matrix` transform ya da faux-3D kullan.
- **Skia'da `Ellipse` yok**, `Oval` kullan.
- **`StyleSheet.absoluteFillObject` tip hatası verir** — `position: 'absolute', top: 0, left: 0, right: 0, bottom: 0` inline yaz.
- **Reanimated worklet'lerinde JS fonksiyonu çağırma** — `withAlpha` gibi utility'ler render sırasında pre-compute edilmeli, worklet içinde değil (Cards ekranı crash yaptı).
- **Firebase Auth persistence** — RN için `initializeAuth` + `getReactNativePersistence(AsyncStorage)` gerek. `getReactNativePersistence` sadece `firebase/auth`'un RN bundle'ında var, TS `@ts-expect-error` gerekir.
- **Firebase Admin SDK v13** — modular API (`initializeApp` from `firebase-admin/app`, `getFirestore` from `firebase-admin/firestore`). Klasik `admin.credential.cert()` çalışmaz.
- **Metro admin/ klasörünü görmez** — `metro.config.js` root'ta `admin/` blockList'te. Expo CLI bazen `admin/tsconfig.json`'a `extends: expo/tsconfig.base` ekler; cosmetic, blockList devrede.

## Mimari

### Katmanlar

- **Mobil (Expo Go)**: kullanıcı-facing app, Firestore'dan okur, Kutular için real-time yazar
- **Firebase Firestore**: içerik + oda/kutu state
- **Admin panel (Next.js, Railway)**: `admin/` klasörü — Firestore CRUD, admin custom claim ile gate
- **Anonymous auth**: mobil kullanıcı UID kalıcı (AsyncStorage persist)
- **Otomatik rules deploy**: GitHub Actions, `firestore.rules` push edilince canlıya çıkar (`FIREBASE_SERVICE_ACCOUNT` secret'ı ile)

### Track + Level Sistemi

Uygulama iki paralel track sunar, her track içinde 5 seviye:

**Yakınlık (Romantik)**: L1 Fısıltı → L2 Yakınlık → L3 Sırlar → L4 Alev → L5 Bağ
**Keşif (Cesur)**: L1 Kıvılcım → L2 Işıltı → L3 Cesaret → L4 Zirve → L5 Efsane

- Kategoriler `track` + `level` alanları taşır
- Kullanıcı her oyunda TrackLevelBar (üstte) ile seçer, `usePlayPrefs` AsyncStorage'a persist
- Filter kümülatif: `c.track === selected && c.level <= selected`
- Kutular odasında track/level Firestore'da paylaşımlı (real-time sync)
- BDSM terimleri kamuflaje edildi: Rigger → Halatçı, Master → Rehber, Sadist → Sınavcı, Brat → Yaramaz, Petowner → Bahçıvan (bkz. `.claude/.../plans/greedy-wibbling-reef.md`)
- L3+ için opsiyonel `flavors?: KinkFlavor[]` (rope, command, petplay, primal, sensory, roleplay, impact)

### Kritik Karar: Offline-First → Cloud-Hybrid

Eski offline QR-based Kutular kaldırıldı, Firebase Firestore real-time'a taşındı (bkz. plan file). Kutular artık:
- Anonymous auth ile stabil UID
- 6-char oda kodu (BASE32, çakışma-korumalı transaction)
- Room-based Firestore doc + boxes subcollection
- Real-time listeners (`onSnapshot`)
- QR/base64 codec **silindi**: `boxSync.ts`, `SyncModal.tsx`, `expo-camera`, `qrcode-svg`, `svg` deps

Çark/Zar/Kart için içerik: bundle fallback + Firestore (`useContent` hook, AsyncStorage cache).

## Mevcut Oyunlar (4)

- **Çark** — `src/screens/WheelScreen.tsx` + `components/Wheel/`. Skia canvas, dim + winner glow + sparkle burst.
- **Zar** — `src/screens/DiceScreen.tsx` + `components/Dice/`. 2 küp side-by-side, arc + tumble + Skia gölge, `useDualDiceRoll`.
- **Kart** — `src/screens/CardsScreen.tsx` + `components/Cards/`. 3D flip kart, kategori chip'leri, `useCardSelection`.
- **Kutular** — `src/screens/BoxListScreen.tsx` + `BoxScreen.tsx` + `RoomLobbyScreen.tsx`. Firebase real-time sync, room-based.

## İçerik Durumu (Firestore)

| Collection | Adet | Notlar |
|-----------|------|--------|
| `categories` | 27 | 6 Romantik L1 bundle + 12 Romantik L2-L5 + 15 Cesur L1-L5 |
| `diceFaces` | 12 | 6 Romantik L1 bundle + 6 Cesur L1 |
| `placeCategories` | 12 | 6 Romantik L1 bundle + 6 Cesur L1 |
| `meta/content` | 1 | version bump for cache invalidation |

Toplam ~250 prompt (çoğu Türkçe; İngilizce çevirisi henüz yok).

## Kullanıcı Tercihleri (Bunları Bil)

- **Animasyon çıtası yüksek**. "Amatör" görünen düz çözüm reddedilir. Detay: `.claude/.../memory/feedback_animation_bar.md`.
- **Full otonomi verilir** — "sen yap" dediğinde büyük değişiklikleri commit + push et.
- **Türkçe + English UI** — default en, ayarlar'dan tr'ye geçiş. Content prompts hala Türkçe.
- **Sensual/kink content**: tam yetişkin bir çiftler uygulaması. BDSM terminolojisi discreet Türkçe kamuflajla (bkz. plan file).
- **Store hedefi**: Google Play + iOS App Store denenecek (Play daha esnek), yetersiz kalırsa PWA fallback.
- **Deneyimli geliştirici** — teknik detaylara girilebilir.

## Kullanılan Servisler

- **Firebase**: proje `love-games-prod` (bkz. `src/services/firebaseConfig.ts` — public config)
  - Firestore, Auth (anonymous + admin panel için email/password), custom claims (`admin: true`)
  - Service account: `scripts/service-account.json` + `admin/scripts/service-account.json` (gitignored)
- **Railway**: Next.js admin panelini deploy eder (bkz. `admin/README.md`)
- **GitHub Actions**: Firestore rules otomatik deploy (`.github/workflows/deploy-firestore-rules.yml`)

## Test / Çalıştırma

**Mobil:**
- `npm start` — LAN mode
- `npx expo start --tunnel` — farklı ağlar (gunelenes hesabı gerek)
- `npx tsc --noEmit` — TS check
- `npx expo export --platform android --output-dir .metro-check` — bundle sanity

**Admin panel:**
- `cd admin && npm run dev` — localhost:3000
- Env: `admin/.env.local` (mobil app ile aynı Firebase config)
- Admin claim: `cd admin && npm run grant-admin -- <email>` (service account gerek)

**Content seed:**
- `node scripts/seed-firestore.js` — bundle JSON'ları upload eder (`categories/`, `placeCategories/`, `diceFaces/`)
- `node scripts/seed-content.js` — `scripts/content/{collection}/*.json` dosyalarını Firestore'a merge eder
- Yeni içerik: `scripts/content/categories/cesur-l6.json` gibi bir dosya oluştur, seed çalıştır

**Firestore rules:**
- `firestore.rules`'a düzenle → push → GitHub Action auto-deploy (~1 dk)
- Local test: `$env:GOOGLE_APPLICATION_CREDENTIALS="admin/scripts/service-account.json"; npm run firebase:deploy:rules`

## Dizin Rehberi

```
love_games/                       # mobil
  src/
    data/                         # bundle JSON'lar + tracks.ts (TRACK_META, LEVEL_META)
    hooks/                        # useAuth, useRoom, useRoomBoxes, useBoxDoc, useContent,
                                  # useCategoryPrefs, useCardSelection, usePlayPrefs,
                                  # useLanguage, useAgeGate, useWheelSpin, useDualDiceRoll
    services/                     # firebase.ts, firebaseConfig.ts, roomService, boxService,
                                  # contentService
    i18n/                         # i18next init + locales/{en,tr}.json
    utils/                        # color.ts
    components/
      TrackLevelBar/              # track chip + level dot bar (Wheel/Dice/Cards/BoxList)
      Settings/SettingsModal      # dil değişimi
      AgeGate/AgeGateModal        # ilk açılış 18+ blocker
      Cards/                      # FlipCard, CardDeck, CardFace, CardSettingsPanel
      Wheel/, Dice/               # (mevcut)
      Background/, Confetti/, ResultCard/, ui/
    screens/                      # Home, Wheel, Dice, Cards, RoomLobby, BoxList, Box
    navigation/RootNav.tsx
    theme/                        # colors, typography
  scripts/
    seed-firestore.js             # bundle → Firestore
    seed-content.js               # scripts/content/{collection}/ → Firestore
    add-track-level.js            # bir seferlik bundle migration
    content/
      categories/*.json           # 27 kategori (Romantik L2-L5 + Cesur L1-L5)
      diceFaces/cesur-l1.json     # 6 Cesur dice
      placeCategories/cesur-l1.json # 6 Cesur places
    service-account.json          # gitignored
  firestore.rules                 # content: public read + admin write, rooms: member-only
  firebase.json / .firebaserc     # Firebase CLI config
  .github/workflows/
    deploy-firestore-rules.yml    # push tetiklemeli auto-deploy
  metro.config.js                 # admin/ blockList
  app.json                        # expo config (expo-camera plugin kaldırıldı)
  App.tsx                         # provider zinciri: Language → AgeGate → Content → Auth → Room

admin/                            # Next.js 14 admin panel (Railway'de deployed)
  app/                            # login, categories, place-categories, dice-faces, no-access
  components/                     # AdminShell, CategoryEditor (with Track/Level/Flavor dropdowns),
                                  # PlaceCategoryEditor
  lib/                            # firebase.ts, auth-context, content-service, types
                                  # (mirror of mobile types + FLAVORS enum)
  scripts/                        # grant-admin.js, check-claims.js
  .env.local                      # gitignored — same Firebase config as mobile
```

## Kritik Tipler (`src/types/index.ts`)

```typescript
export type Track = 'romantik' | 'cesur';
export type Level = 1 | 2 | 3 | 4 | 5;
export type KinkFlavor = 'rope' | 'command' | 'petplay' | 'primal' | 'sensory' | 'roleplay' | 'impact';

export type Category = {
  id: string; name: string; color: string; icon: string;
  prompts: string[]; order?: number;
  track: Track; level: Level; flavors?: KinkFlavor[];
};

export type PlaceCategory = { /* similar, places[] instead of prompts */ };
export type BoxNote = { id: string; text: string; authorUid: string; createdAt: number; };
export type RoomBox = {
  id, name, color, icon, createdAt, updatedAt, createdBy: string;
  notes: BoxNote[]; confirmations: Record<string, boolean>;
};
```

`admin/lib/types.ts` bunun mirror'ı — güncellemede iki tarafı da senkron tut.

## Yapılacaklar / Bilinen Eksikler

**i18n eksikleri** (framework kurulu, en/tr locales var, ana ekranlar refactor edildi):
- BoxScreen (notes UI, karıştır, delete confirm) hala Türkçe
- CategoryPanel modal (çark ayarları) hala Türkçe
- Content prompts (Firestore'daki kategori isim/prompt'lar sadece Türkçe) — data model'e `nameEn`/`promptsEn` eklenmesi + çeviri gerek

**İçerik:**
- Cesur L2-L5 kategorileri henüz 6 prompt'ta (L1 örneği 10 prompt'a çıkarıldı, aynı pattern uygulanabilir)
- Romantik dice + places genişlemesi yok
- Flavor tag'leri mobil UI'da görünmüyor (data yerinde, admin'de setlenebilir; sadece render eksik)

**Kutular:**
- `expo-clipboard` ile "Kodu kopyala" butonu yok (kod uzun bas + seç)
- In-place not düzenleme yok (sil + yeniden ekle)
- Kutu adı rename UI'ı yok (service hazır: `renameBox` in `boxService.ts`)

**Store:**
- EAS build henüz yapılmadı
- App Store metadata + screenshots hazır değil
- Play Store submission testi yok
- PWA fallback plan var ama implemente edilmedi (bkz. plan file)

**Wheel:**
- Outer glow wheel container'a sınırlı — halo dışa taşmıyor

## Son Session Özet

Son turda tamamlanan iş: Cesur ladder içerik (15 kategori), Cesur dice+places, admin flavor dropdown, Kutular real-time track/level, i18n framework + ana ekranlar (Home/Wheel/Cards/Dice/RoomLobby/BoxList/TrackLevelBar/AgeGate), Settings butonu + dil değişimi.

Commit'ler: `bb59076`, `37425c2`, `506914f`, `ed29dc4`, `b8e011e`, `4dd8a4d`, `f1a1b5a` (bkz. `git log`).

Plan dosyası: `.claude/plans/greedy-wibbling-reef.md` — content strategy + track/level + i18n vision.
