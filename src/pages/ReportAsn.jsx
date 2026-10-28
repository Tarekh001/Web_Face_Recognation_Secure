import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import API_BASE from '../config/api';
import {
  Search, Calendar, ChevronLeft, ChevronRight,
  Filter, Clock, MapPin, CheckCircle2, AlertCircle, XCircle,
  FileSpreadsheet, RotateCcw, Camera, Building2
} from 'lucide-react';
import AttendanceMetricCards, { DatePresetBar } from '../components/AttendanceMetricCards';
import {
  PhotoThumbnail,
  AttendanceProofModal,
  EmployeeRoleBadge,
  formatTanggalIndo,
} from '../components/AttendancePhotoModal';

const ReportAsn = () => {
  const userRole = localStorage.getItem('user_role');
  const isSuperAdmin = userRole === 'super_admin';

  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({ total: 0, on_time: 0, late: 0, absent: 0, checked_out: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOpdId, setSelectedOpdId] = useState('');
  const [opdList, setOpdList] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedProofRow, setSelectedProofRow] = useState(null);

  useEffect(() => {
    if (!isSuperAdmin) return;
    const token = localStorage.getItem('access_token');
    axios
      .get(`${API_BASE}/opd`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setOpdList(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch(() => {});
  }, [isSuperAdmin]);

  const fetchReports = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        role: 'asn',
      };
      if (searchQuery) params.search_name = searchQuery;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (statusFilter) params.status_filter = statusFilter;
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
      console.error('Gagal mengambil laporan ASN:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, startDate, endDate, statusFilter, isSuperAdmin, selectedOpdId]);

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 30000);
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

  const handleResetFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    setSelectedOpdId('');
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleExportCSV = async () => {
    if (totalItems === 0) return alert('Tidak ada data untuk di-export');
    setIsExporting(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = { page: 1, limit: 99999, role: 'asn' };
      if (searchQuery) params.search_name = searchQuery;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (statusFilter) params.status_filter = statusFilter;
      if (isSuperAdmin && selectedOpdId) params.opd_id = selectedOpdId;

      const res = await axios.get(`${API_BASE}/report`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      const allData = Array.isArray(res.data) ? res.data : res.data.data || [];
      if (allData.length === 0) return alert('Tidak ada data untuk di-export');

      let csv = '\uFEFFNIP,Tipe,Nama,Instansi OPD,Tanggal,Jam Masuk,Status Masuk,Keterlambatan (Menit),Jam Pulang,Status Pulang,Lokasi Kiosk\n';
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
        csv += `"${r.nip}",ASN,"${r.nama}","${r.nama_opd || '-'}",${r.tanggal},${r.jam_masuk || '-'},"${statusMasukLabel}",${r.keterlambatan_menit || 0},${r.jam_keluar || '-'},"${statusPulangLabel}","${r.nama_lokasi || r.device_sn || '-'}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Laporan_Presensi_ASN_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Gagal export: ' + (err.response?.data?.error || err.message));
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
      if (currentPage <= 3) { start = 2; end = 5; }
      if (currentPage >= totalPages - 2) { start = totalPages - 4; end = totalPages - 1; }
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const hasActiveFilters = Boolean(searchQuery || startDate || endDate || statusFilter || selectedOpdId);

  return (
    <div className="space-y-5">
      {/* ── BENTO METRIC SUMMARY (GLOBAL COUNTS) ── */}
      <AttendanceMetricCards
        summary={summary}
        statusFilter={statusFilter}
        onSelectStatus={(s) => { setStatusFilter(s); setCurrentPage(1); }}
        totalLabel="Total Rekap ASN"
        totalSubtext="Pegawai ASN & Admin OPD terdaftar"
      />

      {/* ── FILTER & ACTION TOOLBAR ── */}
      <div className="glass-panel p-5">
        <DatePresetBar
          startDate={startDate}
          endDate={endDate}
          onSelectRange={handleSelectDateRange}
        />

        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${isSuperAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3 flex-1`}>
            {/* Search */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Pencarian ASN
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Cari NIP atau Nama ASN..."
                  value={searchQuery}
                  onChange={handleFilterChange(setSearchQuery)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all shadow-soft-xs"
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Dari Tanggal
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                <input
                  type="date"
                  value={startDate}
                  onChange={handleFilterChange(setStartDate)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all shadow-soft-xs cursor-pointer"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Sampai Tanggal
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                <input
                  type="date"
                  value={endDate}
                  onChange={handleFilterChange(setEndDate)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all shadow-soft-xs cursor-pointer"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Status Kehadiran
              </label>
              <div className="relative">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                <select
                  value={statusFilter}
                  onChange={handleFilterChange(setStatusFilter)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none appearance-none cursor-pointer transition-all shadow-soft-xs"
                >
                  <option value="">Semua Status</option>
                  <option value="ON_TIME">Tepat Waktu</option>
                  <option value="LATE">Terlambat</option>
                  <option value="ABSENT">Belum / Tidak Hadir</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={15} />
              </div>
            </div>

            {/* OPD Filter (Super Admin) */}
            {isSuperAdmin && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Instansi OPD
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                  <select
                    value={selectedOpdId}
                    onChange={handleFilterChange(setSelectedOpdId)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none appearance-none cursor-pointer transition-all shadow-soft-xs"
                  >
                    <option value="">Seluruh Instansi</option>
                    {opdList.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.nama || o.nama_opd}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={15} />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-1 xl:pt-0">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition-all cursor-pointer active:scale-[0.98]"
              >
                <RotateCcw size={14} />
                <span>Reset Filter</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isExporting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Mengekspor...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet size={16} />
                  <span>Export CSV</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── DATA TABLE ── */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-4 py-3.5 w-12 text-center">#</th>
                <th className="px-4 py-3.5">Pegawai ASN</th>
                <th className="px-3 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Camera size={13} className="text-slate-400" />
                    <span>Foto Bukti</span>
                  </div>
                </th>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    <span>Jam Masuk</span>
                  </div>
                </th>
                <th className="px-4 py-3.5 text-center">Status Masuk</th>
                <th className="px-4 py-3.5 text-center">Keterangan</th>
                <th className="px-4 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    <span>Jam Pulang</span>
                  </div>
                </th>
                <th className="px-4 py-3.5 text-center">Status Pulang</th>
                <th className="px-4 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <MapPin size={13} className="text-slate-400" />
                    <span>Lokasi Kiosk</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-9 h-9 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-slate-400 text-sm font-medium">Memuat data ASN...</span>
                    </div>
                  </td>
                </tr>
              ) : reports.length > 0 ? (
                reports.map((row, idx) => {
                  const isAbsent = row.status_masuk === 'ABSENT';
                  const isLate = row.status_masuk === 'LATE';
                  const isCheckedOut = Boolean(row.jam_keluar);

                  return (
                    <tr key={`${row.nip}-${row.tanggal}-${idx}`} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3.5 text-center text-xs font-mono text-slate-400">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm leading-snug">{row.nama}</span>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="font-mono text-xs text-slate-500 font-medium tracking-tight">
                              {row.nip}
                            </span>
                            <EmployeeRoleBadge role={row.role} />
                            {isSuperAdmin && row.nama_opd && (
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md truncate max-w-[160px]" title={row.nama_opd}>
                                {row.nama_opd}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        <PhotoThumbnail row={row} onSelect={setSelectedProofRow} />
                      </td>

                      <td className="px-4 py-3.5 text-slate-700 text-xs sm:text-sm font-medium whitespace-nowrap">
                        {formatTanggalIndo(row.tanggal)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {row.jam_masuk ? (
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/70">
                            {row.jam_masuk}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {isAbsent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                            <XCircle size={12} /> Belum Hadir
                          </span>
                        ) : row.jam_masuk ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${
                              isLate
                                ? 'bg-red-50 text-red-600 ring-red-200'
                                : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                            }`}
                          >
                            {isLate ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                            {isLate ? 'Terlambat' : 'Tepat Waktu'}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {isAbsent ? (
                          <span className="text-slate-300 font-mono">—</span>
                        ) : isLate && row.keterlambatan_menit > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold text-red-600 bg-red-50 border border-red-100">
                            +{row.keterlambatan_menit} Menit
                          </span>
                        ) : row.jam_masuk ? (
                          <span className="text-xs font-semibold text-emerald-600">Sesuai Jadwal</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {row.jam_keluar ? (
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/70">
                            {row.jam_keluar}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {isAbsent ? (
                          <span className="text-slate-300 font-mono">—</span>
                        ) : isCheckedOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                            <CheckCircle2 size={12} /> Sudah Pulang
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                            <Clock size={12} /> Belum Pulang
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {row.nama_lokasi || row.device_sn ? (
                          <span className="inline-flex items-center gap-1.5 bg-indigo-50/80 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-xl border border-indigo-100 shadow-soft-xs">
                            <MapPin size={12} className="text-indigo-500 shrink-0" />
                            <span className="max-w-[140px] truncate" title={row.nama_lokasi || row.device_sn}>
                              {row.nama_lokasi || row.device_sn}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-20">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                        <Search size={22} />
                      </div>
                      <p className="text-slate-700 font-bold text-base">Tidak ada data presensi ASN ditemukan</p>
                      <p className="text-slate-400 text-xs max-w-sm">
                        Coba sesuaikan rentang tanggal atau kriteria filter untuk menampilkan data lainnya.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                        >
                          Reset semua filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION BAR ── */}
        <div className="p-4 sm:px-6 border-t border-slate-200/80 bg-slate-50/60 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-slate-500 font-medium">
              Menampilkan baris{' '}
              <span className="font-bold text-slate-800">
                {reports.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
              </span>
              –
              <span className="font-bold text-slate-800">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </span>{' '}
              dari <span className="font-bold text-slate-800">{totalItems}</span> data ASN
              {statusFilter && summary.total !== totalItems && (
                <span className="text-slate-400"> (difilter dari {summary.total} total rekap)</span>
              )}
            </p>
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <label className="text-xs text-slate-400 font-medium">Baris per halaman:</label>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="px-2 py-1 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-soft-xs"
              >
                <ChevronLeft size={14} />
                <span>Sebelumnya</span>
              </button>

              {getPageNumbers().map((pg, i) =>
                pg === '...' ? (
                  <span key={`dots-${i}`} className="px-2 text-slate-400 text-xs">
                    ···
                  </span>
                ) : (
                  <button
                    type="button"
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`min-w-[32px] h-[32px] flex items-center justify-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      currentPage === pg
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
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
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-soft-xs"
              >
                <span>Berikutnya</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <AttendanceProofModal row={selectedProofRow} onClose={() => setSelectedProofRow(null)} />
    </div>
  );
};

export default ReportAsn;
