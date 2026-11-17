import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import API_BASE from '../config/api';
import {
  ClipboardList,
  Search,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  RotateCcw,
  MapPin,
  Users,
  Building2,
} from 'lucide-react';
import { getInitials } from '../components/AttendancePhotoModal';
import {
  TableLoadingRow,
  TableErrorRow,
  notifyAlert,
} from '../components/UiFeedback';

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
});

const LaporanKegiatan = () => {
  const [data, setData] = useState([]);
  const [kegiatanList, setKegiatanList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
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
    setErrorMsg('');
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
      setErrorMsg(
        err.response?.data?.error || 'Tidak dapat memuat laporan kehadiran kegiatan dari server.'
      );
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

  const handleExport = async () => {
    if (totalRecords === 0) {
      return notifyAlert({
        icon: 'info',
        title: 'Data Kosong',
        text: 'Belum ada data kehadiran kegiatan untuk diekspor.',
      });
    }
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ page: 1, per_page: 99999 });
      if (selectedKegiatan) params.set('kegiatan_id', selectedKegiatan);
      if (searchDebounced) params.set('search', searchDebounced);

      const res = await axios.get(`${API_BASE}/report/kegiatan?${params}`, getAuthHeaders());
      const allRows = res.data?.data || [];
      if (allRows.length === 0) {
        return notifyAlert({
          icon: 'info',
          title: 'Data Kosong',
          text: 'Tidak ada baris data yang cocok untuk diekspor.',
        });
      }

      const headers = [
        'No',
        'NIP',
        'Nama Pegawai',
        'Instansi OPD',
        'Nama Kegiatan',
        'Waktu Scan',
        'Mesin / Perangkat',
      ];
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
      notifyAlert({
        icon: 'error',
        title: 'Gagal Mengekspor CSV',
        text: err.response?.data?.error || err.message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const selectedKegiatanObj = kegiatanList.find(
    (k) => String(k.id) === String(selectedKegiatan)
  );
  const hasActiveFilters = Boolean(selectedKegiatan || search);

  return (
    <div className="space-y-5">
      {/* Ringkasan Berhierarki (Focal Metric + Konteks Aktif + Total Jadwal) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 surface-card p-5 border-l-4 border-l-blue-700 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-800">
              Total Kehadiran Kegiatan
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
              <Users size={17} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {totalRecords.toLocaleString('id-ID')}
            </span>
            <p className="text-xs text-slate-600 mt-1">
              Jumlah rekaman presensi wajah pada kegiatan sesuai filter aktif
            </p>
          </div>
        </div>

        <div className="lg:col-span-4 surface-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Cakupan Kegiatan Aktif
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <ClipboardList size={17} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <p
              className="text-base font-extrabold text-slate-900 truncate"
              title={selectedKegiatanObj?.nama_kegiatan || 'Semua Kegiatan'}
            >
              {selectedKegiatanObj ? selectedKegiatanObj.nama_kegiatan : 'Semua Kegiatan'}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {selectedKegiatanObj
                ? `Tanggal pelaksanaan: ${selectedKegiatanObj.tanggal_mulai}`
                : 'Menampilkan seluruh riwayat kegiatan dinas luar'}
            </p>
          </div>
        </div>

        <div className="lg:col-span-3 surface-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Agenda Terdaftar
            </span>
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 shrink-0">
              <CalendarDays size={17} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {kegiatanList.length.toLocaleString('id-ID')}
            </span>
            <p className="text-xs text-slate-600 mt-1">Kegiatan lintas OPD dan internal</p>
          </div>
        </div>
      </div>

      {/* Bilah Filter dan Ekspor */}
      <div className="surface-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1">
            <div>
              <label
                htmlFor="laporan-kegiatan-select"
                className="block text-xs font-bold text-slate-800 mb-1.5"
              >
                Pilih Kegiatan
              </label>
              <div className="relative">
                <CalendarDays
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                  size={15}
                  aria-hidden="true"
                />
                <select
                  id="laporan-kegiatan-select"
                  value={selectedKegiatan}
                  onChange={(e) => {
                    setSelectedKegiatan(e.target.value);
                    setPage(1);
                  }}
                  className="gov-select pl-9"
                >
                  <option value="">Semua Kegiatan</option>
                  {kegiatanList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kegiatan} ({k.tanggal_mulai})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="laporan-kegiatan-search"
                className="block text-xs font-bold text-slate-800 mb-1.5"
              >
                Cari Pegawai
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                  size={15}
                  aria-hidden="true"
                />
                <input
                  id="laporan-kegiatan-search"
                  type="text"
                  placeholder="Cari NIP atau nama pegawai..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="gov-input pl-9"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {hasActiveFilters && (
              <button type="button" onClick={handleResetFilters} className="gov-btn-secondary">
                <RotateCcw size={15} aria-hidden="true" />
                <span>Reset Filter</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExport}
              disabled={totalRecords === 0 || isExporting}
              className="gov-btn-primary"
            >
              <FileSpreadsheet size={16} aria-hidden="true" />
              <span>{isExporting ? 'Mengekspor...' : 'Ekspor CSV'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabel Data Kehadiran Kegiatan */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th scope="col" className="w-14 text-center">No</th>
                <th scope="col">Pegawai</th>
                <th scope="col">Instansi OPD</th>
                <th scope="col">Nama Kegiatan</th>
                <th scope="col">Waktu Scan</th>
                <th scope="col" className="text-center">Perangkat / Kiosk</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableLoadingRow colSpan={6} label="Memuat data kehadiran kegiatan..." />
              ) : errorMsg ? (
                <TableErrorRow colSpan={6} message={errorMsg} onRetry={fetchReport} />
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 px-4">
                    <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600 mb-1">
                        <ClipboardList size={22} aria-hidden="true" />
                      </div>
                      <p className="text-slate-900 font-bold text-sm sm:text-base">
                        Belum Ada Data Kehadiran Kegiatan
                      </p>
                      <p className="text-slate-600 text-xs leading-relaxed">
                        {hasActiveFilters
                          ? 'Tidak ditemukan rekaman kehadiran yang cocok dengan filter kegiatan atau pencarian pegawai.'
                          : 'Data kehadiran akan tercatat secara otomatis ketika pegawai memindai wajah pada kegiatan aktif.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={row.id || idx}>
                    <td className="text-center text-xs font-mono text-slate-600 tabular-nums">
                      {(page - 1) * perPage + idx + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-extrabold flex items-center justify-center shrink-0">
                          {getInitials(row.nama_lengkap)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block leading-snug">
                            {row.nama_lengkap}
                          </span>
                          <span className="font-mono text-xs text-slate-600 tabular-nums">
                            {row.nip}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 size={13} className="text-slate-600 shrink-0" aria-hidden="true" />
                        <span>{row.opd || '-'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-300">
                        <CalendarDays size={12} aria-hidden="true" />
                        <span>{row.nama_kegiatan}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs font-semibold text-slate-800 tabular-nums">
                      {row.waktu_scan}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                        <MapPin size={11} className="text-slate-600" aria-hidden="true" />
                        <span>{row.device_sn || '-'}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bilah Paginasi */}
        <div className="p-4 sm:px-6 border-t border-slate-200 bg-slate-50 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-slate-700 font-medium tabular-nums">
              Menampilkan baris{' '}
              <span className="font-bold text-slate-900">
                {data.length > 0 ? (page - 1) * perPage + 1 : 0}
              </span>{' '}
              s.d.{' '}
              <span className="font-bold text-slate-900">
                {Math.min(page * perPage, totalRecords)}
              </span>{' '}
              dari <span className="font-bold text-slate-900">{totalRecords}</span> data kehadiran
            </p>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-300">
              <label htmlFor="laporan-kegiatan-perpage" className="text-xs text-slate-700 font-semibold">
                Baris per halaman:
              </label>
              <select
                id="laporan-kegiatan-perpage"
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="min-h-[44px] px-3 py-1.5 text-xs font-bold border border-slate-500 rounded-lg bg-white text-slate-900 tabular-nums"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="gov-btn-secondary text-xs"
              >
                <ChevronLeft size={15} aria-hidden="true" />
                <span>Sebelumnya</span>
              </button>
              <span className="px-3 py-2 text-xs font-bold text-slate-800 tabular-nums">
                Hal. {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="gov-btn-secondary text-xs"
              >
                <span>Berikutnya</span>
                <ChevronRight size={15} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaporanKegiatan;
