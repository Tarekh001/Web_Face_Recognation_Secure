import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import API_BASE from '../config/api';
import {
  MonitorSmartphone,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
  X,
  Info,
  Unlink,
  Search,
  Shield,
  ShieldOff,
} from 'lucide-react';

const DevicePage = () => {
  const [devices, setDevices] = useState([]);
  const [opds, setOpds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDevices = useMemo(() => {
    if (!searchQuery.trim()) return devices;
    const q = searchQuery.toLowerCase();
    return devices.filter(
      (d) =>
        (d.sn || '').toLowerCase().includes(q) ||
        (d.lokasi || '').toLowerCase().includes(q) ||
        (d.device_name || '').toLowerCase().includes(q) ||
        (d.opd || '').toLowerCase().includes(q)
    );
  }, [devices, searchQuery]);

  const token = localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const [resDev, resOpd] = await Promise.all([
        axios.get(`${API_BASE}/devices`, { headers }),
        axios.get(`${API_BASE}/opd`, { headers }),
      ]);
      setDevices(Array.isArray(resDev.data) ? resDev.data : []);
      setOpds(Array.isArray(resOpd.data) ? resOpd.data : []);
    } catch (err) {
      console.error('Gagal mengambil data device', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUnbind = async (sn) => {
    if (
      !confirm(
        `Yakin ingin melepas perangkat "${sn}" dari instansi?\n\nPerangkat akan ter-logout otomatis dari kiosk.`
      )
    )
      return;
    setIsLoading(true);
    try {
      const res = await axios.put(`${API_BASE}/devices/${sn}/unbind`, {}, { headers });
      alert(res.data.message || 'Device berhasil dilepas!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal melepas device');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editModal) return;
    setIsLoading(true);
    try {
      await axios.put(`${API_BASE}/devices/${editModal.sn}`, editModal, { headers });
      alert('Device berhasil diperbarui!');
      setEditModal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memperbarui device');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (sn) => {
    if (
      !confirm(
        `Yakin ingin HAPUS PERMANEN Device "${sn}"?\n\nData presensi terkait akan terhapus.`
      )
    )
      return;
    try {
      await axios.delete(`${API_BASE}/devices/${sn}`, { headers });
      alert(`Device "${sn}" berhasil dihapus!`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus device');
    }
  };

  const activeCount = devices.filter((d) => d.verified).length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <MonitorSmartphone size={20} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Konfigurasi Mesin Kiosk ({devices.length})
            </h2>
            <p className="text-xs text-slate-500">
              Pemantauan perangkat terminal biometrik, status ikatan OPD, dan proteksi Anti-Spoofing
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs font-bold text-emerald-700">
          <CheckCircle size={15} />
          <span>{activeCount} Mesin Terverifikasi</span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50/80 border border-blue-200/80 p-4 rounded-2xl flex items-start gap-3">
        <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-800 leading-relaxed">
          Perangkat didaftarkan otomatis saat Admin login pertama kali pada aplikasi Kiosk Mobile.
          Gunakan tombol <b>Unbind</b> untuk melepas perangkat dari instansi (perangkat akan meminta
          aktivasi ulang).
        </p>
      </div>

      {/* Search + Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-200/80 bg-white/60 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari SN, Lokasi, Nama Device, atau OPD..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Menampilkan <b className="text-slate-800">{filteredDevices.length}</b> perangkat
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-4 py-3.5 whitespace-nowrap">SN Mesin</th>
                <th className="px-4 py-3.5">Instansi (OPD)</th>
                <th className="px-4 py-3.5">Lokasi Penempatan</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Terdaftar Oleh</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Terakhir Aktif</th>
                <th className="px-4 py-3.5 text-center">Anti-Spoof</th>
                <th className="px-4 py-3.5 text-center w-40 sticky right-0 bg-slate-50/95">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDevices.map((d) => (
                <tr key={d.sn} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/80">
                      {d.sn}
                    </span>
                    {d.device_name && (
                      <div className="text-[11px] text-slate-400 mt-1 font-medium">{d.device_name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">
                    {d.opd || <span className="text-slate-400 italic font-normal">Tidak terikat</span>}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 text-xs">{d.lokasi || '—'}</td>
                  <td className="px-4 py-3.5">
                    {d.verified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 font-bold text-[11px]">
                        <CheckCircle size={13} /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200 font-bold text-[11px]">
                        <XCircle size={13} /> Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {d.registered_by_name ? (
                      <span className="text-xs font-semibold text-slate-700">{d.registered_by_name}</span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap font-mono">
                    {d.last_activity || 'Belum pernah'}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {d.anti_spoofing_enabled !== false ? (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        title="Anti-Spoofing aktif"
                      >
                        <Shield size={12} /> Aktif
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                        title="Anti-Spoofing dinonaktifkan"
                      >
                        <ShieldOff size={12} /> Off
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center sticky right-0 bg-white/95">
                    <div className="flex justify-center items-center gap-1">
                      {d.verified && d.opd && (
                        <button
                          type="button"
                          onClick={() => handleUnbind(d.sn)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 ring-1 ring-amber-200 rounded-xl transition cursor-pointer"
                          title="Lepas ikatan OPD"
                        >
                          <Unlink size={12} /> Unbind
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setEditModal({
                            sn: d.sn,
                            name: d.name || '',
                            nama_lokasi: d.lokasi || '',
                            opd_id: d.opd_id || '',
                            verified: d.verified,
                            anti_spoofing_enabled: d.anti_spoofing_enabled !== false,
                          })
                        }
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                        title="Edit Perangkat"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(d.sn)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        title="Hapus Permanen"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDevices.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 text-sm">
                    {searchQuery ? 'Perangkat tidak ditemukan.' : 'Belum ada perangkat terdaftar.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setEditModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-4 mb-5 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Edit Perangkat — <span className="font-mono text-blue-600">{editModal.sn}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                  Nama Perangkat
                </label>
                <input
                  type="text"
                  value={editModal.name}
                  onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                  Lokasi Penempatan
                </label>
                <input
                  type="text"
                  value={editModal.nama_lokasi}
                  onChange={(e) => setEditModal({ ...editModal, nama_lokasi: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                  Instansi OPD
                </label>
                <select
                  value={editModal.opd_id}
                  onChange={(e) => setEditModal({ ...editModal, opd_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-sm"
                >
                  <option value="">— Tidak Terikat —</option>
                  {opds.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editModal.verified}
                    onChange={(e) => setEditModal({ ...editModal, verified: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm font-bold text-slate-700">Status Terverifikasi (Aktif)</span>
                </label>
              </div>
            </div>

            {/* Anti-Spoofing Toggle */}
            <div
              className={`mt-5 rounded-2xl border p-4 transition-all ${
                editModal.anti_spoofing_enabled
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : 'border-amber-200 bg-amber-50/40'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      editModal.anti_spoofing_enabled
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {editModal.anti_spoofing_enabled ? <Shield size={20} /> : <ShieldOff size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Fitur Anti-Spoofing (Liveness)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Analisis multi-frame untuk mencegah kecurangan foto cetak maupun layar digital.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditModal({
                      ...editModal,
                      anti_spoofing_enabled: !editModal.anti_spoofing_enabled,
                    })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 cursor-pointer ${
                    editModal.anti_spoofing_enabled ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                      editModal.anti_spoofing_enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p
                className={`mt-2.5 text-[11px] font-semibold ${
                  editModal.anti_spoofing_enabled ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {editModal.anti_spoofing_enabled
                  ? 'Proteksi Liveness aktif — perangkat terlindungi dari serangan presentasi.'
                  : 'Perhatian: Liveness detection dimatikan khusus untuk perangkat ini.'}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevicePage;
