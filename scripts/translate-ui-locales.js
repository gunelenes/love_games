/**
 * UI shell translator — reads src/i18n/locales/en.json (authoring source for
 * the UI shell; content translations live elsewhere, see translate-content.js)
 * and fills in missing keys for de/fr/es/it (Tier-1 launch set) via Claude.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/translate-ui-locales.js        # all 4 langs
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/translate-ui-locales.js de     # single lang
 *
 * Idempotent: existing non-empty values in each locale file are kept; only
 * missing or empty keys are sent to Claude. Delete a key from the target JSON
 * (or wipe the file) to force a re-translate.
 *
 * Install deps once:
 *   npm install --no-save @anthropic-ai/sdk
 */

const fs = require('fs');
const path = require('path');
const { Anthropic } = require('@anthropic-ai/sdk');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const SOURCE_FILE = path.join(LOCALES_DIR, 'en.json');

/**
 * Per-language briefing. Each entry is appended to the user message so the
 * model knows which register / politeness / cultural notes apply.
 */
const TARGET_LANGS = {
  de: {
    name: 'German (Deutsch)',
    note:
      "Use informal 'du' form (this is a couples app, intimate register). " +
      'German tends to be ~70% longer than English — favor shorter choices ' +
      'where possible so UI buttons do not overflow.',
  },
  fr: {
    name: 'French (Français)',
    note:
      "Use informal 'tu' form (couples app). Keep translations snug; " +
      'French often runs ~20% longer than English.',
  },
  es: {
    name: 'Spanish (Español, neutral LATAM)',
    note:
      "Use informal 'tú' form (couples app). Prefer neutral LATAM Spanish " +
      '(no vosotros, no voseo). Mild length expansion is OK.',
  },
  it: {
    name: 'Italian (Italiano)',
    note:
      "Use informal 'tu' form (couples app). Keep tone warm and playful.",
  },
};

const SYSTEM_PROMPT = `You translate UI strings for "Love Games" — a mobile app for couples with intimate, playful, sensual mini-games. The voice is warm, confident, and tender; never clinical, corporate, or robotic. Treat the user and their partner as adults who want closeness.

PRESERVE EXACTLY (DO NOT TRANSLATE OR MOVE):
1. Every {{placeholder}} must appear verbatim in the output — same name, same case, same surrounding spaces. If English says "{{count}} notes", your translation must still contain exactly "{{count}}".
2. Every emoji (✨ 🎉 💋 …) stays as-is, in a natural position for the target language.
3. Markdown **bold** markers wrap the equivalent words in the target language — do not drop the stars.
4. UPPERCASE short strings (SPIN, ROLL, SHUFFLE, BOXES, etc.) become UPPERCASE in the target unless the language genuinely has no uppercase convention for that word.
5. Quoted English words that are proper nouns ("Love Games", "love_games") stay as-is.

STYLE:
- Match the English length when feasible — buttons and chips cannot overflow. If the natural translation is long, pick a punchy synonym rather than a full literal rendering.
- Avoid formal/legal tone. "Accept and Continue" is a soft confirmation, not a Terms-of-Service click.
- The content is sensual + couple-oriented but not explicit — translate flirty English with equally flirty target-language phrasing.

OUTPUT:
Return a single JSON object with every input key present, each mapped to the translated string. Begin your response with { and end with } — no code fences, no commentary before or after. The output is parsed by JSON.parse() verbatim.`;

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function unflatten(flat) {
  const out = {};
  for (const [key, val] of Object.entries(flat)) {
    const parts = key.split('.');
    let cur = out;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in cur) || typeof cur[parts[i]] !== 'object') {
        cur[parts[i]] = {};
      }
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  }
  return out;
}

function stripFences(text) {
  // Claude occasionally wraps JSON in ```json fences despite instructions.
  let s = text.trim();
  s = s.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  // Trim anything before the first { and after the last } as a safety net.
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first >= 0 && last > first) s = s.slice(first, last + 1);
  return s;
}

async function translateLang(client, lang, briefing, missing) {
  const keys = Object.keys(missing);
  const userMessage =
    `Target: ${briefing.name}.\n${briefing.note}\n\n` +
    `Translate every value below. Keys are opaque identifiers — translate the ` +
    `values. Return a JSON object with the same ${keys.length} keys, each ` +
    `mapped to its translated string.\n\nSource (English):\n` +
    JSON.stringify(missing, null, 2);

  // Stream so the SDK doesn't trip its ~10min non-streaming guard on larger
  // batches; finalMessage() returns the fully-assembled response.
  const stream = client.messages.stream({
    model: 'claude-opus-4-7',
    max_tokens: 16000,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        // 1h TTL keeps the system prompt cached across all 4 languages in
        // the same run — 1.25x write once, 0.1x read three more times.
        cache_control: { type: 'ephemeral', ttl: '1h' },
      },
    ],
    messages: [{ role: 'user', content: userMessage }],
  });
  const response = await stream.finalMessage();

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) {
    throw new Error(`[${lang}] no text block in response`);
  }
  const cleaned = stripFences(textBlock.text);
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error(`[${lang}] JSON parse failed. First 400 chars of response:`);
    console.error(textBlock.text.slice(0, 400));
    throw e;
  }

  // Guard against missing keys the model forgot to return.
  const returned = new Set(Object.keys(parsed));
  const missed = keys.filter((k) => !returned.has(k));
  if (missed.length > 0) {
    throw new Error(
      `[${lang}] model omitted ${missed.length} keys: ${missed.slice(0, 5).join(', ')}${missed.length > 5 ? '…' : ''}`
    );
  }

  // Sanity: every placeholder in the source must appear in the translation.
  for (const [k, src] of Object.entries(missing)) {
    const placeholders = Array.from(src.matchAll(/\{\{[^}]+\}\}/g)).map(
      (m) => m[0]
    );
    const translated = parsed[k];
    if (typeof translated !== 'string') {
      throw new Error(`[${lang}] missing translation for "${k}"`);
    }
    for (const ph of placeholders) {
      if (!translated.includes(ph)) {
        console.warn(
          `[${lang}] WARN: "${k}" dropped placeholder "${ph}" — ` +
            `src="${src}" out="${translated}"`
        );
      }
    }
  }

  const usage = response.usage;
  console.log(
    `[${lang}] usage input=${usage.input_tokens} output=${usage.output_tokens} ` +
      `cache_read=${usage.cache_read_input_tokens ?? 0} ` +
      `cache_write=${usage.cache_creation_input_tokens ?? 0}`
  );

  return parsed;
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

  const enRaw = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));
  const enFlat = flatten(enRaw);
  console.log(`Source: ${SOURCE_FILE} (${Object.keys(enFlat).length} keys)`);

  for (const lang of langs) {
    const briefing = TARGET_LANGS[lang];
    const targetPath = path.join(LOCALES_DIR, `${lang}.json`);
    const existing = fs.existsSync(targetPath)
      ? JSON.parse(fs.readFileSync(targetPath, 'utf8'))
      : {};
    const existingFlat = flatten(existing);

    const missing = {};
    for (const [k, v] of Object.entries(enFlat)) {
      const cur = existingFlat[k];
      if (typeof cur !== 'string' || cur.trim() === '') {
        missing[k] = v;
      }
    }

    if (Object.keys(missing).length === 0) {
      console.log(`[${lang}] already complete (${Object.keys(enFlat).length} keys) — skipping`);
      continue;
    }

    console.log(`[${lang}] translating ${Object.keys(missing).length} missing keys…`);
    const translated = await translateLang(client, lang, briefing, missing);

    // Merge: existing values win (idempotent), new translations fill holes.
    const merged = { ...existingFlat };
    for (const [k, v] of Object.entries(translated)) {
      if (typeof merged[k] !== 'string' || merged[k].trim() === '') {
        merged[k] = v;
      }
    }
    const unflattened = unflatten(merged);
    fs.writeFileSync(
      targetPath,
      JSON.stringify(unflattened, null, 2) + '\n'
    );
    console.log(`[${lang}] wrote ${targetPath}`);
  }

  console.log('\n✅ Done. Run `npx tsc --noEmit` to confirm nothing broke, then test the Settings dropdown.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
