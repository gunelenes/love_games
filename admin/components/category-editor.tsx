'use client';

import { useEffect, useState } from 'react';
import {
  listDocs,
  removeDoc,
  saveDoc,
} from '@/lib/content-service';
import {
  FLAVORS,
  FLAVOR_LABEL,
  LEVELS,
  LEVEL_LABEL,
  TRACKS,
  TRACK_LABEL,
  type Category,
  type KinkFlavor,
  type Level,
  type Track,
} from '@/lib/types';

type Props = {
  collectionName: 'categories' | 'diceFaces';
  title: string;
  description: string;
};

function newBlank(): Category {
  return {
    id: '',
    name: '',
    nameEn: '',
    color: '#FF4D6D',
    icon: '✨',
    prompts: [''],
    promptsEn: [''],
    track: 'romantik',
    level: 1,
  };
}

export function CategoryEditor({ collectionName, title, description }: Props) {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Category | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listDocs<Category>(collectionName);
      setItems(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName]);

  const markDirty = (id: string) => {
    setDirty((d) => new Set(d).add(id));
  };

  const update = (id: string, patch: Partial<Category>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
    markDirty(id);
  };

  const save = async (item: Category) => {
    if (!item.id.trim()) {
      alert('ID gerekli');
      return;
    }
    setSaving((s) => new Set(s).add(item.id));
    try {
      const clean: Category = {
        ...item,
        prompts: item.prompts.map((p) => p.trim()).filter(Boolean),
        promptsEn: item.promptsEn
          ? // Preserve indices by not filtering empties here. We trim and
            // pad/truncate to match tr length so index-based fallback works.
            item.promptsEn
              .slice(0, item.prompts.filter((p) => p.trim()).length)
              .map((p) => p.trim())
          : undefined,
      };
      await saveDoc(collectionName, clean);
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

  const remove = async (id: string) => {
    if (!confirm(`"${id}" silinsin mi?`)) return;
    await removeDoc(collectionName, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const addNew = () => {
    setNewItem(newBlank());
    setExpanded('__new__');
  };

  const saveNew = async () => {
    if (!newItem) return;
    if (!newItem.id.trim()) {
      alert('ID gerekli (küçük harf, tire ile: örn "cesaret")');
      return;
    }
    if (items.some((i) => i.id === newItem.id)) {
      alert('Bu ID zaten var');
      return;
    }
    const trPrompts = newItem.prompts.map((p) => p.trim()).filter(Boolean);
    const clean: Category = {
      ...newItem,
      prompts: trPrompts,
      promptsEn: newItem.promptsEn
        ? newItem.promptsEn.slice(0, trPrompts.length).map((p) => p.trim())
        : undefined,
    };
    await saveDoc(collectionName, clean);
    setNewItem(null);
    setExpanded(clean.id);
    await load();
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">{title}</h1>
          <p className="text-sm text-muted mt-1">{description}</p>
        </div>
        <button onClick={addNew} className="btn-primary">
          + Yeni
        </button>
      </div>

      {loading ? (
        <div className="text-muted">Yükleniyor…</div>
      ) : (
        <div className="space-y-3">
          {newItem ? (
            <CategoryCard
              item={newItem}
              expanded
              dirty
              saving={false}
              onToggle={() => {}}
              onChange={(patch) => setNewItem({ ...newItem, ...patch })}
              onSave={saveNew}
              onDelete={() => setNewItem(null)}
              isNew
            />
          ) : null}

          {items.map((item) => (
            <CategoryCard
              key={item.id}
              item={item}
              expanded={expanded === item.id}
              dirty={dirty.has(item.id)}
              saving={saving.has(item.id)}
              onToggle={() =>
                setExpanded(expanded === item.id ? null : item.id)
              }
              onChange={(patch) => update(item.id, patch)}
              onSave={() => save(item)}
              onDelete={() => remove(item.id)}
            />
          ))}

          {items.length === 0 && !newItem ? (
            <div className="card text-center text-muted">
              Henüz kayıt yok. "+ Yeni" ile başla.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function CategoryCard({
  item,
  expanded,
  dirty,
  saving,
  onToggle,
  onChange,
  onSave,
  onDelete,
  isNew,
}: {
  item: Category;
  expanded: boolean;
  dirty: boolean;
  saving: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<Category>) => void;
  onSave: () => void;
  onDelete: () => void;
  isNew?: boolean;
}) {
  return (
    <div className="card">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={onToggle}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl border"
          style={{
            backgroundColor: `${item.color}30`,
            borderColor: `${item.color}80`,
          }}
        >
          {item.icon}
        </div>
        <div className="flex-1">
          <div className="text-white font-semibold">
            {item.name || <span className="text-muted italic">isimsiz</span>}
          </div>
          <div className="text-xs text-muted">
            {item.id || '(id yok)'} · {item.prompts.length} prompt
          </div>
        </div>
        {dirty ? (
          <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
            değişti
          </span>
        ) : null}
      </div>

      {expanded ? (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">ID (kalıcı)</label>
              <input
                className="input"
                value={item.id}
                disabled={!isNew}
                onChange={(e) => onChange({ id: e.target.value })}
                placeholder="cesaret"
              />
            </div>
            <div>
              <label className="label">Ad (TR)</label>
              <input
                className="input"
                value={item.name}
                onChange={(e) => onChange({ name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Name (EN)</label>
              <input
                className="input"
                value={item.nameEn ?? ''}
                onChange={(e) => onChange({ nameEn: e.target.value })}
                placeholder="Optional English translation"
              />
            </div>
            <div>
              <label className="label">Renk (hex)</label>
              <div className="flex gap-2">
                <input
                  className="input"
                  value={item.color}
                  onChange={(e) => onChange({ color: e.target.value })}
                />
                <input
                  type="color"
                  value={item.color}
                  onChange={(e) => onChange({ color: e.target.value })}
                  className="w-10 h-10 rounded border border-white/10 bg-transparent"
                />
              </div>
            </div>
            <div>
              <label className="label">Emoji</label>
              <input
                className="input"
                value={item.icon}
                onChange={(e) => onChange({ icon: e.target.value })}
                placeholder="🔥"
              />
            </div>
            <div>
              <label className="label">Track</label>
              <select
                className="input"
                value={item.track}
                onChange={(e) =>
                  onChange({ track: e.target.value as Track })
                }
              >
                {TRACKS.map((t) => (
                  <option key={t} value={t}>
                    {TRACK_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Level</label>
              <select
                className="input"
                value={item.level}
                onChange={(e) =>
                  onChange({ level: Number(e.target.value) as Level })
                }
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {LEVEL_LABEL[item.track][l]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {item.track === 'cesur' && item.level >= 3 ? (
            <div>
              <label className="label">Flavors (opsiyonel)</label>
              <div className="flex flex-wrap gap-2">
                {FLAVORS.map((f) => {
                  const active = item.flavors?.includes(f) ?? false;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        const cur = item.flavors ?? [];
                        const next: KinkFlavor[] = active
                          ? cur.filter((x) => x !== f)
                          : [...cur, f];
                        onChange({ flavors: next });
                      }}
                      className={
                        'px-3 py-1.5 rounded-lg border text-xs font-semibold transition ' +
                        (active
                          ? 'bg-accent/25 border-accent/70 text-white'
                          : 'bg-white/5 border-white/10 text-muted hover:bg-white/10')
                      }
                    >
                      {FLAVOR_LABEL[f]}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div>
            <label className="label">
              Prompt&apos;lar (TR solda, EN sağda — EN boşsa TR fallback)
            </label>
            <div className="space-y-2">
              {item.prompts.map((p, idx) => {
                const en = item.promptsEn?.[idx] ?? '';
                return (
                  <div key={idx} className="flex gap-2">
                    <input
                      className="input flex-1"
                      value={p}
                      onChange={(e) => {
                        const next = [...item.prompts];
                        next[idx] = e.target.value;
                        onChange({ prompts: next });
                      }}
                      placeholder="TR prompt…"
                    />
                    <input
                      className="input flex-1"
                      value={en}
                      onChange={(e) => {
                        const base = item.promptsEn ?? [];
                        const next = [...base];
                        while (next.length <= idx) next.push('');
                        next[idx] = e.target.value;
                        onChange({ promptsEn: next });
                      }}
                      placeholder="EN prompt (optional)"
                    />
                    <button
                      onClick={() => {
                        const nextTr = item.prompts.filter((_, i) => i !== idx);
                        const nextEn = item.promptsEn
                          ? item.promptsEn.filter((_, i) => i !== idx)
                          : undefined;
                        onChange({ prompts: nextTr, promptsEn: nextEn });
                      }}
                      className="btn-ghost text-xs px-2"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              <button
                onClick={() =>
                  onChange({
                    prompts: [...item.prompts, ''],
                    promptsEn: [...(item.promptsEn ?? []), ''],
                  })
                }
                className="btn-ghost text-xs"
              >
                + Prompt ekle
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Kaydediliyor…' : isNew ? 'Oluştur' : 'Kaydet'}
            </button>
            <button onClick={onDelete} className="btn-danger">
              {isNew ? 'İptal' : 'Sil'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
