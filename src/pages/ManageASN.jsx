import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import { 
  Users, UserCheck, UserX, LogOut, 
  Search, Trash2, Edit, Clock, UserCircle2,
  X, Camera, CheckCircle2, Circle, Save, ShieldCheck, ShieldX, AlertTriangle
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:5000/api';

// ==========================================
// EDIT USER MODAL (with optional re-register face)
// ==========================================
const EditUserModal = ({ user, opdList, onClose, onSaved }) => {
  const webcamRef = useRef(null);
  const [editName, setEditName] = useState(user.nama);
  const [editOpdId, setEditOpdId] = useState(user.opd_id || '');
  const [reRegisterFace, setReRegisterFace] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const requiredPoses = [
    "Wajah Lurus & Ekspresi Netral",
    "Wajah Lurus & Tersenyum",
    "Menoleh Sedikit ke Kanan",
    "Menoleh Sedikit ke Kiri",
    "Sedikit Menunduk / Mendongak"
  ];

  useEffect(() => {
    if (reRegisterFace) {
      const loadModels = async () => {
        try {
          await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
          setIsModelsLoaded(true);
        } catch (error) {
          console.error("Gagal memuat model Face API:", error);
        }
      };
      loadModels();
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
      const cropSize = size + (margin * 2);
      const cropX = Math.max(0, x + (width / 2) - (cropSize / 2));
      const cropY = Math.max(0, y + (height / 2) - (cropSize / 2));

      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, cropX, cropY, cropSize, cropSize, 0, 0, 160, 160);

      canvas.toBlob((blob) => {
        setCapturedPhotos(prev => [...prev, blob]);
      }, 'image/jpeg', 1.0);
    } else {
      alert("⚠️ Wajah tidak terdeteksi! Pastikan wajah berada di dalam garis putus-putus.");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('name', editName);
    formData.append('opd_id', editOpdId);

    if (reRegisterFace && capturedPhotos.length >= 5) {
      capturedPhotos.forEach((blob, i) => formData.append('photos', blob, `face_${i}.jpg`));
    }

    try {
      const res = await axios.put(`${API_BASE}/users/update/${user.nip}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert(`✅ ${res.data.message}`);
      onSaved();
      onClose();
    } catch (err) {
      alert("❌ Gagal: " + (err.response?.data?.error || err.response?.data?.message || "Terjadi kesalahan server"));
    } finally {
      setIsSaving(false);
    }
  };

  const currentPoseIndex = capturedPhotos.length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${reRegisterFace ? 'max-w-5xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto transition-all duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Edit Data ASN</h2>
            <p className="text-sm text-gray-500">NIP: {user.nip}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className={`p-6 ${reRegisterFace ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}`}>
          {/* Left Column: Form */}
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Instansi (OPD)</label>
              <select
                value={editOpdId}
                onChange={e => setEditOpdId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
              >
                <option value="" disabled>-- Pilih Instansi OPD --</option>
                {opdList.map(opd => (
                  <option key={opd.id} value={opd.id}>{opd.nama} ({opd.kode})</option>
                ))}
              </select>
            </div>

            {/* Re-register toggle */}
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <input
                type="checkbox"
                id="reRegisterFace"
                checked={reRegisterFace}
                onChange={e => { setReRegisterFace(e.target.checked); setCapturedPhotos([]); }}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="reRegisterFace" className="text-sm font-semibold text-amber-800 cursor-pointer">
                🔄 Registrasi Ulang Wajah? <span className="font-normal text-amber-600">(Hapus data wajah lama & ambil foto baru)</span>
              </label>
            </div>

            {/* Pose Checklist (only when re-registering) */}
            {reRegisterFace && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-bold text-gray-700 mb-1">Daftar Pose Wajah</h3>
                {requiredPoses.map((pose, index) => {
                  const isCompleted = index < currentPoseIndex;
                  const isCurrent = index === currentPoseIndex;
                  return (
                    <div key={index} className={`flex items-center gap-2 p-2 rounded-lg border text-sm ${
                      isCompleted ? 'bg-green-50 border-green-200 text-green-700' :
                      isCurrent ? 'bg-blue-50 border-blue-300 text-blue-800 ring-1 ring-blue-100' :
                      'bg-gray-50 border-gray-200 text-gray-400'
                    }`}>
                      {isCompleted ? <CheckCircle2 size={18} className="text-green-500" /> : <Circle size={18} />}
                      <span className={isCurrent ? 'font-bold' : ''}>{index + 1}. {pose}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Camera (only when re-registering) */}
          {reRegisterFace && (
            <div className="flex flex-col gap-4">
              <div className="bg-gray-900 text-white p-3 rounded-t-xl text-center">
                {currentPoseIndex < 5 ? (
                  <>
                    <p className="text-gray-400 text-xs mb-1">Pose Selanjutnya:</p>
                    <h3 className="text-lg font-bold text-yellow-400 animate-pulse">{requiredPoses[currentPoseIndex]}</h3>
                  </>
                ) : (
                  <h3 className="text-lg font-bold text-green-400 py-1">🎉 Semua Pose Selesai!</h3>
                )}
              </div>
              <div className="relative bg-gray-100 rounded-b-xl overflow-hidden border-x-2 border-b-2 border-gray-900">
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user" }}
                  className={`w-full h-auto object-cover transform scale-x-[-1] ${currentPoseIndex >= 5 ? 'opacity-50 blur-sm' : ''}`}
                />
                {currentPoseIndex < 5 && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-48 border-4 border-dashed border-yellow-400 rounded-[50%] pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
                )}
              </div>
              <p className="text-xs text-center text-gray-500">
                {isModelsLoaded ? "✅ AI Siap" : "⏳ Memuat modul..."}
              </p>
              <button
                onClick={captureAndCrop}
                disabled={!isModelsLoaded || currentPoseIndex >= 5}
                className={`py-3 rounded-full font-bold text-sm transition ${
                  currentPoseIndex >= 5 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' :
                  'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                📸 Jepret Pose {currentPoseIndex < 5 ? currentPoseIndex + 1 : 5} / 5
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition font-medium">
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || (reRegisterFace && capturedPhotos.length < 5)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? "Menyimpan..." : <><Save size={16} /> Simpan Perubahan</>}
          </button>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// MAIN: ManageASN Page Component
// ==========================================
const ManageASN = () => {
  const [asnList, setAsnList] = useState([]);
  const [opdList, setOpdList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [editingUser, setEditingUser] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'pending', 'approved'

  // Jam Real-time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchASNData = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.get(`${API_BASE}/manage-asn`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAsnList(res.data);
    } catch (err) {
      console.error("Gagal mengambil data manajemen ASN");
    }
  };

  const fetchOPDList = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.get(`${API_BASE}/opd`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpdList(res.data);
    } catch (err) {
      console.error("Gagal mengambil daftar OPD");
    }
  };

  useEffect(() => {
    fetchASNData();
    fetchOPDList();
    const interval = setInterval(fetchASNData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filtering
  const filteredASN = asnList
    .filter(asn =>
      asn.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asn.nip.includes(searchQuery)
    )
    .filter(asn => {
      if (filterStatus === 'pending') return asn.approval_status === 'pending';
      if (filterStatus === 'approved') return asn.approval_status === 'approved';
      return true;
    });

  // Summary calculations
  const totalASN = asnList.length;
  const sudahHadir = asnList.filter(a => a.status_hari_ini === "Sudah Hadir").length;
  const belumHadir = asnList.filter(a => a.status_hari_ini === "Belum Hadir").length;
  const sudahKeluar = asnList.filter(a => a.status_hari_ini === "Sudah Keluar").length;
  const pendingCount = asnList.filter(a => a.approval_status === 'pending').length;

  const handleDelete = async (id, nama) => {
    if(window.confirm(`Yakin ingin menghapus data ASN: ${nama}? Semua data wajah dan presensinya akan ikut terhapus.`)) {
      const token = localStorage.getItem('access_token');
      try {
        await axios.delete(`${API_BASE}/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Data berhasil dihapus!");
        fetchASNData();
      } catch (err) {
        alert("Gagal menghapus data.");
      }
    }
  };

  const handleApprove = async (asn) => {
    if(window.confirm(`Setujui registrasi ASN: ${asn.nama}?`)) {
      const token = localStorage.getItem('access_token');
      try {
        // Kirim opd_id agar backend tahu record mana yang harus di-update
        const payload = { status: 'approved' };
        if (asn.opd_id) payload.opd_id = asn.opd_id;

        await axios.put(`${API_BASE}/users/approve/${asn.nip}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert(`✅ Registrasi ${asn.nama} telah disetujui!`);
        fetchASNData();
      } catch (err) {
        alert("Gagal approve: " + (err.response?.data?.error || "Error"));
      }
    }
  };

  const handleReject = async (asn) => {
    if(window.confirm(`Tolak registrasi ASN: ${asn.nama}? ASN ini tidak akan bisa melakukan presensi.`)) {
      const token = localStorage.getItem('access_token');
      try {
        // Kirim opd_id agar backend tahu record mana yang harus di-update
        const payload = { status: 'rejected' };
        if (asn.opd_id) payload.opd_id = asn.opd_id;

        await axios.put(`${API_BASE}/users/approve/${asn.nip}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert(`❌ Registrasi ${asn.nama} telah ditolak.`);
        fetchASNData();
      } catch (err) {
        alert("Gagal reject: " + (err.response?.data?.error || "Error"));
      }
    }
  };

  // Component: Summary Card
  const SummaryCard = ({ title, count, icon, color, bgColor, textColor, onClick, active }) => (
    <div
      onClick={onClick}
      className={`p-6 rounded-xl shadow-sm border-l-4 ${color} ${bgColor} flex items-center justify-between ${onClick ? 'cursor-pointer hover:shadow-md transition' : ''} ${active ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
    >
      <div>
        <p className={`text-sm font-bold ${textColor} uppercase tracking-wider mb-1`}>{title}</p>
        <h3 className="text-3xl font-extrabold text-gray-800">{count}</h3>
      </div>
      <div className={`p-3 rounded-full ${color.replace('border-', 'bg-').replace('500', '100')} ${textColor}`}>
        {icon}
      </div>
    </div>
  );

  // Approval Status Badge
  const ApprovalBadge = ({ status }) => {
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
          <AlertTriangle size={12} /> Pending
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
          <ShieldX size={12} /> Ditolak
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
        <ShieldCheck size={12} /> Aktif
      </span>
    );
  };

  const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  return (
    <main className="p-8 w-full h-full">
      {/* Header & Real-time Clock */}
      <div className="flex justify-between items-end border-b-2 border-gray-300 pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manajemen ASN</h1>
          <p className="text-gray-500 mt-1">Kelola data pegawai aktif dan pantau status harian</p>
        </div>
        <div className="text-right bg-white px-5 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
          <Clock className="text-blue-500" size={24} />
          <div>
            <p className="text-sm font-semibold text-gray-500">
              {currentTime.toLocaleDateString('id-ID', optionsDate)}
            </p>
            <p className="text-xl font-bold text-gray-800 tracking-widest">
              {currentTime.toLocaleTimeString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Wins (Summary Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-8">
        <SummaryCard
          title="Total Terdaftar" count={totalASN} icon={<Users size={28} />}
          color="border-green-500" bgColor="bg-white" textColor="text-green-600"
          onClick={() => setFilterStatus('all')} active={filterStatus === 'all'}
        />
        <SummaryCard
          title="Hadir (Aktif)" count={sudahHadir} icon={<UserCheck size={28} />}
          color="border-blue-500" bgColor="bg-white" textColor="text-blue-600"
        />
        <SummaryCard
          title="Sudah Pulang" count={sudahKeluar} icon={<LogOut size={28} />}
          color="border-yellow-500" bgColor="bg-white" textColor="text-yellow-600"
        />
        <SummaryCard
          title="Belum Hadir" count={belumHadir} icon={<UserX size={28} />}
          color="border-red-500" bgColor="bg-white" textColor="text-red-600"
        />
        <SummaryCard
          title="Menunggu Approval" count={pendingCount} icon={<AlertTriangle size={28} />}
          color="border-amber-500" bgColor={pendingCount > 0 ? "bg-amber-50" : "bg-white"} textColor="text-amber-600"
          onClick={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}
          active={filterStatus === 'pending'}
        />
      </div>

      {/* Toolbar & Tabel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-370px)]">
        
        {/* Search Bar & Filter */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari NIP atau Nama ASN..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm"
            />
          </div>
          {filterStatus !== 'all' && (
            <button
              onClick={() => setFilterStatus('all')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <X size={14} /> Hapus Filter ({filterStatus})
            </button>
          )}
        </div>

        {/* Table Content */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#e9ecef] text-gray-700 text-sm font-semibold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 w-20 text-center">Profil</th>
                <th className="px-6 py-4">NIP</th>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Instansi (OPD)</th>
                <th className="px-6 py-4">Status Approval</th>
                <th className="px-6 py-4">Status Hari Ini</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-600">
              {filteredASN.length > 0 ? (
                filteredASN.map((asn) => (
                  <tr
                    key={asn.id}
                    className={`hover:bg-blue-50/50 transition duration-150 ${
                      asn.approval_status === 'pending' ? 'bg-amber-50/40' :
                      asn.approval_status === 'rejected' ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-center flex justify-center">
                      {asn.avatar_url ? (
                        <img src={asn.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                          <UserCircle2 size={24} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">{asn.nip}</td>
                    <td className="px-6 py-4 font-semibold">{asn.nama}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{asn.opd}</td>
                    <td className="px-6 py-4">
                      <ApprovalBadge status={asn.approval_status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center w-max gap-1.5 ${
                        asn.status_hari_ini === 'Sudah Hadir' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                        asn.status_hari_ini === 'Sudah Keluar' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                        'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          asn.status_hari_ini === 'Sudah Hadir' ? 'bg-blue-500' : 
                          asn.status_hari_ini === 'Sudah Keluar' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></span>
                        {asn.status_hari_ini}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Approve/Reject buttons for pending users */}
                        {asn.approval_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(asn)}
                              className="px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-xs font-bold hover:bg-green-200 transition flex items-center gap-1"
                              title="Setujui Registrasi"
                            >
                              <ShieldCheck size={14} /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(asn)}
                              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-xs font-bold hover:bg-red-200 transition flex items-center gap-1"
                              title="Tolak Registrasi"
                            >
                              <ShieldX size={14} /> Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setEditingUser(asn)}
                          className="text-blue-500 hover:text-blue-700 transition p-1"
                          title="Edit Data"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(asn.id, asn.nama)}
                          className="text-red-500 hover:text-red-700 transition p-1"
                          title="Hapus Data"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-400">
                    Tidak ada data ASN yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          opdList={opdList}
          onClose={() => setEditingUser(null)}
          onSaved={fetchASNData}
        />
      )}
    </main>
  );
};

export default ManageASN;