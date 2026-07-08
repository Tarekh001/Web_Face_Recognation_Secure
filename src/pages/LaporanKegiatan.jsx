import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { ClipboardList, Search, Download, Loader2, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:5000/api';
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
});

const LaporanKegiatan = () => {
  const [data, setData] = useState([]);
  const [kegiatanList, setKegiatanList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [selectedKegiatan, setSelectedKegiatan] = useState('');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const perPage = 20;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearchDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch kegiatan list for dropdown
  useEffect(() => {
    axios.get(`${API_BASE}/kegiatan`, getAuthHeaders())
      .then(res => setKegiatanList(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  // Fetch report data
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
    } finally { setIsLoading(false); }
  }, [page, selectedKegiatan, searchDebounced]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // Export CSV
  const handleExport = () => {
    const headers = ['No', 'NIP', 'Nama', 'OPD', 'Kegiatan', 'Waktu Scan', 'Device'];
    const rows = data.map((r, i) => [
      i + 1 + (page - 1) * perPage, r.nip, r.nama_lengkap, r.opd,
      r.nama_kegiatan, r.waktu_scan, r.device_sn
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_kegiatan_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="p-8 w-full h-full">
      {/* Header */}
      <div className="border-b-2 border-gray-300 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <ClipboardList size={32} className="text-[#0057A4]" />
            Laporan Presensi Kegiatan
          </h1>
          <p className="text-sm text-gray-500 mt-1">Data kehadiran ASN pada kegiatan (rapat, apel, dll).</p>
        </div>
        <button onClick={handleExport} disabled={data.length === 0}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[250px]">
          <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Pilih Kegiatan</label>
          <select value={selectedKegiatan} onChange={e => { setSelectedKegiatan(e.target.value); setPage(1); }}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Semua Kegiatan</option>
            {kegiatanList.map(k => (
              <option key={k.id} value={k.id}>{k.nama_kegiatan} ({k.tanggal_mulai})</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Cari Nama / NIP</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Cari nama atau NIP..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
      </div>

      {/* Summary badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
          <CalendarDays size={13} /> {totalRecords} record kehadiran
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-4 w-10">#</th>
                <th className="px-4 py-4">NIP</th>
                <th className="px-4 py-4">Nama</th>
                <th className="px-4 py-4">OPD</th>
                <th className="px-4 py-4">Kegiatan</th>
                <th className="px-4 py-4">Waktu Scan</th>
                <th className="px-4 py-4">Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
              {isLoading ? (
                <tr><td colSpan="7" className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={28} className="animate-spin text-blue-500" />
                    <span className="text-gray-400 text-sm">Memuat data...</span>
                  </div>
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <ClipboardList size={32} className="text-gray-300" />
                    <span className="text-gray-400">Belum ada data presensi kegiatan.</span>
                  </div>
                </td></tr>
              ) : data.map((row, idx) => (
                <tr key={row.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * perPage + idx + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.nip}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{row.nama_lengkap}</td>
                  <td className="px-4 py-3 text-xs">{row.opd}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 ring-1 ring-purple-200">
                      {row.nama_kegiatan}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs">{row.waktu_scan}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{row.device_sn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500">
              Halaman {page} dari {totalPages} ({totalRecords} record)
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default LaporanKegiatan;
