import { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { 
  Download, Search, Calendar, ChevronLeft, ChevronRight, 
  Filter, Clock, MapPin, CheckCircle2, AlertCircle, XCircle,
  FileSpreadsheet, Users, RotateCcw
} from 'lucide-react';

const ReportAsn = () => {
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
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        role: 'asn',
      };
      if (searchQuery) params.search_name = searchQuery;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (statusFilter) params.status_filter = statusFilter;

      const res = await axios.get('http://127.0.0.1:5000/api/report', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(res.data)) {
        setReports(res.data); setTotalPages(1); setTotalItems(res.data.length);
      } else {
        setReports(res.data.data || []);
        setTotalPages(res.data.total_pages || 1);
        setTotalItems(res.data.total_records || 0);
      }
    } catch (err) { 
      console.error('Gagal mengambil laporan:', err); 
    } finally { 
      setIsLoading(false); 
    }
  }, [currentPage, itemsPerPage, searchQuery, startDate, endDate, statusFilter]);

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, [fetchReports]);

  // Quick stats derived from loaded records
  const stats = useMemo(() => {
    let onTime = 0, late = 0, absent = 0;
    reports.forEach(r => {
      if (r.status_masuk === 'ON_TIME') onTime++;
      else if (r.status_masuk === 'LATE') late++;
      else if (r.status_masuk === 'ABSENT') absent++;
    });
    return { onTime, late, absent };
  }, [reports]);

  const handleFilterChange = (setter) => (e) => { setter(e.target.value); setCurrentPage(1); };
  const handleResetFilters = () => { setSearchQuery(''); setStartDate(''); setEndDate(''); setStatusFilter(''); setCurrentPage(1); };
  const handleItemsPerPageChange = (e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); };

  const handleExportCSV = async () => {
    if (totalItems === 0) return alert('Tidak ada data untuk di-export');
    setIsExporting(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = {
        page: 1,
        limit: 99999,
        role: 'asn',
      };
      if (searchQuery) params.search_name = searchQuery;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (statusFilter) params.status_filter = statusFilter;

      const res = await axios.get('http://127.0.0.1:5000/api/report', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      const allData = Array.isArray(res.data) ? res.data : (res.data.data || []);

      if (allData.length === 0) return alert('Tidak ada data untuk di-export');

      let csv = 'NIP,Tipe,Nama,Tanggal,Jam Masuk,Status Masuk,Keterlambatan,Jam Keluar,Status Keluar,Lokasi\n';
      allData.forEach(r => {
        const ket = r.status_masuk === 'LATE' && r.keterlambatan_menit > 0 ? `Terlambat ${r.keterlambatan_menit} Menit` : 'Tepat Waktu';
        csv += `${r.nip},ASN,"${r.nama}",${r.tanggal},${r.jam_masuk || '-'},${r.status_masuk === 'ABSENT' ? 'Tidak Hadir' : ket},${r.keterlambatan_menit || 0},${r.jam_keluar || '-'},${r.status_keluar || '-'},"${r.nama_lokasi || r.device_sn || '-'}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Laporan_Presensi_ASN_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (err) { 
      alert('Gagal export: ' + (err.response?.data?.error || err.message)); 
    } finally { 
      setIsExporting(false); 
    }
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
    try { 
      return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); 
    } catch { 
      return d; 
    }
  };

  const hasActiveFilters = searchQuery || startDate || endDate || statusFilter;

  return (
    <div className="space-y-6">
      
      {/* ── BENTO HEADER & METRIC SUMMARY ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Title & Total */}
        <div className="sm:col-span-2 lg:col-span-1 glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Rekap ASN
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {totalItems.toLocaleString('id-ID')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Entri log presensi terfilter</p>
          </div>
        </div>

        {/* Metric 2: Tepat Waktu */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Tepat Waktu
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-emerald-700">
              {stats.onTime} <span className="text-xs font-normal text-slate-400">di halaman ini</span>
            </p>
            <p className="text-xs text-emerald-600/80 mt-0.5 font-medium">Presensi sesuai jam</p>
          </div>
        </div>

        {/* Metric 3: Terlambat */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
              Terlambat
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-red-600">
              {stats.late} <span className="text-xs font-normal text-slate-400">di halaman ini</span>
            </p>
            <p className="text-xs text-red-500/80 mt-0.5 font-medium">Perlu perhatian admin</p>
          </div>
        </div>

        {/* Metric 4: Tidak Hadir */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Tidak Hadir
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <XCircle size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-700">
              {stats.absent} <span className="text-xs font-normal text-slate-400">di halaman ini</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Tanpa scan presensi</p>
          </div>
        </div>

      </div>

      {/* ── BENTO CARD: FILTER & ACTION TOOLBAR ── */}
      <div className="glass-panel p-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          
          {/* Filters Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 flex-1">
            
            {/* Search */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Pencarian
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Cari NIP atau Nama..." 
                  value={searchQuery} 
                  onChange={handleFilterChange(setSearchQuery)}
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all shadow-soft-xs" 
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Tanggal Mulai
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={handleFilterChange(setStartDate)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all shadow-soft-xs" 
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Tanggal Akhir
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={handleFilterChange(setEndDate)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all shadow-soft-xs" 
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Status Kehadiran
              </label>
              <div className="relative">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  value={statusFilter} 
                  onChange={handleFilterChange(setStatusFilter)}
                  className="w-full pl-10 pr-8 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none appearance-none cursor-pointer transition-all shadow-soft-xs"
                >
                  <option value="">Semua Status</option>
                  <option value="ON_TIME">Tepat Waktu</option>
                  <option value="LATE">Terlambat</option>
                  <option value="ABSENT">Tidak Hadir</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={16} />
              </div>
            </div>

          </div>

          {/* Action Buttons: Reset & Export */}
          <div className="flex items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
            {hasActiveFilters && (
              <button 
                onClick={handleResetFilters} 
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition-all shadow-soft-xs active:scale-[0.98]"
              >
                <RotateCcw size={15} />
                Reset
              </button>
            )}

            <button 
              onClick={handleExportCSV} 
              disabled={isExporting} 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  <span>Exporting...</span>
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

      {/* ── BENTO CARD: DATA TABLE ── */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-5 py-4 w-12 text-center">#</th>
                <th className="px-5 py-4">Pegawai ASN</th>
                <th className="px-5 py-4">Tanggal</th>
                <th className="px-5 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    <span>Masuk</span>
                  </div>
                </th>
                <th className="px-5 py-4 text-center">Status Masuk</th>
                <th className="px-5 py-4 text-center">Keterangan</th>
                <th className="px-5 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    <span>Keluar</span>
                  </div>
                </th>
                <th className="px-5 py-4 text-center">Status Keluar</th>
                <th className="px-5 py-4 text-center">
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
                  <td colSpan="9" className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-9 h-9 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"/>
                      <span className="text-slate-400 text-sm font-medium">Memuat data presensi ASN...</span>
                    </div>
                  </td>
                </tr>
              ) : reports.length > 0 ? (
                reports.map((row, idx) => {
                  const isAbsent = row.status_masuk === 'ABSENT';
                  const isLate = row.status_masuk === 'LATE';
                  const isCheckedOut = Boolean(row.jam_keluar);

                  return (
                    <tr 
                      key={`${row.nip}-${row.tanggal}-${idx}`} 
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="px-5 py-4 text-center text-xs font-mono text-slate-400">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>

                      {/* Identitas ASN */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm leading-snug">
                            {row.nama}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-xs text-slate-500 font-medium tracking-tight">
                              {row.nip}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                              ASN
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tanggal */}
                      <td className="px-5 py-4 text-slate-700 text-sm font-medium whitespace-nowrap">
                        {formatTanggal(row.tanggal)}
                      </td>

                      {/* Jam Masuk */}
                      <td className="px-5 py-4 text-center">
                        {row.jam_masuk ? (
                          <span className="font-mono font-bold text-slate-900 bg-slate-100/80 px-2 py-1 rounded-lg border border-slate-200/60">
                            {row.jam_masuk}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>

                      {/* Status Masuk */}
                      <td className="px-5 py-4 text-center">
                        {isAbsent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                            <XCircle size={12} /> Tidak Hadir
                          </span>
                        ) : row.jam_masuk ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${
                            isLate 
                              ? 'bg-red-50 text-red-600 ring-red-200' 
                              : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          }`}>
                            {isLate ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                            {isLate ? 'Terlambat' : 'Masuk'}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Keterangan */}
                      <td className="px-5 py-4 text-center">
                        {isAbsent ? (
                          <span className="text-xs text-slate-400 italic">Tidak Absen</span>
                        ) : isLate && row.keterlambatan_menit > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold text-red-600 bg-red-50 border border-red-100">
                            Terlambat {row.keterlambatan_menit} Menit
                          </span>
                        ) : row.jam_masuk ? (
                          <span className="text-xs font-semibold text-emerald-600">Tepat Waktu</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Jam Keluar */}
                      <td className="px-5 py-4 text-center">
                        {row.jam_keluar ? (
                          <span className="font-mono font-bold text-slate-900 bg-slate-100/80 px-2 py-1 rounded-lg border border-slate-200/60">
                            {row.jam_keluar}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>

                      {/* Status Keluar */}
                      <td className="px-5 py-4 text-center">
                        {isCheckedOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 ring-1 ring-orange-200">
                            <CheckCircle2 size={12} /> Sudah Pulang
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-400 ring-1 ring-slate-200">
                            Belum Absen
                          </span>
                        )}
                      </td>

                      {/* Lokasi */}
                      <td className="px-5 py-4 text-center">
                        {(row.nama_lokasi || row.device_sn) ? (
                          <span className="inline-flex items-center gap-1.5 bg-indigo-50/80 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-xl border border-indigo-100 shadow-soft-xs">
                            <MapPin size={12} className="text-indigo-500" />
                            <span className="max-w-[140px] truncate">{row.nama_lokasi || row.device_sn}</span>
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
                  <td colSpan="9" className="text-center py-20">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                        <Search size={22} />
                      </div>
                      <p className="text-slate-700 font-bold text-base">Tidak ada data presensi ditemukan</p>
                      <p className="text-slate-400 text-xs max-w-sm">
                        Coba sesuaikan tanggal atau kriteria pencarian untuk melihat data presensi lainnya.
                      </p>
                      {hasActiveFilters && (
                        <button 
                          onClick={handleResetFilters} 
                          className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 underline"
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
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-500 font-medium">
              Menampilkan baris <span className="font-bold text-slate-800">{reports.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span>-
              <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, totalItems)}</span> dari <span className="font-bold text-slate-800">{totalItems}</span>
            </p>
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <label className="text-xs text-slate-400 font-medium">Baris:</label>
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
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-soft-xs"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              {getPageNumbers().map((pg, i) => pg === '...' ? (
                <span key={`dots-${i}`} className="px-2 text-slate-400 text-xs">···</span>
              ) : (
                <button 
                  key={pg} 
                  onClick={() => setCurrentPage(pg)} 
                  className={`min-w-[32px] h-[32px] flex items-center justify-center text-xs font-bold rounded-lg transition-all ${
                    currentPage === pg 
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30' 
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pg}
                </button>
              ))}

              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => p + 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-soft-xs"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ReportAsn;
