import { useEffect, useState } from 'react';
import API_BASE from '../config/api';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  X,
  Eye,
  ImageOff,
  Shield,
  Moon,
} from 'lucide-react';
import { useModalEscape } from './UiFeedback';

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
  if (!d) return '-';
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
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
        Non-ASN
      </span>
    );
  }
  if (role === 'admin_opd' || role === 'super_admin') {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300"
        title="Pegawai ASN dengan hak akses Admin"
      >
        <Shield size={10} />
        ASN / Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
      ASN
    </span>
  );
};

export const ShiftBadge = ({ row }) => {
  if (!row || !row.nama_shift) return null;
  const isNight = Boolean(row.is_lintas_hari) || (row.nama_shift || '').toLowerCase().includes('malam');
  return (
    <span
      title={`Shift: ${row.nama_shift}${row.jam_baku ? ` (${row.jam_baku})` : ''}${row.shift_source === 'ROSTER' ? ' - Jadwal Roster' : ''}`}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
        isNight
          ? 'bg-slate-800 text-white border-slate-700'
          : row.shift_source === 'ROSTER'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-slate-100 text-slate-700 border-slate-300'
      }`}
    >
      <Clock size={10} />
      <span className="truncate max-w-[130px]">{row.nama_shift}</span>
      {row.is_lintas_hari && <Moon size={10} aria-label="Shift lintas hari" />}
    </span>
  );
};

export const CheckoutStatusBadge = ({ row }) => {
  if (!row || row.status_masuk === 'ABSENT') {
    return <span className="text-slate-600 font-mono">-</span>;
  }
  if (row.status_keluar === 'DINAS_LUAR' || row.is_dinas_luar) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200"
        title={row.keterangan_jadwal || 'Hadir pada Kegiatan Dinas Luar'}
      >
        <CheckCircle2 size={12} /> Dinas Luar
      </span>
    );
  }
  if (row.status_keluar === 'MISSING_OUT') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-800 border border-red-200"
        title="Melewati batas akhir scan pulang shift"
      >
        <AlertCircle size={12} /> Tanpa Scan Pulang
      </span>
    );
  }
  if (row.jam_keluar) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 size={12} /> Sudah Pulang
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
      <Clock size={12} /> Belum Pulang
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
        className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-slate-100 border border-slate-300 text-slate-600 text-xs font-bold select-none"
        title="Belum atau tidak hadir: tidak ada foto bukti"
      >
        -
      </div>
    );
  }

  if (!fullUrl || imgError) {
    return (
      <button
        type="button"
        onClick={() => onSelect(row)}
        title="Presensi tercatat tanpa lampiran foto. Klik untuk melihat rincian."
        aria-label={`Lihat rincian presensi ${row.nama} (tanpa lampiran foto)`}
        className={`relative inline-flex items-center justify-center min-h-[44px] min-w-[44px] w-11 h-11 rounded-lg border text-xs font-extrabold transition-colors ${
          isNonAsn
            ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
            : 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-800'
        }`}
      >
        {getInitials(row.nama)}
        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-md bg-white border border-slate-400 flex items-center justify-center text-slate-600">
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
      aria-label={`Perbesar foto bukti presensi ${row.nama}`}
      className="group relative inline-flex items-center justify-center min-h-[44px] min-w-[44px] w-11 h-11 rounded-lg overflow-hidden border border-slate-400 hover:border-blue-700 transition-colors"
    >
      <img
        src={fullUrl}
        alt={`Bukti presensi ${row.nama}`}
        width="44"
        height="44"
        loading="lazy"
        onError={() => setImgError(true)}
        className="w-full h-full object-cover"
      />
      <span className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/45 flex items-center justify-center transition-colors">
        <Eye size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
      {hasBothPhotos && (
        <span
          className="absolute bottom-0.5 right-0.5 px-1 rounded bg-slate-900/85 text-[9px] font-bold text-white leading-tight tabular-nums"
          title="Tersedia foto Masuk dan Pulang"
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

  useModalEscape(Boolean(row), onClose);

  if (!row) return null;

  const activePhotoUrl = resolvePhotoUrl(
    activeTab === 'IN'
      ? row.foto_masuk || (!row.foto_keluar ? row.foto_presensi : null)
      : row.foto_keluar || (!row.foto_masuk && row.jam_keluar ? row.foto_presensi : null)
  );

  const isLate = row.status_masuk === 'LATE';
  const idLabel = row.role === 'non_asn' ? 'NIK' : 'NIP';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Bukti presensi ${row.nama}`}
    >
      <div
        className="surface-modal w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3 bg-slate-50">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                Bukti Presensi Biometrik
              </span>
              <EmployeeRoleBadge role={row.role} />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 leading-snug truncate mt-1">
              {row.nama}
            </h3>
            <p className="text-xs font-mono text-slate-600 mt-0.5 tabular-nums">
              {idLabel}: {row.nip || '-'}
              {row.nama_opd ? ` | ${row.nama_opd}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau bukti presensi"
            className="gov-icon-btn text-slate-600 hover:text-slate-900 hover:bg-slate-200 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Pemilih Sesi Masuk / Pulang */}
        <div className="px-5 pt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('IN');
              setImgError(false);
            }}
            className={`flex-1 min-h-[44px] py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 tabular-nums ${
              activeTab === 'IN'
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-white text-slate-700 border-slate-400 hover:bg-slate-100'
            }`}
          >
            <Camera size={14} />
            <span>Scan Masuk {row.jam_masuk ? `(${row.jam_masuk})` : ''}</span>
          </button>
          <button
            type="button"
            disabled={!row.jam_keluar && !row.foto_keluar}
            onClick={() => {
              setActiveTab('OUT');
              setImgError(false);
            }}
            className={`flex-1 min-h-[44px] py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 tabular-nums ${
              !row.jam_keluar && !row.foto_keluar
                ? 'bg-slate-100 text-slate-500 border-slate-300 opacity-70'
                : activeTab === 'OUT'
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-slate-700 border-slate-400 hover:bg-slate-100'
            }`}
          >
            <Clock size={14} />
            <span>Scan Pulang {row.jam_keluar ? `(${row.jam_keluar})` : '(Belum)'}</span>
          </button>
        </div>

        {/* Bingkai Foto */}
        <div className="p-5">
          <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-900 border border-slate-300 flex items-center justify-center">
            {activePhotoUrl && !imgError ? (
              <img
                src={activePhotoUrl}
                alt={`Foto presensi ${activeTab === 'IN' ? 'masuk' : 'pulang'} ${row.nama}`}
                width="640"
                height="480"
                onError={() => setImgError(true)}
                className="w-full h-full object-contain bg-slate-950"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center px-6 py-8">
                <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white text-xl font-extrabold mb-3">
                  {getInitials(row.nama)}
                </div>
                <p className="text-sm font-bold text-white">File Foto Tidak Tersedia</p>
                <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
                  {activeTab === 'OUT' && !row.jam_keluar
                    ? 'Pegawai belum melakukan scan pulang pada tanggal tugas ini.'
                    : 'Transaksi presensi tercatat di database tanpa lampiran foto tangkapan kamera.'}
                </p>
              </div>
            )}
          </div>

          {/* Metadata Rincian */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-300">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                Tanggal Tugas
              </span>
              <span className="font-bold text-slate-900 mt-0.5 block tabular-nums">
                {formatTanggalIndo(row.tanggal)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-300">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                Status Kehadiran
              </span>
              <span
                className={`font-bold mt-0.5 inline-flex items-center gap-1 tabular-nums ${
                  isLate ? 'text-red-700' : 'text-emerald-800'
                }`}
              >
                {isLate ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                {isLate ? `Terlambat (${row.keterlambatan_menit || 0} menit)` : 'Tepat Waktu'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-300">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                Waktu Masuk / Pulang
              </span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block tabular-nums">
                {row.jam_masuk || '-'} / {row.jam_keluar || '-'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-300">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                Lokasi Perangkat Kiosk
              </span>
              <span
                className="font-bold text-slate-900 mt-0.5 flex items-center gap-1 truncate"
                title={row.nama_lokasi || row.device_sn || '-'}
              >
                <MapPin size={12} className="text-blue-700 shrink-0" />
                <span className="truncate">{row.nama_lokasi || row.device_sn || '-'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
