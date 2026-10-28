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
      : `${formatTanggalIndo(effectiveStart, false)} – ${formatTanggalIndo(effectiveEnd, false)}`;

  const presets = [
    { label: 'Hari Ini', active: isTodayActive, onClick: () => onSelectRange('', '') },
    { label: 'Kemarin', active: isYesterdayActive, onClick: () => onSelectRange(yesterdayStr, yesterdayStr) },
    { label: '7 Hari Terakhir', active: is7DaysActive, onClick: () => onSelectRange(sevenDaysStr, todayStr) },
    { label: 'Bulan Ini', active: isMonthActive, onClick: () => onSelectRange(monthStartStr, todayStr) },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3.5 mb-3.5 border-b border-slate-100">
      <div className="flex items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-100">
          <CalendarDays size={13} />
          <span>Periode: {periodLabel}</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">Pintasan:</span>
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={p.onClick}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              p.active
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
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
      {/* Card 1: Total */}
      <button
        type="button"
        onClick={() => handleToggle('')}
        className={`text-left glass-card p-5 flex flex-col justify-between transition-all cursor-pointer hover:shadow-soft-md ${
          statusFilter === ''
            ? 'ring-2 ring-blue-600/25 border-blue-200'
            : 'opacity-90 hover:opacity-100'
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {totalLabel}
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Users size={16} />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {total.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-semibold text-blue-600">
              Total Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{totalSubtext}</p>
        </div>
      </button>

      {/* Card 2: Tepat Waktu */}
      <button
        type="button"
        onClick={() => handleToggle('ON_TIME')}
        className={`text-left glass-card p-5 flex flex-col justify-between transition-all cursor-pointer hover:shadow-soft-md ${
          statusFilter === 'ON_TIME'
            ? 'ring-2 ring-emerald-500 bg-emerald-50/40 border-emerald-300'
            : ''
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Tepat Waktu
            </span>
            {statusFilter === 'ON_TIME' && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-600 text-white">
                Filter Aktif
              </span>
            )}
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={16} />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-700 tracking-tight">
              {onTime.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-semibold text-emerald-600/80 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
              {pct(onTime, total)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {checkedOut > 0 ? `${checkedOut} pegawai sudah scan pulang` : 'Hadir sesuai jam kerja'}
          </p>
        </div>
      </button>

      {/* Card 3: Terlambat */}
      <button
        type="button"
        onClick={() => handleToggle('LATE')}
        className={`text-left glass-card p-5 flex flex-col justify-between transition-all cursor-pointer hover:shadow-soft-md ${
          statusFilter === 'LATE'
            ? 'ring-2 ring-red-500 bg-red-50/40 border-red-300'
            : ''
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
              Terlambat
            </span>
            {statusFilter === 'LATE' && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-red-600 text-white">
                Filter Aktif
              </span>
            )}
          </div>
          <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
            <Clock size={16} />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-red-600 tracking-tight">
              {late.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-semibold text-red-600/80 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100">
              {pct(late, total)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Lewat batas toleransi masuk</p>
        </div>
      </button>

      {/* Card 4: Tidak / Belum Hadir */}
      <button
        type="button"
        onClick={() => handleToggle('ABSENT')}
        className={`text-left glass-card p-5 flex flex-col justify-between transition-all cursor-pointer hover:shadow-soft-md ${
          statusFilter === 'ABSENT'
            ? 'ring-2 ring-slate-600 bg-slate-100/70 border-slate-300'
            : ''
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Belum / Tidak Hadir
            </span>
            {statusFilter === 'ABSENT' && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-slate-700 text-white">
                Filter Aktif
              </span>
            )}
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <XCircle size={16} />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight">
              {absent.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
              {pct(absent, total)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Tanpa riwayat scan masuk</p>
        </div>
      </button>
    </div>
  );
};

export default AttendanceMetricCards;
