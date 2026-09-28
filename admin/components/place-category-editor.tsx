'use client';

import { useEffect, useState } from 'react';
import { listDocs, removeDoc, saveDoc } from '@/lib/content-service';
import type { Place, PlaceCategory } from '@/lib/types';

function newBlank(): PlaceCategory {
  return {
    id: '',
    name: '',
    color: '#4CAF50',
    icon: '📍',
    places: [{ name: '', description: '' }],
  };
}

export function PlaceCategoryEditor() {
  const [items, setItems] = useState<PlaceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<PlaceCategory | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await listDocs<PlaceCategory>('placeCategories'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const markDirty = (id: string) =>
    setDirty((d) => new Set(d).add(id));

  const update = (id: string, patch: Partial<PlaceCategory>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
    markDirty(id);
  };

  const cleanPlaces = (places: Place[]): Place[] =>
    places
      .map((p) => ({
        name: p.name.trim(),
        description: (p.description || '').trim() || undefined,
        image: p.image?.trim() || undefined,
      }))
      .filter((p) => p.name.length > 0);

  const save = async (item: PlaceCategory) => {
    if (!item.id.trim()) return alert('ID gerekli');
    setSaving((s) => new Set(s).add(item.id));
    try {
      const clean: PlaceCategory = {
        ...item,
        places: cleanPlaces(item.places),
      };
      await saveDoc('placeCategories', clean);
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
    await removeDoc('placeCategories', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const addNew = () => {
    setNewItem(newBlank());
    setExpanded('__new__');
  };

  const saveNew = async () => {
    if (!newItem) return;
    if (!newItem.id.trim()) return alert('ID gerekli');
    if (items.some((i) => i.id === newItem.id))
      return alert('Bu ID zaten var');
    const clean: PlaceCategory = {
      ...newItem,
      places: cleanPlaces(newItem.places),
    };
    await saveDoc('placeCategories', clean);
    setNewItem(null);
    setExpanded(clean.id);
    await load();
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Place Categories</h1>
          <p className="text-sm text-muted mt-1">
            Zar oyunundaki mekan zarı — 6 kategori, her birinde spesifik mekan
            önerileri.
          </p>
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
            <PCCard
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
            <PCCard
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
              Henüz mekan kategorisi yok.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function PCCard({
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
  item: PlaceCategory;
  expanded: boolean;
  dirty: boolean;
  saving: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<PlaceCategory>) => void;
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
            {item.id || '(id yok)'} · {item.places.length} mekan
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
              <label className="label">ID</label>
              <input
                className="input"
                value={item.id}
                disabled={!isNew}
                onChange={(e) => onChange({ id: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Ad</label>
              <input
                className="input"
                value={item.name}
                onChange={(e) => onChange({ name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Renk</label>
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
                  className="w-10 h-10 rounded"
                />
              </div>
            </div>
            <div>
              <label className="label">Emoji</label>
              <input
                className="input"
                value={item.icon}
                onChange={(e) => onChange({ icon: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Mekanlar</label>
            <div className="space-y-3">
              {item.places.map((p, idx) => (
                <div
                  key={idx}
                  className="border border-white/10 rounded-lg p-3 space-y-2"
                >
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        className="input"
                        value={p.name}
                        onChange={(e) => {
                          const next = [...item.places];
                          next[idx] = { ...p, name: e.target.value };
                          onChange({ places: next });
                        }}
                        placeholder="Mekan adı"
                      />
                      <input
                        className="input"
                        value={p.description || ''}
                        onChange={(e) => {
                          const next = [...item.places];
                          next[idx] = { ...p, description: e.target.value };
                          onChange({ places: next });
                        }}
                        placeholder="Açıklama (opsiyonel)"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const next = item.places.filter((_, i) => i !== idx);
                        onChange({ places: next });
                      }}
                      className="btn-ghost text-xs px-2"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() =>
                  onChange({
                    places: [...item.places, { name: '', description: '' }],
                  })
                }
                className="btn-ghost text-xs"
              >
                + Mekan ekle
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
