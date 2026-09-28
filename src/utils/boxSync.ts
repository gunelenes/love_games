import type { Box, BoxSyncBlob } from '@/types';

/**
 * The blob is serialized as short-key JSON → UTF-8 bytes → base64,
 * with a `LG1:` prefix so we can reject non-love_games QR codes early.
 */

const PREFIX = 'LG1:';

type CompactBlob = {
  v: 1;
  b: string;
  n: string;
  c: string;
  i: string;
  t: Array<[string, string, number]>;
  k: 0 | 1;
  s: number;
};

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk))
    );
  }
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function buildBlobFromBox(box: Box): BoxSyncBlob {
  return {
    v: 1,
    boxId: box.id,
    boxName: box.name,
    boxColor: box.color,
    boxIcon: box.icon,
    notes: box.myNotes,
    confirmed: box.myConfirmed,
    ts: Date.now(),
  };
}

export function encodeSyncBlob(blob: BoxSyncBlob): string {
  const compact: CompactBlob = {
    v: blob.v,
    b: blob.boxId,
    n: blob.boxName,
    c: blob.boxColor,
    i: blob.boxIcon,
    t: blob.notes.map((n) => [n.id, n.text, n.createdAt]),
    k: blob.confirmed ? 1 : 0,
    s: blob.ts,
  };
  return PREFIX + utf8ToBase64(JSON.stringify(compact));
}

export function decodeSyncBlob(input: string): BoxSyncBlob | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith(PREFIX)) return null;
  try {
    const json = base64ToUtf8(trimmed.slice(PREFIX.length));
    const c = JSON.parse(json) as CompactBlob;
    if (
      c.v !== 1 ||
      typeof c.b !== 'string' ||
      typeof c.n !== 'string' ||
      typeof c.c !== 'string' ||
      typeof c.i !== 'string' ||
      typeof c.s !== 'number' ||
      !Array.isArray(c.t)
    ) {
      return null;
    }
    const notes = c.t
      .filter(
        (entry) =>
          Array.isArray(entry) &&
          typeof entry[0] === 'string' &&
          typeof entry[1] === 'string' &&
          typeof entry[2] === 'number'
      )
      .map(([id, text, createdAt]) => ({ id, text, createdAt }));
    return {
      v: 1,
      boxId: c.b,
      boxName: c.n,
      boxColor: c.c,
      boxIcon: c.i,
      notes,
      confirmed: c.k === 1,
      ts: c.s,
    };
  } catch {
    return null;
  }
}
