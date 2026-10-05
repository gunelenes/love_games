'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  deleteSubmission,
  listSubmissions,
  updateSubmissionStatus,
  type SubmissionCollection,
} from '@/lib/submissions-service';
import {
  SUBMISSION_STATUSES,
  SUBMISSION_STATUS_LABEL,
  type Submission,
  type SubmissionStatus,
} from '@/lib/types';

type Props = {
  collectionName: SubmissionCollection;
  title: string;
  description: string;
};

const FILTERS: Array<SubmissionStatus | 'all'> = [
  'all',
  ...SUBMISSION_STATUSES,
];

const FILTER_LABEL: Record<SubmissionStatus | 'all', string> = {
  all: '📋 Tümü',
  ...SUBMISSION_STATUS_LABEL,
};

function formatDate(ts: Submission['createdAt']): string {
  if (!ts || typeof ts.seconds !== 'number') return '—';
  const d = new Date(ts.seconds * 1000);
  return d.toLocaleString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SubmissionsViewer({
  collectionName,
  title,
  description,
}: Props) {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SubmissionStatus | 'all'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSubmissions(collectionName);
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'Yükleme hatası');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((it) => (it.status || 'new') === filter);
  }, [items, filter]);

  const counts = useMemo(() => {
    const base: Record<SubmissionStatus | 'all', number> = {
      all: items.length,
      new: 0,
      reviewed: 0,
      implemented: 0,
      rejected: 0,
    };
    for (const it of items) {
      const s = (it.status || 'new') as SubmissionStatus;
      base[s] = (base[s] || 0) + 1;
    }
    return base;
  }, [items]);

  const setStatus = async (id: string, status: SubmissionStatus) => {
    setBusyId(id);
    try {
      await updateSubmissionStatus(collectionName, id, status);
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status } : it))
      );
    } catch (e: any) {
      alert('Durum güncellenemedi: ' + (e?.message || 'bilinmeyen hata'));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Bu gönderiyi kalıcı olarak silmek istediğine emin misin?')) {
      return;
    }
    setBusyId(id);
    try {
      await deleteSubmission(collectionName, id);
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (e: any) {
      alert('Silinemedi: ' + (e?.message || 'bilinmeyen hata'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold text-white">{title}</h1>
        <p className="text-sm text-muted">{description}</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                'px-3 py-1.5 rounded-md text-xs font-semibold border transition ' +
                (active
                  ? 'bg-accent/25 text-white border-accent/50'
                  : 'bg-white/5 text-muted border-white/10 hover:text-white hover:bg-white/10')
              }
            >
              {FILTER_LABEL[f]}
              <span className="ml-1.5 opacity-70">({counts[f]})</span>
            </button>
          );
        })}
        <button
          onClick={() => void refresh()}
          className="ml-auto btn-ghost text-xs"
          disabled={loading}
        >
          {loading ? 'Yükleniyor…' : '🔄 Yenile'}
        </button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          Hata: {error}
        </div>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <div className="rounded-md border border-white/10 bg-white/5 p-8 text-center text-sm text-muted">
          Bu filtrede gönderi yok.
        </div>
      ) : null}

      <div className="space-y-3">
        {filtered.map((item) => (
          <SubmissionCard
            key={item.id}
            item={item}
            busy={busyId === item.id}
            onStatus={(s) => void setStatus(item.id, s)}
            onDelete={() => void remove(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SubmissionCard({
  item,
  busy,
  onStatus,
  onDelete,
}: {
  item: Submission;
  busy: boolean;
  onStatus: (s: SubmissionStatus) => void;
  onDelete: () => void;
}) {
  const currentStatus = (item.status || 'new') as SubmissionStatus;
  return (
    <div
      className={
        'rounded-lg border p-4 space-y-3 transition ' +
        (currentStatus === 'new'
          ? 'border-accent/40 bg-accent/5'
          : 'border-white/10 bg-white/5')
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs text-muted space-x-2">
          <span>🕒 {formatDate(item.createdAt)}</span>
          <span>· 🌐 {item.locale || '—'}</span>
          <span>· 👤 {item.uid.slice(0, 8)}…</span>
        </div>
        <span className="text-xs font-semibold text-white/80">
          {SUBMISSION_STATUS_LABEL[currentStatus]}
        </span>
      </div>

      <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
        {item.text}
      </p>

      <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-white/5">
        {SUBMISSION_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => onStatus(s)}
            disabled={busy || s === currentStatus}
            className={
              'px-2.5 py-1 rounded text-xs font-semibold border transition ' +
              (s === currentStatus
                ? 'bg-white/15 text-white border-white/25 cursor-default'
                : 'bg-white/5 text-muted border-white/10 hover:text-white hover:bg-white/10 disabled:opacity-50')
            }
          >
            {SUBMISSION_STATUS_LABEL[s]}
          </button>
        ))}
        <button
          onClick={onDelete}
          disabled={busy}
          className="ml-auto text-xs text-red-300 hover:text-red-200 px-2 py-1 border border-red-500/30 rounded disabled:opacity-50"
        >
          🗑 Sil
        </button>
      </div>
    </div>
  );
}
