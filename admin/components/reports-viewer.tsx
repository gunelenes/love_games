'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  deleteReport,
  ejectUser,
  inspectRoom,
  listReports,
  removeUserNotes,
  setReportStatus,
  type RoomState,
} from '@/lib/reports-service';
import {
  REPORT_REASON_LABEL,
  REPORT_STATUSES,
  REPORT_STATUS_LABEL,
  type Report,
  type ReportStatus,
} from '@/lib/types';

const FILTERS: Array<ReportStatus | 'all'> = ['new', 'actioned', 'dismissed', 'all'];
const FILTER_LABEL: Record<ReportStatus | 'all', string> = {
  all: '📋 Tümü',
  ...REPORT_STATUS_LABEL,
};

function formatDate(ts: Report['createdAt']): string {
  if (!ts || typeof ts.seconds !== 'number') return '—';
  return new Date(ts.seconds * 1000).toLocaleString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Hours since the report came in; App Review expects action within 24h. */
function ageHours(ts: Report['createdAt']): number | null {
  if (!ts || typeof ts.seconds !== 'number') return null;
  return Math.floor((Date.now() / 1000 - ts.seconds) / 3600);
}

export function ReportsViewer() {
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReportStatus | 'all'>('new');

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listReports());
    } catch (e: any) {
      setError(e?.message || 'Yükleme hatası');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const counts = useMemo(() => {
    const base: Record<ReportStatus | 'all', number> = { all: items.length, new: 0, actioned: 0, dismissed: 0 };
    for (const it of items) base[it.status] = (base[it.status] || 0) + 1;
    return base;
  }, [items]);

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((it) => it.status === filter)),
    [items, filter]
  );

  const patch = (id: string, status: ReportStatus) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold text-white">Şikâyetler</h1>
        <p className="text-sm text-muted">
          Kutular&apos;dan gelen not / partner şikâyetleri. Kullanıcılara ve App Review&apos;a 24 saat
          içinde inceleme sözü verildi — yeni şikâyetleri bekletme.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              'px-3 py-1.5 rounded-md text-xs font-semibold border transition ' +
              (filter === f
                ? 'bg-accent/25 text-white border-accent/50'
                : 'bg-white/5 text-muted border-white/10 hover:text-white hover:bg-white/10')
            }
          >
            {FILTER_LABEL[f]}
            <span className="ml-1.5 opacity-70">({counts[f]})</span>
          </button>
        ))}
        <button onClick={() => void refresh()} className="ml-auto btn-ghost text-xs" disabled={loading}>
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
          Bu filtrede şikâyet yok.
        </div>
      ) : null}

      <div className="space-y-3">
        {filtered.map((item) => (
          <ReportCard
            key={item.id}
            item={item}
            onStatus={(s) => patch(item.id, s)}
            onDeleted={() => setItems((prev) => prev.filter((it) => it.id !== item.id))}
          />
        ))}
      </div>
    </div>
  );
}

function ReportCard({
  item,
  onStatus,
  onDeleted,
}: {
  item: Report;
  onStatus: (s: ReportStatus) => void;
  onDeleted: () => void;
}) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string | null>(null);
  const hours = ageHours(item.createdAt);
  const overdue = item.status === 'new' && hours !== null && hours >= 24;

  useEffect(() => {
    inspectRoom(item.roomCode, item.reportedUid)
      .then(setRoom)
      .catch(() => setRoom(null));
  }, [item.roomCode, item.reportedUid]);

  const role =
    !room?.exists || !item.reportedUid
      ? null
      : room.guestUid === item.reportedUid
        ? 'misafir'
        : room.hostUid === item.reportedUid
          ? 'ev sahibi'
          : 'odada değil';

  const run = async (label: string, fn: () => Promise<string>) => {
    setBusy(true);
    setLog(null);
    try {
      const msg = await fn();
      setLog(`✓ ${msg}`);
      await setReportStatus(item.id, 'actioned');
      onStatus('actioned');
      setRoom(await inspectRoom(item.roomCode, item.reportedUid));
    } catch (e: any) {
      setLog(`${label} başarısız: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  const status = async (s: ReportStatus) => {
    setBusy(true);
    try {
      await setReportStatus(item.id, s);
      onStatus(s);
    } catch (e: any) {
      alert('Durum güncellenemedi: ' + (e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm('Bu şikâyet kaydı kalıcı olarak silinsin mi?')) return;
    setBusy(true);
    try {
      await deleteReport(item.id);
      onDeleted();
    } catch (e: any) {
      alert('Silinemedi: ' + (e?.message || e));
      setBusy(false);
    }
  };

  return (
    <div
      className={
        'rounded-lg border p-4 space-y-3 ' +
        (item.status === 'new' ? 'border-red-400/40 bg-red-500/5' : 'border-white/10 bg-white/5')
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="text-xs text-muted space-x-2">
          <span>🕒 {formatDate(item.createdAt)}</span>
          {hours !== null ? (
            <span className={overdue ? 'text-red-300 font-semibold' : ''}>· {hours} sa önce</span>
          ) : null}
          <span>· 🌐 {item.locale || '—'}</span>
          <span>· 🏠 {item.roomCode}</span>
        </div>
        <span className="text-xs font-semibold text-white/80">{REPORT_STATUS_LABEL[item.status]}</span>
      </div>

      <div className="text-sm font-semibold text-white">{REPORT_REASON_LABEL[item.reason] ?? item.reason}</div>

      {item.noteText ? (
        <blockquote className="text-sm text-white/90 whitespace-pre-wrap border-l-2 border-red-300/50 pl-3 italic">
          {item.noteText}
        </blockquote>
      ) : (
        <div className="text-xs text-muted">Genel şikâyet (belirli bir not yok)</div>
      )}
      {item.details ? (
        <p className="text-sm text-muted whitespace-pre-wrap">Açıklama: {item.details}</p>
      ) : null}

      <div className="text-xs text-muted space-x-2">
        <span>Şikâyet eden: {item.uid.slice(0, 8)}…</span>
        <span>
          · Şikâyet edilen: {item.reportedUid ? `${item.reportedUid.slice(0, 8)}…` : '—'}
          {role ? ` (${role})` : ''}
          {room?.blocked ? ' · 🚫 engelli' : ''}
        </span>
        {room && !room.exists ? <span>· oda artık yok</span> : null}
      </div>

      <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-white/5">
        {item.reportedUid && room?.exists ? (
          <>
            <button
              disabled={busy}
              onClick={() =>
                void run('Not silme', async () => {
                  const n = await removeUserNotes(item.roomCode, item.reportedUid!);
                  return `${n} not silindi`;
                })
              }
              className="px-2.5 py-1 rounded text-xs font-semibold border border-amber-400/40 text-amber-200 hover:bg-amber-400/10 disabled:opacity-50"
            >
              🧹 Kişinin notlarını sil
            </button>
            <button
              disabled={busy || room.blocked}
              onClick={() => {
                if (!confirm('Kişi odadan çıkarılıp engellensin mi? Notları da silinir.')) return;
                void run('Çıkarma', async () => {
                  const n = await removeUserNotes(item.roomCode, item.reportedUid!);
                  const who = await ejectUser(item.roomCode, item.reportedUid!);
                  return who === 'host'
                    ? `ev sahibi çıkarıldı, oda partnere devredildi, ${n} not silindi`
                    : `kişi odadan çıkarıldı ve engellendi, ${n} not silindi`;
                });
              }}
              className="px-2.5 py-1 rounded text-xs font-semibold border border-red-400/50 text-red-200 hover:bg-red-500/10 disabled:opacity-50"
            >
              ⛔ Odadan çıkar + engelle
            </button>
          </>
        ) : null}
        {REPORT_STATUSES.filter((s) => s !== item.status).map((s) => (
          <button
            key={s}
            disabled={busy}
            onClick={() => void status(s)}
            className="px-2.5 py-1 rounded text-xs font-semibold border bg-white/5 text-muted border-white/10 hover:text-white hover:bg-white/10 disabled:opacity-50"
          >
            {REPORT_STATUS_LABEL[s]}
          </button>
        ))}
        <button
          onClick={() => void remove()}
          disabled={busy}
          className="ml-auto text-xs text-red-300 hover:text-red-200 px-2 py-1 border border-red-500/30 rounded disabled:opacity-50"
        >
          🗑 Sil
        </button>
      </div>
      {log ? <div className="text-xs text-white/80">{log}</div> : null}
    </div>
  );
}
