import { Users, CheckCircle2, Clock, XCircle, CalendarDays } from 'lucide-react';
import { formatTanggalIndo } from './AttendancePhotoModal';

export const getLocalDateStr = (dateObj = new Date()) => {
  const yr = dateObj.getFullYear();
  const mo = String(dateObj.getMonth() + 1).padStart(2, '0');
  const da = String(dateObj.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${da}`;
};

export const DatePresetBar = ({ startDate, endDate, onSelectRange }) => {
  const today = new Date();
  const todayStr = getLocalDateStr(today);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = getLocalDateStr(yesterday);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const sevenDaysStr = getLocalDateStr(sevenDaysAgo);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStartStr = getLocalDateStr(monthStart);

  const isTodayActive = (!startDate && !endDate) || (startDate === todayStr && endDate === todayStr);
  const isYesterdayActive = startDate === yesterdayStr && endDate === yesterdayStr;
  const is7DaysActive = startDate === sevenDaysStr && endDate === todayStr;
  const isMonthActive = startDate === monthStartStr && endDate === todayStr;

  const effectiveStart = startDate || todayStr;
  const effectiveEnd = endDate || todayStr;
  const periodLabel =
    effectiveStart === effectiveEnd
      ? formatTanggalIndo(effectiveStart, true)
      : `${formatTanggalIndo(effectiveStart, false)} s.d. ${formatTanggalIndo(effectiveEnd, false)}`;

  const presets = [
    { label: 'Hari Ini', active: isTodayActive, onClick: () => onSelectRange('', '') },
    { label: 'Kemarin', active: isYesterdayActive, onClick: () => onSelectRange(yesterdayStr, yesterdayStr) },
    { label: '7 Hari Terakhir', active: is7DaysActive, onClick: () => onSelectRange(sevenDaysStr, todayStr) },
    { label: 'Bulan Ini', active: isMonthActive, onClick: () => onSelectRange(monthStartStr, todayStr) },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-[#DCE3EC]">
      <div className="flex items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 font-bold border border-blue-200 tabular-nums">
          <CalendarDays size={14} aria-hidden="true" />
          <span>Periode: {periodLabel}</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Pintasan rentang tanggal">
        <span className="text-xs font-semibold text-slate-600 mr-1 hidden sm:inline">Pintasan:</span>
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            aria-pressed={p.active}
            onClick={p.onClick}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-bold border transition-all duration-150 ${
              p.active
                ? 'bg-[#0B1120] text-white border-[#0B1120] shadow-soft-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-[#64748B]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const pct = (part, total) => {
  if (!total || total <= 0) return '0%';
  return `${Math.round((part / total) * 100)}%`;
};

const AttendanceMetricCards = ({
  summary,
  statusFilter,
  onSelectStatus,
  totalLabel = 'Total Rekap Presensi',
  totalSubtext = 'Seluruh pegawai sesuai filter',
}) => {
  const total = summary?.total ?? 0;
  const onTime = summary?.on_time ?? 0;
  const late = summary?.late ?? 0;
  const absent = summary?.absent ?? 0;
  const checkedOut = summary?.checked_out ?? 0;

  const handleToggle = (targetStatus) => {
    if (!onSelectStatus) return;
    if (targetStatus === '') {
      onSelectStatus('');
    } else {
      onSelectStatus(statusFilter === targetStatus ? '' : targetStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Kartu Utama (Anchor): Total Rekap */}
      <button
        type="button"
        aria-pressed={statusFilter === ''}
        onClick={() => handleToggle('')}
        className={`text-left rounded-2xl p-5 flex flex-col justify-between bg-[#0B1120] text-white border transition-all duration-150 shadow-card hover:border-blue-400 ${
          statusFilter === ''
            ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2 ring-offset-[#F3F6FA]'
            : 'border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between w-full gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
            {totalLabel}
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
            <Users size={17} aria-hidden="true" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-extrabold text-white tracking-tight tabular-nums">
              {total.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-bold text-blue-300">Total Data</span>
          </div>
          <p className="text-xs text-slate-300 mt-1">{totalSubtext}</p>
        </div>
      </button>

      {/* Kartu 2: Tepat Waktu */}
      <button
        type="button"
        aria-pressed={statusFilter === 'ON_TIME'}
        onClick={() => handleToggle('ON_TIME')}
        className={`text-left surface-card p-5 flex flex-col justify-between transition-all duration-150 hover:border-emerald-600 hover:shadow-soft-sm ${
          statusFilter === 'ON_TIME' ? 'border-emerald-700 ring-2 ring-emerald-700 bg-emerald-50/40' : ''
        }`}
      >
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Tepat Waktu
            </span>
            {statusFilter === 'ON_TIME' && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-700 text-white">
                Aktif
              </span>
            )}
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircle2 size={16} aria-hidden="true" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-800 tracking-tight tabular-nums">
              {onTime.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 tabular-nums">
              {pct(onTime, total)}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 tabular-nums">
            {checkedOut > 0 ? `${checkedOut.toLocaleString('id-ID')} pegawai sudah scan pulang` : 'Hadir sesuai jam kerja'}
          </p>
        </div>
      </button>

      {/* Kartu 3: Terlambat */}
      <button
        type="button"
        aria-pressed={statusFilter === 'LATE'}
        onClick={() => handleToggle('LATE')}
        className={`text-left surface-card p-5 flex flex-col justify-between transition-all duration-150 hover:border-red-600 hover:shadow-soft-sm ${
          statusFilter === 'LATE' ? 'border-red-700 ring-2 ring-red-700 bg-red-50/40' : ''
        }`}
      >
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-800">
              Terlambat
            </span>
            {statusFilter === 'LATE' && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-red-700 text-white">
                Aktif
              </span>
            )}
          </div>
          <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-700 shrink-0">
            <Clock size={16} aria-hidden="true" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-red-700 tracking-tight tabular-nums">
              {late.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-bold text-red-800 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-200 tabular-nums">
              {pct(late, total)}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">Melewati batas toleransi masuk</p>
        </div>
      </button>

      {/* Kartu 4: Belum / Tidak Hadir */}
      <button
        type="button"
        aria-pressed={statusFilter === 'ABSENT'}
        onClick={() => handleToggle('ABSENT')}
        className={`text-left surface-card p-5 flex flex-col justify-between transition-all duration-150 hover:border-slate-700 hover:shadow-soft-sm ${
          statusFilter === 'ABSENT' ? 'border-slate-800 ring-2 ring-slate-800 bg-slate-100' : ''
        }`}
      >
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Belum / Tidak Hadir
            </span>
            {statusFilter === 'ABSENT' && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-white">
                Aktif
              </span>
            )}
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 shrink-0">
            <XCircle size={16} aria-hidden="true" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {absent.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-300 tabular-nums">
              {pct(absent, total)}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">Tanpa riwayat scan masuk</p>
        </div>
      </button>
    </div>
  );
};

export default AttendanceMetricCards;
