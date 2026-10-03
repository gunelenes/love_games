/**
 * Content translator — reads the bundle (src/data/*.json) and ladder
 * (scripts/content/**​/*.json), translates every item's Turkish source into
 * the Tier-1 target languages (de/fr/es/it), and writes the translations
 * back into the item's locale maps:
 *
 *   Category:      nameI18n.<lang>, promptsI18n.<lang>
 *   PlaceCategory: nameI18n.<lang>
 *   Place:         nameI18n.<lang>, descriptionI18n.<lang>
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/translate-content.js        # all 4 langs
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/translate-content.js de     # single lang
 *
 * Idempotent: items whose target-lang maps already have non-empty values
 * are skipped. Delete the <lang> key from a map to force a re-translate.
 *
 * Install deps once:
 *   npm install --no-save @anthropic-ai/sdk
 */

const fs = require('fs');
const path = require('path');
const { Anthropic } = require('@anthropic-ai/sdk');

const BUNDLE_DIR = path.join(__dirname, '..', 'src', 'data');
const BUNDLE_FILES = ['categories.json', 'diceFaces.json', 'placeCategories.json'];
const LADDER_DIR = path.join(__dirname, 'content');

const TARGET_LANGS = {
  de: {
    name: 'German (Deutsch)',
    note:
      "Use informal 'du' (couples app). German is ~70% longer than Turkish — " +
      'where a short category name is forced, trim to a punchy noun.',
  },
  fr: {
    name: 'French (Français)',
    note:
      "Use informal 'tu' (couples app). Favor warm, poetic phrasing where the " +
      'Turkish source is lyrical.',
  },
  es: {
    name: 'Spanish (Español, neutral LATAM)',
    note:
      "Use informal 'tú'. Neutral LATAM Spanish — no vosotros, no voseo.",
  },
  it: {
    name: 'Italian (Italiano)',
    note: "Use informal 'tu'. Keep the warmth and sensuality of the Turkish source.",
  },
  ja: {
    name: 'Japanese (日本語)',
    note:
      'Use informal / familiar register for intimate couples content. Katakana/kanji/hiragana as naturally fits. Softened kink role names: Halatçı → 縄師 (rigger), Rehber → 導き手 (guide), Bahçıvan → 世話人 (caretaker), Ustabaşı → 統率者 (foreman), Takipçi → 従う者 (follower).',
  },
  ko: {
    name: 'Korean (한국어)',
    note:
      'Use informal / intimate 반말 or soft 해요체 as fits the tenderness of each prompt. Softened kink role names: Halatçı → 로프 묶는 사람 (rope rigger), Rehber → 안내자 (guide), Bahçıvan → 돌보는 사람 (caretaker), Ustabaşı → 지휘자 (foreman), Takipçi → 따르는 사람 (follower).',
  },
  'zh-TW': {
    name: 'Traditional Chinese (繁體中文)',
    note:
      'Taiwan Traditional Chinese conventions. Use 你 for second person (couples register). Softened kink role names: Halatçı → 繩師 (rigger), Rehber → 引導者 (guide), Bahçıvan → 照護者 (caretaker), Ustabaşı → 主導者 (foreman), Takipçi → 跟隨者 (follower). Traditional characters only — never Simplified.',
  },
  id: {
    name: 'Indonesian (Bahasa Indonesia)',
    note:
      "Use informal 'kamu' (couples app). Standard Indonesian. Softened kink role names: Halatçı → Pengikat Tali (rigger), Rehber → Pembimbing (guide), Bahçıvan → Perawat (caretaker), Ustabaşı → Pengarah (foreman), Takipçi → Pengikut (follower).",
  },
  hi: {
    name: 'Hindi (हिन्दी)',
    note:
      'Use informal तुम form (couples app, Devanagari script). Softened kink role names: Halatçı → रस्सी बांधने वाला (rigger), Rehber → मार्गदर्शक (guide), Bahçıvan → देखभाल करने वाला (caretaker), Ustabaşı → प्रमुख (foreman), Takipçi → अनुसरणकर्ता (follower). Keep sensual tone warm and respectful.',
  },
  ar: {
    name: 'Arabic (العربية)',
    note:
      'Modern Standard Arabic with warmth — accessible to adult Arabic readers. Use masculine singular second person (أنت) as default; the prompts address one partner. Softened kink role names: Halatçı → الرابط (rigger), Rehber → المرشد (guide), Bahçıvan → المعتني (caretaker), Ustabaşı → المدبّر (foreman), Takipçi → التابع (follower). Content is adult / sensual — translate naturally without over-softening or euphemism beyond the Turkish source.',
  },
};

const SYSTEM_PROMPT = `You translate intimate couples' game content for "Love Games" — a mobile app with sensual, playful mini-games for adults (18+). The source is Turkish, written in a warm, direct, slightly flirtatious voice. The content is spicy but tasteful; discreet BDSM-adjacent prompts use softened terminology (Rigger, Guide, Caretaker, Foreman, Follower — never the raw clinical terms).

PRESERVE:
1. Every emoji exactly as-is.
2. Quoted phrases inside the Turkish source (e.g. "seni istiyorum" that the player speaks aloud) — translate the phrase inside the quotes too; it should flow in the target language as the thing you'd actually say to your partner.
3. The imperative tone — "Partnerine…" becomes "Give your partner…" / "Dis à ton/ta partenaire…" etc., second-person informal, direct.
4. Timing instructions (30 seconds, 3 minutes) — pass through unchanged.
5. Softened kink terminology: Halatçı → Rigger (de: Seiler, fr: Lieur, es: Cuerdista, it: Legatore), Rehber → Guide (de: Führer, fr: Guide, es: Guía, it: Guida), Bahçıvan → Caretaker (de: Pfleger, fr: Gardien, es: Cuidador, it: Custode), Ustabaşı → Foreman (de: Vorarbeiter, fr: Contremaître, es: Capataz, it: Capo), Takipçi → Follower (de: Nachfolger, fr: Suiveur, es: Seguidor, it: Seguace). Never translate these as "Master/Slave/Dom/Sub" even if the context would suggest it — the softening is deliberate.

QUOTE HANDLING — CRITICAL:
Your output is a JSON object. Inline quotations (safewords, spoken lines, callouts) MUST use the ASCII double-quote character \\" (escaped), the same character the source uses. Do NOT substitute with language-typographic quotes like „…\" « … » „…\" " … " or ‘…\'. Even if German/French/Spanish/Italian typography would normally prefer curly or guillemet quotes, the raw ASCII \\" is required here so the JSON string remains parseable.
Example — source: "Sahne başlangıcı: safeword netleştir (örn. \\"kırmızı\\" = anında dur)."
Correct DE: "Szenenbeginn: Safeword klären (z. B. \\"rot\\" = sofort stopp)."
WRONG DE: "Szenenbeginn: Safeword klären (z. B. „rot\\" = sofort stopp)."  // breaks JSON

VOICE PER PROMPT:
- Direct second person ("you", "your partner").
- Short, breathy sentences where the Turkish is short.
- Where Turkish uses em-dashes (— like this), reproduce them in the target language.
- Translate the FEELING, not just the words. A line like "Partnerine sıkıca 30 saniye sarıl, hiçbir şey söyleme." should read naturally as an intimate instruction in the target language, not a dictionary rendering.

CATEGORY / PLACE NAMES:
- Keep names evocative and short — these appear as chips/labels in the UI.
- Preserve the register: "Ateş Sözcükleri" → "Feuerworte" / "Mots de feu" / "Palabras de fuego" / "Parole di fuoco" (poetic, two words).

OUTPUT:
Return a single JSON object with every input key present, each mapped to the translated string. Begin your response with { and end with } — no code fences, no commentary before or after. The output is parsed by JSON.parse() verbatim.`;

/**
 * Walk an item and collect every string that needs translation, keyed by a
 * stable path so we can push the translation back in the same spot.
 *
 * Keys emitted (per item):
 *   "name"                              → item.nameI18n.<lang>
 *   "prompts.<i>"                       → item.promptsI18n.<lang>[i]
 *   "places.<i>.name"                   → item.places[i].nameI18n.<lang>
 *   "places.<i>.description"            → item.places[i].descriptionI18n.<lang>
 */
function collectSources(item) {
  const out = {};
  if (typeof item.name === 'string' && item.name.trim()) {
    out['name'] = item.name;
  }
  if (Array.isArray(item.prompts)) {
    item.prompts.forEach((p, i) => {
      if (typeof p === 'string' && p.trim()) out[`prompts.${i}`] = p;
    });
  }
  if (Array.isArray(item.places)) {
    item.places.forEach((pl, i) => {
      if (typeof pl.name === 'string' && pl.name.trim()) {
        out[`places.${i}.name`] = pl.name;
      }
      if (typeof pl.description === 'string' && pl.description.trim()) {
        out[`places.${i}.description`] = pl.description;
      }
    });
  }
  return out;
}

function getExisting(item, lang, flatKey) {
  const parts = flatKey.split('.');
  if (parts[0] === 'name') {
    return item.nameI18n?.[lang];
  }
  if (parts[0] === 'prompts') {
    const idx = Number(parts[1]);
    return item.promptsI18n?.[lang]?.[idx];
  }
  if (parts[0] === 'places') {
    const idx = Number(parts[1]);
    const field = parts[2]; // 'name' | 'description'
    if (field === 'name') return item.places?.[idx]?.nameI18n?.[lang];
    if (field === 'description') return item.places?.[idx]?.descriptionI18n?.[lang];
  }
  return undefined;
}

function writeBack(item, lang, flatKey, value, trPromptsLength) {
  const parts = flatKey.split('.');
  if (parts[0] === 'name') {
    item.nameI18n ??= {};
    item.nameI18n[lang] = value;
    return;
  }
  if (parts[0] === 'prompts') {
    const idx = Number(parts[1]);
    item.promptsI18n ??= {};
    // Preserve index alignment with tr prompts for element-wise fallback.
    if (!Array.isArray(item.promptsI18n[lang])) {
      item.promptsI18n[lang] = new Array(trPromptsLength).fill('');
    }
    // Pad if the array is shorter (e.g. prior partial run).
    while (item.promptsI18n[lang].length < trPromptsLength) {
      item.promptsI18n[lang].push('');
    }
    item.promptsI18n[lang][idx] = value;
    return;
  }
  if (parts[0] === 'places') {
    const idx = Number(parts[1]);
    const field = parts[2];
    const place = item.places[idx];
    if (field === 'name') {
      place.nameI18n ??= {};
      place.nameI18n[lang] = value;
    } else if (field === 'description') {
      place.descriptionI18n ??= {};
      place.descriptionI18n[lang] = value;
    }
  }
}

function stripFences(text) {
  let s = text.trim();
  s = s.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first >= 0 && last > first) s = s.slice(first, last + 1);
  return s;
}

async function translateBatch(client, lang, briefing, batch) {
  // batch: { "itemId::keyPath": "tr source", ... }
  const keys = Object.keys(batch);
  const userMessage =
    `Target: ${briefing.name}.\n${briefing.note}\n\n` +
    `Translate each value from Turkish into the target language. Keys are ` +
    `opaque identifiers tying each string to its slot in a JSON structure — ` +
    `do not interpret or translate the keys, only the values. Return a JSON ` +
    `object with the same ${keys.length} keys, each mapped to the ` +
    `target-language translation.\n\nSource (Turkish):\n` +
    JSON.stringify(batch, null, 2);

  // Streaming is required past ~16K max_tokens to avoid the SDK's non-stream
  // timeout guard; content batches can produce long JSON outputs.
  const stream = client.messages.stream({
    model: 'claude-opus-4-7',
    max_tokens: 32000,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral', ttl: '1h' },
      },
    ],
    messages: [{ role: 'user', content: userMessage }],
  });
  const response = await stream.finalMessage();

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error(`[${lang}] no text block`);
  let parsed;
  try {
    parsed = JSON.parse(stripFences(textBlock.text));
  } catch (e) {
    console.error(`[${lang}] JSON parse failed. First 400 chars:`);
    console.error(textBlock.text.slice(0, 400));
    throw e;
  }
  const returned = new Set(Object.keys(parsed));
  const missed = keys.filter((k) => !returned.has(k));
  if (missed.length > 0) {
    throw new Error(
      `[${lang}] model omitted ${missed.length} keys: ${missed.slice(0, 5).join(', ')}${missed.length > 5 ? '…' : ''}`
    );
  }

  const usage = response.usage;
  console.log(
    `[${lang}] batch=${keys.length} ` +
      `input=${usage.input_tokens} output=${usage.output_tokens} ` +
      `cache_read=${usage.cache_read_input_tokens ?? 0} ` +
      `cache_write=${usage.cache_creation_input_tokens ?? 0}`
  );

  return parsed;
}

/**
 * Translate a single JSON file (either bundle or ladder) for one language.
 * File shape: array of items (Category or PlaceCategory).
 */
async function translateFile(client, lang, briefing, filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const items = JSON.parse(raw);
  if (!Array.isArray(items)) {
    console.warn(`skip (not an array): ${filePath}`);
    return;
  }

  // Build a batch across all items in the file: one Claude call per file.
  const batch = {};
  for (const item of items) {
    const sources = collectSources(item);
    for (const [key, value] of Object.entries(sources)) {
      const existing = getExisting(item, lang, key);
      if (typeof existing === 'string' && existing.trim()) continue;
      batch[`${item.id}::${key}`] = value;
    }
  }

  if (Object.keys(batch).length === 0) {
    console.log(`[${lang}] ${path.basename(filePath)} already complete`);
    return;
  }

  console.log(
    `[${lang}] ${path.basename(filePath)} — translating ${Object.keys(batch).length} strings`
  );
  const translated = await translateBatch(client, lang, briefing, batch);

  // Fan the translations back into item.*I18n.<lang>.
  const itemsById = new Map(items.map((it) => [it.id, it]));
  for (const [k, v] of Object.entries(translated)) {
    const [itemId, ...keyParts] = k.split('::');
    const item = itemsById.get(itemId);
    if (!item) {
      console.warn(`  WARN: unknown item id "${itemId}"`);
      continue;
    }
    writeBack(item, lang, keyParts.join('::'), v, item.prompts?.length ?? 0);
  }

  fs.writeFileSync(filePath, JSON.stringify(items, null, 2) + '\n');
  console.log(`[${lang}] wrote ${path.basename(filePath)}`);
}

function enumerateContentFiles() {
  const files = [];
  for (const f of BUNDLE_FILES) files.push(path.join(BUNDLE_DIR, f));
  if (fs.existsSync(LADDER_DIR)) {
    for (const col of fs.readdirSync(LADDER_DIR)) {
      const colDir = path.join(LADDER_DIR, col);
      if (!fs.statSync(colDir).isDirectory()) continue;
      for (const f of fs.readdirSync(colDir)) {
        if (f.endsWith('.json')) files.push(path.join(colDir, f));
      }
    }
  }
  return files;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      'ANTHROPIC_API_KEY not set. Export it (bash: `export ANTHROPIC_API_KEY=sk-ant-…`, ' +
        'PowerShell: `$env:ANTHROPIC_API_KEY="sk-ant-…"`) and re-run.'
    );
    process.exit(1);
  }

  const client = new Anthropic();

  const langArg = process.argv[2];
  const langs = langArg ? [langArg] : Object.keys(TARGET_LANGS);
  for (const l of langs) {
    if (!TARGET_LANGS[l]) {
      console.error(`Unknown target lang: "${l}". Pick from: ${Object.keys(TARGET_LANGS).join(', ')}`);
      process.exit(1);
    }
  }

  const files = enumerateContentFiles();
  console.log(`${files.length} content files found`);

  for (const lang of langs) {
    const briefing = TARGET_LANGS[lang];
    console.log(`\n=== ${lang.toUpperCase()} ===`);
    for (const f of files) {
      await translateFile(client, lang, briefing, f);
    }
  }

  console.log(
    '\n✅ Done. Review a few translated prompts, then run:\n' +
      '  node scripts/seed-firestore.js\n' +
      '  node scripts/seed-content.js\n' +
      'to push the new language maps to Firestore.'
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
