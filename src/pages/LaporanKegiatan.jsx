import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import API_BASE from '../config/api';
import {
  ClipboardList, Search, FileSpreadsheet, ChevronLeft, ChevronRight,
  CalendarDays, RotateCcw, MapPin, Users, Building2
} from 'lucide-react';
import { getInitials } from '../components/AttendancePhotoModal';

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
});

const LaporanKegiatan = () => {
  const [data, setData] = useState([]);
  const [kegiatanList, setKegiatanList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [selectedKegiatan, setSelectedKegiatan] = useState('');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    axios
      .get(`${API_BASE}/kegiatan`, getAuthHeaders())
      .then((res) => setKegiatanList(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch(() => {});
  }, []);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page, per_page: perPage });
      if (selectedKegiatan) params.set('kegiatan_id', selectedKegiatan);
      if (searchDebounced) params.set('search', searchDebounced);

      const res = await axios.get(`${API_BASE}/report/kegiatan?${params}`, getAuthHeaders());
      setData(res.data.data || []);
      setTotalPages(res.data.total_pages || 1);
      setTotalRecords(res.data.total_records || 0);
    } catch (err) {
      console.error('Gagal mengambil laporan kegiatan:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, selectedKegiatan, searchDebounced]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleResetFilters = () => {
    setSelectedKegiatan('');
    setSearch('');
    setSearchDebounced('');
    setPage(1);
  };

  // Export ALL matching records (not just current page)
  const handleExport = async () => {
    if (totalRecords === 0) return alert('Tidak ada data untuk di-export');
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ page: 1, per_page: 99999 });
      if (selectedKegiatan) params.set('kegiatan_id', selectedKegiatan);
      if (searchDebounced) params.set('search', searchDebounced);

      const res = await axios.get(`${API_BASE}/report/kegiatan?${params}`, getAuthHeaders());
      const allRows = res.data?.data || [];
      if (allRows.length === 0) return alert('Tidak ada data untuk di-export');

      const headers = ['No', 'NIP', 'Nama Pegawai', 'Instansi OPD', 'Nama Kegiatan', 'Waktu Scan', 'Mesin / Device'];
      const rows = allRows.map((r, i) => [
        i + 1,
        r.nip,
        r.nama_lengkap,
        r.opd,
        r.nama_kegiatan,
        r.waktu_scan,
        r.device_sn || '-',
      ]);
      const csvContent = [headers, ...rows]
        .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_Presensi_Kegiatan_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Gagal export CSV: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsExporting(false);
    }
  };

  const selectedKegiatanObj = kegiatanList.find((k) => String(k.id) === String(selectedKegiatan));
  const hasActiveFilters = Boolean(selectedKegiatan || search);

  return (
    <div className="space-y-5">
      {/* ── BENTO SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Kehadiran Kegiatan
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {totalRecords.toLocaleString('id-ID')}
            </span>
            <p className="text-xs text-slate-500 mt-1">Total seluruh log scan kegiatan sesuai filter</p>
          </div>
        </div>

        <div className="glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Jadwal Kegiatan Terdaftar
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <CalendarDays size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-indigo-700 tracking-tight">
              {kegiatanList.length.toLocaleString('id-ID')}
            </span>
            <p className="text-xs text-slate-500 mt-1">Kegiatan global & internal instansi</p>
          </div>
        </div>

        <div className="glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Cakupan Kegiatan Aktif
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <ClipboardList size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-base font-extrabold text-slate-900 truncate" title={selectedKegiatanObj?.nama_kegiatan || 'Semua Kegiatan'}>
              {selectedKegiatanObj ? selectedKegiatanObj.nama_kegiatan : 'Semua Kegiatan'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {selectedKegiatanObj
                ? `Tanggal: ${selectedKegiatanObj.tanggal_mulai}`
                : 'Menampilkan seluruh riwayat kegiatan'}
            </p>
          </div>
        </div>
      </div>

      {/* ── FILTER & ACTION TOOLBAR ── */}
      <div className="glass-panel p-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Pilih Kegiatan
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                <select
                  value={selectedKegiatan}
                  onChange={(e) => {
                    setSelectedKegiatan(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none appearance-none cursor-pointer transition-all shadow-soft-xs"
                >
                  <option value="">Semua Kegiatan</option>
                  {kegiatanList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kegiatan} ({k.tanggal_mulai})
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={15} />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Cari Pegawai
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Cari NIP atau Nama Pegawai..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all shadow-soft-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Reset Filter</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExport}
              disabled={totalRecords === 0 || isExporting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet size={16} />
              <span>{isExporting ? 'Mengekspor...' : 'Export CSV'}</span>
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
                <th className="px-4 py-3.5">Pegawai</th>
                <th className="px-4 py-3.5">Instansi OPD</th>
                <th className="px-4 py-3.5">Nama Kegiatan</th>
                <th className="px-4 py-3.5">Waktu Scan</th>
                <th className="px-4 py-3.5 text-center">Perangkat / Kiosk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-9 h-9 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-slate-400 text-sm font-medium">Memuat data kegiatan...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-20">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                        <ClipboardList size={22} />
                      </div>
                      <p className="text-slate-700 font-bold text-base">Belum ada data kehadiran kegiatan</p>
                      <p className="text-slate-400 text-xs max-w-sm">
                        Data akan muncul secara otomatis ketika pegawai melakukan scan wajah pada kegiatan aktif.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3.5 text-center text-xs font-mono text-slate-400">
                      {(page - 1) * perPage + idx + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs font-extrabold flex items-center justify-center shrink-0">
                          {getInitials(row.nama_lengkap)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block leading-snug">{row.nama_lengkap}</span>
                          <span className="font-mono text-xs text-slate-500">{row.nip}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 size={13} className="text-slate-400 shrink-0" />
                        <span>{row.opd || '—'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
                        <CalendarDays size={12} />
                        {row.nama_kegiatan}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs font-semibold text-slate-700">
                      {row.waktu_scan}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200/70">
                        <MapPin size={11} className="text-slate-400" />
                        {row.device_sn || '—'}
                      </span>
                    </td>
                  </tr>
                ))
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
                {data.length > 0 ? (page - 1) * perPage + 1 : 0}
              </span>
              –
              <span className="font-bold text-slate-800">
                {Math.min(page * perPage, totalRecords)}
              </span>{' '}
              dari <span className="font-bold text-slate-800">{totalRecords}</span> record kehadiran
            </p>
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <label className="text-xs text-slate-400 font-medium">Baris per halaman:</label>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
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
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-soft-xs"
              >
                <ChevronLeft size={14} />
                <span>Sebelumnya</span>
              </button>
              <span className="px-3 py-1.5 text-xs font-bold text-slate-700">
                Hal {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-soft-xs"
              >
                <span>Berikutnya</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaporanKegiatan;
