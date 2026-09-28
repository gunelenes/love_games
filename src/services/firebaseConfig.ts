/**
 * Firebase config — projeye özel değerleri buraya yapıştır.
 *
 * Nereden alınır:
 *   Firebase Console → Project settings → "Your apps" → Web (</>) app add →
 *   "Register app" → firebaseConfig objesini kopyala.
 *
 * Bu değerler public'tir (client SDK için tasarlandı). Gerçek güvenlik
 * Firestore rules üzerinden sağlanır — bkz. proje planındaki security rules.
 *
 * Placeholder değerler bırakıldığı sürece Firebase init edilmez ve mobil app
 * bundle'daki JSON'lar üzerinden çalışmaya devam eder.
 *
 * NOT: Firebase Console'un varsayılan snippet'inde `getAnalytics` ve manuel
 * `initializeApp` çağrıları vardır — bunlar React Native'de çalışmaz.
 * Bu dosyada SADECE firebaseConfig objesini bulundur; init işi
 * src/services/firebase.ts'te yapılır.
 */

export const firebaseConfig = {
  apiKey: 'AIzaSyAeyBZRE_uZ55g5USuHwKhAf4gMD-jA4jo',
  authDomain: 'love-games-prod.firebaseapp.com',
  projectId: 'love-games-prod',
  storageBucket: 'love-games-prod.firebasestorage.app',
  messagingSenderId: '956292347120',
  appId: '1:956292347120:web:b326a1cd657a5e18fe7e35',
  measurementId: 'G-TXQCNBPBDH',
};

export const isFirebaseConfigured =
  firebaseConfig.apiKey !== 'PASTE_YOUR_API_KEY' &&
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.projectId;
