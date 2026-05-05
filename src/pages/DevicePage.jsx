import { useState, useEffect } from 'react';
import axios from 'axios';
import { MonitorSmartphone, Wifi, WifiOff, CheckCircle, XCircle, Pencil, Trash2, X, Info, Unlink } from 'lucide-react';

const API = 'http://127.0.0.1:5000/api';

const DevicePage = () => {
  const [devices, setDevices] = useState([]);
  const [opds, setOpds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editModal, setEditModal] = useState(null);

  const token = localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const [resDev, resOpd] = await Promise.all([
        axios.get(`${API}/devices`, { headers }),
        axios.get(`${API}/opd`, { headers }),
      ]);
      setDevices(resDev.data);
      setOpds(resOpd.data);
    } catch (err) { console.error('Gagal mengambil data device', err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUnbind = async (sn) => {
    if (!confirm(`Yakin ingin melepas perangkat "${sn}" dari instansi?\n\nPerangkat akan ter-logout otomatis dari kiosk.`)) return;
    setIsLoading(true);
    try {
      const res = await axios.put(`${API}/devices/${sn}/unbind`, {}, { headers });
      alert(res.data.message || 'Device berhasil dilepas!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal melepas device');
    } finally { setIsLoading(false); }
  };

  const handleUpdate = async () => {
    if (!editModal) return;
    setIsLoading(true);
    try {
      await axios.put(`${API}/devices/${editModal.sn}`, editModal, { headers });
      alert('Device berhasil diperbarui!');
      setEditModal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memperbarui device');
    } finally { setIsLoading(false); }
  };

  const handleDelete = async (sn) => {
    if (!confirm(`Yakin ingin HAPUS PERMANEN Device "${sn}"?\n\nData presensi terkait akan terhapus.`)) return;
    try {
      await axios.delete(`${API}/devices/${sn}`, { headers });
      alert(`Device "${sn}" berhasil dihapus!`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus device');
    }
  };

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2"><MonitorSmartphone size={24} /> Data Perangkat</h1>
          <p className="text-gray-500 text-sm mt-1">Daftar mesin kiosk yang terdaftar di sistem</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3 mb-6">
        <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">Perangkat didaftarkan otomatis saat Admin login di Kiosk Mobile. Gunakan <b>Unbind</b> untuk melepas perangkat dari instansi (perangkat perlu aktivasi ulang).</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="p-4 border-b font-semibold">SN Mesin</th>
              <th className="p-4 border-b font-semibold">Instansi (OPD)</th>
              <th className="p-4 border-b font-semibold">Lokasi</th>
              <th className="p-4 border-b font-semibold">Status</th>
              <th className="p-4 border-b font-semibold">Terdaftar Oleh</th>
              <th className="p-4 border-b font-semibold">Terakhir Aktif</th>
              <th className="p-4 border-b font-semibold text-center w-40">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {devices.map(d => (
              <tr key={d.sn} className="border-b border-gray-50 hover:bg-blue-50/30 transition">
                <td className="p-4">
                  <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">{d.sn}</span>
                  {d.device_name && <div className="text-[10px] text-gray-400 mt-1">{d.device_name}</div>}
                </td>
                <td className="p-4 font-semibold text-gray-700">{d.opd || <span className="text-gray-400 italic">Tidak terikat</span>}</td>
                <td className="p-4 text-gray-600">{d.lokasi || '-'}</td>
                <td className="p-4">
                  {d.verified
                    ? <span className="flex items-center gap-1 text-green-600 font-semibold text-xs"><CheckCircle size={14} /> Aktif</span>
                    : <span className="flex items-center gap-1 text-red-500 font-semibold text-xs"><XCircle size={14} /> Nonaktif</span>}
                </td>
                <td className="p-4">{d.registered_by_name ? <span className="text-xs font-medium text-gray-700">{d.registered_by_name}</span> : <span className="text-gray-400 text-xs">—</span>}</td>
                <td className="p-4 text-xs text-gray-500 whitespace-nowrap">{d.last_activity || 'Belum pernah'}</td>
                <td className="p-4 text-center">
                  <div className="flex justify-center gap-1">
                    {/* Unbind Button — melepas ikatan */}
                    {d.verified && d.opd && (
                      <button
                        onClick={() => handleUnbind(d.sn)}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-lg transition"
                        title="Lepas ikatan perangkat"
                      >
                        <Unlink size={13} /> Unbind
                      </button>
                    )}
                    <button onClick={() => setEditModal({ sn: d.sn, name: d.name || '', nama_lokasi: d.lokasi || '', opd_id: d.opd_id || '', verified: d.verified })} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Edit"><Pencil size={15} /></button>
                    <button onClick={() => handleDelete(d.sn)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition" title="Hapus Permanen"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {devices.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">Belum ada perangkat terdaftar.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-800">Edit Device — <span className="font-mono text-blue-600">{editModal.sn}</span></h3>
              <button onClick={() => setEditModal(null)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Nama Device</label>
                <input type="text" value={editModal.name} onChange={e => setEditModal({...editModal, name: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Lokasi</label>
                <input type="text" value={editModal.nama_lokasi} onChange={e => setEditModal({...editModal, nama_lokasi: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Instansi</label>
                <select value={editModal.opd_id} onChange={e => setEditModal({...editModal, opd_id: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">-</option>
                  {opds.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editModal.verified} onChange={e => setEditModal({...editModal, verified: e.target.checked})} className="w-4 h-4 rounded" />
                  <span className="text-sm font-semibold text-gray-700">Verified</span>
                </label>
              </div>
            </div>
            <button onClick={handleUpdate} disabled={isLoading} className="mt-5 w-full bg-blue-600 text-white font-bold p-2.5 rounded-lg hover:bg-blue-700 transition">{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevicePage;
