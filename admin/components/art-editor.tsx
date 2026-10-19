'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  deleteArtImage,
  listArt,
  removeArt,
  saveArt,
  uploadArtImage,
} from '@/lib/art-service';
import {
  CONTENT_LANGS,
  CONTENT_LANG_LABEL,
  type ContentLang,
} from '@/lib/contentLangs';
import type { ArtCard, ArtDeck } from '@/lib/types';

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function newBlank(order: number): ArtCard {
  return { id: '', name: '', description: '', image: '', order };
}

type Props = {
  deck: ArtDeck;
  title: string;
  description: string;
  newLabel: string;
};

export function ArtEditor({ deck, title, description, newLabel }: Props) {
  const [items, setItems] = useState<ArtCard[]>([]);
  // imagePath each doc had when loaded/saved — tells save() which blob to drop.
  const [savedPaths, setSavedPaths] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<ArtCard | null>(null);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [translateTo, setTranslateTo] = useState<ContentLang | ''>('en');

  const load = async () => {
    setLoading(true);
    try {
      const list = await listArt(deck);
      setItems(list);
      setSavedPaths(Object.fromEntries(list.map((c) => [c.id, c.imagePath])));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck]);

  const markDirty = (id: string) => setDirty((d) => new Set(d).add(id));

  const update = (id: string, patch: Partial<ArtCard>) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    markDirty(id);
  };

  const save = async (item: ArtCard) => {
    if (!item.name.trim()) {
      alert('İsim gerekli');
      return;
    }
    setSaving((s) => new Set(s).add(item.id));
    try {
      await saveArt(deck, item, savedPaths[item.id]);
      setSavedPaths((p) => ({ ...p, [item.id]: item.imagePath }));
      setDirty((d) => {
        const n = new Set(d);
        n.delete(item.id);
        return n;
      });
    } catch (e: any) {
      alert('Kaydetme başarısız: ' + (e?.message || e));
    } finally {
      setSaving((s) => {
        const n = new Set(s);
        n.delete(item.id);
        return n;
      });
    }
  };

  const remove = async (item: ArtCard) => {
    if (!confirm(`"${item.id}" silinsin mi? (görsel de silinir)`)) return;
    try {
      await removeArt(deck, item);
      // An unsaved replacement upload would otherwise be orphaned.
      const saved = savedPaths[item.id];
      if (saved && saved !== item.imagePath) await deleteArtImage(saved);
      setItems((prev) => prev.filter((p) => p.id !== item.id));
    } catch (e: any) {
      alert('Silme başarısız: ' + (e?.message || e));
    }
  };

  const addNew = () => {
    const maxOrder = items.reduce((m, c) => Math.max(m, c.order ?? -1), -1);
    setNewItem(newBlank(maxOrder + 1));
    setExpanded('__new__');
  };

  const cancelNew = async () => {
    await deleteArtImage(newItem?.imagePath);
    setNewItem(null);
  };

  const saveNew = async () => {
    if (!newItem) return;
    if (!ID_PATTERN.test(newItem.id)) {
      alert('ID küçük harf, rakam ve tire olmalı (örn. "lotus-embrace")');
      return;
    }
    if (items.some((p) => p.id === newItem.id)) {
      alert('Bu ID zaten var');
      return;
    }
    if (!newItem.name.trim()) {
      alert('İsim gerekli');
      return;
    }
    if (!newItem.image) {
      alert('Önce bir görsel yükleyin');
      return;
    }
    try {
      await saveArt(deck, newItem);
      const id = newItem.id;
      setNewItem(null);
      await load();
      setExpanded(id);
    } catch (e: any) {
      alert('Kaydetme başarısız: ' + (e?.message || e));
    }
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">{title}</h1>
          <p className="text-sm text-muted mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-muted">Translate to:</label>
          <select
            className="input"
            value={translateTo}
            onChange={(e) => setTranslateTo(e.target.value as ContentLang | '')}
          >
            <option value="">— none —</option>
            {CONTENT_LANGS.map((l) => (
              <option key={l} value={l}>
                {CONTENT_LANG_LABEL[l]} ({l})
              </option>
            ))}
          </select>
          <button onClick={addNew} className="btn-primary" disabled={!!newItem}>
            {newLabel}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-muted">Yükleniyor…</div>
      ) : (
        <div className="space-y-3">
          {newItem ? (
            <ArtCardRow
              deck={deck}
              item={newItem}
              savedPath={undefined}
              expanded
              dirty
              saving={false}
              translateTo={translateTo}
              onToggle={() => {}}
              onChange={(patch) => setNewItem({ ...newItem, ...patch })}
              onSave={saveNew}
              onDelete={cancelNew}
              isNew
            />
          ) : null}

          {items.length === 0 && !newItem ? (
            <div className="rounded-md border border-white/10 bg-white/5 p-8 text-center text-sm text-muted">
              Henüz kart yok. &quot;{newLabel}&quot; ile başla.
            </div>
          ) : null}

          {items.map((item) => (
            <ArtCardRow
              key={item.id}
              deck={deck}
              item={item}
              savedPath={savedPaths[item.id]}
              expanded={expanded === item.id}
              dirty={dirty.has(item.id)}
              saving={saving.has(item.id)}
              translateTo={translateTo}
              onToggle={() =>
                setExpanded((cur) => (cur === item.id ? null : item.id))
              }
              onChange={(patch) => update(item.id, patch)}
              onSave={() => save(item)}
              onDelete={() => remove(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type RowProps = {
  deck: ArtDeck;
  item: ArtCard;
  /** Blob the saved doc points at — never deleted until the save lands. */
  savedPath: string | undefined;
  expanded: boolean;
  dirty: boolean;
  saving: boolean;
  translateTo: ContentLang | '';
  onToggle: () => void;
  onChange: (patch: Partial<ArtCard>) => void;
  onSave: () => void;
  onDelete: () => void;
  isNew?: boolean;
};

function ArtCardRow({
  deck,
  item,
  savedPath,
  expanded,
  dirty,
  saving,
  translateTo,
  onToggle,
  onChange,
  onSave,
  onDelete,
  isNew,
}: RowProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ID_PATTERN.test(item.id)) {
      alert('Önce geçerli bir ID gir, sonra görsel yükle.');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const { url, path } = await uploadArtImage(deck, item.id, file);
      // Replacing an upload that was never saved — drop it right away.
      if (item.imagePath && item.imagePath !== savedPath) {
        await deleteArtImage(item.imagePath);
      }
      onChange({ image: url, imagePath: path });
    } catch (err: any) {
      alert('Görsel yüklenemedi: ' + (err?.message || err));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const translatedName = translateTo ? (item.nameI18n?.[translateTo] ?? '') : '';
  const translatedDesc = translateTo
    ? (item.descriptionI18n?.[translateTo] ?? '')
    : '';

  return (
    <div
      className={
        'rounded-lg border overflow-hidden ' +
        (dirty
          ? 'border-amber-400/50 bg-amber-400/5'
          : 'border-white/10 bg-white/5')
      }
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5"
      >
        <div className="w-14 h-14 rounded-md bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-muted text-xl">🖼</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">
            {item.name || <span className="text-muted">(isimsiz)</span>}
          </div>
          <div className="text-xs text-muted truncate">
            {item.id || '(id yok)'}
            {typeof item.order === 'number' ? ` · sıra ${item.order}` : ''}
          </div>
        </div>
        {dirty && !isNew ? (
          <span className="text-xs text-amber-300 font-semibold">● kaydedilmedi</span>
        ) : null}
        <span className="text-muted text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded ? (
        <div className="p-4 border-t border-white/10 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_100px] gap-4">
            <label className="block">
              <span className="text-xs text-muted uppercase tracking-wide">ID</span>
              <input
                className="input w-full mt-1"
                value={item.id}
                onChange={(e) => onChange({ id: e.target.value.trim().toLowerCase() })}
                disabled={!isNew}
                placeholder="örn. lotus-embrace"
              />
            </label>

            <label className="block">
              <span className="text-xs text-muted uppercase tracking-wide">
                İsim (Türkçe)
              </span>
              <input
                className="input w-full mt-1"
                value={item.name}
                onChange={(e) => onChange({ name: e.target.value })}
              />
            </label>

            <label className="block">
              <span className="text-xs text-muted uppercase tracking-wide">Sıra</span>
              <input
                type="number"
                className="input w-full mt-1"
                value={item.order ?? ''}
                onChange={(e) =>
                  onChange({
                    order: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs text-muted uppercase tracking-wide">
              Açıklama (Türkçe)
            </span>
            <textarea
              className="input w-full mt-1 min-h-[80px]"
              value={item.description || ''}
              onChange={(e) => onChange({ description: e.target.value })}
            />
          </label>

          {translateTo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-md border border-white/10 bg-black/20 p-3">
              <label className="block">
                <span className="text-xs text-muted uppercase tracking-wide">
                  İsim ({translateTo})
                </span>
                <input
                  className="input w-full mt-1"
                  value={translatedName}
                  onChange={(e) =>
                    onChange({
                      nameI18n: { ...(item.nameI18n || {}), [translateTo]: e.target.value },
                    })
                  }
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted uppercase tracking-wide">
                  Açıklama ({translateTo})
                </span>
                <textarea
                  className="input w-full mt-1 min-h-[80px]"
                  value={translatedDesc}
                  onChange={(e) =>
                    onChange({
                      descriptionI18n: {
                        ...(item.descriptionI18n || {}),
                        [translateTo]: e.target.value,
                      },
                    })
                  }
                />
              </label>
            </div>
          ) : null}

          <div className="rounded-md border border-white/10 p-3">
            <div className="flex items-start gap-4">
              <div className="w-32 h-44 rounded border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center shrink-0">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-muted text-sm">yok</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="text-xs text-muted">
                  Görsel · dikey (~3:4) karakalem · max 5 MB
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="text-xs text-muted"
                  disabled={uploading}
                />
                {uploading ? (
                  <div className="text-xs text-amber-300">Yükleniyor…</div>
                ) : null}
                {item.imagePath ? (
                  <div className="text-[10px] text-muted/70 break-all">
                    {item.imagePath}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              onClick={onDelete}
              className="text-xs text-red-300 hover:text-red-200"
              disabled={saving || uploading}
            >
              {isNew ? 'İptal' : '🗑 Sil'}
            </button>
            <button
              onClick={onSave}
              disabled={saving || uploading || (!dirty && !isNew)}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor…' : isNew ? 'Oluştur' : 'Kaydet'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
