# Firestore Rules — Otomatik Deploy

`firestore.rules` GitHub'a push edildiğinde otomatik yayına gider (GitHub Actions).
Local'de de tek komutla deploy edilebilir.

## Yapı

```
firebase.json               # Firebase CLI config (rules + indexes path)
.firebaserc                 # default project → love-games-prod
firestore.rules             # asıl rules dosyası
firestore.indexes.json      # composite index tanımları (şimdilik boş)
.github/workflows/
  deploy-firestore-rules.yml # push tetiklemeli auto-deploy
```

## Otomatik Deploy (GitHub Actions)

### Bir kere setup:

1. Firebase Console → Project settings → **Service accounts** → **Generate new private key**
   → indirilen JSON dosyasını aç, tüm içeriğini kopyala.
2. GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: (adım 1'de kopyaladığın JSON tam metni)
3. Save.

### Kullanım:

`firestore.rules`, `firestore.indexes.json`, `firebase.json` veya `.firebaserc` dosyalarından
birinde değişiklik yapıp `main`'e push et → workflow otomatik çalışır (~1 dk):

```
git add firestore.rules
git commit -m "Update: rules"
git push origin main
```

GitHub → **Actions** sekmesinden ilerlemesi izlenebilir. Yayına gitti onayını
oradaki yeşil tik gösterir.

### Manuel tetikleme:

Actions sekmesi → **Deploy Firestore Rules** workflow → sağ üstteki **Run workflow**
butonu → main branch. Kod değişikliği olmadan da deploy edebilir.

## Local Deploy (opsiyonel)

Bazen küçük bir düzenlemeyi push etmeden hızlıca denemek istersin. `admin/scripts/`
altındaki service account'unu kullanarak:

```bash
# Bir kere: service account'ı Firebase CLI'nin göreceği yere göster
$env:GOOGLE_APPLICATION_CREDENTIALS="admin/scripts/service-account.json"

# Sonra:
npm run firebase:deploy:rules
# veya
npm run firebase:deploy:indexes
# veya (rules + indexes birlikte):
npm run firebase:deploy
```

Bash için:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="admin/scripts/service-account.json"
npm run firebase:deploy:rules
```

`npx --yes firebase-tools ...` ilk sefer ~30 saniye indirme sürer, sonra cache'de kalır.

## Rules Değişikliği Testi

Deploy öncesi syntax kontrolü:
```
npx --yes firebase-tools firestore:rules:test firestore.rules
```

Firebase Emulator ile lokal test (advanced):
```
npx --yes firebase-tools emulators:start --only firestore
```

## Mevcut Kural Yapısı Özeti

- **`/categories`, `/placeCategories`, `/diceFaces`, `/meta`** — herkes okur, sadece
  admin custom claim'li kullanıcılar yazar (admin panel).
- **`/rooms/{code}`** — sadece odanın hostUid veya guestUid'i okuyabilir; ekstra:
  boş oda (guestUid=null) ise yeni bir kullanıcı guestUid olarak kendi UID'ini
  atayabilir (join akışı).
- **`/rooms/{code}/boxes/{boxId}`** — odanın üyeleri (host veya guest) tam CRUD.
