import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Clock,
  CalendarRange,
  Users,
  Plus,
  Edit3,
  Trash2,
  ArrowLeftRight,
  Moon,
  Sun,
  ShieldAlert,
  Building2,
  Search,
  RefreshCw,
  CheckCircle2,
  Info,
  CalendarDays,
  Save,
  X,
  Loader2,
} from 'lucide-react';
import API_BASE from '../config/api';
import {
  useModalEscape,
  ErrorBanner,
  TableLoadingRow,
  TableErrorRow,
  notifyAlert,
  confirmAction,
} from '../components/UiFeedback';

const API_URL = API_BASE;

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

// Palet Terkendali Lulus WCAG AA >= 4.5:1 (R-25 & R-29)
const SHIFT_COLOR_PALETTE = [
  {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-300',
    pill: 'bg-blue-700 text-white border-blue-800',
    code: 'REG',
  },
  {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    pill: 'bg-emerald-700 text-white border-emerald-800',
    code: 'PAGI',
  },
  {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    border: 'border-amber-300',
    pill: 'bg-amber-100 text-amber-950 border-amber-400',
    code: 'SIANG',
  },
  {
    bg: 'bg-slate-100',
    text: 'text-slate-900',
    border: 'border-slate-400',
    pill: 'bg-slate-900 text-white border-slate-950',
    code: 'MALAM',
  },
  {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-300',
    pill: 'bg-red-700 text-white border-red-800',
    code: 'OPS',
  },
];

const getShiftStyle = (shift) => {
  if (!shift) return SHIFT_COLOR_PALETTE[0];
  const name = (shift.nama_shift || '').toLowerCase();
  if (shift.is_lintas_hari || name.includes('malam')) return SHIFT_COLOR_PALETTE[3];
  if (name.includes('pagi')) return SHIFT_COLOR_PALETTE[1];
  if (name.includes('siang') || name.includes('sore')) return SHIFT_COLOR_PALETTE[2];
  if (name.includes('reguler')) return SHIFT_COLOR_PALETTE[0];
  const idx = (shift.id || 0) % SHIFT_COLOR_PALETTE.length;
  return SHIFT_COLOR_PALETTE[idx];
};

const getShortShiftCode = (namaShift = '') => {
  const lower = namaShift.toLowerCase();
  if (lower.includes('reguler')) return 'REG';
  if (lower.includes('pagi')) return 'P';
  if (lower.includes('siang')) return 'S';
  if (lower.includes('malam')) return 'M';
  return namaShift.slice(0, 3).toUpperCase() || 'SHF';
};

const JamKerjaPage = () => {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [activeTab, setActiveTab] = useState('master'); // 'master' | 'penugasan' | 'roster'
  const [shifts, setShifts] = useState([]);
  const [opdList, setOpdList] = useState([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [shiftError, setShiftError] = useState('');

  // Filter OPD global (khusus Super Admin)
  const [selectedOpd, setSelectedOpd] = useState('');

  // Modal Master Shift
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [shiftForm, setShiftForm] = useState({
    nama_shift: '',
    jam_masuk: '07:30',
    jam_pulang: '16:00',
    mulai_scan_masuk: '06:00',
    akhir_scan_masuk: '11:00',
    mulai_scan_pulang: '15:00',
    akhir_scan_pulang: '20:00',
    menit_toleransi: 30,
    is_lintas_hari: false,
    abaikan_libur: false,
    opd_id: '',
  });

  // State Tab 2 & 3 (Pegawai & Roster)
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [roleFilter, setRoleFilter] = useState('');
  const [searchEmp, setSearchEmp] = useState('');
  const [filterShiftDefault, setFilterShiftDefault] = useState('');
  const [employees, setEmployees] = useState([]);
  const [rosterMap, setRosterMap] = useState({});
  const [daysInMonth, setDaysInMonth] = useState(30);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [rosterError, setRosterError] = useState('');

  // Bulk Assign state (Tab 2)
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkShiftId, setBulkShiftId] = useState('');

  // Roster interactive painting & modals (Tab 3)
  const [activeBrushShiftId, setActiveBrushShiftId] = useState(null);
  const [pendingEntries, setPendingEntries] = useState({});
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [rangeForm, setRangeForm] = useState({
    user_ids: [],
    start_date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
    end_date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-07`,
    jam_kerja_id: '',
    keterangan: '',
  });

  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapForm, setSwapForm] = useState({
    user_a_id: '',
    user_b_id: '',
    tanggal: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    keterangan: '',
  });

  useModalEscape(showShiftModal, () => setShowShiftModal(false));
  useModalEscape(showRangeModal, () => setShowRangeModal(false));
  useModalEscape(showSwapModal, () => setShowSwapModal(false));

  // Load OPD List for Super Admin
  useEffect(() => {
    if (userRole === 'super_admin') {
      axios
        .get(`${API_URL}/opd`, { headers })
        .then((res) => setOpdList(Array.isArray(res.data) ? res.data : res.data?.data || []))
        .catch(() => {});
    }
  }, [userRole, headers]);

  const fetchShifts = useCallback(async () => {
    setLoadingShifts(true);
    setShiftError('');
    try {
      const params = {};
      if (selectedOpd) params.opd_id = selectedOpd;
      const res = await axios.get(`${API_URL}/jam-kerja`, { headers, params });
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setShifts(list);
      setActiveBrushShiftId((prev) => (prev === null && list.length > 0 ? list[0].id : prev));
    } catch (err) {
      console.error('Gagal memuat profil jam kerja:', err);
      setShiftError(err.response?.data?.error || 'Tidak dapat memuat daftar profil jam kerja dari server.');
    } finally {
      setLoadingShifts(false);
    }
  }, [selectedOpd, headers]);

  const fetchRosterAndEmployees = useCallback(async () => {
    setLoadingRoster(true);
    setRosterError('');
    try {
      const params = { bulan, tahun };
      if (selectedOpd) params.opd_id = selectedOpd;
      if (roleFilter) params.role = roleFilter;
      const res = await axios.get(`${API_URL}/roster`, { headers, params });
      setEmployees(res.data?.employees || res.data?.pegawai || []);
      setRosterMap(res.data?.roster || {});
      setDaysInMonth(res.data?.days_in_month || 30);
      setPendingEntries({});
    } catch (err) {
      console.error('Gagal memuat data roster:', err);
      setRosterError(err.response?.data?.error || 'Tidak dapat memuat data penugasan shift dan roster pegawai.');
    } finally {
      setLoadingRoster(false);
    }
  }, [bulan, tahun, selectedOpd, roleFilter, headers]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  useEffect(() => {
    fetchRosterAndEmployees();
  }, [fetchRosterAndEmployees]);

  const shiftsById = useMemo(() => {
    const map = {};
    shifts.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [shifts]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        !searchEmp ||
        (emp.nama || '').toLowerCase().includes(searchEmp.toLowerCase()) ||
        (emp.nip || '').toLowerCase().includes(searchEmp.toLowerCase());
      const matchShift =
        !filterShiftDefault ||
        (filterShiftDefault === 'DEFAULT'
          ? !emp.default_jam_kerja_id
          : String(emp.default_jam_kerja_id) === String(filterShiftDefault));
      return matchSearch && matchShift;
    });
  }, [employees, searchEmp, filterShiftDefault]);

  // HANDLERS TAB 1: MASTER JAM KERJA
  const openCreateShiftModal = () => {
    setEditingShift(null);
    setShiftForm({
      nama_shift: '',
      jam_masuk: '07:30',
      jam_pulang: '16:00',
      mulai_scan_masuk: '06:00',
      akhir_scan_masuk: '11:00',
      mulai_scan_pulang: '15:00',
      akhir_scan_pulang: '20:00',
      menit_toleransi: 15,
      is_lintas_hari: false,
      abaikan_libur: false,
      opd_id: selectedOpd || '',
    });
    setShowShiftModal(true);
  };

  const openEditShiftModal = (shift) => {
    setEditingShift(shift);
    setShiftForm({
      nama_shift: shift.nama_shift || '',
      jam_masuk: shift.jam_masuk_str || shift.jam_masuk || '07:30',
      jam_pulang: shift.jam_pulang_str || shift.jam_pulang || '16:00',
      mulai_scan_masuk: shift.mulai_scan_masuk_str || shift.mulai_scan_masuk || '06:00',
      akhir_scan_masuk: shift.akhir_scan_masuk_str || shift.akhir_scan_masuk || '11:00',
      mulai_scan_pulang: shift.mulai_scan_pulang_str || shift.mulai_scan_pulang || '15:00',
      akhir_scan_pulang: shift.akhir_scan_pulang_str || shift.akhir_scan_pulang || '20:00',
      menit_toleransi: shift.menit_toleransi ?? 15,
      is_lintas_hari: Boolean(shift.is_lintas_hari),
      abaikan_libur: Boolean(shift.abaikan_libur),
      opd_id: shift.opd_id || '',
    });
    setShowShiftModal(true);
  };

  const handleSaveShift = async (e) => {
    e.preventDefault();
    try {
      if (editingShift) {
        await axios.put(`${API_URL}/jam-kerja/${editingShift.id}`, shiftForm, { headers });
        notifyAlert({
          icon: 'success',
          title: 'Berhasil',
          text: 'Profil jam kerja berhasil diperbarui.',
          timer: 1600,
        });
      } else {
        await axios.post(`${API_URL}/jam-kerja`, shiftForm, { headers });
        notifyAlert({
          icon: 'success',
          title: 'Berhasil',
          text: 'Profil jam kerja baru berhasil ditambahkan.',
          timer: 1600,
        });
      }
      setShowShiftModal(false);
      fetchShifts();
      fetchRosterAndEmployees();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.response?.data?.error || 'Terjadi kesalahan saat menyimpan profil jam kerja.',
      });
    }
  };

  const handleDeleteShift = async (shift) => {
    const ok = await confirmAction({
      title: `Hapus ${shift.nama_shift}?`,
      text: 'Pegawai yang menggunakan shift ini sebagai default akan dikembalikan ke Reguler Global.',
      confirmText: 'Ya, Hapus',
    });
    if (!ok) return;

    try {
      await axios.delete(`${API_URL}/jam-kerja/${shift.id}`, { headers });
      notifyAlert({
        icon: 'success',
        title: 'Terhapus',
        text: 'Profil jam kerja berhasil dihapus.',
        timer: 1500,
      });
      fetchShifts();
      fetchRosterAndEmployees();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Tidak Dapat Dihapus',
        text: err.response?.data?.error || 'Gagal menghapus profil jam kerja.',
      });
    }
  };

  // HANDLERS TAB 2: PENUGASAN SHIFT PEGAWAI
  const handleSingleAssignShift = async (userId, newShiftId, empRole = '', empNip = '') => {
    const matchedEmp = employees.find((e) => e.user_id === userId && (!empRole || e.role === empRole));
    try {
      const res = await axios.put(
        `${API_URL}/users/${userId}/jam-kerja`,
        {
          jam_kerja_id: newShiftId || null,
          role: empRole || matchedEmp?.role || '',
          nip: empNip || matchedEmp?.nip || '',
        },
        { headers }
      );
      notifyAlert({
        icon: 'success',
        title: 'Tersimpan',
        text: res.data?.message || 'Shift default pegawai berhasil diperbarui.',
        timer: 1600,
      });
      fetchRosterAndEmployees();
      fetchShifts();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data?.error || 'Gagal mengubah shift pegawai.',
      });
    }
  };

  const toggleSelectUser = (uid) => {
    setSelectedUserIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const toggleSelectAllFiltered = () => {
    const allIds = filteredEmployees.map((e) => e.user_id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedUserIds.includes(id));
    if (allSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...allIds])));
    }
  };

  const handleBulkAssignShift = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      const res = await axios.post(
        `${API_URL}/users/bulk-jam-kerja`,
        {
          user_ids: selectedUserIds,
          jam_kerja_id: bulkShiftId === 'RESET' ? null : bulkShiftId || null,
        },
        { headers }
      );
      notifyAlert({
        icon: 'success',
        title: 'Penugasan Massal Berhasil',
        text: res.data?.message || 'Shift berhasil diterapkan ke pegawai terpilih.',
        timer: 1800,
      });
      setSelectedUserIds([]);
      fetchRosterAndEmployees();
      fetchShifts();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data?.error || 'Gagal menerapkan shift massal.',
      });
    }
  };

  // HANDLERS TAB 3: ROSTER BULANAN & TUKAR JAGA
  const handleCellClick = (emp, dayNumber) => {
    if (activeBrushShiftId === null) {
      notifyAlert({
        icon: 'info',
        title: 'Pilih Kuas Shift',
        text: 'Pilih salah satu tombol kuas shift di atas matriks sebelum mengeklik tanggal.',
      });
      return;
    }
    const dateStr = `${tahun}-${String(bulan).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    const key = `${emp.user_id}_${dateStr}`;

    setPendingEntries((prev) => ({
      ...prev,
      [key]: {
        user_id: emp.user_id,
        role: emp.role,
        tanggal: dateStr,
        jam_kerja_id: activeBrushShiftId === 0 ? null : activeBrushShiftId,
        keterangan: activeBrushShiftId === 0 ? '' : 'Roster Bulanan',
      },
    }));
  };

  const handleSavePendingRoster = async () => {
    const entries = Object.values(pendingEntries);
    if (entries.length === 0) return;
    try {
      const res = await axios.post(`${API_URL}/roster/batch`, { entries }, { headers });
      notifyAlert({
        icon: 'success',
        title: 'Roster Tersimpan',
        text: res.data?.message || 'Perubahan jadwal roster berhasil disimpan.',
        timer: 1800,
      });
      fetchRosterAndEmployees();
      fetchShifts();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Menyimpan Roster',
        text: err.response?.data?.error || 'Terjadi kesalahan saat menyimpan matriks roster.',
      });
    }
  };

  const handleSubmitRangeRoster = async (e) => {
    e.preventDefault();
    if (!rangeForm.user_ids.length) {
      notifyAlert({ icon: 'warning', title: 'Perhatian', text: 'Pilih minimal 1 pegawai.' });
      return;
    }
    const start = new Date(rangeForm.start_date);
    const end = new Date(rangeForm.end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      notifyAlert({ icon: 'warning', title: 'Perhatian', text: 'Rentang tanggal tidak valid.' });
      return;
    }

    const entries = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const tglStr = `${yyyy}-${mm}-${dd}`;
      rangeForm.user_ids.forEach((uid) => {
        entries.push({
          user_id: uid,
          tanggal: tglStr,
          jam_kerja_id: rangeForm.jam_kerja_id === '0' ? null : Number(rangeForm.jam_kerja_id),
          keterangan: rangeForm.keterangan || 'Plotting Rentang Tanggal',
        });
      });
    }

    try {
      const res = await axios.post(`${API_URL}/roster/batch`, { entries }, { headers });
      notifyAlert({
        icon: 'success',
        title: 'Berhasil',
        text: res.data?.message || 'Plotting rentang tanggal berhasil disimpan.',
        timer: 1800,
      });
      setShowRangeModal(false);
      fetchRosterAndEmployees();
      fetchShifts();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data?.error || 'Gagal menyimpan rentang roster.',
      });
    }
  };

  const handleSubmitSwapRoster = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_URL}/roster/swap`, swapForm, { headers });
      notifyAlert({
        icon: 'success',
        title: 'Tukar Jaga Berhasil',
        text: res.data?.message || 'Jadwal kedua pegawai telah dipertukarkan.',
        timer: 2000,
      });
      setShowSwapModal(false);
      fetchRosterAndEmployees();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Tukar Jaga',
        text: err.response?.data?.error || 'Pastikan kedua pegawai berbeda dan tanggal valid.',
      });
    }
  };

  const pendingCount = Object.keys(pendingEntries).length;
  const allFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((e) => selectedUserIds.includes(e.user_id));

  return (
    <div className="space-y-6 pb-10">
      {/* Header Otoritatif (Solid High-Contrast Surface) */}
      <div className="surface-card p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
              <Clock size={22} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Manajemen Jam Kerja dan Roster Shift
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
                Kelola profil jam kerja reguler dan operasional 24 jam (RSUD, Satpol PP, Dishub, BPBD), penugasan shift default pegawai, serta jadwal roster bulanan dan tukar jaga.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {userRole === 'super_admin' && (
              <div className="w-full sm:w-auto">
                <label htmlFor="jamkerja-opd-filter" className="sr-only">
                  Filter Instansi OPD
                </label>
                <div className="relative">
                  <Building2
                    size={16}
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                  />
                  <select
                    id="jamkerja-opd-filter"
                    value={selectedOpd}
                    onChange={(e) => setSelectedOpd(e.target.value)}
                    className="gov-select pl-9 pr-8 text-xs sm:text-sm font-semibold min-w-[230px]"
                  >
                    <option value="">Semua Instansi OPD (Global)</option>
                    {opdList.map((opd) => (
                      <option key={opd.id} value={opd.id}>
                        {opd.nama_opd || opd.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                fetchShifts();
                fetchRosterAndEmployees();
              }}
              className="gov-btn-secondary"
            >
              <RefreshCw size={15} aria-hidden="true" />
              <span>Muat Ulang Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigasi Tab */}
      <div className="surface-card p-3 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Menu Manajemen Jam Kerja" className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'master'}
            onClick={() => setActiveTab('master')}
            className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all active:translate-y-px ${
              activeTab === 'master'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <Clock size={16} aria-hidden="true" />
            <span>1. Master Profil Jam Kerja</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-md font-mono tabular-nums ${
                activeTab === 'master' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 border border-slate-300'
              }`}
            >
              {shifts.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'penugasan'}
            onClick={() => setActiveTab('penugasan')}
            className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all active:translate-y-px ${
              activeTab === 'penugasan'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <Users size={16} aria-hidden="true" />
            <span>2. Penugasan Shift Pegawai</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-md font-mono tabular-nums ${
                activeTab === 'penugasan' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 border border-slate-300'
              }`}
            >
              {employees.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'roster'}
            onClick={() => setActiveTab('roster')}
            className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all active:translate-y-px ${
              activeTab === 'roster'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <CalendarRange size={16} aria-hidden="true" />
            <span>3. Kalender Roster dan Tukar Jaga</span>
          </button>
        </div>

        {userRole === 'super_admin' && activeTab === 'master' && (
          <button type="button" onClick={openCreateShiftModal} className="gov-btn-primary">
            <Plus size={16} aria-hidden="true" />
            <span>Buat Profil Shift Baru</span>
          </button>
        )}
      </div>

      {/* =========================================================
          TAB 1: MASTER PROFIL JAM KERJA
      ========================================================= */}
      {activeTab === 'master' && (
        <div className="space-y-5">
          {/* Ringkasan Aturan Operasional Shift */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="surface-card p-4 flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 shrink-0">
                <Moon size={18} aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Shift Malam Lintas Hari
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Scan pulang pagi hari (misal 06:00 WIB) pada shift malam otomatis tercatat ke{' '}
                  <code className="font-bold text-slate-900 bg-slate-100 px-1 py-0.5 rounded">tanggal_tugas</code>{' '}
                  hari sebelumnya.
                </p>
              </div>
            </div>

            <div className="surface-card p-4 flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                <ShieldAlert size={18} aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Abaikan Hari Libur (Operasional 24/7)
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Petugas dengan profil berlabel <b>Abaikan Libur</b> tetap dapat melakukan presensi pada hari Sabtu, Minggu, dan Libur Nasional.
                </p>
              </div>
            </div>

            <div className="surface-card p-4 flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
                <Info size={18} aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Batas Akhir Scan Pulang
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Apabila pegawai tidak memindai wajah hingga melewati batas <b>Akhir Scan Pulang</b>, sesi otomatis ditutup sebagai <i>Tidak Absen Pulang</i>.
                </p>
              </div>
            </div>
          </div>

          <ErrorBanner message={shiftError} onRetry={fetchShifts} />

          {/* Daftar Kartu Shift */}
          {loadingShifts ? (
            <div className="surface-card p-12 text-center" role="status" aria-live="polite">
              <div className="inline-flex flex-col items-center gap-2.5">
                <Loader2 size={26} className="animate-spin text-blue-700" aria-hidden="true" />
                <span className="text-sm font-semibold text-slate-700">
                  Memuat daftar profil jam kerja...
                </span>
              </div>
            </div>
          ) : !shiftError && shifts.length === 0 ? (
            <div className="surface-card p-12 text-center">
              <div className="max-w-md mx-auto space-y-2">
                <p className="text-base font-bold text-slate-900">Belum Ada Profil Jam Kerja</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Belum terdapat profil shift untuk cakupan instansi ini.{' '}
                  {userRole === 'super_admin'
                    ? 'Gunakan tombol "Buat Profil Shift Baru" di atas untuk menambahkan jadwal kerja.'
                    : 'Hubungi Super Admin untuk menambahkan profil shift baru.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {shifts.map((shift) => {
                const style = getShiftStyle(shift);
                const canModify =
                  userRole === 'super_admin' || (shift.opd_id && Number(shift.opd_id) > 0);
                return (
                  <div
                    key={shift.id}
                    className="surface-card flex flex-col justify-between overflow-hidden"
                  >
                    <div>
                      <div
                        className={`px-5 py-4 border-b ${style.bg} ${style.border} flex items-start justify-between gap-2`}
                      >
                        <div>
                          <span
                            className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${style.pill}`}
                          >
                            {shift.opd_id ? shift.nama_opd : 'Global Semua OPD'}
                          </span>
                          <h3 className="text-base font-extrabold text-slate-900 mt-2">
                            {shift.nama_shift}
                          </h3>
                        </div>
                        {shift.is_lintas_hari ? (
                          <Moon
                            size={20}
                            className="text-slate-800 shrink-0"
                            aria-label="Shift Lintas Hari"
                          />
                        ) : (
                          <Sun
                            size={20}
                            className="text-amber-700 shrink-0"
                            aria-label="Shift Hari yang Sama"
                          />
                        )}
                      </div>

                      <div className="p-5 space-y-3 text-xs">
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                          <span className="text-slate-600 font-semibold">Jam Kerja Baku</span>
                          <span className="font-extrabold text-slate-900 text-sm font-mono tabular-nums">
                            {shift.jam_masuk_str || shift.jam_masuk} s.d.{' '}
                            {shift.jam_pulang_str || shift.jam_pulang}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-slate-200">
                          <span className="text-slate-600 font-semibold">Jendela Scan Masuk</span>
                          <span className="font-bold text-blue-800 font-mono tabular-nums">
                            {shift.mulai_scan_masuk_str || shift.mulai_scan_masuk} s.d.{' '}
                            {shift.akhir_scan_masuk_str || shift.akhir_scan_masuk}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-slate-200">
                          <span className="text-slate-600 font-semibold">Jendela Scan Pulang</span>
                          <span className="font-bold text-emerald-800 font-mono tabular-nums">
                            {shift.mulai_scan_pulang_str || shift.mulai_scan_pulang} s.d.{' '}
                            {shift.akhir_scan_pulang_str || shift.akhir_scan_pulang}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-slate-200">
                          <span className="text-slate-600 font-semibold">Toleransi Terlambat</span>
                          <span className="font-bold text-amber-900 font-mono tabular-nums">
                            {shift.menit_toleransi} mnt ({shift.batas_masuk_str || shift.batas_masuk})
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {shift.is_lintas_hari && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-900 border border-slate-300 font-bold text-[11px]">
                              <Moon size={12} aria-hidden="true" />
                              <span>Lintas Hari (Malam)</span>
                            </span>
                          )}
                          {shift.abaikan_libur ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[11px]">
                              <CheckCircle2 size={12} aria-hidden="true" />
                              <span>Tetap Masuk Saat Libur</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-[11px]">
                              Mengikuti Libur Nasional
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                      <div className="text-xs text-slate-700 font-semibold tabular-nums">
                        <b>{shift.jumlah_pegawai_default || 0}</b> Pegawai,{' '}
                        <b>{shift.jumlah_roster_aktif || 0}</b> Roster
                      </div>
                      {canModify && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditShiftModal(shift)}
                            aria-label={`Ubah profil shift ${shift.nama_shift}`}
                            title="Ubah Shift"
                            className="gov-icon-btn text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200"
                          >
                            <Edit3 size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteShift(shift)}
                            aria-label={`Hapus profil shift ${shift.nama_shift}`}
                            title="Hapus Shift"
                            className="gov-icon-btn text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200"
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          TAB 2: PENUGASAN SHIFT DEFAULT PEGAWAI
      ========================================================= */}
      {activeTab === 'penugasan' && (
        <div className="surface-card overflow-hidden">
          <div className="p-5 border-b border-slate-200 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                <div>
                  <label
                    htmlFor="penugasan-search"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    Cari Pegawai
                  </label>
                  <div className="relative">
                    <Search
                      size={16}
                      aria-hidden="true"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                    />
                    <input
                      id="penugasan-search"
                      type="text"
                      placeholder="Nama atau NIP/NIK..."
                      value={searchEmp}
                      onChange={(e) => setSearchEmp(e.target.value)}
                      className="gov-input pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="penugasan-role-filter"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    Kategori Personel
                  </label>
                  <select
                    id="penugasan-role-filter"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="gov-select"
                  >
                    <option value="">Semua Kategori (ASN dan Non-ASN)</option>
                    <option value="asn">Personel ASN</option>
                    <option value="non_asn">Personel Non-ASN</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="penugasan-shift-filter"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    Filter Shift Default
                  </label>
                  <select
                    id="penugasan-shift-filter"
                    value={filterShiftDefault}
                    onChange={(e) => setFilterShiftDefault(e.target.value)}
                    className="gov-select"
                  >
                    <option value="">Semua Shift Default</option>
                    <option value="DEFAULT">Mengikuti Default Reguler</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama_shift}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs font-semibold text-slate-700 tabular-nums">
                Menampilkan <b>{filteredEmployees.length}</b> dari <b>{employees.length}</b> personel
              </div>
            </div>

            {/* Bar Penugasan Massal */}
            {selectedUserIds.length > 0 && (
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-950">
                  <CheckCircle2 size={18} className="text-blue-700 shrink-0" aria-hidden="true" />
                  <span>{selectedUserIds.length} pegawai dipilih untuk penugasan massal</span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <label htmlFor="bulk-shift-select" className="sr-only">
                    Pilih Shift Massal
                  </label>
                  <select
                    id="bulk-shift-select"
                    value={bulkShiftId}
                    onChange={(e) => setBulkShiftId(e.target.value)}
                    className="gov-select w-full sm:w-auto min-w-[240px] text-xs font-semibold"
                  >
                    <option value="">Pilih Shift untuk Diterapkan</option>
                    <option value="RESET">Kembalikan ke Default Global (Reguler)</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama_shift} ({s.jam_masuk_str || s.jam_masuk} s.d.{' '}
                        {s.jam_pulang_str || s.jam_pulang})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleBulkAssignShift}
                    disabled={!bulkShiftId}
                    className="gov-btn-primary text-xs"
                  >
                    Terapkan ke {selectedUserIds.length} Pegawai
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedUserIds([])}
                    className="gov-btn-secondary text-xs"
                  >
                    Batal Pilih
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tabel Penugasan Pegawai */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <th className="py-3 px-4 w-12 text-center">
                    <label className="inline-flex items-center justify-center min-h-[44px] min-w-[44px]">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAllFiltered}
                        aria-label="Pilih semua pegawai yang ditampilkan"
                        className="w-4 h-4 rounded accent-blue-700"
                      />
                    </label>
                  </th>
                  <th className="py-3.5 px-4">Nama dan NIP / NIK</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Instansi OPD</th>
                  <th className="py-3.5 px-4">Shift Aktif Saat Ini</th>
                  <th className="py-3.5 px-4">Ubah Shift Default</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                {loadingRoster ? (
                  <TableLoadingRow colSpan={6} label="Memuat daftar penugasan shift pegawai..." />
                ) : rosterError ? (
                  <TableErrorRow
                    colSpan={6}
                    message={rosterError}
                    onRetry={fetchRosterAndEmployees}
                  />
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 px-4 text-center">
                      <p className="text-sm font-bold text-slate-900">
                        Tidak Ada Personel yang Sesuai
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Ubah kata kunci pencarian atau reset filter kategori dan shift di atas.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const checked = selectedUserIds.includes(emp.user_id);
                    const currentShiftObj = emp.default_jam_kerja_id
                      ? shiftsById[emp.default_jam_kerja_id]
                      : shifts[0];
                    const style = getShiftStyle(currentShiftObj);
                    return (
                      <tr
                        key={emp.user_id}
                        className={`hover:bg-slate-50 transition-colors ${
                          checked ? 'bg-blue-50/60' : ''
                        }`}
                      >
                        <td className="py-2 px-4 text-center">
                          <label className="inline-flex items-center justify-center min-h-[44px] min-w-[44px]">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSelectUser(emp.user_id)}
                              aria-label={`Pilih ${emp.nama}`}
                              className="w-4 h-4 rounded accent-blue-700"
                            />
                          </label>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{emp.nama}</div>
                          <div className="text-xs text-slate-600 font-mono tabular-nums">
                            {emp.nip}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase border ${
                              emp.role === 'non_asn'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-blue-50 text-blue-800 border-blue-300'
                            }`}
                          >
                            {emp.role === 'non_asn' ? 'Non-ASN' : 'ASN'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{emp.nama_opd}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}
                          >
                            <Clock size={13} aria-hidden="true" />
                            <span>
                              {emp.default_nama_shift} ({emp.default_jam_baku})
                            </span>
                          </span>
                        </td>
                        <td className="py-2.5 px-4 min-w-[230px]">
                          <select
                            aria-label={`Ubah shift default untuk ${emp.nama}`}
                            value={emp.default_jam_kerja_id || ''}
                            onChange={(e) => handleSingleAssignShift(emp.user_id, e.target.value)}
                            className="gov-select text-xs font-semibold"
                          >
                            <option value="">Default Global (Reguler ASN)</option>
                            {shifts.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nama_shift} ({s.jam_masuk_str || s.jam_masuk} s.d.{' '}
                                {s.jam_pulang_str || s.jam_pulang})
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: KALENDER ROSTER BULANAN & TUKAR JAGA
      ========================================================= */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Kontrol Periode, Filter & Palet Kuas */}
          <div className="surface-card p-5 space-y-4">
            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
                <div>
                  <label htmlFor="roster-bulan" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Bulan Roster
                  </label>
                  <div className="relative">
                    <CalendarDays
                      size={15}
                      aria-hidden="true"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                    />
                    <select
                      id="roster-bulan"
                      value={bulan}
                      onChange={(e) => setBulan(Number(e.target.value))}
                      className="gov-select pl-9 font-semibold"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="roster-tahun" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tahun
                  </label>
                  <select
                    id="roster-tahun"
                    value={tahun}
                    onChange={(e) => setTahun(Number(e.target.value))}
                    className="gov-select font-semibold tabular-nums"
                  >
                    {[2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="roster-search" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Cari Personel
                  </label>
                  <div className="relative">
                    <Search
                      size={15}
                      aria-hidden="true"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                    />
                    <input
                      id="roster-search"
                      type="text"
                      placeholder="Nama / NIP / NIK..."
                      value={searchEmp}
                      onChange={(e) => setSearchEmp(e.target.value)}
                      className="gov-input pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="roster-role" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kategori Personel
                  </label>
                  <select
                    id="roster-role"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="gov-select"
                  >
                    <option value="">Semua Kategori (ASN dan Non-ASN)</option>
                    <option value="asn">Personel ASN</option>
                    <option value="non_asn">Personel Non-ASN</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setRangeForm((prev) => ({
                      ...prev,
                      jam_kerja_id: shifts[0]?.id ? String(shifts[0].id) : '',
                    }));
                    setShowRangeModal(true);
                  }}
                  className="gov-btn-primary text-xs"
                >
                  <CalendarRange size={15} aria-hidden="true" />
                  <span>Plotting Rentang Tanggal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSwapModal(true)}
                  className="gov-btn-secondary text-xs"
                >
                  <ArrowLeftRight size={15} aria-hidden="true" />
                  <span>Tukar Jaga Pegawai</span>
                </button>
              </div>
            </div>

            {/* Banner Perubahan Roster Belum Disimpan (Kontras Tinggi Lulus WCAG AA tanpa Animasi Berulang) */}
            {pendingCount > 0 && (
              <div
                role="status"
                aria-live="polite"
                className="p-4 rounded-lg bg-amber-50 border border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="text-xs sm:text-sm font-bold text-amber-950">
                  Terdapat <span className="tabular-nums underline">{pendingCount}</span> sel jadwal roster yang telah diubah dan belum disimpan ke server.
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingEntries({})}
                    className="gov-btn-secondary text-xs"
                  >
                    Batalkan Perubahan
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePendingRoster}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 active:translate-y-px text-white text-xs font-bold transition-all"
                  >
                    <Save size={15} aria-hidden="true" />
                    <span>Simpan {pendingCount} Perubahan Roster</span>
                  </button>
                </div>
              </div>
            )}

            {/* Palet Kuas Klik Cepat */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 mr-1">
                Kuas Klik Cepat Tanggal:
              </span>
              {shifts.map((s) => {
                const style = getShiftStyle(s);
                const isSelected = activeBrushShiftId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setActiveBrushShiftId(s.id)}
                    className={`inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-bold border transition-all active:translate-y-px ${
                      isSelected
                        ? `${style.pill} ring-2 ring-offset-1 ring-blue-700`
                        : `${style.bg} ${style.text} ${style.border} hover:brightness-95`
                    }`}
                  >
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/10">
                      {getShortShiftCode(s.nama_shift)}
                    </span>
                    <span>{s.nama_shift}</span>
                  </button>
                );
              })}

              <button
                type="button"
                aria-pressed={activeBrushShiftId === 0}
                onClick={() => setActiveBrushShiftId(0)}
                className={`inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-bold border transition-all active:translate-y-px ${
                  activeBrushShiftId === 0
                    ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-offset-1 ring-blue-700'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                Reset ke Default
              </button>
            </div>
          </div>

          {/* Matriks Kalender Bulanan (Sel <button> Aksesibel >= 44x44px) */}
          <div className="surface-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase">
                    <th className="sticky left-0 z-20 bg-slate-900 py-3 px-4 min-w-[220px] border-r border-slate-700">
                      Pegawai ({filteredEmployees.length})
                    </th>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                      const dObj = new Date(tahun, bulan - 1, day);
                      const isWeekend = dObj.getDay() === 0 || dObj.getDay() === 6;
                      return (
                        <th
                          key={day}
                          className={`py-2.5 px-1 text-center min-w-[48px] border-r border-slate-800 tabular-nums ${
                            isWeekend ? 'bg-red-950 text-red-100' : ''
                          }`}
                        >
                          <div>{day}</div>
                          <div className="text-[10px] font-medium text-slate-300">
                            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][dObj.getDay()]}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {loadingRoster ? (
                    <TableLoadingRow
                      colSpan={daysInMonth + 1}
                      label="Memuat matriks kalender roster bulanan..."
                    />
                  ) : rosterError ? (
                    <TableErrorRow
                      colSpan={daysInMonth + 1}
                      message={rosterError}
                      onRetry={fetchRosterAndEmployees}
                    />
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={daysInMonth + 1} className="py-14 px-4 text-center">
                        <p className="text-sm font-bold text-slate-900">
                          Tidak Ada Personel Ditemukan
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Periksa filter kategori atau kata kunci pencarian nama/NIP di atas.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const empRoster = rosterMap[String(emp.user_id)] || {};
                      return (
                        <tr key={emp.user_id} className="hover:bg-slate-50">
                          <td className="sticky left-0 z-10 bg-white py-2.5 px-4 border-r border-slate-300">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="font-bold text-slate-900 truncate max-w-[140px]"
                                title={emp.nama}
                              >
                                {emp.nama}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 border ${
                                  emp.role === 'non_asn'
                                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                                    : 'bg-blue-50 text-blue-800 border-blue-300'
                                }`}
                              >
                                {emp.role === 'non_asn' ? 'Non-ASN' : 'ASN'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 truncate mt-0.5">
                              Default: {emp.default_nama_shift}
                            </div>
                          </td>
                          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                            const dateStr = `${tahun}-${String(bulan).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const pendingKey = `${emp.user_id}_${dateStr}`;
                            const pendingItem = pendingEntries[pendingKey];
                            const savedItem = empRoster[dateStr];

                            let activeShiftId = null;
                            let isRosterOverride = false;
                            let tooltip = `Default: ${emp.default_nama_shift}`;

                            if (pendingItem !== undefined) {
                              activeShiftId = pendingItem.jam_kerja_id;
                              isRosterOverride = activeShiftId !== null;
                              tooltip = activeShiftId
                                ? `Belum Disimpan: ${shiftsById[activeShiftId]?.nama_shift || ''}`
                                : 'Belum Disimpan: Reset ke Default';
                            } else if (savedItem) {
                              activeShiftId = savedItem.jam_kerja_id;
                              isRosterOverride = true;
                              tooltip = `Roster: ${savedItem.nama_shift} (${savedItem.jam_baku})${
                                savedItem.keterangan ? ', ' + savedItem.keterangan : ''
                              }`;
                            } else {
                              activeShiftId = emp.default_jam_kerja_id;
                            }

                            const shiftObj = activeShiftId ? shiftsById[activeShiftId] : null;
                            const style = getShiftStyle(shiftObj);
                            const code = shiftObj ? getShortShiftCode(shiftObj.nama_shift) : 'REG';

                            return (
                              <td
                                key={day}
                                className={`p-1 text-center border-r border-slate-200 ${
                                  pendingItem !== undefined ? 'bg-amber-50' : ''
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleCellClick(emp, day)}
                                  title={tooltip}
                                  aria-label={`${emp.nama}, tanggal ${day} ${MONTH_NAMES[bulan - 1]} ${tahun}, ${tooltip}`}
                                  className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-1 rounded-md text-[11px] font-mono font-extrabold border transition-all active:scale-95 ${
                                    pendingItem !== undefined
                                      ? 'ring-2 ring-amber-600 '
                                      : ''
                                  }${
                                    isRosterOverride
                                      ? `${style.pill}`
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 font-semibold'
                                  }`}
                                >
                                  {code}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 1: CREATE / EDIT MASTER JAM KERJA
      ========================================================= */}
      {showShiftModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowShiftModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-shift-title"
            className="surface-modal max-w-lg w-full overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 id="modal-shift-title" className="text-base font-extrabold">
                {editingShift ? 'Perbarui Profil Jam Kerja' : 'Buat Profil Jam Kerja Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowShiftModal(false)}
                aria-label="Tutup dialog profil jam kerja"
                className="gov-icon-btn text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="p-6 space-y-4 text-xs sm:text-sm">
              <div>
                <label htmlFor="shift-nama" className="block font-bold text-slate-800 mb-1.5">
                  Nama Profil Shift <span className="text-red-700">*</span>
                </label>
                <input
                  id="shift-nama"
                  type="text"
                  required
                  placeholder="Contoh: Shift Pagi RSUD / Reguler OPD"
                  value={shiftForm.nama_shift}
                  onChange={(e) => setShiftForm({ ...shiftForm, nama_shift: e.target.value })}
                  className="gov-input"
                />
              </div>

              {userRole === 'super_admin' && (
                <div>
                  <label htmlFor="shift-opd" className="block font-bold text-slate-800 mb-1.5">
                    Cakupan Instansi OPD
                  </label>
                  <select
                    id="shift-opd"
                    value={shiftForm.opd_id}
                    onChange={(e) => setShiftForm({ ...shiftForm, opd_id: e.target.value })}
                    className="gov-select"
                  >
                    <option value="">Global (Berlaku untuk Seluruh OPD)</option>
                    {opdList.map((opd) => (
                      <option key={opd.id} value={opd.id}>
                        {opd.nama_opd || opd.nama}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="shift-jam-masuk" className="block font-bold text-slate-800 mb-1.5">
                    Jam Masuk Baku <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="shift-jam-masuk"
                    type="time"
                    required
                    value={shiftForm.jam_masuk}
                    onChange={(e) => setShiftForm({ ...shiftForm, jam_masuk: e.target.value })}
                    className="gov-input font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="shift-jam-pulang" className="block font-bold text-slate-800 mb-1.5">
                    Jam Pulang Baku <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="shift-jam-pulang"
                    type="time"
                    required
                    value={shiftForm.jam_pulang}
                    onChange={(e) => setShiftForm({ ...shiftForm, jam_pulang: e.target.value })}
                    className="gov-input font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="shift-mulai-masuk"
                    className="block font-bold text-slate-800 mb-1.5"
                  >
                    Mulai Scan Masuk <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="shift-mulai-masuk"
                    type="time"
                    required
                    value={shiftForm.mulai_scan_masuk}
                    onChange={(e) =>
                      setShiftForm({ ...shiftForm, mulai_scan_masuk: e.target.value })
                    }
                    className="gov-input font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label
                    htmlFor="shift-akhir-masuk"
                    className="block font-bold text-slate-800 mb-1.5"
                  >
                    Akhir Scan Masuk <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="shift-akhir-masuk"
                    type="time"
                    required
                    value={shiftForm.akhir_scan_masuk}
                    onChange={(e) =>
                      setShiftForm({ ...shiftForm, akhir_scan_masuk: e.target.value })
                    }
                    className="gov-input font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="shift-mulai-pulang"
                    className="block font-bold text-slate-800 mb-1.5"
                  >
                    Mulai Scan Pulang <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="shift-mulai-pulang"
                    type="time"
                    required
                    value={shiftForm.mulai_scan_pulang}
                    onChange={(e) =>
                      setShiftForm({ ...shiftForm, mulai_scan_pulang: e.target.value })
                    }
                    className="gov-input font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label
                    htmlFor="shift-akhir-pulang"
                    className="block font-bold text-slate-800 mb-1.5"
                  >
                    Akhir Scan Pulang (Batas Tutup) <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="shift-akhir-pulang"
                    type="time"
                    required
                    value={shiftForm.akhir_scan_pulang}
                    onChange={(e) =>
                      setShiftForm({ ...shiftForm, akhir_scan_pulang: e.target.value })
                    }
                    className="gov-input font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="shift-toleransi" className="block font-bold text-slate-800 mb-1.5">
                  Toleransi Keterlambatan (Menit)
                </label>
                <input
                  id="shift-toleransi"
                  type="number"
                  min={0}
                  max={180}
                  value={shiftForm.menit_toleransi}
                  onChange={(e) =>
                    setShiftForm({ ...shiftForm, menit_toleransi: Number(e.target.value) })
                  }
                  className="gov-input font-mono tabular-nums"
                />
              </div>

              <div className="space-y-2.5 pt-1">
                <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={shiftForm.is_lintas_hari}
                    onChange={(e) =>
                      setShiftForm({ ...shiftForm, is_lintas_hari: e.target.checked })
                    }
                    className="mt-0.5 w-4 h-4 rounded accent-blue-700 shrink-0"
                  />
                  <span className="font-semibold text-slate-800 text-xs leading-relaxed">
                    Shift Lintas Hari / Malam (jam kepulangan berada pada pagi hari berikutnya)
                  </span>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={shiftForm.abaikan_libur}
                    onChange={(e) =>
                      setShiftForm({ ...shiftForm, abaikan_libur: e.target.checked })
                    }
                    className="mt-0.5 w-4 h-4 rounded accent-blue-700 shrink-0"
                  />
                  <span className="font-semibold text-slate-800 text-xs leading-relaxed">
                    Abaikan Hari Libur (tetap beroperasi pada hari Sabtu, Minggu, dan Libur Nasional)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="gov-btn-secondary"
                >
                  Batal
                </button>
                <button type="submit" className="gov-btn-primary">
                  Simpan Profil Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: PLOTTING RENTANG TANGGAL
      ========================================================= */}
      {showRangeModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowRangeModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-range-title"
            className="surface-modal max-w-lg w-full overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 id="modal-range-title" className="text-base font-extrabold">
                Plotting Roster Rentang Tanggal
              </h3>
              <button
                type="button"
                onClick={() => setShowRangeModal(false)}
                aria-label="Tutup dialog plotting rentang tanggal"
                className="gov-icon-btn text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmitRangeRoster} className="p-6 space-y-4 text-xs sm:text-sm">
              <div>
                <p className="font-bold text-slate-800 mb-1.5">
                  Pilih Pegawai ({rangeForm.user_ids.length} dipilih)
                </p>
                <div className="max-h-48 overflow-y-auto border border-slate-400 rounded-lg p-2 space-y-1 bg-slate-50">
                  {filteredEmployees.map((emp) => {
                    const checked = rangeForm.user_ids.includes(emp.user_id);
                    return (
                      <label
                        key={emp.user_id}
                        className="flex items-center gap-2.5 min-h-[44px] px-2.5 py-1.5 rounded-md bg-white hover:bg-blue-50 border border-slate-200"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setRangeForm((prev) => ({
                              ...prev,
                              user_ids: checked
                                ? prev.user_ids.filter((id) => id !== emp.user_id)
                                : [...prev.user_ids, emp.user_id],
                            }));
                          }}
                          className="w-4 h-4 rounded accent-blue-700 shrink-0"
                        />
                        <span className="font-bold text-slate-900 text-xs">{emp.nama}</span>
                        <span className="text-slate-600 font-mono text-[11px] tabular-nums">
                          ({emp.nip})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="range-start" className="block font-bold text-slate-800 mb-1.5">
                    Dari Tanggal <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="range-start"
                    type="date"
                    required
                    value={rangeForm.start_date}
                    onChange={(e) => setRangeForm({ ...rangeForm, start_date: e.target.value })}
                    className="gov-input font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="range-end" className="block font-bold text-slate-800 mb-1.5">
                    Sampai Tanggal <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="range-end"
                    type="date"
                    required
                    value={rangeForm.end_date}
                    onChange={(e) => setRangeForm({ ...rangeForm, end_date: e.target.value })}
                    className="gov-input font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="range-shift" className="block font-bold text-slate-800 mb-1.5">
                  Shift yang Diterapkan <span className="text-red-700">*</span>
                </label>
                <select
                  id="range-shift"
                  required
                  value={rangeForm.jam_kerja_id}
                  onChange={(e) => setRangeForm({ ...rangeForm, jam_kerja_id: e.target.value })}
                  className="gov-select"
                >
                  <option value="">Pilih Profil Shift</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama_shift} ({s.jam_masuk_str || s.jam_masuk} s.d.{' '}
                      {s.jam_pulang_str || s.jam_pulang})
                    </option>
                  ))}
                  <option value="0">Reset / Hapus Roster (Kembali ke Default Pegawai)</option>
                </select>
              </div>

              <div>
                <label htmlFor="range-ket" className="block font-bold text-slate-800 mb-1.5">
                  Keterangan (Opsional)
                </label>
                <input
                  id="range-ket"
                  type="text"
                  placeholder="Contoh: Jadwal Jaga Minggu Ke-1"
                  value={rangeForm.keterangan}
                  onChange={(e) => setRangeForm({ ...rangeForm, keterangan: e.target.value })}
                  className="gov-input"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRangeModal(false)}
                  className="gov-btn-secondary"
                >
                  Batal
                </button>
                <button type="submit" className="gov-btn-primary">
                  Simpan Plotting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: TUKAR JAGA PEGAWAI (SWAP SHIFT)
      ========================================================= */}
      {showSwapModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowSwapModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-swap-title"
            className="surface-modal max-w-md w-full overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ArrowLeftRight size={18} aria-hidden="true" />
                <h3 id="modal-swap-title" className="text-base font-extrabold">
                  Tukar Jaga Shift Pegawai
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSwapModal(false)}
                aria-label="Tutup dialog tukar jaga"
                className="gov-icon-btn text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmitSwapRoster} className="p-6 space-y-4 text-xs sm:text-sm">
              <div>
                <label htmlFor="swap-tanggal" className="block font-bold text-slate-800 mb-1.5">
                  Tanggal Tukar Jaga <span className="text-red-700">*</span>
                </label>
                <input
                  id="swap-tanggal"
                  type="date"
                  required
                  value={swapForm.tanggal}
                  onChange={(e) => setSwapForm({ ...swapForm, tanggal: e.target.value })}
                  className="gov-input font-mono tabular-nums"
                />
              </div>

              <div>
                <label htmlFor="swap-user-a" className="block font-bold text-slate-800 mb-1.5">
                  Pegawai Pertama (Pihak A) <span className="text-red-700">*</span>
                </label>
                <select
                  id="swap-user-a"
                  required
                  value={swapForm.user_a_id}
                  onChange={(e) => setSwapForm({ ...swapForm, user_a_id: e.target.value })}
                  className="gov-select"
                >
                  <option value="">Pilih Pegawai Pihak A</option>
                  {employees.map((emp) => (
                    <option key={emp.user_id} value={emp.user_id}>
                      {emp.nama} ({emp.default_nama_shift})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="swap-user-b" className="block font-bold text-slate-800 mb-1.5">
                  Ditukar dengan Pegawai Kedua (Pihak B) <span className="text-red-700">*</span>
                </label>
                <select
                  id="swap-user-b"
                  required
                  value={swapForm.user_b_id}
                  onChange={(e) => setSwapForm({ ...swapForm, user_b_id: e.target.value })}
                  className="gov-select"
                >
                  <option value="">Pilih Pegawai Pihak B</option>
                  {employees.map((emp) => (
                    <option key={emp.user_id} value={emp.user_id}>
                      {emp.nama} ({emp.default_nama_shift})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="swap-keterangan" className="block font-bold text-slate-800 mb-1.5">
                  Alasan / Catatan Tukar Jaga
                </label>
                <input
                  id="swap-keterangan"
                  type="text"
                  placeholder="Contoh: Tukar shift atas izin Kepala Ruangan"
                  value={swapForm.keterangan}
                  onChange={(e) => setSwapForm({ ...swapForm, keterangan: e.target.value })}
                  className="gov-input"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSwapModal(false)}
                  className="gov-btn-secondary"
                >
                  Batal
                </button>
                <button type="submit" className="gov-btn-primary">
                  Proses Tukar Jaga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JamKerjaPage;
