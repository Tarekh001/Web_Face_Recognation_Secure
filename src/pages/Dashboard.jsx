import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Upload, ArrowUpDown, Search, Calendar, ChevronLeft, ChevronRight, Filter, Clock } from 'lucide-react';

// --- STATUS BADGE COMPONENT ---
const StatusBadge = ({ status }) => {
  const config = {
    ON_TIME: { label: 'Tepat Waktu', classes: 'bg-green-100 text-green-700 ring-1 ring-green-300' },
    LATE:    { label: 'Terlambat',   classes: 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300' },
    ABSENT:  { label: 'Tidak Hadir', classes: 'bg-red-100 text-red-700 ring-1 ring-red-300' },
  };

  const badge = config[status] || { label: status || '-', classes: 'bg-gray-100 text-gray-600 ring-1 ring-gray-300' };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide ${badge.classes}`}>
      {badge.label}
    </span>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
  // Data & meta from API
  const [reports, setReports] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Sorting & Pagination state
  const [sortConfig, setSortConfig] = useState({ key: 'waktu', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- API FETCH (server-side pagination & filtering) ---
  const fetchReports = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('per_page', itemsPerPage);

      if (searchQuery) params.append('search', searchQuery);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (statusFilter) params.append('status', statusFilter);
      if (sortConfig.key) {
        params.append('sort_by', sortConfig.key);
        params.append('sort_dir', sortConfig.direction);
      }

      const res = await axios.get(`http://127.0.0.1:5000/api/report?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Support both paginated response { data, total_pages, total } and flat array
      if (Array.isArray(res.data)) {
        setReports(res.data);
        setTotalPages(Math.ceil(res.data.length / itemsPerPage));
        setTotalItems(res.data.length);
      } else {
        setReports(res.data.data || []);
        setTotalPages(res.data.total_pages || 1);
        setTotalItems(res.data.total || 0);
      }
    } catch (err) {
      console.error('Gagal mengambil laporan:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, startDate, endDate, statusFilter, sortConfig]);

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 15000);
    return () => clearInterval(interval);
  }, [fetchReports]);

  // --- HANDLERS ---
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  // --- CSV EXPORT (exports ALL filtered data) ---
  const handleExportCSV = () => {
    if (reports.length === 0) return alert('Tidak ada data untuk diexport');

    let csvContent = 'NIP,Nama ASN,Tanggal Absensi,Waktu Absensi,Keterlambatan (Menit),Status\n';

    reports.forEach(row => {
      const tanggal = row.waktu ? row.waktu.split(' ')[0] : '-';
      const jam = row.waktu ? row.waktu.split(' ')[1] : '-';
      const keterlambatan = row.keterlambatan_menit ?? '-';
      const status = row.status || row.tipe || '-';
      csvContent += `${row.nip},${row.nama},${tanggal},${jam},${keterlambatan},${status}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Presensi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- PAGINATION HELPERS ---
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) { start = 2; end = maxVisible; }
      if (currentPage >= totalPages - 2) { start = totalPages - maxVisible + 1; end = totalPages - 1; }

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const hasActiveFilters = searchQuery || startDate || endDate || statusFilter;

  // ==================== RENDER ====================
  return (
    <main className="p-8 w-full h-full">

      {/* Page Header */}
      <div className="border-b-2 border-gray-300 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Laporan Presensi ASN</h1>
          <p className="text-sm text-gray-500 mt-1">
            Total {totalItems} data presensi ditemukan
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-[#005bb5] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          <Upload size={18} />
          Export CSV
        </button>
      </div>

      {/* ─── Controls Area ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-end">

          {/* Search Input */}
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Pencarian</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="search-input"
                type="text"
                placeholder="Cari Nama atau NIP..."
                value={searchQuery}
                onChange={handleFilterChange(setSearchQuery)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-sm"
              />
            </div>
          </div>

          {/* Start Date */}
          <div className="min-w-[180px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Tanggal Mulai</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={handleFilterChange(setStartDate)}
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-sm text-gray-600"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="min-w-[180px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Tanggal Akhir</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={handleFilterChange(setEndDate)}
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-sm text-gray-600"
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="min-w-[180px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Status</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                id="status-filter"
                value={statusFilter}
                onChange={handleFilterChange(setStatusFilter)}
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-sm text-gray-600 appearance-none cursor-pointer"
              >
                <option value="">Semua</option>
                <option value="ON_TIME">Tepat Waktu</option>
                <option value="LATE">Terlambat</option>
                <option value="ABSENT">Tidak Hadir</option>
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 whitespace-nowrap"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Data Table ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">NIP</th>
                <th
                  className="px-6 py-4 cursor-pointer hover:bg-gray-200/60 transition-colors duration-150 select-none"
                  onClick={() => handleSort('nama')}
                >
                  <div className="flex items-center gap-2">
                    Nama ASN
                    <ArrowUpDown size={14} className={sortConfig.key === 'nama' ? 'text-blue-600' : 'text-gray-400'} />
                  </div>
                </th>
                <th
                  className="px-6 py-4 cursor-pointer hover:bg-gray-200/60 transition-colors duration-150 select-none"
                  onClick={() => handleSort('waktu')}
                >
                  <div className="flex items-center gap-2">
                    Tanggal Absensi
                    <ArrowUpDown size={14} className={sortConfig.key === 'waktu' ? 'text-blue-600' : 'text-gray-400'} />
                  </div>
                </th>
                <th className="px-6 py-4">Instansi (OPD)</th>
                <th className="px-6 py-4">Waktu Absensi</th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    Keterlambatan (Menit)
                  </div>
                </th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-gray-400 text-sm">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : reports.length > 0 ? (
                reports.map((log) => {
                  const tanggal = log.waktu ? log.waktu.split(' ')[0] : '-';
                  const jam = log.waktu ? log.waktu.split(' ')[1] : '-';
                  const status = log.status || log.tipe?.toUpperCase() || '-';
                  const keterlambatan = log.keterlambatan_menit;

                  return (
                    <tr key={log.id} className="hover:bg-blue-50/40 transition-colors duration-150">
                      <td className="px-6 py-4 font-mono font-medium text-gray-800">{log.nip}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{log.nama}</td>
                      <td className="px-6 py-4">{tanggal}</td>
                      <td className="px-6 py-4">{log.opd || '-'}</td>
                      <td className="px-6 py-4 font-mono">{jam}</td>
                      <td className="px-6 py-4">
                        {keterlambatan != null ? (
                          <span className={`font-semibold tabular-nums ${keterlambatan > 0 ? 'text-yellow-700' : 'text-green-700'}`}>
                            {keterlambatan > 0 ? `+${keterlambatan}` : keterlambatan}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="text-gray-300" />
                      <span className="text-gray-400">Belum ada data presensi yang sesuai.</span>
                      {hasActiveFilters && (
                        <button onClick={handleResetFilters} className="text-blue-500 text-sm hover:underline mt-1">
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
      </div>

      {/* ─── Pagination UI ─── */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            Halaman <span className="font-semibold text-gray-700">{currentPage}</span> dari{' '}
            <span className="font-semibold text-gray-700">{totalPages}</span>
            <span className="mx-2 text-gray-300">•</span>
            {totalItems} data
          </p>

          <div className="flex items-center gap-1.5">
            {/* Previous */}
            <button
              id="btn-prev-page"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeft size={16} />
              Sebelumnya
            </button>

            {/* Page Numbers */}
            {getPageNumbers().map((page, idx) =>
              page === '...' ? (
                <span key={`dots-${idx}`} className="px-2 py-2 text-gray-400 text-sm select-none">
                  ···
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[40px] h-[40px] flex items-center justify-center text-sm font-medium rounded-lg transition-all duration-200 ${
                    currentPage === page
                      ? 'bg-[#005bb5] text-white shadow-sm shadow-blue-200'
                      : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              )
            )}

            {/* Next */}
            <button
              id="btn-next-page"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              Selanjutnya
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

    </main>
  );
};

export default Dashboard;