import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import API_BASE from '../config/api';
import {
  Settings,
  Clock,
  CalendarOff,
  Save,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  Calendar,
  Info,
  CheckCircle2,
  PlayCircle,
  StopCircle,
  Loader2,
  Search,
} from 'lucide-react';
import {
  useModalEscape,
  ErrorBanner,
  TableLoadingRow,
  TableErrorRow,
  TablePaginationBar,
  notifyAlert,
  confirmAction,
} from '../components/UiFeedback';

const API = API_BASE;

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('jam_kerja');

  // JAM KERJA STATE
  const [settings, setSettings] = useState({
    JAM_MASUK_MULAI: '06:00:00',
    BATAS_TERLAMBAT: '08:00:00',
    JAM_MASUK_AKHIR: '12:00:00',
    JAM_KELUAR_MULAI: '15:00:00',
    JAM_KELUAR_AKHIR: '20:00:00',
  });
  const [isFetchingSettings, setIsFetchingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // HARI LIBUR STATE
  const [holidays, setHolidays] = useState([]);
  const [isFetchingHolidays, setIsFetchingHolidays] = useState(true);
  const [holidaysError, setHolidaysError] = useState('');
  const [holidaySearch, setHolidaySearch] = useState('');
  const [holidayPage, setHolidayPage] = useState(1);
  const [holidayPerPage, setHolidayPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ tanggal: '', keterangan: '' });
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);

  useModalEscape(showAddModal, () => setShowAddModal(false));

  const fetchSettings = useCallback(async () => {
    setIsFetchingSettings(true);
    setSettingsError('');
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.get(`${API}/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const map = {
        JAM_MASUK_MULAI: '06:00:00',
        BATAS_TERLAMBAT: '08:00:00',
        JAM_MASUK_AKHIR: '12:00:00',
        JAM_KELUAR_MULAI: '15:00:00',
        JAM_KELUAR_AKHIR: '20:00:00',
      };

      if (Array.isArray(res.data)) {
        res.data.forEach((s) => {
          if (s && s.key) map[s.key] = s.value;
        });
      } else if (res.data && typeof res.data === 'object') {
        Object.entries(res.data).forEach(([k, v]) => {
          map[k] = typeof v === 'object' && v !== null && 'value' in v ? v.value : v;
        });
      }

      setSettings(map);
      setSettingsLoaded(true);
    } catch (err) {
      console.error('Gagal mengambil pengaturan', err);
      setSettingsError(
        err.response?.data?.error ||
          'Tidak dapat memuat parameter jam kerja dari server. Menampilkan nilai bawaan sementara.'
      );
      setSettingsLoaded(true);
    } finally {
      setIsFetchingSettings(false);
    }
  }, []);

  const fetchHolidays = useCallback(async () => {
    setIsFetchingHolidays(true);
    setHolidaysError('');
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.get(`${API}/holidays`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHolidays(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.error('Gagal mengambil data hari libur', err);
      setHolidaysError(
        err.response?.data?.error || 'Tidak dapat memuat daftar hari libur khusus dari server.'
      );
    } finally {
      setIsFetchingHolidays(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchHolidays();
  }, [fetchSettings, fetchHolidays]);

  const filteredHolidays = useMemo(() => {
    if (!holidaySearch.trim()) return holidays;
    const q = holidaySearch.toLowerCase();
    return holidays.filter(
      (h) =>
        (h.tanggal || '').toLowerCase().includes(q) ||
        (h.keterangan || '').toLowerCase().includes(q)
    );
  }, [holidays, holidaySearch]);

  const totalHolidayPages = Math.max(1, Math.ceil(filteredHolidays.length / holidayPerPage));
  const safeHolidayPage = Math.min(holidayPage, totalHolidayPages);
  const paginatedHolidays = useMemo(() => {
    const start = (safeHolidayPage - 1) * holidayPerPage;
    return filteredHolidays.slice(start, start + holidayPerPage);
  }, [filteredHolidays, safeHolidayPage, holidayPerPage]);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    const token = localStorage.getItem('access_token');
    try {
      await axios.put(`${API}/settings`, settings, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      notifyAlert({
        icon: 'success',
        title: 'Tersimpan',
        text: 'Pengaturan jam kerja kiosk berhasil disimpan.',
        timer: 1800,
      });
      fetchSettings();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.response?.data?.error || 'Terjadi kesalahan saat menyimpan pengaturan.',
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddHoliday = async (e) => {
    if (e) e.preventDefault();
    if (!newHoliday.tanggal || !newHoliday.keterangan.trim()) {
      return notifyAlert({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Tanggal dan keterangan hari libur wajib diisi.',
      });
    }
    setIsAddingHoliday(true);
    const token = localStorage.getItem('access_token');
    try {
      await axios.post(`${API}/holidays`, newHoliday, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notifyAlert({
        icon: 'success',
        title: 'Berhasil',
        text: 'Hari libur khusus berhasil ditambahkan.',
        timer: 1800,
      });
      setNewHoliday({ tanggal: '', keterangan: '' });
      setShowAddModal(false);
      fetchHolidays();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Menambahkan',
        text: err.response?.data?.error || 'Terjadi kesalahan saat menyimpan hari libur.',
      });
    } finally {
      setIsAddingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (id, ket) => {
    const ok = await confirmAction({
      title: 'Hapus Hari Libur Khusus?',
      text: `Tanggal libur "${ket}" akan dihapus dari kalender pengecualian kerja.`,
      confirmText: 'Ya, Hapus',
    });
    if (!ok) return;
    const token = localStorage.getItem('access_token');
    try {
      await axios.delete(`${API}/holidays/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      notifyAlert({
        icon: 'success',
        title: 'Terhapus',
        text: `Hari libur "${ket}" telah dihapus.`,
        timer: 1500,
      });
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Menghapus',
        text: err.response?.data?.error || 'Terjadi kesalahan saat menghapus hari libur.',
      });
    }
  };

  const updateSetting = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const formatDate = (d) => {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const settingFields = [
    {
      key: 'JAM_MASUK_MULAI',
      label: 'Jam Mulai Masuk',
      icon: <PlayCircle size={15} className="text-emerald-700" aria-hidden="true" />,
      badge: 'Sesi Masuk',
      desc: 'Waktu paling awal perangkat kiosk mulai menerima pemindaian presensi kehadiran pagi.',
    },
    {
      key: 'BATAS_TERLAMBAT',
      label: 'Batas Tepat Waktu',
      icon: <Clock size={15} className="text-amber-800" aria-hidden="true" />,
      badge: 'Ambang Batas',
      desc: 'Pemindaian setelah jam ini secara otomatis tercatat berstatus TERLAMBAT.',
    },
    {
      key: 'JAM_MASUK_AKHIR',
      label: 'Jam Akhir Masuk',
      icon: <StopCircle size={15} className="text-red-700" aria-hidden="true" />,
      badge: 'Sesi Masuk',
      desc: 'Batas akhir pemindaian sesi pagi. Lewat jam ini kiosk menolak presensi masuk reguler.',
    },
    {
      key: 'JAM_KELUAR_MULAI',
      label: 'Jam Mulai Pulang',
      icon: <PlayCircle size={15} className="text-emerald-700" aria-hidden="true" />,
      badge: 'Sesi Pulang',
      desc: 'Waktu paling awal pegawai diizinkan melakukan pemindaian presensi kepulangan kantor.',
    },
    {
      key: 'JAM_KELUAR_AKHIR',
      label: 'Jam Akhir Pulang',
      icon: <StopCircle size={15} className="text-red-700" aria-hidden="true" />,
      badge: 'Sesi Pulang',
      desc: 'Batas akhir sesi kepulangan harian. Setelah jam ini perangkat beralih ke mode siaga.',
    },
  ];

  const tabs = [
    {
      id: 'jam_kerja',
      label: 'Jam Kerja Kiosk',
      icon: <Clock size={16} aria-hidden="true" />,
      count: null,
    },
    {
      id: 'hari_libur',
      label: 'Hari Libur Khusus',
      icon: <CalendarOff size={16} aria-hidden="true" />,
      count: holidays.length,
    },
  ];

  return (
    <div className="w-full space-y-5">
      {/* Header Standar Konfigurasi */}
      <div className="surface-card p-5 sm:px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <Settings size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Pengaturan Parameter Sistem
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Konfigurasi jendela jam kerja bawaan kiosk dan kalender hari libur khusus daerah
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="tablist"
            aria-label="Kategori Pengaturan Sistem"
            className="inline-flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-300"
          >
            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(t.id)}
                  className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg text-xs font-bold transition-all active:translate-y-px ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-btn-primary'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                  {t.count !== null && (
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded font-mono font-bold tabular-nums ${
                        isActive
                          ? 'bg-blue-900 text-white'
                          : 'bg-white text-slate-700 border border-slate-300'
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {activeTab === 'hari_libur' && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="gov-btn-primary"
            >
              <Plus size={16} aria-hidden="true" />
              <span>Tambah Hari Libur</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: JAM KERJA KIOSK */}
      {activeTab === 'jam_kerja' && (
        <div className="surface-card p-5 sm:p-6 space-y-6">
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-950">
                Perhatian Sinkronisasi Kiosk
              </p>
              <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                Perubahan parameter jam kerja bawaan akan langsung dievaluasi pada{' '}
                <b>setiap pemindaian wajah berikutnya</b>. Pastikan format waktu sesuai standar 24 jam (
                <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-950 font-bold border border-amber-300">
                  HH:MM:SS
                </code>
                ).
              </p>
            </div>
          </div>

          <ErrorBanner message={settingsError} onRetry={fetchSettings} />

          {isFetchingSettings ? (
            <div className="py-12 text-center" role="status" aria-live="polite">
              <div className="inline-flex flex-col items-center gap-2.5">
                <Loader2 size={26} className="animate-spin text-blue-700" aria-hidden="true" />
                <span className="text-sm font-semibold text-slate-700">
                  Memuat parameter jam kerja sistem...
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {settingFields.map((f) => {
                const inputId = `setting-${f.key}`;
                return (
                  <div
                    key={f.key}
                    className="surface-panel p-5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label
                        htmlFor={inputId}
                        className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5"
                      >
                        {f.icon}
                        <span>{f.label}</span>
                      </label>
                      <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-300">
                        {f.badge}
                      </span>
                    </div>

                    <div className="my-2">
                      <input
                        id={inputId}
                        type="time"
                        step="1"
                        value={(settings[f.key] || '').substring(0, 8)}
                        onChange={(e) =>
                          updateSetting(
                            f.key,
                            e.target.value + (e.target.value.length === 5 ? ':00' : '')
                          )
                        }
                        className="w-full min-h-[48px] px-3.5 py-2.5 bg-white border border-slate-500 rounded-lg font-mono text-xl font-extrabold text-center text-slate-900 tabular-nums shadow-soft-xs hover:border-slate-700 focus:border-blue-700"
                      />
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mt-1 flex items-start gap-1.5">
                      <Info size={14} className="text-slate-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{f.desc}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
              <CheckCircle2 size={16} className="text-emerald-700 shrink-0" aria-hidden="true" />
              <span>Seluruh perubahan disimpan langsung pada basis data server utama</span>
            </div>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSavingSettings || !settingsLoaded}
              className="w-full sm:w-auto gov-btn-primary px-6"
            >
              {isSavingSettings ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  <span>Menyimpan Pengaturan...</span>
                </>
              ) : (
                <>
                  <Save size={16} aria-hidden="true" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: HARI LIBUR KHUSUS (Tabel Standar Konfigurasi) */}
      {activeTab === 'hari_libur' && (
        <div className="surface-card overflow-hidden">
          <div className="gov-table-toolbar">
            <div className="w-full sm:w-80">
              <label htmlFor="holiday-search-input" className="sr-only">
                Cari Tanggal atau Keterangan Hari Libur
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                  size={16}
                  aria-hidden="true"
                />
                <input
                  id="holiday-search-input"
                  type="text"
                  placeholder="Cari tanggal atau nama hari libur..."
                  value={holidaySearch}
                  onChange={(e) => {
                    setHolidaySearch(e.target.value);
                    setHolidayPage(1);
                  }}
                  className="gov-input pl-9"
                />
              </div>
            </div>

            <span className="text-xs font-semibold text-slate-700 tabular-nums">
              Total <b className="text-slate-900">{filteredHolidays.length}</b> hari libur khusus
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="gov-table min-w-[760px]">
              <thead>
                <tr>
                  <th className="w-14 text-center">No</th>
                  <th className="w-64">Tanggal Libur</th>
                  <th>Nama / Keterangan Libur</th>
                  <th className="w-32 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isFetchingHolidays ? (
                  <TableLoadingRow
                    colSpan={4}
                    label="Memuat daftar kalender hari libur khusus..."
                  />
                ) : holidaysError ? (
                  <TableErrorRow
                    colSpan={4}
                    message={holidaysError}
                    onRetry={fetchHolidays}
                  />
                ) : paginatedHolidays.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 px-4 text-center">
                      <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600">
                          <CalendarOff size={22} aria-hidden="true" />
                        </div>
                        <p className="text-sm font-bold text-slate-900">
                          {holidaySearch
                            ? 'Hari Libur Tidak Ditemukan'
                            : 'Belum Ada Hari Libur Khusus'}
                        </p>
                        <p className="text-xs text-slate-600">
                          {holidaySearch
                            ? `Tidak ada tanggal atau keterangan libur yang cocok dengan "${holidaySearch}".`
                            : 'Klik tombol "Tambah Hari Libur" di atas untuk mendaftarkan tanggal cuti bersama atau libur daerah.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedHolidays.map((h, i) => (
                    <tr key={h.id}>
                      <td className="text-center text-xs font-mono text-slate-600 tabular-nums">
                        {(safeHolidayPage - 1) * holidayPerPage + i + 1}
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className="inline-block w-fit font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-300 tabular-nums">
                            {h.tanggal}
                          </span>
                          <span className="text-xs text-slate-600 mt-1 font-medium">
                            {formatDate(h.tanggal)}
                          </span>
                        </div>
                      </td>
                      <td className="font-semibold text-slate-900">{h.keterangan}</td>
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteHoliday(h.id, h.keterangan)}
                          aria-label={`Hapus hari libur ${h.keterangan}`}
                          title="Hapus Hari Libur"
                          className="gov-icon-btn text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <TablePaginationBar
            currentPage={safeHolidayPage}
            totalItems={filteredHolidays.length}
            itemsPerPage={holidayPerPage}
            onPageChange={setHolidayPage}
            onItemsPerPageChange={(val) => {
              setHolidayPerPage(val);
              setHolidayPage(1);
            }}
            unitLabel="hari libur"
          />
        </div>
      )}

      {/* MODAL TAMBAH HARI LIBUR KHUSUS */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-add-holiday-title"
            className="surface-modal max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#0B1120] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar size={18} aria-hidden="true" />
                <div>
                  <h3 id="modal-add-holiday-title" className="text-base font-extrabold">
                    Tambah Hari Libur Khusus
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Tutup dialog tambah hari libur"
                className="gov-icon-btn text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleAddHoliday} className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="holiday-tanggal"
                  className="block text-xs font-bold text-slate-800 mb-1.5"
                >
                  Tanggal Libur <span className="text-red-700">*</span>
                </label>
                <input
                  id="holiday-tanggal"
                  type="date"
                  required
                  value={newHoliday.tanggal}
                  onChange={(e) => setNewHoliday({ ...newHoliday, tanggal: e.target.value })}
                  className="gov-input font-mono tabular-nums"
                />
              </div>

              <div>
                <label
                  htmlFor="holiday-keterangan"
                  className="block text-xs font-bold text-slate-800 mb-1.5"
                >
                  Keterangan / Nama Hari Libur <span className="text-red-700">*</span>
                </label>
                <input
                  id="holiday-keterangan"
                  type="text"
                  required
                  placeholder="Contoh: Cuti Bersama Idul Fitri"
                  value={newHoliday.keterangan}
                  onChange={(e) => setNewHoliday({ ...newHoliday, keterangan: e.target.value })}
                  className="gov-input"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="gov-btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAddingHoliday}
                  className="gov-btn-primary"
                >
                  {isAddingHoliday ? (
                    <>
                      <Loader2 size={15} className="animate-spin" aria-hidden="true" />
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
