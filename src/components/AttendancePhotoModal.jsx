import { useEffect, useState } from 'react';
import API_BASE from '../config/api';
import { Camera, CheckCircle2, AlertCircle, XCircle, MapPin, Clock, X, Eye, ImageOff, Shield } from 'lucide-react';

const SERVER_BASE = API_BASE.replace(/\/api\/?$/, '');

export const resolvePhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SERVER_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const getInitials = (name) => {
  if (!name) return 'PG';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const formatTanggalIndo = (d, withWeekday = true) => {
  if (!d) return '—';
  try {
    const opts = withWeekday
      ? { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }
      : { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', opts);
  } catch {
    return d;
  }
};

export const EmployeeRoleBadge = ({ role }) => {
  if (role === 'non_asn') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-200/90">
        Non-ASN
      </span>
    );
  }
  if (role === 'admin_opd' || role === 'super_admin') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/90" title="Pegawai ASN dengan hak akses Admin">
        <Shield size={9} />
        ASN • Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 ring-1 ring-blue-200/90">
      ASN
    </span>
  );
};

export const PhotoThumbnail = ({ row, onSelect }) => {
  const [imgError, setImgError] = useState(false);
  const photoPath = row.foto_masuk || row.foto_presensi || row.foto_keluar;
  const fullUrl = resolvePhotoUrl(photoPath);
  const isAbsent = row.status_masuk === 'ABSENT';
  const isNonAsn = row.role === 'non_asn';
  const hasBothPhotos = Boolean(row.foto_masuk && row.foto_keluar);

  if (isAbsent) {
    return (
      <div
        className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100/80 border border-slate-200/70 text-slate-300 text-xs font-bold select-none"
        title="Belum / tidak hadir — belum ada foto bukti"
      >
        —
      </div>
    );
  }

  if (!fullUrl || imgError) {
    return (
      <button
        type="button"
        onClick={() => onSelect(row)}
        title="Presensi tercatat (tanpa lampiran foto) — klik untuk lihat rincian"
        className={`relative inline-flex items-center justify-center w-10 h-10 rounded-xl border text-xs font-extrabold transition-all cursor-pointer shadow-soft-xs ${
          isNonAsn
            ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'
            : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
        }`}
      >
        {getInitials(row.nama)}
        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
          <ImageOff size={9} />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(row)}
      title="Klik untuk memperbesar foto bukti presensi"
      className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden border border-slate-200 hover:border-blue-500 shadow-soft-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
    >
      <img
        src={fullUrl}
        alt={`Bukti presensi ${row.nama}`}
        onError={() => setImgError(true)}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
      />
      <span className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 flex items-center justify-center transition-colors">
        <Eye size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
      {hasBothPhotos && (
        <span
          className="absolute bottom-0.5 right-0.5 px-1 rounded bg-slate-900/75 text-[8px] font-bold text-white leading-tight"
          title="Tersedia foto Masuk & Pulang"
        >
          2
        </span>
      )}
    </button>
  );
};

export const AttendanceProofModal = ({ row, onClose }) => {
  const [activeTab, setActiveTab] = useState(() =>
    row && !row.foto_masuk && row.foto_keluar ? 'OUT' : 'IN'
  );
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!row) return;
    setImgError(false);
    setActiveTab(!row.foto_masuk && row.foto_keluar ? 'OUT' : 'IN');
  }, [row]);

  useEffect(() => {
    if (!row) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [row, onClose]);

  if (!row) return null;

  const activePhotoUrl = resolvePhotoUrl(
    activeTab === 'IN'
      ? (row.foto_masuk || (!row.foto_keluar ? row.foto_presensi : null))
      : (row.foto_keluar || (!row.foto_masuk && row.jam_keluar ? row.foto_presensi : null))
  );

  const isLate = row.status_masuk === 'LATE';
  const idLabel = row.role === 'non_asn' ? 'NIK' : 'NIP';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Bukti presensi ${row.nama}`}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/80">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Bukti Presensi Biometrik
              </span>
              <EmployeeRoleBadge role={row.role} />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 leading-snug truncate mt-1">
              {row.nama}
            </h3>
            <p className="text-xs font-mono text-slate-500 mt-0.5">
              {idLabel}: {row.nip || '—'}
              {row.nama_opd ? ` • ${row.nama_opd}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Switcher Masuk / Pulang */}
        <div className="px-6 pt-4 flex gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('IN'); setImgError(false); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'IN'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Camera size={13} />
            <span>Scan Masuk {row.jam_masuk ? `(${row.jam_masuk})` : ''}</span>
          </button>
          <button
            type="button"
            disabled={!row.jam_keluar && !row.foto_keluar}
            onClick={() => { setActiveTab('OUT'); setImgError(false); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
              !row.jam_keluar && !row.foto_keluar
                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                : activeTab === 'OUT'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20 cursor-pointer'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 cursor-pointer'
            }`}
          >
            <Clock size={13} />
            <span>Scan Pulang {row.jam_keluar ? `(${row.jam_keluar})` : '(Belum)'}</span>
          </button>
        </div>

        {/* Photo Viewport */}
        <div className="p-6">
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center">
            {activePhotoUrl && !imgError ? (
              <img
                src={activePhotoUrl}
                alt={`Foto presensi ${activeTab === 'IN' ? 'masuk' : 'pulang'} ${row.nama}`}
                onError={() => setImgError(true)}
                className="w-full h-full object-contain bg-slate-950"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center px-6 py-8">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white text-xl font-extrabold mb-3">
                  {getInitials(row.nama)}
                </div>
                <p className="text-sm font-bold text-slate-200">
                  File Foto Tidak Tersedia
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                  {activeTab === 'OUT' && !row.jam_keluar
                    ? 'Pegawai belum melakukan scan pulang pada tanggal ini.'
                    : 'Transaksi presensi tercatat valid di database sebelum fitur penyimpanan foto WebP diaktifkan.'}
                </p>
              </div>
            )}
          </div>

          {/* Structured Metadata */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Tanggal Tugas
              </span>
              <span className="font-bold text-slate-800 mt-0.5 block">
                {formatTanggalIndo(row.tanggal)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Status Kehadiran
              </span>
              <span className={`font-bold mt-0.5 inline-flex items-center gap-1 ${
                isLate ? 'text-red-600' : 'text-emerald-700'
              }`}>
                {isLate ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                {isLate
                  ? `Terlambat (${row.keterlambatan_menit || 0} mnt)`
                  : 'Tepat Waktu'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Waktu Masuk / Pulang
              </span>
              <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                {row.jam_masuk || '—'} / {row.jam_keluar || '—'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Lokasi Mesin Kiosk
              </span>
              <span className="font-bold text-slate-800 mt-0.5 flex items-center gap-1 truncate" title={row.nama_lokasi || row.device_sn || '—'}>
                <MapPin size={12} className="text-blue-600 shrink-0" />
                <span className="truncate">{row.nama_lokasi || row.device_sn || '—'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
