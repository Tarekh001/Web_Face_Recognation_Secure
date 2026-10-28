import { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import API_BASE from '../config/api';
import {
  Users, UserCheck, UserX, LogOut,
  Search, Trash2, Edit, X, CheckCircle2, Circle, Save,
  Fingerprint, RotateCcw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { getInitials } from '../components/AttendancePhotoModal';

// ==========================================
// EDIT NON-ASN MODAL
// ==========================================
const EditNonAsnModal = ({ user, opdList, onClose, onSaved }) => {
  const webcamRef = useRef(null);
  const [editName, setEditName] = useState(user.nama);
  const [editOpdId, setEditOpdId] = useState(user.opd_id || '');
  const [reRegisterFace, setReRegisterFace] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const requiredPoses = ['Lurus & Netral', 'Lurus & Senyum', 'Menoleh Kanan', 'Menoleh Kiri', 'Mendongak/Menunduk'];

  useEffect(() => {
    if (reRegisterFace) {
      faceapi.nets.tinyFaceDetector
        .loadFromUri('/models')
        .then(() => setIsModelsLoaded(true))
        .catch(console.error);
    }
  }, [reRegisterFace]);

  const captureAndCrop = async () => {
    if (capturedPhotos.length >= 5) return;
    const video = webcamRef.current.video;
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
      alert('Wajah tidak terdeteksi! Pastikan pencahayaan cukup.');
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
      alert(res.data.message);
      onSaved();
      onClose();
    } catch (err) {
      alert('Gagal menyimpan: ' + (err.response?.data?.error || 'Error'));
    } finally {
      setIsSaving(false);
    }
  };

  const idx = capturedPhotos.length;
  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-3xl shadow-2xl border border-slate-200 w-full ${reRegisterFace ? 'max-w-5xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 rounded-t-3xl">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Edit Data Tenaga Non-ASN</h2>
            <p className="text-xs font-mono text-slate-500 mt-0.5">NIK: {user.nip}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200/70 rounded-xl cursor-pointer">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className={`p-6 ${reRegisterFace ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}`}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Instansi (OPD)</label>
              <select
                value={editOpdId}
                onChange={(e) => setEditOpdId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none bg-white"
              >
                <option value="" disabled>-- Pilih OPD --</option>
                {opdList.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nama} ({o.kode})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <input
                type="checkbox"
                id="reRegNonAsn"
                checked={reRegisterFace}
                onChange={(e) => {
                  setReRegisterFace(e.target.checked);
                  setCapturedPhotos([]);
                }}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="reRegNonAsn" className="text-xs font-bold text-amber-800 cursor-pointer">
                Perbarui Rekaman Biometrik Wajah (5 Pose)
              </label>
            </div>
            {reRegisterFace && (
              <div className="flex flex-col gap-2">
                {requiredPoses.map((p, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs ${
                      i < idx
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold'
                        : i === idx
                          ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    {i < idx ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Circle size={15} />}
                    <span>{i + 1}. {p}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {reRegisterFace && (
            <div className="flex flex-col gap-3">
              <div className="bg-slate-900 text-white p-3 rounded-t-2xl text-center">
                {idx < 5 ? (
                  <>
                    <p className="text-slate-400 text-xs">Pose Saat Ini:</p>
                    <h3 className="text-base font-bold text-amber-400">{requiredPoses[idx]}</h3>
                  </>
                ) : (
                  <h3 className="text-base font-bold text-emerald-400">5 Pose Selesai Direkam</h3>
                )}
              </div>
              <div className="relative bg-slate-100 rounded-b-2xl overflow-hidden border border-slate-800">
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: 'user' }}
                  className={`w-full transform scale-x-[-1] ${idx >= 5 ? 'opacity-50 blur-sm' : ''}`}
                />
                {idx < 5 && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-48 border-4 border-dashed border-amber-400 rounded-[50%] pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
                )}
              </div>
              <button
                type="button"
                onClick={captureAndCrop}
                disabled={!isModelsLoaded || idx >= 5}
                className={`py-2.5 rounded-xl font-bold text-sm cursor-pointer ${
                  idx >= 5 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                Ambil Foto Pose {Math.min(idx + 1, 5)}/5
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 rounded-b-3xl flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || (reRegisterFace && idx < 5)}
            className="px-5 py-2 bg-amber-600 text-white rounded-xl text-sm hover:bg-amber-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? 'Menyimpan...' : <><Save size={15} /> Simpan Perubahan</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN: ManageNonASN Page
// ==========================================
const ManageNonASN = () => {
  const [nonAsnList, setNonAsnList] = useState([]);
  const [opdList, setOpdList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [editingUser, setEditingUser] = useState(null);

  const fetchNonASNData = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.get(`${API_BASE}/manage-asn`, {
        params: { role: 'non_asn' },
        headers: { Authorization: `Bearer ${token}` },
      });
      setNonAsnList(Array.isArray(res.data) ? res.data : []);
    } catch {
      console.error('Gagal mengambil data Non-ASN');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOPDList = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.get(`${API_BASE}/opd`, { headers: { Authorization: `Bearer ${token}` } });
      setOpdList(Array.isArray(res.data) ? res.data : []);
    } catch {
      console.error('Gagal mengambil daftar OPD');
    }
  };

  useEffect(() => {
    fetchNonASNData();
    fetchOPDList();
    const i = setInterval(fetchNonASNData, 20000);
    return () => clearInterval(i);
  }, []);

  const totalCount = nonAsnList.length;
  const hadirCount = nonAsnList.filter((a) => a.status_hari_ini === 'Hadir').length;
  const sudahKeluar = nonAsnList.filter((a) => a.status_hari_ini === 'Sudah Keluar').length;
  const belumHadir = nonAsnList.filter((a) => a.status_hari_ini === 'Belum Hadir').length;

  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return nonAsnList.filter((a) => {
      const matchSearch =
        !q ||
        (a.nama || '').toLowerCase().includes(q) ||
        (a.nip || '').toLowerCase().includes(q) ||
        (a.opd || '').toLowerCase().includes(q);
      const matchStatus = !statusFilter || a.status_hari_ini === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [nonAsnList, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedList = filteredList.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin hapus data Tenaga Non-ASN: ${nama}?`)) return;
    const token = localStorage.getItem('access_token');
    try {
      await axios.delete(`${API_BASE}/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchNonASNData();
    } catch {
      alert('Gagal menghapus data Non-ASN.');
    }
  };

  const handleRevokeAccess = async (aksesId, opdNama, nama) => {
    if (!window.confirm(`Cabut hak akses absen ${nama} di "${opdNama}"?`)) return;
    const token = localStorage.getItem('access_token');
    try {
      await axios.delete(`${API_BASE}/users/akses-opd/${aksesId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNonAsnList((prev) =>
        prev.map((item) => ({
          ...item,
          cross_opd_privileges: (item.cross_opd_privileges || []).filter((p) => p.akses_id !== aksesId),
        }))
      );
    } catch (err) {
      alert('Gagal mencabut akses: ' + (err.response?.data?.error || 'Error'));
    }
  };

  const StatusBadge = ({ status }) => {
    const map = {
      Hadir: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500', label: 'Sedang Hadir' },
      'Sudah Keluar': { cls: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500', label: 'Sudah Pulang' },
      'Belum Hadir': { cls: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400', label: 'Belum Hadir' },
    };
    const s = map[status] || map['Belum Hadir'];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${s.cls}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>
    );
  };

  const toggleStatus = (target) => {
    setStatusFilter((prev) => (prev === target ? '' : target));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5">
      {/* ── BENTO SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => { setStatusFilter(''); setCurrentPage(1); }}
          className={`text-left glass-card p-5 flex flex-col justify-between transition-all cursor-pointer hover:shadow-soft-md ${
            statusFilter === '' ? 'ring-2 ring-amber-500/25 border-amber-200' : ''
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Non-ASN</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">{totalCount}</span>
            <p className="text-xs text-slate-500 mt-1">Tenaga Ahli, Honorer & Magang</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => toggleStatus('Hadir')}
          className={`text-left glass-card p-5 flex flex-col justify-between transition-all cursor-pointer hover:shadow-soft-md ${
            statusFilter === 'Hadir' ? 'ring-2 ring-emerald-500 bg-emerald-50/40' : ''
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Sedang Hadir</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-emerald-700">{hadirCount}</span>
            <p className="text-xs text-slate-500 mt-1">Sudah scan masuk hari ini</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => toggleStatus('Sudah Keluar')}
          className={`text-left glass-card p-5 flex flex-col justify-between transition-all cursor-pointer hover:shadow-soft-md ${
            statusFilter === 'Sudah Keluar' ? 'ring-2 ring-blue-500 bg-blue-50/40' : ''
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Sudah Pulang</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <LogOut size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-blue-700">{sudahKeluar}</span>
            <p className="text-xs text-slate-500 mt-1">Selesai jam kerja hari ini</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => toggleStatus('Belum Hadir')}
          className={`text-left glass-card p-5 flex flex-col justify-between transition-all cursor-pointer hover:shadow-soft-md ${
            statusFilter === 'Belum Hadir' ? 'ring-2 ring-slate-600 bg-slate-100/70' : ''
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Belum Hadir</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <UserX size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-800">{belumHadir}</span>
            <p className="text-xs text-slate-500 mt-1">Belum scan hari ini</p>
          </div>
        </button>
      </div>

      {/* ── SEARCH & TABLE CARD ── */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-200/80 bg-white/60 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari NIK, Nama, atau Instansi..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none"
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-4 py-3.5 w-12 text-center">#</th>
                <th className="px-4 py-3.5">Identitas Non-ASN (NIK)</th>
                <th className="px-4 py-3.5">Status Biometrik</th>
                <th className="px-4 py-3.5">Instansi OPD</th>
                <th className="px-4 py-3.5">Status Hari Ini</th>
                <th className="px-4 py-3.5">Akses Lintas OPD</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-9 h-9 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                      <span className="text-slate-400 text-sm font-medium">Memuat data tenaga Non-ASN...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedList.length > 0 ? (
                paginatedList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-4 py-3.5 text-center text-xs font-mono text-slate-400">
                      {(safePage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 text-xs font-extrabold shrink-0">
                          {getInitials(item.nama)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block leading-snug">{item.nama}</span>
                          <span className="font-mono text-xs text-slate-500">{item.nip}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                          Non-ASN
                        </span>
                        {item.is_face_registered ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                            <Fingerprint size={10} /> Wajah Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500 ring-1 ring-slate-200">
                            Belum Rekam
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs sm:text-sm font-medium text-slate-600">{item.opd}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={item.status_hari_ini} />
                    </td>
                    <td className="px-4 py-3.5">
                      {item.cross_opd_privileges && item.cross_opd_privileges.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {item.cross_opd_privileges.map((p) => (
                            <span
                              key={p.akses_id}
                              className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-1 rounded-full ring-1 ring-purple-200"
                            >
                              {p.opd_nama}
                              <button
                                type="button"
                                onClick={() => handleRevokeAccess(p.akses_id, p.opd_nama, item.nama)}
                                className="ml-0.5 text-purple-400 hover:text-red-500 transition cursor-pointer"
                                title="Cabut akses lintas OPD"
                              >
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300 font-mono">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingUser(item)}
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-xl transition cursor-pointer"
                          title="Edit Data Non-ASN"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.nama)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition cursor-pointer"
                          title="Hapus Data Non-ASN"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={28} className="text-slate-300" />
                      <span className="text-slate-500 font-semibold text-sm">Tidak ada data tenaga Non-ASN ditemukan.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION BAR ── */}
        <div className="p-4 sm:px-6 border-t border-slate-200/80 bg-slate-50/60 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-slate-500 font-medium">
              Menampilkan{' '}
              <span className="font-bold text-slate-800">
                {paginatedList.length > 0 ? (safePage - 1) * itemsPerPage + 1 : 0}
              </span>
              –
              <span className="font-bold text-slate-800">
                {Math.min(safePage * itemsPerPage, filteredList.length)}
              </span>{' '}
              dari <span className="font-bold text-slate-800">{filteredList.length}</span> tenaga Non-ASN
            </p>
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <label className="text-xs text-slate-400 font-medium">Baris:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 outline-none cursor-pointer"
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
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={14} /> Sebelumnya
              </button>
              <span className="px-2.5 text-xs font-bold text-slate-700">
                Hal {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                Berikutnya <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {editingUser && (
        <EditNonAsnModal
          user={editingUser}
          opdList={opdList}
          onClose={() => setEditingUser(null)}
          onSaved={fetchNonASNData}
        />
      )}
    </div>
  );
};

export default ManageNonASN;
