import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import API_BASE from '../config/api';
import { History, Lock, Search, RefreshCw } from 'lucide-react';
import {
  TableLoadingRow,
  TableErrorRow,
  TablePaginationBar,
} from '../components/UiFeedback';

const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchLogs = useCallback(async () => {
    setIsFetching(true);
    setErrorMsg('');
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.get(`${API_BASE}/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Gagal mengambil audit logs', err);
      setErrorMsg(
        err.response?.data?.error || 'Tidak dapat memuat rekaman log audit dari server.'
      );
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter(
      (l) =>
        (l.action || '').toLowerCase().includes(q) ||
        (l.target || '').toLowerCase().includes(q) ||
        (l.detail || '').toLowerCase().includes(q)
    );
  }, [logs, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLogs = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, safePage, itemsPerPage]);

  const badgeColor = (action = '') => {
    if (action.includes('DELETE') || action.includes('REJECT')) {
      return 'bg-red-50 text-red-800 border-red-300';
    }
    if (action.includes('UPDATE') || action.includes('RE_REGISTER')) {
      return 'bg-amber-50 text-amber-900 border-amber-300';
    }
    if (
      action.includes('ADD') ||
      action.includes('REGISTER') ||
      action.includes('BIND') ||
      action.includes('ELEVATE')
    ) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    }
    if (action.includes('APPROVE')) {
      return 'bg-blue-50 text-blue-800 border-blue-300';
    }
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  return (
    <div className="w-full space-y-5">
      {/* Header Standar Konfigurasi */}
      <div className="surface-card p-5 sm:px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <History size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight tabular-nums">
              Riwayat Aktivitas Sistem ({filteredLogs.length})
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Rekaman perubahan konfigurasi dan kepegawaian untuk kebutuhan pengawasan keamanan
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-bold text-slate-800 bg-slate-100 border border-slate-300 px-3.5 py-2 rounded-lg">
            <Lock size={13} aria-hidden="true" />
            <span>Log Audit (Baca Saja)</span>
          </span>
          <button type="button" onClick={fetchLogs} className="gov-btn-secondary text-xs">
            <RefreshCw size={14} aria-hidden="true" />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>

      {/* Tabel Standar Konfigurasi */}
      <div className="surface-card overflow-hidden">
        <div className="gov-table-toolbar">
          <div className="w-full sm:w-80">
            <label htmlFor="audit-search-input" className="sr-only">
              Filter Aksi, Tabel, atau Keterangan Log Audit
            </label>
            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                size={16}
                aria-hidden="true"
              />
              <input
                id="audit-search-input"
                type="text"
                placeholder="Filter aksi, tabel, atau keterangan..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="gov-input pl-9"
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-700 tabular-nums">
            Total <b className="text-slate-900">{filteredLogs.length}</b> rekaman aktivitas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="gov-table min-w-[820px]">
            <thead>
              <tr>
                <th className="w-14 text-center">No</th>
                <th className="w-48 whitespace-nowrap">Waktu Kejadian</th>
                <th className="w-44">Aksi</th>
                <th className="w-44">Tabel Target</th>
                <th>Keterangan Detail</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                <TableLoadingRow colSpan={5} label="Memuat rekaman log aktivitas sistem..." />
              ) : errorMsg ? (
                <TableErrorRow colSpan={5} message={errorMsg} onRetry={fetchLogs} />
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 px-4 text-center">
                    <p className="text-sm font-bold text-slate-900">
                      {searchQuery
                        ? 'Rekaman Log Tidak Ditemukan'
                        : 'Belum Ada Rekaman Aktivitas'}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {searchQuery
                        ? `Tidak ada aksi atau keterangan yang cocok dengan "${searchQuery}".`
                        : 'Perubahan konfigurasi dan data pegawai akan tercatat secara otomatis pada halaman ini.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, i) => (
                  <tr key={log.log_id || i}>
                    <td className="text-center text-xs font-mono text-slate-600 tabular-nums">
                      {(safePage - 1) * itemsPerPage + i + 1}
                    </td>
                    <td className="text-blue-800 font-mono text-xs font-semibold whitespace-nowrap tabular-nums">
                      {log.waktu || log.created_at || '-'}
                    </td>
                    <td>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border ${badgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md text-xs font-mono border border-slate-300">
                        {log.target || log.actor || '-'}
                      </span>
                    </td>
                    <td className="text-slate-700 text-xs sm:text-sm" title={log.detail || log.details}>
                      {log.detail || log.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePaginationBar
          currentPage={safePage}
          totalItems={filteredLogs.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
          unitLabel="rekaman"
        />
      </div>
    </div>
  );
};

export default AuditPage;
