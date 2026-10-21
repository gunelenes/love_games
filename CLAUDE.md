@AGENTS.md

# Wisp & Flame (repo: love_games)

Yetişkin çiftler için sensuel + kink-yönelimli mini oyunlar. Store adı **Wisp & Flame**, bundle ID / package `com.gunelenes.wispandflame` (Expo slug hala `love_games`). **Expo SDK 57 + React Native 0.86 + Reanimated 4 + Skia 2.6 + Firebase 12 + i18next**. Cloud-backed (Firestore + Storage), 12 dil (English default). 18+ yaş kapılı.

> **Şu an:** iOS App Store'a ilk gönderim hazırlığı. Kod tarafı hazır; sıradaki iş ekran görüntüleri + EAS build + App Store Connect. Adım adım plan: **"iOS Yayın Planı"** bölümü (en altta).

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
- BDSM terimleri kamuflaje edildi: Rigger → Halatçı, Master → Rehber, Sadist → Sınavcı, Brat → Yaramaz, Petowner → Bahçıvan
- L3+ için opsiyonel `flavors?: KinkFlavor[]` (rope, command, petplay, primal, sensory, roleplay, impact)

### Kritik Karar: Offline-First → Cloud-Hybrid

Eski offline QR-based Kutular kaldırıldı, Firebase Firestore real-time'a taşındı. Kutular artık:
- Anonymous auth ile stabil UID
- 6-char oda kodu (BASE32, çakışma-korumalı transaction)
- Room-based Firestore doc + boxes subcollection
- Real-time listeners (`onSnapshot`)
- QR/base64 codec **silindi**: `boxSync.ts`, `SyncModal.tsx`, `expo-camera`, `qrcode-svg`, `svg` deps

Çark/Zar/Kart için içerik: bundle fallback + Firestore (`useContent` hook, AsyncStorage cache).

## Mevcut Oyunlar (5 aktif + 1 dondurulmuş)

- **Çark** — `src/screens/WheelScreen.tsx` + `components/Wheel/`. Skia canvas, dim + winner glow + sparkle burst.
- **Kart** — `src/screens/CardsScreen.tsx` + `components/Cards/`. 3D flip kart, kategori chip'leri, `useCardSelection`.
- **Pozlar** — `src/screens/PosesScreen.tsx`, veri Firestore `poses/` + Storage. Beyaz "sanat eseri" kart, altın border, karakalem görsel + poz adı + açıklama. Track/level yok, tamamen rastgele. Görseller Firebase Storage'dan (bundle'da yok). Yeni oyun — Zar yerine Home'a koyuldu.
- **Göz Ucuyla / Glimpse** — `src/screens/GlimpsesScreen.tsx`, veri Firestore `glimpses/` + Storage. Pozlar'ın kardeşi: yarım/kışkırtıcı fotoğraf + hayal gücü prompt'u. Gece moru kart, gül-kızılı çerçeve. 5 karakalem: covered-eyes, lifted-hem, from-behind, tilted-jaw, hand-in-hair. Pozlar ve Göz Ucuyla ortak `src/components/ArtDeck/ArtDeckGame.tsx` kullanır — sadece tema + veri + label farklı.
- **Kutular** — `src/screens/BoxListScreen.tsx` + `BoxScreen.tsx` + `RoomLobbyScreen.tsx`. Firebase real-time sync, room-based.

**Dondurulmuş**: **Zar** — `src/screens/DiceScreen.tsx` + `components/Dice/` + `useDualDiceRoll` hala duruyor, route hala `RootNav`'da. Home'dan link kaldırıldı (yerine Pozlar). İleride geri getirilebilir, kod silinmedi.

## Güvenlik / App Store §1.2 (Kutular)

Kutular tek kullanıcıdan-kullanıcıya içerik yeri (davetli 2 kişilik oda). Önlemler (2026-10-20):
- **Oda menüsü (•••)** — `src/components/Safety/RoomMenuSheet.tsx`: Sorun bildir · Partneri çıkar ve engelle · Odadan ayrıl. Ortak `src/components/ui/BottomSheet.tsx`.
- **Şikâyet** — `ReportSheet.tsx`: açılan partner notunda "Şikâyet et" + menüden genel şikâyet. `reports/` koleksiyonu (create-only; admin okur). Gönderince "partneri de engelle" teklif edilir.
- **Engelleme** — `src/services/safetyService.ts`. Host engellerse: partnerin notları + onayları tüm kutulardan silinir, `guestUid=null`, `blockedUids` arrayUnion. Guest engellerse: odadan çıkar. Her iki durumda uid cihazdaki `safety:blocked:v1` listesine girer → yeni açılan odalara `blockedUids` olarak taşınır, o kişinin host olduğu odalara `joinRoom` `blocked` döner.
- **Ayrılma artık sunucuda** — guest slotu boşaltır; host partner varsa odayı devreder (`hostUid=guestUid`), yalnızsa kutuları + odayı siler.
- **Çıkarılan taraf** — `useRoom` snapshot'ta kendini üye olarak görmezse kodu siler + lobide `notice` gösterir (`removed` / `closed`). Kendi ayrılmasında `leavingRef` ile bastırılır.
- **Rules** (`firestore.rules` rooms): host hostUid'i sadece mevcut guest'e devredebilir; guest sadece `track/level/guestUid→null`; join sadece `guestUid` alanı + `blockedUids`'te değilse; admin rooms/boxes read+update (silme yok). **Test:** `scripts/rules-test` (`npm install && npm test`, Java gerekir) — 41 senaryo. Rules değişince mutlaka çalıştır.
- **Admin** — `/reports` (`admin/components/reports-viewer.tsx`, `admin/lib/reports-service.ts`): kişinin notlarını sil, odadan çıkar + engelle (host ise oda partnere devredilir), durum (yeni / işlem yapıldı / geçersiz), 24 saati geçen yeni şikâyet kırmızı.
- **Söz verildi: her şikâyet 24 saat içinde incelenir** (uygulama içi metin, Terms, reviewer notu). Admin `/reports`'u düzenli kontrol etmek gerekiyor; ileride e-posta bildirimi (Cloud Function) eklenebilir.
- **Kullanım Koşulları** — `docs/terms/` (sıfır tolerans). Yaş kapısı onay cümlesi Terms kabulünü içerir + "Kullanım Koşulları'nı oku" linki; Settings → "Yasal ve destek" (Terms / Gizlilik / Yardım). URL'ler `src/data/legal.ts` (`tr` → `#tr`).

## Topluluk Özellikleri

- **Öneriler + Fantezilerin** — `src/screens/SubmissionScreen.tsx` (ortak ekran, route adına göre `kind` seçer). Settings modal → "Bize yardım et" bölümünden erişim. Firestore koleksiyonları: `suggestions/`, `fantasies/`. Service: `src/services/submissionService.ts` (`submitFeedback(kind, text)`, 4-1000 char validation, uid + locale + status=new ekler). Mobile sadece create yapabilir, read/update/delete admin.
- **Admin panel**: `/suggestions` + `/fantasies` sayfaları (`admin/app/{suggestions,fantasies}/page.tsx`), `admin/components/submissions-viewer.tsx` filtreli liste (yeni/incelendi/eklendi/reddedildi), status transitions + delete. Service: `admin/lib/submissions-service.ts`.

## İçerik Durumu (Firestore + Bundle)

| Collection | Adet | Kaynak | Notlar |
|-----------|------|--------|--------|
| `categories` | 27 | Firestore | 6 Romantik L1 bundle + 12 Romantik L2-L5 + 15 Cesur L1-L5 |
| `diceFaces` | 12 | Firestore | 6 Romantik L1 bundle + 6 Cesur L1 |
| `placeCategories` | 12 | Firestore | 6 Romantik L1 bundle + 6 Cesur L1 |
| `poses` | 3 | Firestore + Storage | Taht, Yükselen Bacak, Binici. Admin `/poses` sayfasından yönetilir; kaynak kopya `scripts/art/poses{.json,/}` |
| `glimpses` | 5 | Firestore + Storage | Göz Ucuyla. Admin `/glimpses`; kaynak kopya `scripts/art/glimpses{.json,/}` |
| `suggestions` | — | Firestore (user) | Kullanıcı gönderileri, admin inbox |
| `fantasies` | — | Firestore (user) | Kullanıcı gönderileri, admin inbox |
| `meta/content` | 1 | Firestore | version bump for cache invalidation |

Toplam ~250 prompt. Türkçe yazılır (`name`/`prompts`), 11 dile çevrilmiş (`nameI18n`/`promptsI18n`: en, es, de, fr, it, ja, ko, zh-TW, id, hi, ar — 33/33 kategori). Çeviri: `scripts/translate-content.js`.

**Art desteleri cloud-only (2026-10-19):** Pozlar + Göz Ucuyla görselleri ve metinleri Firestore + Firebase Storage'dan gelir, bundle'da hiçbir şey yok (kullanıcı kararı: iOS review sırasında uzaktan gating + küçük binary). İlk açılışta internet yoksa ve cache boşsa deste "Tekrar Dene" durumu gösterir.
- Storage yolu `{deck}/{id}-{hash|ts}.{ext}` — her yeni görsel yeni URL → expo-image disk cache'i hiç bayatlamaz. `useContent` cloud verisi gelince `Image.prefetch(..., 'memory-disk')` yapar.
- Admin: `admin/components/art-editor.tsx` (deck prop'lu, iki sayfa paylaşır) + `admin/lib/art-service.ts`. Görsel değiştirince eski blob kayıtta silinir.
- Toplu/ilk yükleme: `npm run seed:art` (`scripts/seed-art.js`, service account gerek) — `scripts/art/{deck}.json` + görselleri yükler, içerik-hash'li path ile idempotent.
- `scripts/art/` bilerek `scripts/content/` dışında: `seed-content.js` oradaki her klasörü koleksiyon sayar.
- **Firebase Storage Blaze plan ister** (bucket `love-games-prod.firebasestorage.app`).

## Store Kimliği + Marka (2026-10-19)

- **Ad:** Wisp & Flame. Store başlığı `Wisp & Flame: Couples Games` / TR `Wisp & Flame: Çift Oyunları`. Bundle ID / package `com.gunelenes.wispandflame` (onaylandı — App Store kaydı açıldıktan sonra değiştirilemez).
- **İletişim (public):** Enes Günel · enesgunel@enesgunel.com — kullanıcının tercihi, gizlilik/destek sayfalarında ve store'da görünür.
- **Pozlar + Göz Ucuyla iOS'ta da açık** (kullanıcı kararı, feature-gating YOK). Store açıklamasında "elegant charcoal sketches" diliyle geçer, ekran görüntülerine konmaz.
- **Metadata:** `store.config.json` (EAS Metadata, 14 locale: 12 uygulama dili + en-GB + es-MX — her ülke mağazası kendi locale'inin keyword'lerini tarar, ABD ayrıca es-MX'i de tarar. İçerik: başlık, altyazı, keyword, açıklama, yaş derecelendirmesi, kategori, reviewer notu, URL'ler). Push girişi `store.config.js` (eas.json `metadataPath`): review iletişim telefonu repoya girmez, `ASC_REVIEW_PHONE` env'inden eklenir; env yoksa review bölümü push edilmez. Keyword kuralı: başlık/altyazıdaki kelimeyi tekrarlama, virgülden sonra boşluk yok, ≤100 karakter. Play metinleri `store/google-play/`. Kurallar + App Store Connect'te elle doldurulacak cevaplar: `store/README.md`.
- **Web (GitHub Pages, `docs/`, canlı):** https://gunelenes.github.io/love_games/ · `/privacy/` · `/support/` (EN + `#tr`). Gizlilik politikasındaki veri envanteri koddan çıkarıldı; yeni veri türü / analitik eklenirse **politika + App Privacy cevapları + `app.json` `ios.privacyManifests`** birlikte güncellenmeli.
- **Logo: "Duo / Violet Pop"** — iki üst üste binen alev (pembe `#FF4FA3` + sarı `#FFD23F`, kesişim turuncu `#FF8A3D`), mor gradient zemin (`#8E2DE2 → #4A00E0`, düz karşılığı `#6C17E1`). Tüm ikonlar `scripts/brand/build-icons.mjs`'ten üretilir (renk/oran değişikliği = script'te tek edit + yeniden çalıştır). `assets/icon.png` alpha'sız RGB olmalı (Apple alpha'lı ikonu reddeder). Tasarım turları (reddedilenler dahil) claude.ai artifact'ında: https://claude.ai/artifact/BTh2HxLJqxWpFXPrzHRjPM
- **Yaş kapısı metni** "kink" içermez ("sensual and intimate themes for couples", 12 dil) — reviewer ilk bunu görür, metadata diliyle tutarlı kalmalı. Store metninde de sex/kink/fantasy/BDSM geçmez.

## Kullanıcı Tercihleri (Bunları Bil)

- **Animasyon çıtası yüksek**. "Amatör" görünen düz çözüm reddedilir: spring/stagger/shimmer/haptics ile katmanlı hareket beklenir, tasarımda da düz/sıradan görünen ilk versiyonlar geri çevrildi (ör. logo 1. tur "daha canlı" diye reddedildi).
- **Full otonomi verilir** — "sen yap" dediğinde büyük değişiklikleri commit + push et.
- **12 dilli UI** — default en, Settings'ten değişir. İçerik Türkçe yazılır + 11 dile çevrilir.
- **Sensual/kink content**: tam yetişkin bir çiftler uygulaması. BDSM terminolojisi discreet Türkçe kamuflajla (yukarıdaki Track + Level bölümü). Eski plan dosyası (`.claude/plans/…`) artık mevcut değil.
- **Store hedefi**: Google Play + iOS App Store denenecek (Play daha esnek), yetersiz kalırsa PWA fallback.
- **Deneyimli geliştirici** — teknik detaylara girilebilir.

## Kullanılan Servisler

- **Firebase**: proje `love-games-prod` (bkz. `src/services/firebaseConfig.ts` — public config)
  - Firestore, Auth (anonymous + admin panel için email/password), custom claims (`admin: true`)
  - Service account: `scripts/service-account.json` + `admin/scripts/service-account.json` (gitignored)
- **Railway**: Next.js admin panelini deploy eder (bkz. `admin/README.md`)
- **Firebase Storage**: Pozlar + Göz Ucuyla görselleri (Blaze plan açık). Bucket `love-games-prod.firebasestorage.app`, Firestore bölgesi `eur3`.
- **GitHub Actions**: Firestore + Storage rules otomatik deploy (`.github/workflows/deploy-firestore-rules.yml`)
- **GitHub Pages**: `docs/` → gizlilik / destek / ana sayfa
- **Expo / EAS**: hesap `gunelenes`. `eas.json` hazır (preview + production, build numarası remote). `eas init` henüz yapılmadı.

## İlk Açılış Defaults (Apple-reviewer safe)

- **Dil**: `DEFAULT_LANGUAGE = 'en'` (`src/i18n/index.ts`). İlk açılış İngilizce, kullanıcı Settings'ten değiştirince AsyncStorage'da `app:language:v1` persist edilir.
- **Track + Level**: `DEFAULT_TRACK = 'romantik'`, `DEFAULT_LEVEL = 1` (`src/data/tracks.ts`). `PlayPrefsProvider` (App.tsx zincirinde) tek source of truth — tüm oyun ekranları aynı state'i paylaşır, flicker yok.
- **Yaş kapısı**: İlk açılışta mutlaka onaylanmalı (`src/hooks/useAgeGate.tsx`, key `ageGate:accepted:v1`).
- Her iki hook (`usePlayPrefs`, `useLanguage`) cache validation yapar — bozuk/eski cache sessizce silinir ve bir sonraki açılış defaults'tan başlar (console.warn ile loglanır).

**Fresh install testi (Expo Go'da):** `expo start --clear` AsyncStorage'ı temizlemez. Test etmek için:
1. Settings → "🧹 Reset Prefs (DEV)" butonuna bas (sadece dev build'de görünür)
2. Uygulamayı tamamen kapat (background'dan swipe)
3. Yeniden aç → EN + Romantik L1 + yaş kapısı gelmeli

Veya gerçek cihazdan uninstall + reinstall yap.

## Test / Çalıştırma

**Mobil:**
- `npm start` — LAN mode
- `npx expo start --tunnel` — farklı ağlar (gunelenes hesabı gerek)
  - **Windows PowerShell**: `npx` execution policy hatası verir → `npx.cmd` kullan ya da bir kere `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
  - Expo CLI şu an login değil (`expo whoami` → Not logged in), tunnel URL'i `xxx-anonymous-8081.exp.direct` olur. `npx expo login` ile gunelenes'e gir.
  - ngrok bazen `TypeError: Cannot read properties of undefined (reading 'body')` ile düşer — geçici, tekrar dene.
- `npx tsc --noEmit` — TS check
- `npx expo export --platform android --output-dir .metro-check` — bundle sanity

**Admin panel:**
- `cd admin && npm run dev` — localhost:3000
- Env: `admin/.env.local` (mobil app ile aynı Firebase config)
- Admin claim: `cd admin && npm run grant-admin -- <email>` (service account gerek)

**Content seed:**
- `node scripts/seed-firestore.js` — bundle JSON'ları upload eder (`categories/`, `placeCategories/`, `diceFaces/`)
- `node scripts/seed-content.js` — `scripts/content/{collection}/*.json` dosyalarını Firestore'a merge eder
- `npm run seed:art [poses|glimpses]` — art destelerini Storage + Firestore'a yükler
- Script'ler root `firebase-admin` devDependency'sini + `scripts/service-account.json`'ı kullanır
- Yeni içerik: `scripts/content/categories/cesur-l6.json` gibi bir dosya oluştur, seed çalıştır

**Firestore + Storage rules:**
- `firestore.rules` / `storage.rules`'a düzenle → push → GitHub Action auto-deploy (~1 dk)
- Elle: `npm run firebase:deploy:storage` (CLI login yeterli)
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
                                  # contentService, submissionService
    i18n/                         # i18next init + locales/{en,tr}.json
    utils/                        # color.ts
    components/
      TrackLevelBar/              # track chip + level dot bar (Wheel/Dice/Cards/BoxList)
      Settings/SettingsModal      # dil değişimi
      AgeGate/AgeGateModal        # ilk açılış 18+ blocker
      ArtDeck/ArtDeckGame         # Pozlar + Göz Ucuyla ortak kart ekranı (tema + veri + label prop'ları)
      Cards/                      # FlipCard, CardDeck, CardFace, CardSettingsPanel
      Wheel/, Dice/               # (mevcut)
      Background/, Confetti/, ResultCard/, ui/
    screens/                      # Home, Wheel, Dice (dondurulmuş), Cards, Poses, Glimpses,
                                  # RoomLobby, BoxList, Box, Submission (Öneriler + Fantezilerin)
    navigation/RootNav.tsx
    theme/                        # colors, typography
  scripts/
    seed-firestore.js             # bundle → Firestore
    seed-content.js               # scripts/content/{collection}/ → Firestore
    seed-art.js                   # scripts/art/ → Storage + Firestore (poses, glimpses)
    art/                          # art deck kaynak kopyası: {deck}.json + {deck}/*.jpeg
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
  app/                            # login, categories, place-categories, dice-faces,
                                  # suggestions, fantasies, no-access
  components/                     # AdminShell, CategoryEditor (with Track/Level/Flavor dropdowns),
                                  # PlaceCategoryEditor, submissions-viewer, ArtEditor (poses/glimpses)
  lib/                            # firebase.ts, auth-context, content-service,
                                  # submissions-service, art-service, types (mirror of mobile types + FLAVORS enum)
  scripts/                        # grant-admin.js, check-claims.js
  .env.local                      # gitignored — same Firebase config as mobile

assets/                           # sadece app ikonları + splash (scripts/brand/ üretir)
scripts/brand/                    # build-icons.mjs + icon.svg / mark.svg (logo master)
store.config.json                 # EAS Metadata (App Store)
store/                            # README (kurallar, ASC cevapları), google-play/, screenshots/
docs/                             # GitHub Pages: index, privacy/, support/, favicon
eas.json                          # EAS build/submit profilleri
```

`.gitignore` tüm `*.png/*.jpg/*.jpeg`'i yok sayar; istisnalar: `assets/`, `docs/`, `store/`, `scripts/art/`. Başka yere görsel koyarsan git'e girmez.

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

export type Pose = {
  id: string; name: string; description?: string;
  image: string; // Firebase Storage download URL
  imagePath?: string; order?: number;
  nameI18n?: LocalizedString; descriptionI18n?: LocalizedString;
};

export type BoxNote = { id: string; text: string; authorUid: string; createdAt: number; };
export type RoomBox = {
  id, name, color, icon, createdAt, updatedAt, createdBy: string;
  notes: BoxNote[]; confirmations: Record<string, boolean>;
};
```

`admin/lib/types.ts` bunun mirror'ı (categories/places için) — güncellemede iki tarafı da senkron tut. Admin'de `Pose`'un karşılığı `ArtCard` (+ `ArtDeck = 'poses' | 'glimpses'`).

## Yapılacaklar / Bilinen Eksikler

**i18n eksikleri:**
- en + tr dışındaki 10 dilde `poses.*`, `glimpses.*`, `artDeck.*`, `suggestions.*`/`fantasies.*` key'leri yok → İngilizce fallback. (Store açıklaması "12 languages" diyor; UI'ın kalanı ve içerik çevrili.)
- Settings'teki DEV reset diyaloğu Türkçe — `__DEV__` guard'lı, production'da görünmez.

**İçerik:**
- Cesur L2-L5 kategorileri henüz 6 prompt'ta (L1 örneği 10 prompt'a çıkarıldı, aynı pattern uygulanabilir)
- Romantik dice + places genişlemesi yok
- Flavor tag'leri mobil UI'da görünmüyor (data yerinde, admin'de setlenebilir; sadece render eksik)
- **Pozlar / Göz Ucuyla görselleri**: Yeni kart admin panelden (`/poses`, `/glimpses`) eklenir. İstenirse `scripts/art/` kaynak kopyasına da eklenip `npm run seed:art` ile yüklenir.

**Kutular:**
- `expo-clipboard` ile "Kodu kopyala" butonu yok (kod uzun bas + seç)
- In-place not düzenleme yok (sil + yeniden ekle)
- Kutu adı rename UI'ı yok (service hazır: `renameBox` in `boxService.ts`)

**Topluluk (Öneriler + Fantezilerin):**
- Content moderation yok — explicit submission validation (OpenAI Moderation API, profanity filter) gerek, özellikle iOS submission öncesi
- Admin'de user block / rate limiting yok
- Mobile'da report flow yok

**Store:** bkz. "iOS Yayın Planı". Play Store ve PWA fallback sonraya.

**Altyapı / açık sorular:**
- `admin/package-lock.json` `package.json` ile senkron değil (`npm ci` düşer). Railway `npm ci` kullanıyorsa admin deploy'u kırılabilir → `cd admin && npm install` ile lock'u yenileyip commit et.
- Gizlilik politikasında öneri/fantezi saklama süresi "en fazla 24 ay" yazıldı — Claude'un önerisi, kullanıcı henüz onaylamadı.

**Wheel:**
- Outer glow wheel container'a sınırlı — halo dışa taşmıyor

## Durum (2026-10-19 session'ı sonunda)

Bu session'da yapılanlar (hepsi push'lu, HEAD `af33eba` civarı):
- **Art desteleri cloud-only** — Pozlar + Göz Ucuyla Firestore + Storage'dan (`f2c5e57`). Bundle'da görsel yok.
- **Shuffle bag** — ArtDeck'te her kart turda 1 kez, tur bitince yeni karıştırma, yeni tur önceki son kartla başlamaz (`de9eb81`).
- **Store metadata** — `store.config.json` + `store/` (`f08da3d`).
- **iOS hazırlığı** — `app.json` (ad, bundle ID, iPhone-only, şifreleme beyanı, privacy manifest, splash plugin), `eas.json`, expo `~57.0.30`, yaş kapısı metni, `docs/` gizlilik + destek sayfaları (`904f5c0`). `npx expo-doctor` → 21/21.
- **Logo** — Duo / Violet Pop ikonları, adaptive icon, splash, favicon (`af33eba`).

Önceki session'lar: 2026-10-15 Göz Ucuyla + ArtDeckGame refactor (`3e554e1`, `bdfa9bc`); 2026-10-05/06 Pozlar + Öneriler/Fanteziler (`0f34e0e`, `08a2be1`). Pozları cloud'a taşıma 10-06'da denenip geri alınmıştı (`e7bf349` → `f2c473b`); 10-19'da kullanıcı isteğiyle yeniden yapıldı.

## iOS Yayın Planı (sıradaki iş)

Kullanıcı bu adımlara **Claude web** (claude.ai/code) ile devam etmek istiyor. Kullanıcı Windows'ta, **Mac yok** → iOS Simulator yok; build'ler EAS cloud'da, ekran görüntüleri gerçek iPhone'dan.

### Claude web ortamı için notlar

- Repo GitHub'dan temiz klonlanır: önce `npm ci`. Windows/PowerShell notları (npx.cmd vb.) orada geçersiz.
- **Yok:** `scripts/service-account.json` (gitignored) → seed script'leri ve elle rules deploy çalışmaz (rules zaten push ile GitHub Action'dan deploy olur). Firebase CLI login yok.
- **EAS komutları** için ortamda `EXPO_TOKEN` env var'ı lazım (expo.dev → Account settings → Access tokens). Yoksa kullanıcıdan iste; token'ı asla repoya yazma.
- **Apple Developer hesabı + 2FA** isteyen adımlar etkileşimlidir → kullanıcı kendi makinesinde bir kez çalıştırmalı (aşağıda **[Kullanıcı]** işaretli). Sonrasında credential'lar EAS sunucusunda durur ve `--non-interactive` build'ler token ile çalışır.
- Görsel üretimi (ikon, ekran görüntüsü kompozisyonu): `npm i --no-save @resvg/resvg-js@2.6.2 sharp@0.33.5` (proje bağımlılığı değil).

### Adımlar

1. **[Kullanıcı] Apple Developer Program** — bireysel üyelik (Enes Günel), yıllık $99. Onay 24–48 saat sürebilir.
2. **[Kullanıcı] App Store Connect'te uygulama kaydı** — My Apps → + → New App: platform iOS, ad `Wisp & Flame: Couples Games`, birincil dil English (U.S.), bundle ID `com.gunelenes.wispandflame` (önce Certificates, Identifiers & Profiles'ta kaydedilmeli; ya da 4. adımdaki ilk EAS build bunu otomatik yapar), SKU `wispandflame-ios`. Ad bu anda rezerve olur. Oluşan **Apple ID (sayısal ascAppId)** not edilmeli → `eas.json` `submit.production.ios.ascAppId`.
3. **`eas init`** — `npx eas-cli@latest init` → `app.json`'a `extra.eas.projectId` + `owner` yazar; commit et.
4. **[Kullanıcı] İlk iOS build** — `npx eas-cli build -p ios --profile production`. İlk seferde Apple ID ile giriş + 2FA ister, Distribution Certificate + Provisioning Profile'ı EAS üretir. Sonraki build'ler: `eas build -p ios --profile production --non-interactive` (EXPO_TOKEN ile Claude web'den de tetiklenebilir).
5. **App Store Connect API key** — ASC → Users and Access → Integrations → App Store Connect API → Team Key (rol: App Manager). Issuer ID + Key ID + `.p8` dosyası `eas credentials` ile EAS'e yüklenir. **`.p8` repoya girmez.** Bu key submit + metadata push'u etkileşimsiz yapar.
6. **TestFlight** — `npx eas-cli submit -p ios --latest` → build TestFlight'a düşer. Kullanıcı kendi iPhone'unda TestFlight ile kur, akışları test et (yaş kapısı → Home → her oyun → Kutular iki cihazla → Ayarlar dil değişimi). **Ekran görüntüleri bu build'den alınır** (gerçek ikon/splash, Expo Go arayüzü yok).
7. **Ekran görüntüleri** (aşağıdaki bölüm).
8. **Metadata** — `npx eas-cli metadata:push` (`store.config.json` → ASC). Önce `eas metadata:lint` ile doğrula. EAS Metadata ekran görüntüsü yüklemez → onları ASC'ye elle sürükle (ya da fastlane deliver).
9. **[Kullanıcı] ASC'de elle doldurulacaklar** (`store/README.md` → "App Store Connect'te elle doldurulacaklar"): yeni yaş derecelendirmesi soruları (UGC: Yes, sonuç 18+), App Privacy etiketi (User ID + Other User Content, kimlikle bağlantısız, tracking yok), fiyat (ücretsiz?), review contact bilgileri.
10. **Review'a gönder** — build'i sürüme bağla, reviewer notu `store.config.json`'da hazır. Red gelirse gerekçeye göre: Pozlar/Göz Ucuyla §1.1.4 riski en olası — içerik cloud'da olduğu için admin panelden kartları kaldırmak build gerektirmez.

### Ekran görüntüleri

- **Zorunlu:** 6.9" iPhone, dikey, **1320×2868** veya **1290×2796** PNG/JPG, 1–10 adet (hedef 6). `supportsTablet: false` → iPad gerekmez.
- **Ham çekim [Kullanıcı]:** TestFlight build'inde Pro Max / Plus bir iPhone'da (yan tuş + ses açma). 16 Pro Max → 1320×2868, 14 Pro Max / 15 Plus / 15 Pro Max / 16 Plus → 1290×2796. Daha küçük bir iPhone da olur: ham görüntü aşağıdaki "Akış" adımında çerçeveye yerleştirilip 1290×2796'ya büyütülür.
- **İçerik kuralı:** sadece **Romantik (Yakınlık) L1–L2** içerik; Pozlar / Göz Ucuyla / Keşif (Cesur) ekrana girmez. Dil EN (TR seti için Settings'ten Türkçe'ye geçip aynı ekranlar tekrar).
- **Çekilecek 6 ekran** (başlıklar `store/README.md`'de, EN + TR): 1 Home · 2 Çark (dönerken/sonuç) · 3 Kart (açık kart) · 4 Track/Level bar görünür bir oyun ekranı · 5 Kutular (mümkünse iki telefon) · 6 Settings dil listesi.
- **Akış:** kullanıcı ham PNG'leri `store/screenshots/raw/{en-US,tr}/01-home.png …` olarak commit'ler → Claude `scripts/brand/build-screenshots.mjs` yazar (sharp + resvg): mor gradient zemin (`#8E2DE2 → #4A00E0`), üstte başlık (Fredoka bold, beyaz), ortada yuvarlatılmış köşeli ham ekran + gölge → çıktı `store/screenshots/{en-US,tr}/01.png …` tam 1290×2796. Logo renkleriyle tutarlı olmalı; kullanıcının animasyon/tasarım çıtası yüksek, düz görünen kompozisyon reddedilir.
- Status bar: saat/şarj ideal olmak zorunda değil ama bildirim ikonları olmasın.

## Android / Google Play Planı

Kod tarafı hazır: package `com.gunelenes.wispandflame`, adaptive icon, splash, `versionCode` EAS remote. Gereksiz şablon izinleri `android.blockedPermissions` ile kaldırıldı (SYSTEM_ALERT_WINDOW, READ/WRITE_EXTERNAL_STORAGE) → kalanlar INTERNET + VIBRATE. Listing görselleri `store/google-play/icon-512.png` + `feature-graphic.png` (1024×500, `scripts/brand/build-icons.mjs` üretir; font `scripts/brand/fonts/Fredoka-Bold.ttf`, OFL).

1. **[Kullanıcı] Play Console geliştirici hesabı** ($25, tek seferlik, kimlik doğrulama birkaç gün sürebilir).
2. **Kişisel hesaplar için zorunlu kapalı test:** 2023 sonrası açılan kişisel hesaplarda production'a çıkmadan önce **en az 12 test kullanıcısıyla 14 gün kesintisiz kapalı test** gerekiyor. Takvimde en uzun kalem bu → hesap açılır açılmaz başlat.
3. Build: `npx eas-cli build -p android --profile production` → AAB. İmza anahtarını EAS üretir/saklar (Play App Signing açık kalsın).
4. **İlk AAB'yi Play Console'a elle yükle** (internal/closed testing track). Sonrakiler `eas submit -p android` ile — bunun için Google Cloud service account JSON'u gerekir (repoya girmez).
5. **[Kullanıcı] Play Console formları:** Data safety (App Privacy cevaplarıyla aynı: User ID + user content, şifreli aktarım, silme talebi e-postayla), içerik derecelendirmesi (IARC anketi — cinsel temalar: evet → yetişkin), hedef kitle **18+**, uygulama erişimi (giriş yok), reklam yok, gizlilik URL'i.
6. Listing: `store/google-play/{en-US,tr-TR}/` metinleri + ikon + feature graphic + en az 2 telefon ekran görüntüsü (iOS için çekilenler kullanılabilir, 16:9 / 9:16 oranında).

**Play'e özel risk:** Google Play'in *Sexual Content* politikası Apple'dan katı. Cinsel eylemi tasvir eden içerik yasak; Pozlar'daki poz çizimleri buna takılabilir (Apple'da §1.1.4 riskiyle aynı). Reddedilirse ilk hamle yine admin'den Pozlar kartlarını değiştirmek/kaldırmak.

### Bilinen riskler

- **§1.1.4 (cinsellik):** Pozlar karakalem poz çizimleri iOS'ta açık gidiyor (kullanıcı kararı). Reddedilirse ilk hamle admin'den Pozlar kartlarını kaldırmak/değiştirmek (build gerekmez); yine olmazsa Home'dan gizlemek için küçük bir remote flag (`meta/flags`) eklenebilir — **kullanıcıya sormadan ekleme**.
- **Yaş derecelendirmesi:** advisory'de sexual content + mature themes `FREQUENT_OR_INTENSE`. Düşük göstermek red sebebi; yüksek göstermenin zararı yok (zaten 18+).
- **Metadata dili:** "couples / intimacy / date night"; sex, kink, fantasy, BDSM, erotic geçmez (uygulama içi Fanteziler ekranı adı hariç).
