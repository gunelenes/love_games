# Store metadata — Wisp & Flame

| Dosya | Ne |
|---|---|
| `../store.config.json` | App Store metadata (en-US + tr): ad, altyazı, keyword, açıklama, promo, yaş derecelendirmesi, kategori, reviewer notu. `eas metadata:push` ile yüklenir. |
| `google-play/{en-US,tr-TR}/` | Play Console listing: `title.txt` (30), `short_description.txt` (80), `full_description.txt` (4000). EAS Metadata Play'i desteklemiyor — elle yapıştır (veya ileride fastlane `supply`). |

App Store açıklaması ile Play uzun açıklaması aynı metin; birini değiştirirsen diğerini de güncelle.

## Kurallar (metin değiştirirken)

- **Metadata'da geçmeyecek kelimeler:** sex, kink, fantasy, BDSM, erotic, adult toy. "Intimacy", "romantic", "date night", "for adult couples (18+)" güvenli.
- **Pozlar / Göz Ucuyla** uygulamada açık ve açıklamada "zarif karakalem çizimler" diliyle geçiyor. Ekran görüntülerine konmuyor (review riskini görsel olarak öne çıkarmamak için).
- Keyword alanına ad/altyazıdaki kelimeleri tekrar yazma (Apple zaten sayıyor). Sınır: virgüllerle birlikte 100 karakter.
- Ekran görüntüleri sadece Romantik (Yakınlık) L1–L2 içeriğinden.

## Ekran görüntüsü başlıkları

iPhone 6.9" (1320×2868) zorunlu. `supportsTablet: false` olursa iPad gerekmez.

| # | Ekran | EN | TR |
|---|---|---|---|
| 1 | Home | Games made for two | İki kişi için oyunlar |
| 2 | Wheel (spin anı) | Spin and let fate decide | Çevir, gerisini kader seçsin |
| 3 | Cards (açık kart) | Every card, a small invitation | Her kart küçük bir davet |
| 4 | Track/Level bar | Two paths, five levels each | İki yol, her birinde beş seviye |
| 5 | Boxes (iki telefon) | Your shared space, synced live | Ortak alanınız, anında senkron |
| 6 | Settings (dil) | Play in 12 languages | 12 dilde oynayın |

## App Store Connect'te elle doldurulacaklar

`store.config.json`'ın kapsamadığı alanlar:

**Yaş derecelendirmesi — yeni sorular** (EAS şemasında yok):
- User-generated content: **Yes** — Kutular'daki notlar odadaki iki partner arasında paylaşılıyor. Öneriler/Fanteziler sadece geliştiriciye gidiyor, kimseye gösterilmiyor. §1.2 önlemleri yerinde: şikâyet (not + partner), partneri çıkar ve engelle (Firestore rules ile zorlanır), Kullanım Koşulları (sıfır tolerans, yaş kapısında kabul), admin `/reports` paneli. **Şikâyetlere 24 saat içinde bakma sözü verildi** (uygulama, Terms ve reviewer notunda).
- Messaging / chat: **No**
- Advertising: **No**
- Sonuç: **18+** olmalı (advisory'de sexual content + mature themes "frequent/intense" işaretli; uygulama içi 18+ kapısıyla tutarlı).

**App Privacy (nutrition label)** — Tracking: **No**. Toplanan veri:

| Veri türü | Neden | Kimlikle bağlantılı? |
|---|---|---|
| Identifiers → User ID (Firebase anonim UID) | App Functionality | Hayır |
| User Content → Other User Content (Kutular notları, Öneri/Fantezi metinleri, şikâyet metinleri) | App Functionality | Hayır |

İsim, e-posta, konum, kişiler, analitik, crash log **toplanmıyor**. Analitik veya Crashlytics eklenirse bu tablo güncellenmeli.

**Diğer:**
- Fiyat: Ücretsiz (veya karar verilecek)
- Review contact: ad, e-posta, telefon — bilerek repoya yazılmadı, App Store Connect'te gir.

## Web sayfaları

`docs/` → GitHub Pages (Settings → Pages → Deploy from branch: `main` / `/docs`):
- https://gunelenes.github.io/love_games/ — ana sayfa (marketingUrl)
- https://gunelenes.github.io/love_games/privacy/ — gizlilik politikası (EN + `#tr`)
- https://gunelenes.github.io/love_games/support/ — destek + SSS (EN + `#tr`)
- https://gunelenes.github.io/love_games/terms/ — Kullanım Koşulları, §1.2 sıfır tolerans maddesi (EN + `#tr`). Uygulama içinde yaş kapısından ve Ayarlar → Yasal ve destek'ten açılır.

Gizlilik politikası veri envanteri koddan çıkarıldı (anonim UID, Kutular, Öneri/Fanteziler, AsyncStorage, Firebase eur3). Analitik, reklam veya yeni bir veri türü eklenirse **politika + App Privacy tablosu + `app.json` privacyManifests** birlikte güncellenmeli.

## Eksik (göndermeden önce)

- [x] Gizlilik + destek URL'leri
- [x] `app.json`: ad, bundle ID `com.gunelenes.wispandflame`, şifreleme beyanı, privacy manifest, `supportsTablet: false`, splash · `eas.json`
- [x] Yaş kapısı metni (kink ifadesi kaldırıldı, 12 dil)
- [ ] GitHub Pages'i aç (yukarıdaki ayar) ve URL'lerin açıldığını kontrol et
- [ ] Logo / app ikonu + splash görseli (şu an Expo varsayılanı)
- [ ] Apple Developer üyeliği → App Store Connect'te uygulama kaydı ("Wisp & Flame" adı orada rezerve olur)
- [ ] `eas init` + `eas build -p ios --profile production` + `eas metadata:push`
- [ ] Ekran görüntüleri
