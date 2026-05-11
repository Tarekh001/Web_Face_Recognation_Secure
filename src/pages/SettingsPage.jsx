import { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Clock, CalendarOff, Save, Plus, Trash2, X, AlertTriangle } from 'lucide-react';

const API = 'http://127.0.0.1:5000/api';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('jam_kerja');
  const token = localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}` };

  // ── JAM KERJA STATE ──
  const [settings, setSettings] = useState({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // ── HARI LIBUR STATE ──
  const [holidays, setHolidays] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ tanggal: '', keterangan: '' });
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);

  // ── FETCH ──
  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/settings`, { headers });
      const map = {};
      res.data.forEach(s => { map[s.key] = s.value; });
      setSettings(map);
      setSettingsLoaded(true);
    } catch (err) { console.error('Gagal mengambil pengaturan', err); }
  };

  const fetchHolidays = async () => {
    try {
      const res = await axios.get(`${API}/holidays`, { headers });
      setHolidays(res.data);
    } catch (err) { console.error('Gagal mengambil data hari libur', err); }
  };

  useEffect(() => { fetchSettings(); fetchHolidays(); }, []);

  // ── SAVE SETTINGS ──
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await axios.put(`${API}/settings`, settings, { headers, 'Content-Type': 'application/json' });
      alert('✅ Pengaturan jam kerja berhasil disimpan!');
      fetchSettings();
    } catch (err) { alert('❌ Gagal: ' + (err.response?.data?.error || 'Error')); }
    finally { setIsSavingSettings(false); }
  };

  // ── ADD HOLIDAY ──
  const handleAddHoliday = async () => {
    if (!newHoliday.tanggal || !newHoliday.keterangan.trim()) return alert('Tanggal dan keterangan wajib diisi.');
    setIsAddingHoliday(true);
    try {
      await axios.post(`${API}/holidays`, newHoliday, { headers });
      alert('✅ Hari libur berhasil ditambahkan!');
      setNewHoliday({ tanggal: '', keterangan: '' });
      setShowAddModal(false);
      fetchHolidays();
    } catch (err) { alert('❌ Gagal: ' + (err.response?.data?.error || 'Error')); }
    finally { setIsAddingHoliday(false); }
  };

  // ── DELETE HOLIDAY ──
  const handleDeleteHoliday = async (id, ket) => {
    if (!confirm(`Hapus hari libur "${ket}"?`)) return;
    try {
      await axios.delete(`${API}/holidays/${id}`, { headers });
      setHolidays(prev => prev.filter(h => h.id !== id));
    } catch (err) { alert('❌ Gagal: ' + (err.response?.data?.error || 'Error')); }
  };

  const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const formatDate = (d) => {
    try { return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return d; }
  };

  const settingFields = [
    { key: 'JAM_MASUK_MULAI',  label: 'Jam Mulai Masuk',    icon: '🟢', desc: 'Kiosk mulai menerima scan masuk' },
    { key: 'BATAS_TERLAMBAT',  label: 'Batas Tepat Waktu',  icon: '⏰', desc: 'Lewat jam ini → dianggap TERLAMBAT' },
    { key: 'JAM_MASUK_AKHIR',  label: 'Jam Akhir Masuk',    icon: '🔴', desc: 'Kiosk berhenti menerima scan masuk' },
    { key: 'JAM_KELUAR_MULAI', label: 'Jam Mulai Pulang',   icon: '🟢', desc: 'Kiosk mulai menerima scan pulang' },
    { key: 'JAM_KELUAR_AKHIR', label: 'Jam Akhir Pulang',   icon: '🔴', desc: 'Kiosk berhenti menerima scan pulang' },
  ];

  const tabs = [
    { id: 'jam_kerja', label: 'Jam Kerja', icon: <Clock size={16} /> },
    { id: 'hari_libur', label: 'Hari Libur Custom', icon: <CalendarOff size={16} /> },
  ];

  return (
    <div className="p-8 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2"><Settings size={24} /> Pengaturan Sistem</h1>
        <p className="text-gray-500 text-sm mt-1">Konfigurasi jam kerja & hari libur custom</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-max">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>{t.icon}{t.label}</button>
        ))}
      </div>

      {/* ── TAB 1: JAM KERJA ── */}
      {activeTab === 'jam_kerja' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Clock size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-800">Pengaturan Jam Kerja</h2>
          </div>

          {/* Info Banner */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 mb-6">
            <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">Perubahan jam kerja akan langsung berlaku pada <b>scan presensi berikutnya</b>. Pastikan format waktu benar (HH:MM:SS).</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {settingFields.map(f => (
              <div key={f.key} className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <span>{f.icon}</span> {f.label}
                </label>
                <input type="time" step="1" value={(settings[f.key] || '').substring(0, 8)}
                  onChange={e => updateSetting(f.key, e.target.value + (e.target.value.length === 5 ? ':00' : ''))}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg text-center bg-gray-50"
                />
                <p className="text-[10px] text-gray-400 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button onClick={handleSaveSettings} disabled={isSavingSettings || !settingsLoaded}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition shadow-md disabled:bg-blue-300 disabled:cursor-not-allowed">
              <Save size={18} />{isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 2: HARI LIBUR ── */}
      {activeTab === 'hari_libur' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarOff size={20} className="text-red-500" />
              <h2 className="text-lg font-bold text-gray-800">Hari Libur Custom</h2>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">{holidays.length} data</span>
            </div>
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition shadow-sm">
              <Plus size={16} /> Tambah Libur
            </button>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border-b border-blue-100 p-3 px-5">
            <p className="text-[11px] text-blue-600">Daftar ini untuk hari libur yang <b>tidak tercakup</b> oleh library Hari Libur Nasional Indonesia (mis: Cuti Bersama, Libur Khusus Daerah).</p>
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs">
                <th className="p-4 border-b font-semibold w-12">#</th>
                <th className="p-4 border-b font-semibold">Tanggal</th>
                <th className="p-4 border-b font-semibold">Keterangan</th>
                <th className="p-4 border-b font-semibold text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((h, i) => (
                <tr key={h.id} className="border-b border-gray-50 hover:bg-red-50/30 transition">
                  <td className="p-4 text-gray-400">{i + 1}</td>
                  <td className="p-4">
                    <span className="font-mono text-sm font-bold text-gray-700">{h.tanggal}</span>
                    <div className="text-[10px] text-gray-400 mt-0.5">{formatDate(h.tanggal)}</div>
                  </td>
                  <td className="p-4 text-gray-800 font-medium">{h.keterangan}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleDeleteHoliday(h.id, h.keterangan)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition" title="Hapus">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {holidays.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Belum ada data hari libur custom.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ADD HOLIDAY MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-800">Tambah Hari Libur</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Tanggal <span className="text-red-400">*</span></label>
                <input type="date" value={newHoliday.tanggal} onChange={e => setNewHoliday({ ...newHoliday, tanggal: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Keterangan <span className="text-red-400">*</span></label>
                <input type="text" placeholder="Cuti Bersama Idul Fitri" value={newHoliday.keterangan}
                  onChange={e => setNewHoliday({ ...newHoliday, keterangan: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <button onClick={handleAddHoliday} disabled={isAddingHoliday}
                className="bg-red-500 text-white font-bold p-2.5 rounded-lg hover:bg-red-600 transition disabled:bg-red-300">
                {isAddingHoliday ? 'Menyimpan...' : 'Simpan Hari Libur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
