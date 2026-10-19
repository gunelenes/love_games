# Store metadata — Wisp & Flame

| Dosya | Ne |
|---|---|
| `../store.config.json` | App Store metadata (en-US + tr): ad, altyazı, keyword, açıklama, promo, yaş derecelendirmesi, kategori, reviewer notu. `eas metadata:push` ile yüklenir. |
| `google-play/{en-US,tr-TR}/` | Play Console listing: `title.txt` (30), `short_description.txt` (80), `full_description.txt` (4000). EAS Metadata Play'i desteklemiyor — elle yapıştır (veya ileride fastlane `supply`). |

App Store açıklaması ile Play uzun açıklaması aynı metin; birini değiştirirsen diğerini de güncelle.

## Kurallar (metin değiştirirken)

- **Metadata'da geçmeyecek kelimeler:** sex, kink, fantasy, BDSM, erotic, adult toy. "Intimacy", "romantic", "date night", "for adult couples (18+)" güvenli.
- **Pozlar / Göz Ucuyla açıklamada yok** — iOS'ta uzaktan kapalı gönderilecek. Açılırsa açıklamaya ve ekran görüntülerine sonra eklenir.
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
- User-generated content: **Yes** — Kutular'daki notlar odadaki iki partner arasında paylaşılıyor. Öneriler/Fanteziler sadece geliştiriciye gidiyor, kimseye gösterilmiyor.
- Messaging / chat: **No**
- Advertising: **No**
- Sonuç: **18+** olmalı (advisory'de sexual content + mature themes "frequent/intense" işaretli; uygulama içi 18+ kapısıyla tutarlı).

**App Privacy (nutrition label)** — Tracking: **No**. Toplanan veri:

| Veri türü | Neden | Kimlikle bağlantılı? |
|---|---|---|
| Identifiers → User ID (Firebase anonim UID) | App Functionality | Hayır |
| User Content → Other User Content (Kutular notları, Öneri/Fantezi metinleri) | App Functionality | Hayır |

İsim, e-posta, konum, kişiler, analitik, crash log **toplanmıyor**. Analitik veya Crashlytics eklenirse bu tablo güncellenmeli.

**Diğer:**
- Fiyat: Ücretsiz (veya karar verilecek)
- Review contact: ad, e-posta, telefon — bilerek repoya yazılmadı, App Store Connect'te gir.

## Eksik (göndermeden önce)

- [ ] `privacyPolicyUrl` + `supportUrl` — Apple **zorunlu**. Sayfalar yazılınca iki locale'e de ekle.
- [ ] `app.json`: ad "Wisp & Flame", `ios.bundleIdentifier`, `ITSAppUsesNonExemptEncryption: false`, privacy manifest, `supportsTablet: false`, splash.
- [ ] Pozlar + Göz Ucuyla için iOS uzaktan bayrağı (review'a kapalı gönder).
- [ ] Uygulama içi metinler: yaş kapısı "kink-oriented suggestions" diyor — reviewer bunu okur; metadata ile aynı dile ("intimate themes") çekilmeli.
- [ ] App Store Connect'te uygulama kaydını aç — "Wisp & Flame" adı orada rezerve olur.
