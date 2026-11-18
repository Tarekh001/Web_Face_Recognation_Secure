import { useEffect, useState, useRef, useMemo, useCallback, useId } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import API_BASE from '../config/api';
import {
  Users,
  UserCheck,
  UserX,
  LogOut,
  Search,
  Trash2,
  Edit,
  X,
  CheckCircle2,
  Circle,
  Save,
  Shield,
  Fingerprint,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Camera,
} from 'lucide-react';
import { getInitials } from './AttendancePhotoModal';
import {
  useModalEscape,
  TableLoadingRow,
  TableErrorRow,
  notifyAlert,
  confirmAction,
} from './UiFeedback';

const toTitleCase = (str) => {
  if (!str) return '-';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const EditEmployeeModal = ({ user, opdList, idLabel, modalTitle, onClose, onSaved }) => {
  const uid = useId();
  const webcamRef = useRef(null);
  const [editName, setEditName] = useState(user.nama);
  const [editOpdId, setEditOpdId] = useState(user.opd_id || '');
  const [reRegisterFace, setReRegisterFace] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const requiredPoses = [
    'Wajah Lurus & Netral',
    'Wajah Lurus & Senyum',
    'Menoleh ke Kanan',
    'Menoleh ke Kiri',
    'Mendongak / Menunduk',
  ];

  useModalEscape(true, onClose);

  useEffect(() => {
    if (reRegisterFace) {
      (async () => {
        try {
          if (faceapi.tf) {
            try {
              await faceapi.tf.setBackend('webgl');
              await faceapi.tf.ready();
            } catch {
              await faceapi.tf.setBackend('cpu');
              await faceapi.tf.ready();
            }
          }
          await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
          setIsModelsLoaded(true);
        } catch (err) {
          console.error('Gagal memuat model deteksi wajah:', err);
        }
      })();
    }
  }, [reRegisterFace]);

  const captureAndCrop = async () => {
    if (capturedPhotos.length >= 5) return;
    const video = webcamRef.current?.video;
    if (!video) return;
    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
    if (detection) {
      const { x, y, width, height } = detection.box;
      const canvas = document.createElement('canvas');
      const size = Math.max(width, height);
      const margin = size * 0.3;
      const cropSize = size + margin * 2;
      canvas.width = 160;
      canvas.height = 160;
      canvas
        .getContext('2d')
        .drawImage(
          video,
          Math.max(0, x + width / 2 - cropSize / 2),
          Math.max(0, y + height / 2 - cropSize / 2),
          cropSize,
          cropSize,
          0,
          0,
          160,
          160
        );
      canvas.toBlob((blob) => setCapturedPhotos((prev) => [...prev, blob]), 'image/jpeg', 1.0);
    } else {
      notifyAlert({
        icon: 'warning',
        title: 'Wajah Tidak Terdeteksi',
        text: 'Pastikan wajah berada di dalam bingkai oval dan pencahayaan cukup.',
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const token = localStorage.getItem('access_token');
    const fd = new FormData();
    fd.append('name', editName);
    fd.append('opd_id', editOpdId);
    if (reRegisterFace && capturedPhotos.length >= 5) {
      capturedPhotos.forEach((b, i) => fd.append('photos', b, `face_${i}.jpg`));
    }
    try {
      const res = await axios.put(`${API_BASE}/users/update/${user.nip}`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      notifyAlert({
        icon: 'success',
        title: 'Berhasil Diperbarui',
        text: res.data.message || 'Data pegawai berhasil diperbarui.',
        timer: 2000,
      });
      onSaved();
      onClose();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.response?.data?.error || 'Terjadi kendala saat menyimpan perubahan.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const idx = capturedPhotos.length;

  return (
    <div
      className="fixed inset-0 bg-slate-950/65 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${uid}-modal-title`}
    >
      <div
        className={`surface-modal w-full ${
          reRegisterFace ? 'max-w-5xl' : 'max-w-lg'
        } max-h-[90dvh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 id={`${uid}-modal-title`} className="text-base sm:text-lg font-extrabold text-slate-900">
              {modalTitle}
            </h2>
            <p className="text-xs font-mono text-slate-600 mt-0.5 tabular-nums">
              {idLabel}: {user.nip}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog edit pegawai"
            className="gov-icon-btn text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`p-6 ${reRegisterFace ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}`}>
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor={`${uid}-name`} className="block text-xs font-bold text-slate-800 mb-1.5">
                Nama Lengkap
              </label>
              <input
                id={`${uid}-name`}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="gov-input"
              />
            </div>

            <div>
              <label htmlFor={`${uid}-opd`} className="block text-xs font-bold text-slate-800 mb-1.5">
                Instansi OPD
              </label>
              <select
                id={`${uid}-opd`}
                value={editOpdId}
                onChange={(e) => setEditOpdId(e.target.value)}
                className="gov-select"
              >
                <option value="" disabled>
                  Pilih Instansi OPD
                </option>
                {opdList.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nama} ({o.kode})
                  </option>
                ))}
              </select>
            </div>

            <label
              htmlFor={`${uid}-rereg`}
              className="flex items-center gap-3 min-h-[48px] p-3.5 bg-amber-50 border border-amber-300 rounded-lg cursor-pointer"
            >
              <input
                type="checkbox"
                id={`${uid}-rereg`}
                checked={reRegisterFace}
                onChange={(e) => {
                  setReRegisterFace(e.target.checked);
                  setCapturedPhotos([]);
                }}
                className="w-5 h-5 rounded border-slate-500 text-blue-700"
              />
              <span className="text-xs font-bold text-amber-900">
                Perbarui Rekaman Biometrik Wajah (5 Pose)
              </span>
            </label>

            {reRegisterFace && (
              <div className="flex flex-col gap-2">
                {requiredPoses.map((p, i) => (
                  <div
                    key={p}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs ${
                      i < idx
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                        : i === idx
                          ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                          : 'bg-slate-50 border-slate-300 text-slate-600 font-medium'
                    }`}
                  >
                    {i < idx ? (
                      <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                    ) : (
                      <Circle size={15} className="text-slate-500 shrink-0" />
                    )}
                    <span className="tabular-nums">
                      {i + 1}. {p}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {reRegisterFace && (
            <div className="flex flex-col gap-3">
              <div className="bg-slate-900 text-white p-3 rounded-t-lg text-center">
                {idx < 5 ? (
                  <>
                    <p className="text-slate-300 text-xs font-semibold">Pose Saat Ini:</p>
                    <h3 className="text-base font-bold text-amber-300">{requiredPoses[idx]}</h3>
                  </>
                ) : (
                  <h3 className="text-base font-bold text-emerald-300">5 Pose Selesai Direkam</h3>
                )}
              </div>
              <div className="relative bg-slate-950 rounded-b-lg overflow-hidden border border-slate-800">
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: 'user' }}
                  className={`w-full transform scale-x-[-1] ${idx >= 5 ? 'opacity-50' : ''}`}
                />
                {idx < 5 && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-48 border-4 border-dashed border-amber-300 rounded-[50%] pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
                )}
              </div>
              <button
                type="button"
                onClick={captureAndCrop}
                disabled={!isModelsLoaded || idx >= 5}
                className={`min-h-[44px] py-2.5 px-4 rounded-lg font-bold text-sm inline-flex items-center justify-center gap-2 tabular-nums ${
                  !isModelsLoaded || idx >= 5
                    ? 'bg-slate-200 text-slate-600 border border-slate-300'
                    : 'bg-blue-700 hover:bg-blue-800 text-white'
                }`}
              >
                <Camera size={16} />
                <span>Ambil Foto Pose {Math.min(idx + 1, 5)} / 5</span>
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="gov-btn-secondary">
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || (reRegisterFace && idx < 5)}
            className="gov-btn-primary"
          >
            {isSaving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const RoleBadge = ({ role, isNonAsnPage }) => {
  if (isNonAsnPage) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
        Non-ASN
      </span>
    );
  }
  const map = {
    super_admin: {
      label: 'ASN / Super Admin',
      cls: 'bg-slate-800 text-white border-slate-700',
    },
    admin_opd: {
      label: 'ASN / Admin OPD',
      cls: 'bg-slate-100 text-slate-800 border-slate-300',
    },
    asn: {
      label: 'ASN',
      cls: 'bg-blue-50 text-blue-800 border-blue-200',
    },
  };
  const b = map[role] || map.asn;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${b.cls}`}>
      <Shield size={10} />
      {b.label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    Hadir: {
      cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-600',
      label: 'Sedang Hadir',
    },
    'Sudah Keluar': {
      cls: 'bg-blue-50 text-blue-800 border-blue-200',
      dot: 'bg-blue-700',
      label: 'Sudah Pulang',
    },
    'Belum Hadir': {
      cls: 'bg-slate-100 text-slate-700 border-slate-300',
      dot: 'bg-slate-500',
      label: 'Belum Hadir',
    },
  };
  const s = map[status] || map['Belum Hadir'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const EmployeeDirectoryView = ({
  roleParam = 'asn', // 'asn' | 'non_asn'
  idLabel = 'NIP',
  totalCardTitle = 'Total ASN Terdaftar',
  totalCardSubtext = 'Termasuk ASN berstatus Admin OPD',
  identityColumnHeader = 'Identitas Pegawai ASN',
  roleColumnHeader = 'Peran & Biometrik',
  searchPlaceholder = 'Cari NIP, Nama, atau Instansi...',
  emptyText = 'Tidak ada data pegawai ASN ditemukan.',
  unitLabel = 'pegawai ASN',
  editModalTitle = 'Edit Data Pegawai ASN',
}) => {
  const uid = useId();
  const isNonAsnPage = roleParam === 'non_asn';

  const [employees, setEmployees] = useState([]);
  const [opdList, setOpdList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [editingUser, setEditingUser] = useState(null);

  const fetchEmployees = useCallback(
    async (silent = false) => {
      const token = localStorage.getItem('access_token');
      if (!silent) setIsLoading(true);
      setErrorMsg('');
      try {
        const res = await axios.get(`${API_BASE}/manage-asn`, {
          params: { role: roleParam },
          headers: { Authorization: `Bearer ${token}` },
        });
        setEmployees(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(`Gagal mengambil data ${roleParam}:`, err);
        setErrorMsg(
          err.response?.data?.error ||
            `Gagal memuat daftar ${unitLabel} dari server. Periksa koneksi jaringan lalu coba kembali.`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [roleParam, unitLabel]
  );

  const fetchOPDList = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.get(`${API_BASE}/opd`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpdList(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      // Daftar OPD untuk modal edit diabaikan jika non-superadmin hanya memiliki 1 OPD
    }
  }, []);

  useEffect(() => {
    fetchEmployees(false);
    fetchOPDList();
    const i = setInterval(() => fetchEmployees(true), 20000);
    return () => clearInterval(i);
  }, [fetchEmployees, fetchOPDList]);

  const totalCount = employees.length;
  const hadirCount = employees.filter((a) => a.status_hari_ini === 'Hadir').length;
  const sudahKeluar = employees.filter((a) => a.status_hari_ini === 'Sudah Keluar').length;
  const belumHadir = employees.filter((a) => a.status_hari_ini === 'Belum Hadir').length;

  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return employees.filter((a) => {
      const matchSearch =
        !q ||
        (a.nama || '').toLowerCase().includes(q) ||
        (a.nip || '').toLowerCase().includes(q) ||
        (a.opd || '').toLowerCase().includes(q);
      const matchStatus = !statusFilter || a.status_hari_ini === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [employees, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedList = filteredList.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  const handleDelete = async (id, nama) => {
    const ok = await confirmAction({
      title: `Hapus Data ${isNonAsnPage ? 'Non-ASN' : 'ASN'}?`,
      text: `Data biometrik dan akun milik "${nama}" akan dihapus secara permanen.`,
      confirmText: 'Ya, Hapus',
    });
    if (!ok) return;

    const token = localStorage.getItem('access_token');
    try {
      await axios.delete(`${API_BASE}/users/${id}`, {
        params: { role: isNonAsnPage ? 'non_asn' : 'asn' },
        headers: { Authorization: `Bearer ${token}` },
      });
      notifyAlert({ icon: 'success', title: 'Data Terhapus', timer: 1600 });
      fetchEmployees(false);
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Menghapus',
        text: err.response?.data?.error || 'Data pegawai gagal dihapus.',
      });
    }
  };

  const handleRevokeAccess = async (aksesId, opdNama, nama) => {
    const ok = await confirmAction({
      title: 'Cabut Akses Lintas OPD?',
      text: `Cabut hak presensi "${nama}" pada instansi "${opdNama}"?`,
      confirmText: 'Ya, Cabut Akses',
    });
    if (!ok) return;

    const token = localStorage.getItem('access_token');
    try {
      await axios.delete(`${API_BASE}/users/akses-opd/${aksesId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees((prev) =>
        prev.map((item) => ({
          ...item,
          cross_opd_privileges: (item.cross_opd_privileges || []).filter((p) => p.akses_id !== aksesId),
        }))
      );
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Mencabut Akses',
        text: err.response?.data?.error || 'Terjadi kendala saat mencabut akses lintas OPD.',
      });
    }
  };

  const toggleStatus = (target) => {
    setStatusFilter((prev) => (prev === target ? '' : target));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Kartu Ringkasan Status Harian */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          aria-pressed={statusFilter === ''}
          onClick={() => {
            setStatusFilter('');
            setCurrentPage(1);
          }}
          className={`text-left rounded-2xl p-5 flex flex-col justify-between bg-[#0B1120] text-white border transition-all duration-150 shadow-card hover:border-blue-400 ${
            statusFilter === ''
              ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2 ring-offset-[#F3F6FA]'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
              {totalCardTitle}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
              <Users size={17} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white tracking-tight tabular-nums">
              {totalCount.toLocaleString('id-ID')}
            </span>
            <p className="text-xs text-slate-300 mt-1">{totalCardSubtext}</p>
          </div>
        </button>

        <button
          type="button"
          aria-pressed={statusFilter === 'Hadir'}
          onClick={() => toggleStatus('Hadir')}
          className={`text-left surface-card p-5 flex flex-col justify-between transition-all duration-150 hover:border-emerald-600 hover:shadow-soft-sm ${
            statusFilter === 'Hadir' ? 'border-emerald-700 ring-2 ring-emerald-700 bg-emerald-50/40' : ''
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Sedang Hadir
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <UserCheck size={16} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-emerald-800 tabular-nums">
              {hadirCount.toLocaleString('id-ID')}
            </span>
            <p className="text-xs text-slate-600 mt-1">Sudah scan masuk hari ini</p>
          </div>
        </button>

        <button
          type="button"
          aria-pressed={statusFilter === 'Sudah Keluar'}
          onClick={() => toggleStatus('Sudah Keluar')}
          className={`text-left surface-card p-5 flex flex-col justify-between transition-all duration-150 hover:border-blue-600 hover:shadow-soft-sm ${
            statusFilter === 'Sudah Keluar' ? 'border-blue-700 ring-2 ring-blue-700 bg-blue-50/40' : ''
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              Sudah Pulang
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
              <LogOut size={16} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-blue-800 tabular-nums">
              {sudahKeluar.toLocaleString('id-ID')}
            </span>
            <p className="text-xs text-slate-600 mt-1">Selesai jam kerja hari ini</p>
          </div>
        </button>

        <button
          type="button"
          aria-pressed={statusFilter === 'Belum Hadir'}
          onClick={() => toggleStatus('Belum Hadir')}
          className={`text-left surface-card p-5 flex flex-col justify-between transition-all duration-150 hover:border-slate-700 hover:shadow-soft-sm ${
            statusFilter === 'Belum Hadir' ? 'border-slate-800 ring-2 ring-slate-800 bg-slate-100' : ''
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Belum Hadir
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 shrink-0">
              <UserX size={16} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {belumHadir.toLocaleString('id-ID')}
            </span>
            <p className="text-xs text-slate-600 mt-1">Belum scan hari ini</p>
          </div>
        </button>
      </div>

      {/* Kartu Pencarian & Tabel Data */}
      <div className="surface-card overflow-hidden">
        <div className="gov-table-toolbar">
          <div className="relative w-full sm:w-80">
            <label htmlFor={`${uid}-search`} className="sr-only">
              {searchPlaceholder}
            </label>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} aria-hidden="true" />
            <input
              id={`${uid}-search`}
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="gov-input pl-10 pr-4"
            />
          </div>

          {(searchQuery || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
                setCurrentPage(1);
              }}
              className="gov-btn-secondary"
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Atur Ulang Filter</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th scope="col" className="w-14 text-center">No</th>
                <th scope="col">{identityColumnHeader}</th>
                <th scope="col">{roleColumnHeader}</th>
                <th scope="col">Instansi OPD</th>
                <th scope="col">Status Hari Ini</th>
                <th scope="col">Akses Lintas OPD</th>
                <th scope="col" className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableLoadingRow colSpan={7} label={`Memuat daftar ${unitLabel}...`} />
              ) : errorMsg ? (
                <TableErrorRow colSpan={7} message={errorMsg} onRetry={() => fetchEmployees(false)} />
              ) : paginatedList.length > 0 ? (
                paginatedList.map((item, idx) => {
                  const isManageable = isNonAsnPage ? true : Boolean(item.is_manageable);
                  return (
                    <tr key={item.id}>
                      <td className="text-center text-xs font-mono text-slate-600 tabular-nums">
                        {(safePage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg border flex items-center justify-center text-xs font-extrabold shrink-0 ${
                              isNonAsnPage
                                ? 'bg-amber-50 border-amber-300 text-amber-800'
                                : 'bg-blue-50 border-blue-200 text-blue-800'
                            }`}
                          >
                            {getInitials(item.nama)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-snug">
                              {toTitleCase(item.nama)}
                            </span>
                            <span className="font-mono text-xs text-slate-600 tabular-nums">{item.nip}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <RoleBadge role={item.role} isNonAsnPage={isNonAsnPage} />
                          {item.is_face_registered ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Fingerprint size={10} /> Wajah Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                              Belum Rekam
                            </span>
                          )}
                          {item.nama_shift && (
                            <span
                              title={`Jam Baku: ${item.jam_baku || '-'}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300"
                            >
                              <Clock size={10} /> {item.nama_shift}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs sm:text-sm font-medium text-slate-700">
                        {item.opd || '-'}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={item.status_hari_ini} />
                      </td>
                      <td className="px-4 py-3.5">
                        {item.cross_opd_privileges && item.cross_opd_privileges.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {item.cross_opd_privileges.map((p) =>
                              isManageable ? (
                                <button
                                  key={p.akses_id}
                                  type="button"
                                  onClick={() => handleRevokeAccess(p.akses_id, p.opd_nama, item.nama)}
                                  title={`Cabut akses lintas OPD di ${p.opd_nama}`}
                                  aria-label={`Cabut akses lintas OPD ${item.nama} di ${p.opd_nama}`}
                                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-red-50 text-blue-800 hover:text-red-800 border border-blue-200 hover:border-red-300 text-xs font-bold transition-colors"
                                >
                                  <span>{p.opd_nama}</span>
                                  <X size={13} />
                                </button>
                              ) : (
                                <span
                                  key={p.akses_id}
                                  className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold"
                                >
                                  {p.opd_nama}
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600 font-mono">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isManageable ? (
                          <div className="inline-flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingUser(item)}
                              title={`Edit ${item.nama}`}
                              aria-label={`Edit data ${item.nama}`}
                              className="gov-icon-btn text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id, item.nama)}
                              title={`Hapus ${item.nama}`}
                              aria-label={`Hapus data ${item.nama}`}
                              className="gov-icon-btn text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 select-none"
                            title="Akun Admin dikelola melalui menu Akun Admin OPD oleh Super Admin"
                          >
                            <Shield size={11} /> Terlindungi
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-16 px-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600">
                        <Search size={20} />
                      </div>
                      <span className="text-slate-800 font-bold text-sm">{emptyText}</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bilah Paginasi */}
        <div className="p-4 sm:px-6 border-t border-slate-300 bg-slate-50 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-slate-700 font-medium tabular-nums">
              Menampilkan{' '}
              <span className="font-bold text-slate-900">
                {paginatedList.length > 0 ? (safePage - 1) * itemsPerPage + 1 : 0}
              </span>{' '}
              s.d.{' '}
              <span className="font-bold text-slate-900">
                {Math.min(safePage * itemsPerPage, filteredList.length)}
              </span>{' '}
              dari <span className="font-bold text-slate-900">{filteredList.length}</span> {unitLabel}
            </p>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-300">
              <label htmlFor={`${uid}-per-page`} className="text-xs text-slate-700 font-semibold">
                Baris per halaman:
              </label>
              <select
                id={`${uid}-per-page`}
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="min-h-[44px] px-3 py-1.5 text-xs font-bold border border-slate-500 rounded-lg bg-white text-slate-900 tabular-nums"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 min-h-[44px] px-3.5 py-2 text-xs font-bold border border-slate-400 bg-white rounded-lg text-slate-800 hover:bg-slate-100 disabled:opacity-45"
              >
                <ChevronLeft size={15} /> Sebelumnya
              </button>
              <span className="px-3 text-xs font-bold text-slate-800 tabular-nums">
                Hal {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 min-h-[44px] px-3.5 py-2 text-xs font-bold border border-slate-400 bg-white rounded-lg text-slate-800 hover:bg-slate-100 disabled:opacity-45"
              >
                Berikutnya <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {editingUser && (
        <EditEmployeeModal
          user={editingUser}
          opdList={opdList}
          idLabel={idLabel}
          modalTitle={editModalTitle}
          onClose={() => setEditingUser(null)}
          onSaved={() => fetchEmployees(false)}
        />
      )}
    </div>
  );
};

export default EmployeeDirectoryView;
