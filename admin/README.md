# love_games — Admin Panel

Next.js 14 (App Router) + Firebase Auth + Firestore. Mobil app'in içeriğini
buradan yönet.

## Local Development

### 1. Bağımlılıkları kur

```
cd admin
npm install
```

### 2. Firebase config

`.env.example`'ı `.env.local`'e kopyala ve doldur. Değerler mobil app'takiyle
**aynı Firebase projesinden** gelmeli:

```
cp .env.example .env.local
# .env.local'i düzenle
```

Firebase Console → Project settings → General → Web app → firebaseConfig.

### 3. Admin kullanıcı oluştur

**a) Kullanıcı ekle:**
Firebase Console → Authentication → Users → **Add user** → email + şifre.

**b) Service account indir:**
Firebase Console → Project settings → Service accounts → **Generate new
private key** → indirilen JSON'ı `admin/scripts/service-account.json`
olarak kaydet. (Gitignored.)

**c) Admin claim ata:**

```
npm run grant-admin -- kullanici@example.com
```

Bir kere yapılır, kalıcıdır. Sonra kullanıcı normal giriş yapabilir.

### 4. Çalıştır

```
npm run dev
```

http://localhost:3000 → login sayfası. Admin girişi ile Categories, Places,
Dice Faces sayfalarını göreceksin.

## Railway Deploy

### 1. Railway projesi

- railway.app → **New Project** → **Deploy from GitHub repo**
- Repo'yu seç
- **Root directory**: `admin` (monorepo subfolder)
- **Build command**: `npm install && npm run build`
- **Start command**: `npm start`

### 2. Environment variables

Railway → Variables → şu key'leri ekle (`.env.example`'daki gibi):

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

`FIREBASE_SERVICE_ACCOUNT` Railway'de **GEREKMEZ** — grant-admin script'i
sadece local'de bir kere çalıştırılır.

### 3. Firebase Authorized Domains

Firebase Console → Authentication → Settings → **Authorized domains** →
Railway'in verdiği domain'i ekle (örn. `love-games-admin.up.railway.app`).
Yoksa auth login çalışmaz.

### 4. Custom domain (opsiyonel)

Railway → Settings → **Networking** → **Generate domain** veya kendi
domain'ini bağla. Sonra o domain'i de Firebase authorized domains'e ekle.

## Firestore Structure

```
/categories/{catId}        # couple prompt kategorileri (çark için)
  { name, color, icon, prompts[], order }

/placeCategories/{catId}   # mekan kategorileri (zar için)
  { name, color, icon, places[], order }

/diceFaces/{catId}         # zar couple aksiyon yüzleri
  { name, color, icon, prompts[], order }

/meta/content              # cache invalidation
  { version, updatedAt }
```

Her yazmada `/meta/content` `version`'ı otomatik bump edilir — mobil app
bunu izleyip cache'i güncelleyebilir.

## Notes

- Client-side Firebase Auth kullanıyor (Server Components auth-gated değil).
  Admin panel için yeterli, SEO/SSR önemli değil.
- Custom claim (`admin: true`) client-side kontrol edilir + Firestore rules
  server-side enforce eder → double defense.
- Kullanıcının admin claim'i değişince ID token'ı yenilenmeli: çıkış yap
  + tekrar gir. `getIdTokenResult(true)` mount'ta force refresh eder.
