import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Settings, Clock, CalendarOff, Save, Plus, Trash2, X, 
  AlertTriangle, Calendar, Info, CheckCircle2, ShieldAlert
} from 'lucide-react';

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
      const map = {
        JAM_MASUK_MULAI: '06:00:00',
        BATAS_TERLAMBAT: '08:00:00',
        JAM_MASUK_AKHIR: '12:00:00',
        JAM_KELUAR_MULAI: '15:00:00',
        JAM_KELUAR_AKHIR: '20:00:00',
      };

      if (Array.isArray(res.data)) {
        res.data.forEach(s => {
          if (s && s.key) map[s.key] = s.value;
        });
      } else if (res.data && typeof res.data === 'object') {
        Object.entries(res.data).forEach(([k, v]) => {
          map[k] = (typeof v === 'object' && v !== null && 'value' in v) ? v.value : v;
        });
      }

      setSettings(map);
      setSettingsLoaded(true);
    } catch (err) {
      console.error('Gagal mengambil pengaturan', err);
      // Fallback ke default values jika API gagal
      setSettings({
        JAM_MASUK_MULAI: '06:00:00',
        BATAS_TERLAMBAT: '08:00:00',
        JAM_MASUK_AKHIR: '12:00:00',
        JAM_KELUAR_MULAI: '15:00:00',
        JAM_KELUAR_AKHIR: '20:00:00',
      });
      setSettingsLoaded(true);
    }
  };

  const fetchHolidays = async () => {
    try {
      const res = await axios.get(`${API}/holidays`, { headers });
      setHolidays(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {
      console.error('Gagal mengambil data hari libur', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchHolidays();
  }, []);

  // ── SAVE SETTINGS ──
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await axios.put(`${API}/settings`, settings, { headers, 'Content-Type': 'application/json' });
      alert('✅ Pengaturan jam kerja berhasil disimpan!');
      fetchSettings();
    } catch (err) {
      alert('❌ Gagal: ' + (err.response?.data?.error || 'Error'));
    } finally {
      setIsSavingSettings(false);
    }
  };

  // ── ADD HOLIDAY ──
  const handleAddHoliday = async (e) => {
    if (e) e.preventDefault();
    if (!newHoliday.tanggal || !newHoliday.keterangan.trim()) {
      return alert('Tanggal dan keterangan wajib diisi.');
    }
    setIsAddingHoliday(true);
    try {
      await axios.post(`${API}/holidays`, newHoliday, { headers });
      alert('✅ Hari libur berhasil ditambahkan!');
      setNewHoliday({ tanggal: '', keterangan: '' });
      setShowAddModal(false);
      fetchHolidays();
    } catch (err) {
      alert('❌ Gagal: ' + (err.response?.data?.error || 'Error'));
    } finally {
      setIsAddingHoliday(false);
    }
  };

  // ── DELETE HOLIDAY ──
  const handleDeleteHoliday = async (id, ket) => {
    if (!confirm(`Hapus hari libur "${ket}"?`)) return;
    try {
      await axios.delete(`${API}/holidays/${id}`, { headers });
      setHolidays(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      alert('❌ Gagal: ' + (err.response?.data?.error || 'Error'));
    }
  };

  const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const formatDate = (d) => {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch {
      return d;
    }
  };

  const settingFields = [
    { 
      key: 'JAM_MASUK_MULAI',  
      label: 'Jam Mulai Masuk',    
      icon: '🟢', 
      badge: 'Sesi Masuk',
      desc: 'Waktu paling awal kiosk mulai menerima pemindaian presensi kehadiran pagi.' 
    },
    { 
      key: 'BATAS_TERLAMBAT',  
      label: 'Batas Tepat Waktu',  
      icon: '⏰', 
      badge: 'Ambang Batas',
      desc: 'Pemindaian setelah jam ini secara otomatis tercatat berstatus TERLAMBAT.' 
    },
    { 
      key: 'JAM_MASUK_AKHIR',  
      label: 'Jam Akhir Masuk',    
      icon: '🔴', 
      badge: 'Sesi Masuk',
      desc: 'Batas akhir scan sesi pagi. Lewat jam ini kiosk menolak scan kehadiran masuk.' 
    },
    { 
      key: 'JAM_KELUAR_MULAI', 
      label: 'Jam Mulai Pulang',   
      icon: '🟢', 
      badge: 'Sesi Pulang',
      desc: 'Waktu paling awal pegawai diizinkan melakukan presensi kepulangan kantor.' 
    },
    { 
      key: 'JAM_KELUAR_AKHIR', 
      label: 'Jam Akhir Pulang',   
      icon: '🔴', 
      badge: 'Sesi Pulang',
      desc: 'Batas akhir sesi kepulangan malam. Setelah ini kiosk beralih ke mode standby.' 
    },
  ];

  const tabs = [
    { id: 'jam_kerja', label: 'Jam Kerja Kiosk', icon: <Clock size={16} />, count: null },
    { id: 'hari_libur', label: 'Hari Libur Custom', icon: <CalendarOff size={16} />, count: holidays.length },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* ── BENTO HEADER & SEGMENTED CONTROL TABS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600">
              <Settings size={18} />
            </div>
            Pengaturan Parameter Sistem
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi jendela jam kerja presensi dan kalender libur dinamis
          </p>
        </div>

        {/* Pill-shaped Segmented Control */}
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/80 shadow-soft-xs">
          {tabs.map(t => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-soft-sm scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
                {t.count !== null && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB 1: PENGATURAN JAM KERJA ── */}
      {activeTab === 'jam_kerja' && (
        <div className="glass-panel p-6 sm:p-8 space-y-6 transition-all duration-300 animate-fadeIn">
          
          {/* Info Banner */}
          <div className="bg-amber-50/90 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3 shadow-soft-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">Perhatian Sinkronisasi Kiosk</p>
              <p className="text-xs text-amber-700/90 mt-0.5 leading-relaxed">
                Perubahan jam kerja akan langsung dievaluasi pada <b>setiap scan wajah berikutnya</b>. Pastikan format waktu dalam standar 24 jam (<code className="font-mono bg-amber-100/80 px-1 py-0.5 rounded text-amber-900 font-bold">HH:MM:SS</code>).
              </p>
            </div>
          </div>

          {/* 2-Column Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {settingFields.map(f => (
              <div 
                key={f.key} 
                className="bg-white/80 border border-slate-200/80 rounded-2xl p-5 shadow-soft-xs hover:shadow-soft-sm transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>{f.icon}</span>
                    <span>{f.label}</span>
                  </label>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    {f.badge}
                  </span>
                </div>

                <div className="my-2">
                  <input 
                    type="time" 
                    step="1" 
                    value={(settings[f.key] || '').substring(0, 8)}
                    onChange={e => updateSetting(f.key, e.target.value + (e.target.value.length === 5 ? ':00' : ''))}
                    className="w-full p-3 bg-slate-50/90 border border-slate-200 rounded-xl font-mono text-xl font-extrabold text-center text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all shadow-soft-xs"
                  />
                </div>

                <p className="text-[11px] text-slate-500 leading-normal mt-1 flex items-start gap-1">
                  <Info size={13} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>{f.desc}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>Semua perubahan disimpan ke database server utama</span>
            </div>

            <button 
              onClick={handleSaveSettings} 
              disabled={isSavingSettings || !settingsLoaded}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold px-7 py-3 rounded-xl transition-all shadow-md shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingSettings ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  <span>Menyimpan Pengaturan...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}

      {/* ── TAB 2: HARI LIBUR CUSTOM ── */}
      {activeTab === 'hari_libur' && (
        <div className="glass-panel overflow-hidden transition-all duration-300 animate-fadeIn">
          
          {/* Header Bar */}
          <div className="p-5 sm:px-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarOff size={18} className="text-red-500" />
                Kalender Hari Libur Khusus
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Libur daerah, cuti bersama, dan hari non-kerja khusus di luar libur nasional
              </p>
            </div>

            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-red-500/20 active:scale-[0.98]"
            >
              <Plus size={16} />
              <span>Tambah Hari Libur</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/80">
                  <th className="px-6 py-4 w-12 text-center">#</th>
                  <th className="px-6 py-4">Tanggal Libur</th>
                  <th className="px-6 py-4">Nama / Keterangan</th>
                  <th className="px-6 py-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {holidays.map((h, i) => (
                  <tr key={h.id} className="hover:bg-red-50/20 transition-colors">
                    <td className="px-6 py-4 text-center text-xs font-mono text-slate-400">
                      {i + 1}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                        {h.tanggal}
                      </span>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        {formatDate(h.tanggal)}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {h.keterangan}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleDeleteHoliday(h.id, h.keterangan)}
                        className="inline-flex items-center gap-1 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-200" 
                        title="Hapus Hari Libur"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {holidays.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <CalendarOff size={32} className="text-slate-300" />
                        <p className="text-sm font-semibold text-slate-600">Belum ada hari libur custom</p>
                        <p className="text-xs text-slate-400">Klik tombol "Tambah Hari Libur" di atas untuk menambahkan tanggal libur baru.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ── GLASSMORPHIC ADD HOLIDAY MODAL ── */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="glass-modal max-w-md w-full p-6 sm:p-7 border border-white/80 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Tambah Hari Libur Custom</h3>
                  <p className="text-[11px] text-slate-500">Pengecualian hari kerja untuk kiosk</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddHoliday} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Tanggal Libur <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  required
                  value={newHoliday.tanggal} 
                  onChange={e => setNewHoliday({ ...newHoliday, tanggal: e.target.value })}
                  className="w-full p-2.5 bg-slate-50/90 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all shadow-soft-xs" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Keterangan / Nama Libur <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Cuti Bersama Idul Fitri" 
                  value={newHoliday.keterangan}
                  onChange={e => setNewHoliday({ ...newHoliday, keterangan: e.target.value })}
                  className="w-full p-2.5 bg-slate-50/90 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all shadow-soft-xs" 
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-6 border-t border-slate-200/80 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-[0.98]"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isAddingHoliday}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-red-500/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
                >
                  {isAddingHoliday ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Hari Libur</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsPage;
