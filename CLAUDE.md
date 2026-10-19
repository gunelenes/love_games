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

## Mevcut Oyunlar (5 aktif + 1 dondurulmuş)

- **Çark** — `src/screens/WheelScreen.tsx` + `components/Wheel/`. Skia canvas, dim + winner glow + sparkle burst.
- **Kart** — `src/screens/CardsScreen.tsx` + `components/Cards/`. 3D flip kart, kategori chip'leri, `useCardSelection`.
- **Pozlar** — `src/screens/PosesScreen.tsx`, veri Firestore `poses/` + Storage. Beyaz "sanat eseri" kart, altın border, karakalem görsel + poz adı + açıklama. Track/level yok, tamamen rastgele. Görseller Firebase Storage'dan (bundle'da yok). Yeni oyun — Zar yerine Home'a koyuldu.
- **Göz Ucuyla / Glimpse** — `src/screens/GlimpsesScreen.tsx`, veri Firestore `glimpses/` + Storage. Pozlar'ın kardeşi: yarım/kışkırtıcı fotoğraf + hayal gücü prompt'u. Gece moru kart, gül-kızılı çerçeve. 5 karakalem: covered-eyes, lifted-hem, from-behind, tilted-jaw, hand-in-hair. Pozlar ve Göz Ucuyla ortak `src/components/ArtDeck/ArtDeckGame.tsx` kullanır — sadece tema + veri + label farklı.
- **Kutular** — `src/screens/BoxListScreen.tsx` + `BoxScreen.tsx` + `RoomLobbyScreen.tsx`. Firebase real-time sync, room-based.

**Dondurulmuş**: **Zar** — `src/screens/DiceScreen.tsx` + `components/Dice/` + `useDualDiceRoll` hala duruyor, route hala `RootNav`'da. Home'dan link kaldırıldı (yerine Pozlar). İleride geri getirilebilir, kod silinmedi.

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

Toplam ~250 prompt (çoğu Türkçe; İngilizce çevirisi henüz yok).

**Art desteleri cloud-only (2026-10-19):** Pozlar + Göz Ucuyla görselleri ve metinleri Firestore + Firebase Storage'dan gelir, bundle'da hiçbir şey yok (kullanıcı kararı: iOS review sırasında uzaktan gating + küçük binary). İlk açılışta internet yoksa ve cache boşsa deste "Tekrar Dene" durumu gösterir.
- Storage yolu `{deck}/{id}-{hash|ts}.{ext}` — her yeni görsel yeni URL → expo-image disk cache'i hiç bayatlamaz. `useContent` cloud verisi gelince `Image.prefetch(..., 'memory-disk')` yapar.
- Admin: `admin/components/art-editor.tsx` (deck prop'lu, iki sayfa paylaşır) + `admin/lib/art-service.ts`. Görsel değiştirince eski blob kayıtta silinir.
- Toplu/ilk yükleme: `npm run seed:art` (`scripts/seed-art.js`, service account gerek) — `scripts/art/{deck}.json` + görselleri yükler, içerik-hash'li path ile idempotent.
- `scripts/art/` bilerek `scripts/content/` dışında: `seed-content.js` oradaki her klasörü koleksiyon sayar.
- **Firebase Storage Blaze plan ister** (bucket `love-games-prod.firebasestorage.app`).

**Store kimliği (2026-10-19):** Uygulama adı **Wisp & Flame**, bundle ID / package `com.gunelenes.wispandflame` (slug hala `love_games`). Store metadata `store.config.json` (EAS Metadata) + `store/`. Gizlilik/destek sayfaları `docs/` → GitHub Pages. İletişim: Enes Günel · enesgunel@enesgunel.com (kullanıcının tercihi, sayfalarda public). Pozlar + Göz Ucuyla iOS'ta da açık kalacak (kullanıcı kararı, gating yok).

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

assets/
  (sadece app ikonları — art desteleri Storage'da, kaynak kopya scripts/art/)

örnek uygulama fantazileri/       # [untracked] rakip app ekran görüntüleri — App Store
                                  # stratejisi için araştırma. Submit sonrası elle sil.
örnek pozisyon kartı.jpeg         # [untracked] mevcut Pozlar görseli (çıplaklık + poz) —
                                  # App Store riskli, adaptasyon bekliyor
mail seçeneği.jpeg                # [untracked] Apple Developer Contact Us ekran görüntüsü
dice/                             # [untracked] eski "zar" ekranı için gönderilen çift
                                  # pozisyonu referans görselleri (3 adet)
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

**i18n eksikleri** (framework kurulu, en/tr locales var, ana ekranlar refactor edildi):
- BoxScreen (notes UI, karıştır, delete confirm) hala Türkçe
- CategoryPanel modal (çark ayarları) hala Türkçe
- Content prompts (Firestore'daki kategori isim/prompt'lar sadece Türkçe) — data model'e `nameEn`/`promptsEn` eklenmesi + çeviri gerek
- Diğer 10 dil için `poses.*` ve `suggestions.*`/`fantasies.*` key'leri yok, en fallback'ine düşüyor

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

**Store:**
- EAS build henüz yapılmadı
- App Store metadata + screenshots hazır değil
- Play Store submission testi yok
- PWA fallback plan var ama implemente edilmedi (bkz. plan file)

**Wheel:**
- Outer glow wheel container'a sınırlı — halo dışa taşmıyor

## App Store Stratejisi (2026-10-06 araştırma)

Kullanıcı rakip bir "couples dare" app'inin ekran görüntülerini paylaştı (`örnek uygulama fantazileri/`). Analiz sonuçları:

- **Rakip içerik bizden çok daha explicit** — "oral sex", "genitals", "orgasm", "BDSM club" direkt kullanıyor, bizim L5 bondage'tan ağır. Yıllık $250 abonelikle App Store'da.
- **Kritik fark**: Rakip metin-only, biz görsel + animasyon + UGC (Fanteziler) kullanıyoruz. Apple'ın UGC gereksinimleri (§1.2: filter, EULA, report, block) olmadan iOS reject garanti.
- **Pozlar görseli App Store riski** (2026-10-15 güncelleme: sample görsel silindi, yerine giyinik/bikinili karakalem çizimler geldi — risk azaldı ama Pozlar hala cinsel pozisyon tasvir ediyor; Göz Ucuyla da görsel tabanlı, iOS gating planına dahil edilmeli). Eski not: Mevcut sample görseli çıplaklık + cinsel pozisyon tasvir ediyor. §1.1.4 nedeniyle neredeyse kesin reject. Kullanıcıya iki yol önerildi: (a) AI generator ile silhouette prompt, (b) manual Photopea edit (nipple + poz nötralize), (c) Fiverr $80 silhouette seti. Henüz karar verilmedi — "yarın bakalım" dendi.
- **iOS strateji taslağı** (henüz implementasyon yok):
  1. Fanteziler'i iOS build'de kapat (Platform.OS gate)
  2. Pozlar görsellerini silhouette/clothed versiyona adapte et VEYA iOS'ta tamamen gizle
  3. Store metadata'da "sensuel/kink/fantazi" kelimeleri geçmesin — "mindful intimacy games", "couples wellness" dili
  4. Screenshots sadece Romantik L1-L2 kartlarından
  5. Cesur L1-L5 içerik mobile'da kalır — rakip app çok daha explicit, mevcut içerik Apple'ı tetiklemez
- **Pre-submission mail'i hazırlandı** (iki versiyon: genel içerik + poz görseli). Henüz gönderilmedi, kullanıcı önce illustrasyonu adapte etmek istiyor. Apple contact kanalı: Developer Portal → Contact Us → "App Review" ya da "Feedback and Other Topics". Pre-enrollment durumda app ID istendiği için formu kullanmak zor; email `appreview@apple.com` alternatif ama cevap oranı düşük.

## Son Session Özet (2026-10-15)

Tamamlanan:
- **Göz Ucuyla / Glimpse** (yeni oyun, Home'da Pozlar'ın altında, ✧ ikon, renk `#D6336C`) — yarım/kışkırtıcı karakalem görsel + hayal gücü prompt'u. Gece moru kart (`#1C0F1A`), gül-kızılı çerçeve (`#F0507E`), kırmızı buton (`#E8366A`). İsim alternatifleri konuşuldu (Peek/Aralık, Tease/Yarım Kalan, Unseen/Görünmeyen) — şimdilik Glimpse / Göz Ucuyla.
- **ArtDeckGame refactor** — PosesScreen'in tüm UI'ı `src/components/ArtDeck/ArtDeckGame.tsx`'e taşındı. `PosesScreen` + `GlimpsesScreen` sadece `ArtDeckTheme` sabiti + data + label veriyor. Tema module-level const olmalı (styles identity ile memoize).
- **Gerçek görseller bağlandı** — kullanıcı 8 karakalem gönderdi: 5'i Göz Ucuyla'ya, 3'ü Pozlar'a. Dosyalar boşluksuz isimlere çevrildi, kart metinleri her görsele göre yazıldı. Eski 8 placeholder poz (Lotus Kucaklaşması vb.) silindi (git geçmişinde `3e554e1` ve öncesi).
- Küçük destelerde aynı kartın arka arkaya gelmemesi için history boyu `min(5, n-1)` (2026-10-19: shuffle bag ile değişti — her kart turda 1 kez, tur bitince yeni karıştırma, yeni tur önceki son kartla başlamaz).
- Home kart listesi ScrollView oldu (5 oyun küçük ekrana sığsın), kart minHeight 130 → 116.
- i18n: `games.glimpses` + `glimpses.*` sadece en + tr'de; diğer 10 dil en fallback.

Commit'ler: `3e554e1` (Glimpse + ArtDeck), `f232cad` (kullanıcı: poz görselleri), `bdfa9bc` (görseller bağlandı) — push edildi.

**Commit edilmemiş (kullanıcının):** `package.json` + `package-lock.json` — expo `^57.0.25` → `~57.0.29`. Dokunulmadı.

**Sonraki adımlar (açık):**
- Göz Ucuyla + Pozlar'ı cihazda gözle kontrol et (refactor sonrası Pozlar görünümü aynı olmalı; beyaz zeminli görseller koyu Göz Ucuyla kartında nasıl duruyor bak)
- Yeni görseller geldikçe `assets/{poses,glimpses}/` + data entry
- Oyun ismini kesinleştir
- Apple mail + iOS feature-gating (Fanteziler, Pozlar, Göz Ucuyla)

## Önceki Session (2026-10-05 / 06)

Tamamlanan:
- **Pozlar oyunu** (yeni, Home'da Zar yerine) — 8 bundle poz, altın border beyaz kart, shimmer + konfeti
- **Öneriler + Fantezilerin** — Settings modal'dan erişim, Firestore write, admin inbox + filtre + status transitions
- Pozları cloud'a taşıma denendi + geri alındı — `src/data/poses.ts` + `assets/poses/` ile kalıyor
- Firestore rules: `suggestions`, `fantasies` koleksiyonları eklendi (signed-in create, admin read/update/delete)
- Content fetch sağlamlaştırıldı — `fetchCollectionSoft` ekleyip Cesur içeriğinin kaybolma bug'ı çözüldü (poses koleksiyonu yokken Promise.all tüm fetch'i reject ediyordu)

Commit'ler: `0f34e0e` (Pozlar), `08a2be1` (submissions), `e7bf349` (cloud pozlar — reverted), `f2c473b` (revert) — HEAD şu an `f2c473b`.

Plan dosyası: `.claude/plans/greedy-wibbling-reef.md` — content strategy + track/level + i18n vision.

**Yarına kalan:** Pozlar görsel adaptasyonu + Apple mail gönderimi (contact kanalı seçimi dahil) + iOS feature-gating stratejisinin kodlanması.
