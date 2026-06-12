import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Download, Search, Calendar, ChevronLeft, ChevronRight, Filter, Clock, MapPin } from 'lucide-react';

const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [isExporting, setIsExporting] = useState(false);

  const fetchReports = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);
      if (searchQuery) params.append('search_name', searchQuery);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (statusFilter) params.append('status_filter', statusFilter);

      const res = await axios.get(`http://127.0.0.1:5000/api/report?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(res.data)) {
        setReports(res.data); setTotalPages(1); setTotalItems(res.data.length);
      } else {
        setReports(res.data.data || []);
        setTotalPages(res.data.total_pages || 1);
        setTotalItems(res.data.total_records || 0);
      }
    } catch (err) { console.error('Gagal mengambil laporan:', err); }
    finally { setIsLoading(false); }
  }, [currentPage, itemsPerPage, searchQuery, startDate, endDate, statusFilter]);

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, [fetchReports]);

  const handleFilterChange = (setter) => (e) => { setter(e.target.value); setCurrentPage(1); };
  const handleResetFilters = () => { setSearchQuery(''); setStartDate(''); setEndDate(''); setStatusFilter(''); setCurrentPage(1); };
  const handleItemsPerPageChange = (e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); };

  const handleExportCSV = async () => {
    if (totalItems === 0) return alert('Tidak ada data untuk di-export');
    setIsExporting(true);
    try {
      // Fetch ALL filtered data (bypass pagination) for complete export
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      params.append('page', 1);
      params.append('limit', 99999); // Request all records
      if (searchQuery) params.append('search_name', searchQuery);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (statusFilter) params.append('status_filter', statusFilter);

      const res = await axios.get(`http://127.0.0.1:5000/api/report?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allData = Array.isArray(res.data) ? res.data : (res.data.data || []);

      if (allData.length === 0) return alert('Tidak ada data untuk di-export');

      let csv = 'NIP,Nama,Tanggal,Jam Masuk,Keterangan,Jam Keluar,Lokasi\n';
      allData.forEach(r => {
        const ket = r.status_masuk === 'LATE' && r.keterlambatan_menit > 0 ? `Terlambat ${r.keterlambatan_menit} Menit` : 'Tepat Waktu';
        csv += `${r.nip},"${r.nama}",${r.tanggal},${r.jam_masuk || '-'},${r.status_masuk === 'ABSENT' ? 'Tidak Hadir' : ket},${r.jam_keluar || '-'},"${r.nama_lokasi || r.device_sn || '-'}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Laporan_Presensi_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (err) { alert('Gagal export: ' + (err.response?.data?.error || err.message)); }
    finally { setIsExporting(false); }
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1), end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 3) { start = 2; end = 5; }
      if (currentPage >= totalPages - 2) { start = totalPages - 4; end = totalPages - 1; }
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const formatTanggal = (d) => {
    if (!d) return '—';
    try { return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  const hasActiveFilters = searchQuery || startDate || endDate || statusFilter;

  return (
    <main className="p-8 w-full h-full">
      {/* Header */}
      <div className="border-b-2 border-gray-300 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Laporan Presensi ASN</h1>
          <p className="text-sm text-gray-500 mt-1">Total <span className="font-semibold text-gray-700">{totalItems}</span> data</p>
        </div>
        <button onClick={handleExportCSV} disabled={isExporting} className="flex items-center gap-2 bg-[#005bb5] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait">
          {isExporting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Exporting...</> : <><Download size={18} />Export CSV</>}
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Pencarian</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input id="search-input" type="text" placeholder="Cari Nama atau NIP..." value={searchQuery} onChange={handleFilterChange(setSearchQuery)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
            </div>
          </div>
          <div className="min-w-[170px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Tanggal Mulai</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input id="start-date" type="date" value={startDate} onChange={handleFilterChange(setStartDate)}
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-600" />
            </div>
          </div>
          <div className="min-w-[170px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Tanggal Akhir</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input id="end-date" type="date" value={endDate} onChange={handleFilterChange(setEndDate)}
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-600" />
            </div>
          </div>
          <div className="min-w-[170px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Status</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select id="status-filter" value={statusFilter} onChange={handleFilterChange(setStatusFilter)}
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-600 appearance-none cursor-pointer">
                <option value="">Semua</option>
                <option value="ON_TIME">Tepat Waktu</option>
                <option value="LATE">Terlambat</option>
                <option value="ABSENT">Tidak Hadir</option>
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={16} />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex items-end">
              <button onClick={handleResetFilters} className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg whitespace-nowrap">Reset Filter</button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-4 w-10">#</th>
                <th className="px-4 py-4">Identitas</th>
                <th className="px-4 py-4">Tanggal</th>
                <th className="px-4 py-4 text-center"><div className="flex items-center justify-center gap-1"><Clock size={12}/>Jam Masuk</div></th>
                <th className="px-4 py-4 text-center">Status Masuk</th>
                <th className="px-4 py-4 text-center">Keterangan</th>
                <th className="px-4 py-4 text-center"><div className="flex items-center justify-center gap-1"><Clock size={12}/>Jam Keluar</div></th>
                <th className="px-4 py-4 text-center">Status Keluar</th>
                <th className="px-4 py-4 text-center"><div className="flex items-center justify-center gap-1"><MapPin size={12}/>Lokasi</div></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
              {isLoading ? (
                <tr><td colSpan="9" className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"/>
                    <span className="text-gray-400 text-sm">Memuat data...</span>
                  </div>
                </td></tr>
              ) : reports.length > 0 ? (
                reports.map((row, idx) => {
                  const isAbsent = row.status_masuk === 'ABSENT';
                  const isLate = row.status_masuk === 'LATE';
                  return (
                    <tr key={`${row.nip}-${row.tanggal}-${idx}`} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3.5 text-gray-400 text-xs">{(currentPage - 1) * itemsPerPage + idx + 1}</td>

                      {/* Identitas */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-gray-800 text-sm block">{row.nama}</span>
                        <span className="font-mono text-[11px] text-gray-400">{row.nip}</span>
                      </td>

                      {/* Tanggal */}
                      <td className="px-4 py-3.5 text-gray-700 text-sm whitespace-nowrap">{formatTanggal(row.tanggal)}</td>

                      {/* Jam Masuk */}
                      <td className="px-4 py-3.5 text-center">
                        {row.jam_masuk ? <span className="font-mono font-semibold text-gray-800">{row.jam_masuk}</span> : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Status Masuk — clean label only */}
                      <td className="px-4 py-3.5 text-center">
                        {isAbsent ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 ring-1 ring-gray-300">Tidak Hadir</span>
                        ) : row.jam_masuk ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ring-1 ${isLate ? 'bg-red-50 text-red-600 ring-red-300' : 'bg-blue-50 text-blue-600 ring-blue-300'}`}>Masuk</span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Keterangan */}
                      <td className="px-4 py-3.5 text-center">
                        {isAbsent ? (
                          <span className="text-[11px] text-gray-400 italic">Tidak Masuk</span>
                        ) : isLate && row.keterlambatan_menit > 0 ? (
                          <span className="text-[11px] font-bold text-red-500">Terlambat {row.keterlambatan_menit} Menit</span>
                        ) : row.jam_masuk ? (
                          <span className="text-[11px] text-emerald-600">Tepat Waktu</span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Jam Keluar */}
                      <td className="px-4 py-3.5 text-center">
                        {row.jam_keluar ? <span className="font-mono font-semibold text-gray-800">{row.jam_keluar}</span> : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Status Keluar — clean label only */}
                      <td className="px-4 py-3.5 text-center">
                        {row.jam_keluar ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 ring-1 ring-orange-300">Keluar</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-400 ring-1 ring-gray-200">Belum Absen</span>
                        )}
                      </td>

                      {/* Lokasi */}
                      <td className="px-4 py-3.5 text-center">
                        {(row.nama_lokasi || row.device_sn) ? (
                          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ring-1 ring-indigo-200">
                            <MapPin size={10}/>{row.nama_lokasi || row.device_sn}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="9" className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <Search size={32} className="text-gray-300"/>
                    <span className="text-gray-400">Belum ada data presensi.</span>
                    {hasActiveFilters && <button onClick={handleResetFilters} className="text-blue-500 text-sm hover:underline mt-1">Reset filter</button>}
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {/* Pagination */}
      <div className="mt-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500">Halaman <span className="font-semibold text-gray-700">{currentPage}</span> dari <span className="font-semibold text-gray-700">{totalPages}</span><span className="mx-2 text-gray-300">•</span>{totalItems} data</p>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Tampilkan</label>
            <select value={itemsPerPage} onChange={handleItemsPerPageChange}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-xs text-gray-400">baris</span>
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button id="btn-prev-page" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft size={16}/>Sebelumnya</button>
            {getPageNumbers().map((pg, i) => pg === '...'
              ? <span key={`d${i}`} className="px-2 py-2 text-gray-400 text-sm">···</span>
              : <button key={pg} onClick={() => setCurrentPage(pg)} className={`min-w-[40px] h-[40px] flex items-center justify-center text-sm font-medium rounded-lg transition-all ${currentPage === pg ? 'bg-[#005bb5] text-white shadow-sm shadow-blue-200' : 'border border-gray-300 text-gray-600 hover:bg-gray-100'}`}>{pg}</button>
            )}
            <button id="btn-next-page" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">Selanjutnya<ChevronRight size={16}/></button>
          </div>
        )}
      </div>
    </main>
  );
};

export default Dashboard;