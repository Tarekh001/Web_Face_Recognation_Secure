import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Clock, CalendarRange, Users, Plus, Edit3, Trash2, CheckSquare,
  Square, ArrowLeftRight, Moon, Sun, ShieldAlert, Building2,
  Search, Filter, RefreshCw, Sparkles, CheckCircle2, Info, CalendarDays, Save, X
} from 'lucide-react';
import API_BASE from '../config/api';

const API_URL = API_BASE;

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const SHIFT_COLOR_PALETTE = [
  { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', pill: 'bg-blue-600 text-white', code: 'REG' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', pill: 'bg-emerald-600 text-white', code: 'PAGI' },
  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', pill: 'bg-amber-500 text-white', code: 'SIANG' },
  { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', pill: 'bg-purple-600 text-white', code: 'MALAM' },
  { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', pill: 'bg-rose-600 text-white', code: 'KHUSUS' },
  { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', pill: 'bg-cyan-600 text-white', code: 'OPS' },
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

  // Bulk Assign state (Tab 2)
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkShiftId, setBulkShiftId] = useState('');

  // Roster interactive painting & modals (Tab 3)
  const [activeBrushShiftId, setActiveBrushShiftId] = useState(null); // shift.id or 0 for reset
  const [pendingEntries, setPendingEntries] = useState({}); // key `${user_id}_${YYYY-MM-DD}` -> { user_id, tanggal, jam_kerja_id, keterangan }
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

  // Load OPD List for Super Admin
  useEffect(() => {
    if (userRole === 'super_admin') {
      axios.get(`${API_URL}/opd`, { headers })
        .then((res) => setOpdList(Array.isArray(res.data) ? res.data : (res.data?.data || [])))
        .catch(() => {});
    }
  }, [userRole, headers]);

  const fetchShifts = async () => {
    setLoadingShifts(true);
    try {
      const params = {};
      if (selectedOpd) params.opd_id = selectedOpd;
      const res = await axios.get(`${API_URL}/jam-kerja`, { headers, params });
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setShifts(list);
      if (list.length > 0 && activeBrushShiftId === null) {
        setActiveBrushShiftId(list[0].id);
      }
    } catch (err) {
      console.error('Gagal memuat profil jam kerja:', err);
    } finally {
      setLoadingShifts(false);
    }
  };

  const fetchRosterAndEmployees = async () => {
    setLoadingRoster(true);
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
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [selectedOpd]);

  useEffect(() => {
    fetchRosterAndEmployees();
  }, [bulan, tahun, selectedOpd, roleFilter]);

  const shiftsById = useMemo(() => {
    const map = {};
    shifts.forEach((s) => { map[s.id] = s; });
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

  // ── HANDLERS TAB 1: MASTER JAM KERJA ──
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
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Profil jam kerja berhasil diperbarui.', timer: 1600, showConfirmButton: false });
      } else {
        await axios.post(`${API_URL}/jam-kerja`, shiftForm, { headers });
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Profil jam kerja baru berhasil ditambahkan.', timer: 1600, showConfirmButton: false });
      }
      setShowShiftModal(false);
      fetchShifts();
      fetchRosterAndEmployees();
    } catch (err) {
      Swal.fire('Gagal', err.response?.data?.error || 'Terjadi kesalahan saat menyimpan profil jam kerja.', 'error');
    }
  };

  const handleDeleteShift = async (shift) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: `Hapus ${shift.nama_shift}?`,
      text: 'Pegawai yang menggunakan shift ini sebagai default akan dikembalikan ke Reguler Global.',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });
    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}/jam-kerja/${shift.id}`, { headers });
      Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Profil jam kerja berhasil dihapus.', timer: 1500, showConfirmButton: false });
      fetchShifts();
      fetchRosterAndEmployees();
    } catch (err) {
      Swal.fire('Tidak Dapat Dihapus', err.response?.data?.error || 'Gagal menghapus profil jam kerja.', 'error');
    }
  };

  // ── HANDLERS TAB 2: PENUGASAN SHIFT PEGAWAI ──
  const handleSingleAssignShift = async (userId, newShiftId) => {
    try {
      const res = await axios.put(
        `${API_URL}/users/${userId}/jam-kerja`,
        { jam_kerja_id: newShiftId || null },
        { headers }
      );
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: res.data?.message || 'Shift pegawai diperbarui',
        showConfirmButton: false,
        timer: 1800,
      });
      fetchRosterAndEmployees();
      fetchShifts();
    } catch (err) {
      Swal.fire('Gagal', err.response?.data?.error || 'Gagal mengubah shift pegawai.', 'error');
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
          jam_kerja_id: bulkShiftId === 'RESET' ? null : (bulkShiftId || null),
        },
        { headers }
      );
      Swal.fire({
        icon: 'success',
        title: 'Penugasan Massal Berhasil',
        text: res.data?.message,
        timer: 1800,
        showConfirmButton: false,
      });
      setSelectedUserIds([]);
      fetchRosterAndEmployees();
      fetchShifts();
    } catch (err) {
      Swal.fire('Gagal', err.response?.data?.error || 'Gagal menerapkan shift massal.', 'error');
    }
  };

  // ── HANDLERS TAB 3: ROSTER BULANAN & TUKAR JAGA ──
  const handleCellClick = (emp, dayNumber) => {
    if (activeBrushShiftId === null) {
      Swal.fire('Pilih Kuas Shift', 'Silakan pilih salah satu kuas Shift di bagian atas tabel sebelum mengeklik tanggal.', 'info');
      return;
    }
    const dateStr = `${tahun}-${String(bulan).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    const key = `${emp.user_id}_${dateStr}`;

    setPendingEntries((prev) => {
      const next = { ...prev };
      next[key] = {
        user_id: emp.user_id,
        tanggal: dateStr,
        jam_kerja_id: activeBrushShiftId === 0 ? null : activeBrushShiftId,
        keterangan: activeBrushShiftId === 0 ? '' : 'Roster Bulanan',
      };
      return next;
    });
  };

  const handleSavePendingRoster = async () => {
    const entries = Object.values(pendingEntries);
    if (entries.length === 0) return;
    try {
      const res = await axios.post(`${API_URL}/roster/batch`, { entries }, { headers });
      Swal.fire({
        icon: 'success',
        title: 'Roster Tersimpan',
        text: res.data?.message,
        timer: 1800,
        showConfirmButton: false,
      });
      fetchRosterAndEmployees();
      fetchShifts();
    } catch (err) {
      Swal.fire('Gagal Menyimpan Roster', err.response?.data?.error || 'Terjadi kesalahan.', 'error');
    }
  };

  const handleSubmitRangeRoster = async (e) => {
    e.preventDefault();
    if (!rangeForm.user_ids.length) {
      Swal.fire('Perhatian', 'Pilih minimal 1 pegawai.', 'warning');
      return;
    }
    const start = new Date(rangeForm.start_date);
    const end = new Date(rangeForm.end_date);
    if (isNaN(start) || isNaN(end) || end < start) {
      Swal.fire('Perhatian', 'Rentang tanggal tidak valid.', 'warning');
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
      Swal.fire({ icon: 'success', title: 'Berhasil', text: res.data?.message, timer: 1800, showConfirmButton: false });
      setShowRangeModal(false);
      fetchRosterAndEmployees();
      fetchShifts();
    } catch (err) {
      Swal.fire('Gagal', err.response?.data?.error || 'Gagal menyimpan rentang roster.', 'error');
    }
  };

  const handleSubmitSwapRoster = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_URL}/roster/swap`, swapForm, { headers });
      Swal.fire({ icon: 'success', title: 'Tukar Jaga Berhasil', text: res.data?.message, timer: 2000, showConfirmButton: false });
      setShowSwapModal(false);
      fetchRosterAndEmployees();
    } catch (err) {
      Swal.fire('Gagal Tukar Jaga', err.response?.data?.error || 'Pastikan kedua pegawai berbeda dan tanggal valid.', 'error');
    }
  };

  const pendingCount = Object.keys(pendingEntries).length;

  return (
    <div className="space-y-6 pb-10">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800/80 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={13} />
              Core Shift Engine v2.0 • 5 Aturan Baku Presensi
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Manajemen Jam Kerja & Sistem Roster Shift
            </h2>
            <p className="text-slate-300 text-sm max-w-3xl">
              Kelola profil jam kerja reguler & operasional 24/7 (RSUD, Satpol PP, Dishub, BPBD), penugasan shift default pegawai, hingga plotting roster bulanan lintas hari dan tukar jaga.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {userRole === 'super_admin' && (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2">
                <Building2 size={16} className="text-blue-400 shrink-0" />
                <select
                  value={selectedOpd}
                  onChange={(e) => setSelectedOpd(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-white focus:outline-none"
                >
                  <option value="" className="text-slate-900">Semua Instansi OPD (Global)</option>
                  {opdList.map((opd) => (
                    <option key={opd.id} value={opd.id} className="text-slate-900">
                      {opd.nama_opd}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => { fetchShifts(); fetchRosterAndEmployees(); }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition cursor-pointer"
            >
              <RefreshCw size={15} />
              Segarkan Data
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-soft-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('master')}
            className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              activeTab === 'master'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock size={17} />
            1. Master Profil Jam Kerja
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'master' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {shifts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('penugasan')}
            className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              activeTab === 'penugasan'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users size={17} />
            2. Penugasan Shift Pegawai
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'penugasan' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {employees.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarRange size={17} />
            3. Kalender Roster Bulanan & Tukar Jaga
          </button>
        </div>

        {(userRole === 'super_admin') && activeTab === 'master' &&  (
          <button
            onClick={openCreateShiftModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Plus size={17} />
            Buat Profil Shift Baru
          </button>
        )}
      </div>

      {/* =========================================================
          TAB 1: MASTER PROFIL JAM KERJA
      ========================================================= */}
      {activeTab === 'master' && (
        <div className="space-y-6">
          {/* 5 Core Rules Info Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft-xs flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 shrink-0">
                <Moon size={20} />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Overnight Shift (Lintas Hari)
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Scan pulang pagi hari (misal 06:00 WIB) untuk shift malam otomatis merujuk ke <code className="font-bold text-purple-700">tanggal_tugas</code> hari sebelumnya.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft-xs flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Abaikan Hari Libur (24/7 Ops)
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Petugas dengan shift berlabel <b>Abaikan Libur</b> tetap dapat absen di Kiosk pada hari Sabtu, Minggu, dan Libur Nasional.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft-xs flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                <Info size={20} />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Cut-Off Tidak Absen Pulang
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Jika pegawai lupa scan pulang hingga melewati <b>Akhir Scan Pulang</b>, sesi otomatis ditutup sebagai <i>Tidak Absen Pulang</i>.
                </p>
              </div>
            </div>
          </div>

          {/* Shift Cards Grid */}
          {loadingShifts ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">
              Memuat daftar profil jam kerja...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {shifts.map((shift) => {
                const style = getShiftStyle(shift);
                const canModify = userRole === 'super_admin' || (shift.opd_id && Number(shift.opd_id) > 0);
                return (
                  <div
                    key={shift.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-soft-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
                  >
                    <div>
                      <div className={`px-5 py-4 border-b ${style.bg} ${style.border} flex items-start justify-between gap-2`}>
                        <div>
                          <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${style.pill}`}>
                            {shift.opd_id ? shift.nama_opd : 'Global • Semua OPD'}
                          </span>
                          <h3 className="text-base font-extrabold text-slate-900 mt-2">
                            {shift.nama_shift}
                          </h3>
                        </div>
                        {shift.is_lintas_hari ? (
                          <Moon size={20} className="text-purple-600 shrink-0" title="Shift Lintas Hari" />
                        ) : (
                          <Sun size={20} className="text-amber-500 shrink-0" title="Shift Hari yang Sama" />
                        )}
                      </div>

                      <div className="p-5 space-y-3 text-xs">
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Jam Kerja Baku</span>
                          <span className="font-extrabold text-slate-900 text-sm">
                            {shift.jam_masuk_str || shift.jam_masuk} – {shift.jam_pulang_str || shift.jam_pulang}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Jendela Scan Masuk</span>
                          <span className="font-bold text-blue-700">
                            {shift.mulai_scan_masuk_str || shift.mulai_scan_masuk} – {shift.akhir_scan_masuk_str || shift.akhir_scan_masuk}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Jendela Scan Pulang</span>
                          <span className="font-bold text-emerald-700">
                            {shift.mulai_scan_pulang_str || shift.mulai_scan_pulang} – {shift.akhir_scan_pulang_str || shift.akhir_scan_pulang}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Toleransi (Batas Telat)</span>
                          <span className="font-bold text-amber-700">
                            {shift.menit_toleransi} mnt ({shift.batas_masuk_str || shift.batas_masuk})
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {shift.is_lintas_hari && (
                            <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[11px]">
                              🌙 Lintas Hari (Overnight)
                            </span>
                          )}
                          {shift.abaikan_libur ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                              ✅ Tetap Masuk Saat Libur
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold text-[11px]">
                              Libur Akhir Pekan & Nasional
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-200/70 flex items-center justify-between">
                      <div className="text-[11px] text-slate-500 font-semibold">
                        <b>{shift.jumlah_pegawai_default || 0}</b> Pegawai • <b>{shift.jumlah_roster_aktif || 0}</b> Roster
                      </div>
                      {canModify && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditShiftModal(shift)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="Ubah Shift"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteShift(shift)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Hapus Shift"
                          >
                            <Trash2 size={15} />
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
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft-xs overflow-hidden">
          {/* Filter & Bulk Action Header */}
          <div className="p-5 border-b border-slate-200 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-72">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama atau NIP pegawai..."
                    value={searchEmp}
                    onChange={(e) => setSearchEmp(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
                >
                  <option value="">Semua Kategori (ASN & Non-ASN)</option>
                  <option value="asn">Personel ASN</option>
                  <option value="non_asn">Personel Non-ASN</option>
                </select>

                <select
                  value={filterShiftDefault}
                  onChange={(e) => setFilterShiftDefault(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
                >
                  <option value="">Semua Shift Default</option>
                  <option value="DEFAULT">Mengikuti Default Reguler</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>{s.nama_shift}</option>
                  ))}
                </select>
              </div>

              <div className="text-xs font-semibold text-slate-500">
                Menampilkan <b>{filteredEmployees.length}</b> dari <b>{employees.length}</b> personel
              </div>
            </div>

            {/* Bulk Assign Bar */}
            {selectedUserIds.length > 0 && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <CheckCircle2 size={17} className="text-blue-600" />
                  <span>{selectedUserIds.length} Pegawai Dipilih</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={bulkShiftId}
                    onChange={(e) => setBulkShiftId(e.target.value)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-300 bg-white text-slate-800"
                  >
                    <option value="">-- Pilih Shift untuk Diterapkan Massal --</option>
                    <option value="RESET">Reset ke Default Global (Reguler ASN)</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama_shift} ({s.jam_masuk_str || s.jam_masuk}-{s.jam_pulang_str || s.jam_pulang})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleBulkAssignShift}
                    disabled={!bulkShiftId}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Terapkan ke {selectedUserIds.length} Pegawai
                  </button>

                  <button
                    onClick={() => setSelectedUserIds([])}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    Batal Pilih
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Employee Shift Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 w-10">
                    <button onClick={toggleSelectAllFiltered} className="text-slate-500 hover:text-blue-600 cursor-pointer">
                      {filteredEmployees.length > 0 && filteredEmployees.every((e) => selectedUserIds.includes(e.user_id)) ? (
                        <CheckSquare size={17} className="text-blue-600" />
                      ) : (
                        <Square size={17} />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">Nama & NIP Pegawai</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Instansi OPD</th>
                  <th className="py-3.5 px-4">Shift Aktif Saat Ini</th>
                  <th className="py-3.5 px-4">Ubah Shift Default</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Tidak ada pegawai yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const checked = selectedUserIds.includes(emp.user_id);
                    const currentShiftObj = emp.default_jam_kerja_id ? shiftsById[emp.default_jam_kerja_id] : shifts[0];
                    const style = getShiftStyle(currentShiftObj);
                    return (
                      <tr key={emp.user_id} className={`hover:bg-slate-50/80 transition ${checked ? 'bg-blue-50/40' : ''}`}>
                        <td className="py-3 px-4">
                          <button onClick={() => toggleSelectUser(emp.user_id)} className="text-slate-500 hover:text-blue-600 cursor-pointer">
                            {checked ? <CheckSquare size={17} className="text-blue-600" /> : <Square size={17} />}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{emp.nama}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{emp.nip}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            emp.role === 'non_asn'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {emp.role === 'non_asn' ? 'Non-ASN' : 'ASN'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {emp.nama_opd}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border ${style.bg} ${style.text} ${style.border}`}>
                            <Clock size={12} />
                            {emp.default_nama_shift} ({emp.default_jam_baku})
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={emp.default_jam_kerja_id || ''}
                            onChange={(e) => handleSingleAssignShift(emp.user_id, e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                          >
                            <option value="">Default Global (Reguler ASN)</option>
                            {shifts.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nama_shift} ({s.jam_masuk_str || s.jam_masuk}-{s.jam_pulang_str || s.jam_pulang})
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
          {/* Roster Controls & Paint Palette */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-soft-xs space-y-4">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              {/* Month/Year & Search */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <CalendarDays size={16} className="text-blue-600 ml-2" />
                  <select
                    value={bulan}
                    onChange={(e) => setBulan(Number(e.target.value))}
                    className="bg-transparent px-2 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={tahun}
                    onChange={(e) => setTahun(Number(e.target.value))}
                    className="bg-transparent px-2 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    {[2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="relative w-60">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama / NIP / NIK di roster..."
                    value={searchEmp}
                    onChange={(e) => setSearchEmp(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer"
                >
                  <option value="">Semua Kategori (ASN & Non-ASN)</option>
                  <option value="asn">Personel ASN</option>
                  <option value="non_asn">Personel Non-ASN</option>
                </select>
              </div>

              {/* Action Buttons: Plotting Rentang & Tukar Jaga */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => {
                    setRangeForm((prev) => ({
                      ...prev,
                      jam_kerja_id: shifts[0]?.id ? String(shifts[0].id) : '',
                    }));
                    setShowRangeModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                >
                  <CalendarRange size={15} />
                  Plotting Rentang Tanggal
                </button>

                <button
                  onClick={() => setShowSwapModal(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  <ArrowLeftRight size={15} />
                  Tukar Jaga Pegawai
                </button>

                {pendingCount > 0 && (
                  <button
                    onClick={handleSavePendingRoster}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 animate-pulse cursor-pointer"
                  >
                    <Save size={15} />
                    Simpan {pendingCount} Perubahan Roster
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Brush Palette */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">
                Kuas Klik Cepat Tanggal:
              </span>
              {shifts.map((s) => {
                const style = getShiftStyle(s);
                const isSelected = activeBrushShiftId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveBrushShiftId(s.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      isSelected
                        ? `${style.pill} border-transparent ring-2 ring-offset-1 ring-blue-500 shadow-sm`
                        : `${style.bg} ${style.text} ${style.border} hover:opacity-90`
                    }`}
                  >
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/10">
                      {getShortShiftCode(s.nama_shift)}
                    </span>
                    <span>{s.nama_shift}</span>
                  </button>
                );
              })}

              <button
                onClick={() => setActiveBrushShiftId(0)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  activeBrushShiftId === 0
                    ? 'bg-slate-800 text-white border-slate-800 ring-2 ring-offset-1 ring-slate-600'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                Reset ke Default
              </button>
            </div>
          </div>

          {/* Monthly Matrix Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] font-bold uppercase">
                    <th className="sticky left-0 z-20 bg-slate-900 py-3 px-4 min-w-[210px] border-r border-slate-800">
                      Pegawai ({filteredEmployees.length})
                    </th>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                      const dObj = new Date(tahun, bulan - 1, day);
                      const isWeekend = dObj.getDay() === 0 || dObj.getDay() === 6;
                      return (
                        <th
                          key={day}
                          className={`py-2.5 px-1.5 text-center min-w-[40px] border-r border-slate-800 ${
                            isWeekend ? 'bg-red-950/70 text-red-200' : ''
                          }`}
                        >
                          <div>{day}</div>
                          <div className="text-[8px] font-normal opacity-75">
                            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][dObj.getDay()]}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {loadingRoster ? (
                    <tr>
                      <td colSpan={daysInMonth + 1} className="py-12 text-center text-slate-400">
                        Memuat matriks kalender roster...
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={daysInMonth + 1} className="py-12 text-center text-slate-400">
                        Tidak ada personel ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const empRoster = rosterMap[String(emp.user_id)] || {};
                      return (
                        <tr key={emp.user_id} className="hover:bg-slate-50/70">
                          <td className="sticky left-0 z-10 bg-white py-2.5 px-4 border-r border-slate-200 shadow-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800 truncate max-w-[140px]" title={emp.nama}>
                                {emp.nama}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                                emp.role === 'non_asn'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {emp.role === 'non_asn' ? 'Non-ASN' : 'ASN'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
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
                                ? `[Belum Disimpan] ${shiftsById[activeShiftId]?.nama_shift || ''}`
                                : '[Belum Disimpan] Reset ke Default';
                            } else if (savedItem) {
                              activeShiftId = savedItem.jam_kerja_id;
                              isRosterOverride = true;
                              tooltip = `Roster: ${savedItem.nama_shift} (${savedItem.jam_baku})${savedItem.keterangan ? ' • ' + savedItem.keterangan : ''}`;
                            } else {
                              activeShiftId = emp.default_jam_kerja_id;
                            }

                            const shiftObj = activeShiftId ? shiftsById[activeShiftId] : null;
                            const style = getShiftStyle(shiftObj);
                            const code = shiftObj ? getShortShiftCode(shiftObj.nama_shift) : 'REG';

                            return (
                              <td
                                key={day}
                                onClick={() => handleCellClick(emp, day)}
                                title={tooltip}
                                className={`p-1 text-center border-r border-slate-100 cursor-pointer select-none transition ${
                                  pendingItem !== undefined ? 'ring-2 ring-inset ring-emerald-500 bg-emerald-50/40' : ''
                                }`}
                              >
                                <span
                                  className={`inline-flex items-center justify-center w-7 h-6 rounded-md text-[10px] font-extrabold ${
                                    isRosterOverride
                                      ? `${style.pill} shadow-2xs`
                                      : 'bg-slate-100 text-slate-400 font-semibold'
                                  }`}
                                >
                                  {code}
                                </span>
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {editingShift ? 'Perbarui Profil Jam Kerja' : 'Buat Profil Jam Kerja Baru'}
              </h3>
              <button onClick={() => setShowShiftModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Profil Shift</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Shift Pagi RSUD / Reguler OPD"
                  value={shiftForm.nama_shift}
                  onChange={(e) => setShiftForm({ ...shiftForm, nama_shift: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                />
              </div>

              {userRole === 'super_admin' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cakupan Instansi OPD</label>
                  <select
                    value={shiftForm.opd_id}
                    onChange={(e) => setShiftForm({ ...shiftForm, opd_id: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">Global (Berlaku untuk Seluruh OPD)</option>
                    {opdList.map((opd) => (
                      <option key={opd.id} value={opd.id}>{opd.nama_opd}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Masuk Baku</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.jam_masuk}
                    onChange={(e) => setShiftForm({ ...shiftForm, jam_masuk: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Pulang Baku</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.jam_pulang}
                    onChange={(e) => setShiftForm({ ...shiftForm, jam_pulang: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mulai Scan Masuk</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.mulai_scan_masuk}
                    onChange={(e) => setShiftForm({ ...shiftForm, mulai_scan_masuk: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Akhir Scan Masuk</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.akhir_scan_masuk}
                    onChange={(e) => setShiftForm({ ...shiftForm, akhir_scan_masuk: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mulai Scan Pulang</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.mulai_scan_pulang}
                    onChange={(e) => setShiftForm({ ...shiftForm, mulai_scan_pulang: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Akhir Scan Pulang (Cut-Off)</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.akhir_scan_pulang}
                    onChange={(e) => setShiftForm({ ...shiftForm, akhir_scan_pulang: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Toleransi Keterlambatan (Menit)</label>
                <input
                  type="number"
                  min={0}
                  max={180}
                  value={shiftForm.menit_toleransi}
                  onChange={(e) => setShiftForm({ ...shiftForm, menit_toleransi: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shiftForm.is_lintas_hari}
                    onChange={(e) => setShiftForm({ ...shiftForm, is_lintas_hari: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="font-bold text-slate-800">
                    Shift Lintas Hari / Malam (Jam pulang berada di pagi hari berikutnya)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shiftForm.abaikan_libur}
                    onChange={(e) => setShiftForm({ ...shiftForm, abaikan_libur: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="font-bold text-slate-800">
                    Abaikan Hari Libur (Tetap beroperasi pada Sabtu/Minggu & Libur Nasional)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 cursor-pointer"
                >
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-extrabold">Plotting Roster Rentang Tanggal</h3>
              <button onClick={() => setShowRangeModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitRangeRoster} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Pegawai ({rangeForm.user_ids.length} dipilih)
                </label>
                <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
                  {filteredEmployees.map((emp) => {
                    const checked = rangeForm.user_ids.includes(emp.user_id);
                    return (
                      <label key={emp.user_id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
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
                        />
                        <span className="font-bold text-slate-800">{emp.nama}</span>
                        <span className="text-slate-400 font-mono text-[10px]">({emp.nip})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dari Tanggal</label>
                  <input
                    type="date"
                    required
                    value={rangeForm.start_date}
                    onChange={(e) => setRangeForm({ ...rangeForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sampai Tanggal</label>
                  <input
                    type="date"
                    required
                    value={rangeForm.end_date}
                    onChange={(e) => setRangeForm({ ...rangeForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Shift yang Diterapkan</label>
                <select
                  required
                  value={rangeForm.jam_kerja_id}
                  onChange={(e) => setRangeForm({ ...rangeForm, jam_kerja_id: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">-- Pilih Shift --</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama_shift} ({s.jam_masuk_str || s.jam_masuk}-{s.jam_pulang_str || s.jam_pulang})
                    </option>
                  ))}
                  <option value="0">Reset / Hapus Roster (Kembali ke Default Pegawai)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Jadwal Jaga Minggu Ke-1"
                  value={rangeForm.keterangan}
                  onChange={(e) => setRangeForm({ ...rangeForm, keterangan: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRangeModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight size={18} />
                <h3 className="text-base font-extrabold">Tukar Jaga Shift Pegawai</h3>
              </div>
              <button onClick={() => setShowSwapModal(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitSwapRoster} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Tukar Jaga</label>
                <input
                  type="date"
                  required
                  value={swapForm.tanggal}
                  onChange={(e) => setSwapForm({ ...swapForm, tanggal: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pegawai Pertama (Pihak A)</label>
                <select
                  required
                  value={swapForm.user_a_id}
                  onChange={(e) => setSwapForm({ ...swapForm, user_a_id: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">-- Pilih Pegawai A --</option>
                  {employees.map((emp) => (
                    <option key={emp.user_id} value={emp.user_id}>
                      {emp.nama} ({emp.default_nama_shift})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ditukar Dengan Pegawai Kedua (Pihak B)</label>
                <select
                  required
                  value={swapForm.user_b_id}
                  onChange={(e) => setSwapForm({ ...swapForm, user_b_id: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">-- Pilih Pegawai B --</option>
                  {employees.map((emp) => (
                    <option key={emp.user_id} value={emp.user_id}>
                      {emp.nama} ({emp.default_nama_shift})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alasan / Catatan Tukar Jaga</label>
                <input
                  type="text"
                  placeholder="Contoh: Tukar shift atas izin Kepala Ruangan"
                  value={swapForm.keterangan}
                  onChange={(e) => setSwapForm({ ...swapForm, keterangan: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSwapModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer"
                >
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
