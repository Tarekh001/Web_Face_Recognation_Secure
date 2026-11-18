import { useEffect, useState, useCallback, useId } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config/api';
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileSpreadsheet,
  Users,
  RotateCcw,
  Camera,
  Building2,
  CalendarDays,
  Loader2,
} from 'lucide-react';
import AttendanceMetricCards, { DatePresetBar } from './AttendanceMetricCards';
import {
  PhotoThumbnail,
  AttendanceProofModal,
  EmployeeRoleBadge,
  ShiftBadge,
  CheckoutStatusBadge,
  formatTanggalIndo,
} from './AttendancePhotoModal';
import { TableLoadingRow, TableErrorRow, notifyAlert } from './UiFeedback';

const toTitleCase = (str) => {
  if (!str) return '-';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const SpotSyncPill = ({ row }) => {
  if (!row || !row.jam_masuk) return null;
  const st = (row.spot_sync_status || 'pending').toLowerCase();
  const tooltip = [
    row.spot_response ? `Respons SPOT: ${row.spot_response}` : null,
    row.spot_synced_at ? `Waktu Kirim: ${row.spot_synced_at}` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  if (st === 'synced') {
    return (
      <span
        title={tooltip || 'Log presensi ASN telah diterima oleh server SPOT'}
        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded-md whitespace-nowrap"
      >
        <CheckCircle2 size={11} aria-hidden="true" />
        <span>Terkirim SPOT</span>
      </span>
    );
  }
  if (st === 'failed') {
    return (
      <span
        title={tooltip || 'Pengiriman ke server SPOT tertunda atau gagal'}
        className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-50 border border-red-300 px-1.5 py-0.5 rounded-md whitespace-nowrap"
      >
        <AlertCircle size={11} aria-hidden="true" />
        <span>Gagal SPOT</span>
      </span>
    );
  }
  return (
    <span
      title={tooltip || 'Menunggu antrean pengiriman Cron Job ke server SPOT'}
      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded-md whitespace-nowrap"
    >
      <Clock size={11} aria-hidden="true" />
      <span>Menunggu SPOT</span>
    </span>
  );
};

const DailyAttendanceReportView = ({
  fixedRole = '', // '' | 'asn' | 'non_asn'
  totalLabel = 'Total Rekap Presensi',
  totalSubtextDefault = 'Seluruh ASN & Non-ASN',
  personColumnTitle = 'Pegawai',
  searchLabel = 'Pencarian Pegawai',
  searchPlaceholder = 'Cari NIP, NIK, atau Nama...',
  emptyTitle = 'Tidak ada data presensi ditemukan',
  dataUnitLabel = 'data',
  csvFilenamePrefix = 'Laporan_Presensi',
  showKegiatanShortcut = false,
}) => {
  const uid = useId();
  const userRole = localStorage.getItem('user_role');
  const isSuperAdmin = userRole === 'super_admin';

  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({ total: 0, on_time: 0, late: 0, absent: 0, checked_out: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedOpdId, setSelectedOpdId] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [opdList, setOpdList] = useState([]);
  const [shiftList, setShiftList] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedProofRow, setSelectedProofRow] = useState(null);

  const effectiveRole = fixedRole || roleFilter;

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    axios
      .get(`${API_BASE}/jam-kerja`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setShiftList(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch(() => {});
    if (!isSuperAdmin) return;
    axios
      .get(`${API_BASE}/opd`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setOpdList(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch(() => {});
  }, [isSuperAdmin]);

  const fetchReports = useCallback(async (silent = false) => {
    const token = localStorage.getItem('access_token');
    if (!silent) setIsLoading(true);
    setErrorMsg('');
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (searchQuery) params.search_name = searchQuery;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (statusFilter) params.status_filter = statusFilter;
      if (effectiveRole) params.role = effectiveRole;
      if (selectedShiftId) params.jam_kerja_id = selectedShiftId;
      if (isSuperAdmin && selectedOpdId) params.opd_id = selectedOpdId;

      const res = await axios.get(`${API_BASE}/report`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(res.data)) {
        const arr = res.data;
        setReports(arr);
        setTotalPages(1);
        setTotalItems(arr.length);
        setSummary({
          total: arr.length,
          on_time: arr.filter((r) => r.status_masuk === 'ON_TIME').length,
          late: arr.filter((r) => r.status_masuk === 'LATE').length,
          absent: arr.filter((r) => r.status_masuk === 'ABSENT').length,
          checked_out: arr.filter((r) => Boolean(r.jam_keluar)).length,
        });
      } else {
        const rows = res.data.data || [];
        setReports(rows);
        setTotalPages(res.data.total_pages || 1);
        setTotalItems(res.data.total_records || 0);
        if (res.data.summary) {
          setSummary(res.data.summary);
        } else {
          setSummary({
            total: res.data.total_records || rows.length,
            on_time: rows.filter((r) => r.status_masuk === 'ON_TIME').length,
            late: rows.filter((r) => r.status_masuk === 'LATE').length,
            absent: rows.filter((r) => r.status_masuk === 'ABSENT').length,
            checked_out: rows.filter((r) => Boolean(r.jam_keluar)).length,
          });
        }
      }
    } catch (err) {
      console.error('Gagal mengambil laporan presensi:', err);
      setErrorMsg(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Gagal memuat data laporan presensi dari server. Periksa koneksi jaringan lalu coba kembali.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    searchQuery,
    startDate,
    endDate,
    statusFilter,
    effectiveRole,
    selectedShiftId,
    isSuperAdmin,
    selectedOpdId,
  ]);

  useEffect(() => {
    fetchReports(false);
    const interval = setInterval(() => fetchReports(true), 30000);
    return () => clearInterval(interval);
  }, [fetchReports]);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const handleSelectDateRange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1);
  };

  const handleSelectStatusFromCard = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    if (!fixedRole) setRoleFilter('');
    setSelectedShiftId('');
    setSelectedOpdId('');
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleExportCSV = async () => {
    if (totalItems === 0) {
      return notifyAlert({
        icon: 'warning',
        title: 'Data Kosong',
        text: 'Tidak ada data presensi yang dapat diekspor untuk filter saat ini.',
      });
    }
    setIsExporting(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = { page: 1, limit: 99999 };
      if (searchQuery) params.search_name = searchQuery;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (statusFilter) params.status_filter = statusFilter;
      if (effectiveRole) params.role = effectiveRole;
      if (selectedShiftId) params.jam_kerja_id = selectedShiftId;
      if (isSuperAdmin && selectedOpdId) params.opd_id = selectedOpdId;

      const res = await axios.get(`${API_BASE}/report`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      const allData = Array.isArray(res.data) ? res.data : res.data.data || [];
      if (allData.length === 0) {
        return notifyAlert({
          icon: 'warning',
          title: 'Data Kosong',
          text: 'Tidak ada data presensi yang dapat diekspor.',
        });
      }

      const idColHeader = fixedRole === 'asn' ? 'NIP' : fixedRole === 'non_asn' ? 'NIK' : 'NIP/NIK';
      let csv = `\uFEFF${idColHeader},Tipe Pegawai,Nama,Instansi OPD,Tanggal,Jam Masuk,Status Masuk,Keterlambatan (Menit),Jam Pulang,Status Pulang,Lokasi Kiosk\n`;
      allData.forEach((r) => {
        const statusMasukLabel =
          r.status_masuk === 'ABSENT'
            ? 'Tidak Hadir'
            : r.status_masuk === 'LATE'
              ? `Terlambat (${r.keterlambatan_menit || 0} Menit)`
              : 'Tepat Waktu';
        const statusPulangLabel =
          r.status_masuk === 'ABSENT'
            ? '-'
            : r.jam_keluar
              ? 'Sudah Pulang'
              : 'Belum Pulang';
        const tipe =
          fixedRole === 'asn'
            ? 'ASN'
            : fixedRole === 'non_asn'
              ? 'Non-ASN'
              : r.role === 'non_asn'
                ? 'Non-ASN'
                : 'ASN';
        csv += `"${r.nip}",${tipe},"${r.nama}","${r.nama_opd || '-'}",${r.tanggal},${r.jam_masuk || '-'},"${statusMasukLabel}",${r.keterlambatan_menit || 0},${r.jam_keluar || '-'},"${statusPulangLabel}","${r.nama_lokasi || r.device_sn || '-'}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `${csvFilenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Mengekspor CSV',
        text: err.response?.data?.error || err.message || 'Terjadi kesalahan saat mengunduh berkas CSV.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 3) {
        start = 2;
        end = 5;
      }
      if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
        end = totalPages - 1;
      }
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
      startDate ||
      endDate ||
      statusFilter ||
      (!fixedRole && roleFilter) ||
      selectedShiftId ||
      selectedOpdId
  );

  const totalSubtitle = !fixedRole
    ? roleFilter === 'asn'
      ? 'Pegawai ASN (termasuk Admin OPD)'
      : roleFilter === 'non_asn'
        ? 'Tenaga Non-ASN terdaftar'
        : totalSubtextDefault
    : totalSubtextDefault;

  const gridColsClass = !fixedRole
    ? isSuperAdmin
      ? 'xl:grid-cols-6'
      : 'xl:grid-cols-5'
    : isSuperAdmin
      ? 'lg:grid-cols-5'
      : 'lg:grid-cols-4';

  return (
    <div className="space-y-5">
      <AttendanceMetricCards
        summary={summary}
        statusFilter={statusFilter}
        onSelectStatus={handleSelectStatusFromCard}
        totalLabel={totalLabel}
        totalSubtext={totalSubtitle}
      />

      {/* Bilah Filter & Aksi */}
      <div className="surface-panel p-5">
        <DatePresetBar startDate={startDate} endDate={endDate} onSelectRange={handleSelectDateRange} />

        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${gridColsClass} gap-3 flex-1`}>
            {/* Pencarian */}
            <div>
              <label
                htmlFor={`${uid}-search`}
                className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
              >
                {searchLabel}
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={15} />
                <input
                  id={`${uid}-search`}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={handleFilterChange(setSearchQuery)}
                  className="gov-input pl-9 pr-3"
                />
              </div>
            </div>

            {/* Tanggal Awal */}
            <div>
              <label
                htmlFor={`${uid}-start-date`}
                className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
              >
                Dari Tanggal
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={15} />
                <input
                  id={`${uid}-start-date`}
                  type="date"
                  value={startDate}
                  onChange={handleFilterChange(setStartDate)}
                  className="gov-input pl-9 pr-3 tabular-nums"
                />
              </div>
            </div>

            {/* Tanggal Akhir */}
            <div>
              <label
                htmlFor={`${uid}-end-date`}
                className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
              >
                Sampai Tanggal
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={15} />
                <input
                  id={`${uid}-end-date`}
                  type="date"
                  value={endDate}
                  onChange={handleFilterChange(setEndDate)}
                  className="gov-input pl-9 pr-3 tabular-nums"
                />
              </div>
            </div>

            {/* Status Kehadiran */}
            <div>
              <label
                htmlFor={`${uid}-status`}
                className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
              >
                Status Kehadiran
              </label>
              <div className="relative">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={15} />
                <select
                  id={`${uid}-status`}
                  value={statusFilter}
                  onChange={handleFilterChange(setStatusFilter)}
                  className="gov-select pl-9 pr-8 appearance-none"
                >
                  <option value="">Semua Status</option>
                  <option value="ON_TIME">Tepat Waktu</option>
                  <option value="LATE">Terlambat</option>
                  <option value="ABSENT">Belum / Tidak Hadir</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={15} />
              </div>
            </div>

            {/* Tipe Pegawai (Khusus Dashboard Gabungan) */}
            {!fixedRole && (
              <div>
                <label
                  htmlFor={`${uid}-role`}
                  className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
                >
                  Tipe Pegawai
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={15} />
                  <select
                    id={`${uid}-role`}
                    value={roleFilter}
                    onChange={handleFilterChange(setRoleFilter)}
                    className="gov-select pl-9 pr-8 appearance-none"
                  >
                    <option value="">Semua Pegawai</option>
                    <option value="asn">ASN (Termasuk Admin)</option>
                    <option value="non_asn">Non-ASN</option>
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={15} />
                </div>
              </div>
            )}

            {/* Shift Jam Kerja */}
            <div>
              <label
                htmlFor={`${uid}-shift`}
                className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
              >
                Shift Jam Kerja
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={15} />
                <select
                  id={`${uid}-shift`}
                  value={selectedShiftId}
                  onChange={handleFilterChange(setSelectedShiftId)}
                  className="gov-select pl-9 pr-8 appearance-none"
                >
                  <option value="">Semua Shift</option>
                  {shiftList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama_shift}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={15} />
              </div>
            </div>

            {/* Filter OPD (Super Admin) */}
            {isSuperAdmin && (
              <div>
                <label
                  htmlFor={`${uid}-opd`}
                  className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
                >
                  Instansi OPD
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={15} />
                  <select
                    id={`${uid}-opd`}
                    value={selectedOpdId}
                    onChange={handleFilterChange(setSelectedOpdId)}
                    className="gov-select pl-9 pr-8 appearance-none"
                  >
                    <option value="">Seluruh Instansi</option>
                    {opdList.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.nama || o.nama_opd}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={15} />
                </div>
              </div>
            )}
          </div>

          {/* Tombol Aksi Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1 xl:pt-0">
            {hasActiveFilters && (
              <button type="button" onClick={handleResetFilters} className="gov-btn-secondary">
                <RotateCcw size={15} />
                <span>Atur Ulang Filter</span>
              </button>
            )}

            {showKegiatanShortcut && (
              <Link
                to="/laporan-kegiatan"
                title="Lihat rekapitulasi presensi kegiatan luar kantor"
                className="gov-btn-secondary"
              >
                <CalendarDays size={15} className="text-blue-700" />
                <span>Rekap Kegiatan</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isExporting}
              className="gov-btn-primary"
            >
              {isExporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Mengekspor...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet size={16} />
                  <span>Ekspor CSV</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabel Data Presensi */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th scope="col" className="w-14 text-center">No</th>
                <th scope="col">{personColumnTitle}</th>
                <th scope="col" className="px-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Camera size={13} className="text-slate-600" aria-hidden="true" />
                    <span>Foto Bukti</span>
                  </div>
                </th>
                <th scope="col">Tanggal</th>
                <th scope="col" className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Clock size={13} className="text-slate-600" aria-hidden="true" />
                    <span>Jam Masuk</span>
                  </div>
                </th>
                <th scope="col" className="text-center">Status Masuk</th>
                <th scope="col" className="text-center">Keterangan</th>
                <th scope="col" className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Clock size={13} className="text-slate-600" aria-hidden="true" />
                    <span>Jam Pulang</span>
                  </div>
                </th>
                <th scope="col" className="text-center">Status Pulang</th>
                <th scope="col" className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <MapPin size={13} className="text-slate-600" aria-hidden="true" />
                    <span>Lokasi Kiosk</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableLoadingRow colSpan={10} label="Memuat data presensi harian..." />
              ) : errorMsg ? (
                <TableErrorRow colSpan={10} message={errorMsg} onRetry={() => fetchReports(false)} />
              ) : reports.length > 0 ? (
                reports.map((row, idx) => {
                  const isAbsent = row.status_masuk === 'ABSENT';
                  const isLate = row.status_masuk === 'LATE';
                  const rowRole = fixedRole || row.role;

                  return (
                    <tr
                      key={`${row.nip}-${row.tanggal}-${idx}`}
                    >
                      <td className="text-center text-xs font-mono text-slate-600 tabular-nums">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm leading-snug">
                            {toTitleCase(row.nama)}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="font-mono text-xs text-slate-600 font-medium tabular-nums">
                              {row.nip}
                            </span>
                            <EmployeeRoleBadge role={rowRole} />
                            <ShiftBadge row={row} />
                            {rowRole !== 'non_asn' && row.jam_masuk && (
                              <SpotSyncPill row={row} />
                            )}
                            {isSuperAdmin && row.nama_opd && (
                              <span
                                className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded-md truncate max-w-[180px]"
                                title={row.nama_opd}
                              >
                                {row.nama_opd}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center">
                        <PhotoThumbnail row={row} onSelect={setSelectedProofRow} />
                      </td>

                      <td className="px-4 py-3.5 text-slate-700 text-xs sm:text-sm font-medium whitespace-nowrap tabular-nums">
                        {formatTanggalIndo(row.tanggal)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {row.jam_masuk ? (
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300 tabular-nums">
                            {row.jam_masuk}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {isAbsent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                            <XCircle size={12} /> Belum Hadir
                          </span>
                        ) : row.jam_masuk ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${
                              isLate
                                ? 'bg-red-50 text-red-800 border-red-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {isLate ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                            {isLate ? 'Terlambat' : 'Tepat Waktu'}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {isAbsent ? (
                          <span className="text-slate-600 font-mono">-</span>
                        ) : isLate && row.keterlambatan_menit > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold text-red-800 bg-red-50 border border-red-200 tabular-nums">
                            +{row.keterlambatan_menit} Menit
                          </span>
                        ) : row.jam_masuk ? (
                          <span className="text-xs font-bold text-emerald-800">Sesuai Jadwal</span>
                        ) : (
                          <span className="text-slate-600 font-mono">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {row.jam_keluar ? (
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300 tabular-nums">
                            {row.jam_keluar}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <CheckoutStatusBadge row={row} />
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {row.nama_lokasi || row.device_sn ? (
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-300">
                            <MapPin size={12} className="text-blue-700 shrink-0" />
                            <span className="max-w-[140px] truncate" title={row.nama_lokasi || row.device_sn}>
                              {row.nama_lokasi || row.device_sn}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-16 px-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600 mb-1">
                        <Search size={22} />
                      </div>
                      <p className="text-slate-900 font-bold text-base">{emptyTitle}</p>
                      <p className="text-slate-600 text-xs max-w-sm">
                        Sesuaikan rentang tanggal atau kriteria filter di atas untuk menampilkan data presensi lainnya.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 gov-btn-secondary"
                        >
                          <RotateCcw size={14} />
                          <span>Atur Ulang Filter</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bilah Paginasi */}
        <div className="p-4 sm:px-6 border-t border-slate-300 bg-slate-50 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-slate-700 font-medium tabular-nums">
              Menampilkan baris{' '}
              <span className="font-bold text-slate-900">
                {reports.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
              </span>{' '}
              s.d.{' '}
              <span className="font-bold text-slate-900">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </span>{' '}
              dari <span className="font-bold text-slate-900">{totalItems}</span> {dataUnitLabel}
              {statusFilter && summary.total !== totalItems && (
                <span className="text-slate-600"> (difilter dari {summary.total} total rekap)</span>
              )}
            </p>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-300">
              <label htmlFor={`${uid}-per-page`} className="text-xs text-slate-700 font-semibold">
                Baris per halaman:
              </label>
              <select
                id={`${uid}-per-page`}
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="min-h-[44px] px-3 py-1.5 text-xs font-bold border border-slate-500 rounded-lg bg-white text-slate-900 tabular-nums"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <nav className="flex flex-wrap items-center gap-1.5" aria-label="Navigasi halaman tabel">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="inline-flex items-center gap-1 min-h-[44px] px-3.5 py-2 text-xs font-bold border border-slate-400 bg-white rounded-lg text-slate-800 hover:bg-slate-100 disabled:opacity-45"
              >
                <ChevronLeft size={15} />
                <span>Sebelumnya</span>
              </button>

              {getPageNumbers().map((pg, i) =>
                pg === '...' ? (
                  <span key={`dots-${i}`} className="px-2 text-slate-600 text-xs font-bold select-none">
                    ...
                  </span>
                ) : (
                  <button
                    type="button"
                    key={pg}
                    aria-current={currentPage === pg ? 'page' : undefined}
                    onClick={() => setCurrentPage(pg)}
                    className={`min-w-[44px] min-h-[44px] px-2.5 flex items-center justify-center text-xs font-bold rounded-lg transition-colors tabular-nums ${
                      currentPage === pg
                        ? 'bg-blue-700 text-white border border-blue-700'
                        : 'border border-slate-400 bg-white text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {pg}
                  </button>
                )
              )}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="inline-flex items-center gap-1 min-h-[44px] px-3.5 py-2 text-xs font-bold border border-slate-400 bg-white rounded-lg text-slate-800 hover:bg-slate-100 disabled:opacity-45"
              >
                <span>Berikutnya</span>
                <ChevronRight size={15} />
              </button>
            </nav>
          )}
        </div>
      </div>

      <AttendanceProofModal row={selectedProofRow} onClose={() => setSelectedProofRow(null)} />
    </div>
  );
};

export default DailyAttendanceReportView;
