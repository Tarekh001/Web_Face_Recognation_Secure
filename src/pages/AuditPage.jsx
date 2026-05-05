import { useState, useEffect } from 'react';
import axios from 'axios';
import { History, Lock } from 'lucide-react';

const API = 'http://127.0.0.1:5000/api';

const AuditPage = () => {
  const [logs, setLogs] = useState([]);

  const token = localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(`${API}/audit-logs`, { headers });
        setLogs(res.data);
      } catch (err) { console.error('Gagal mengambil audit logs', err); }
    };
    fetchLogs();
  }, []);

  const badgeColor = (action) => {
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700';
    if (action.includes('UPDATE') || action.includes('RE_REGISTER')) return 'bg-yellow-100 text-yellow-700';
    if (action.includes('ADD') || action.includes('REGISTER') || action.includes('BIND')) return 'bg-green-100 text-green-700';
    if (action.includes('APPROVE')) return 'bg-emerald-100 text-emerald-700';
    if (action.includes('REJECT')) return 'bg-orange-100 text-orange-700';
    return 'bg-gray-200 text-gray-700';
  };

  return (
    <div className="p-8 w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2"><History size={24} /> Audit Trail</h1>
          <p className="text-gray-500 text-sm mt-1">Riwayat aktivitas sistem (100 terakhir)</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
          <Lock size={12} /> Read Only — Log tidak bisa diubah
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="p-4 border-b font-semibold w-16">#</th>
              <th className="p-4 border-b font-semibold whitespace-nowrap">Waktu</th>
              <th className="p-4 border-b font-semibold">Aksi</th>
              <th className="p-4 border-b font-semibold">Tabel Target</th>
              <th className="p-4 border-b font-semibold">Keterangan Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={log.log_id} className="border-b border-gray-50 hover:bg-blue-50/30 transition">
                <td className="p-4 text-gray-400">{i + 1}</td>
                <td className="p-4 text-blue-600 font-medium whitespace-nowrap">{log.waktu}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badgeColor(log.action)}`}>{log.action}</span>
                </td>
                <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{log.target}</span></td>
                <td className="p-4 text-gray-600 max-w-md truncate" title={log.detail}>{log.detail}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">Belum ada log aktivitas.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditPage;
