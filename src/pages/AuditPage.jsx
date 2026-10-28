import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import API_BASE from '../config/api';
import { History, Lock, Search } from 'lucide-react';

const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const token = localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(`${API_BASE}/audit-logs`, { headers });
        setLogs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Gagal mengambil audit logs', err);
      }
    };
    fetchLogs();
  }, []);

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

  const badgeColor = (action = '') => {
    if (action.includes('DELETE')) return 'bg-red-50 text-red-700 ring-red-200';
    if (action.includes('UPDATE') || action.includes('RE_REGISTER')) return 'bg-amber-50 text-amber-700 ring-amber-200';
    if (action.includes('ADD') || action.includes('REGISTER') || action.includes('BIND') || action.includes('ELEVATE'))
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    if (action.includes('APPROVE')) return 'bg-blue-50 text-blue-700 ring-blue-200';
    if (action.includes('REJECT')) return 'bg-orange-50 text-orange-700 ring-orange-200';
    return 'bg-slate-100 text-slate-700 ring-slate-200';
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <History size={20} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Riwayat Aktivitas Sistem ({filteredLogs.length})
            </h2>
            <p className="text-xs text-slate-500">100 rekaman perubahan terakhir untuk kebutuhan pengawasan keamanan</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full">
          <Lock size={12} /> Read-Only Audit Log
        </span>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-200/80 bg-white/60">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Filter aksi, tabel, atau keterangan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-4 py-3.5 w-14 text-center">#</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Waktu</th>
                <th className="px-4 py-3.5">Aksi</th>
                <th className="px-4 py-3.5">Tabel Target</th>
                <th className="px-4 py-3.5">Keterangan Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map((log, i) => (
                <tr key={log.log_id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3.5 text-center text-xs font-mono text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3.5 text-blue-700 font-mono text-xs font-semibold whitespace-nowrap">
                    {log.waktu}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ring-1 ${badgeColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-xs font-mono border border-slate-200/70">
                      {log.target}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 text-xs sm:text-sm max-w-md truncate" title={log.detail}>
                    {log.detail}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    Belum ada log aktivitas yang sesuai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditPage;
