import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import {
  Users, UserCheck, UserX, LogOut,
  Search, Trash2, Edit, Clock, UserCircle2,
  X, CheckCircle2, Circle, Save, Shield
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:5000/api';

// ==========================================
// EDIT USER MODAL
// ==========================================
const EditUserModal = ({ user, opdList, onClose, onSaved }) => {
  const webcamRef = useRef(null);
  const [editName, setEditName] = useState(user.nama);
  const [editOpdId, setEditOpdId] = useState(user.opd_id || '');
  const [reRegisterFace, setReRegisterFace] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const requiredPoses = ["Lurus & Netral", "Lurus & Senyum", "Menoleh Kanan", "Menoleh Kiri", "Mendongak/Menunduk"];

  useEffect(() => {
    if (reRegisterFace) {
      faceapi.nets.tinyFaceDetector.loadFromUri('/models').then(() => setIsModelsLoaded(true)).catch(console.error);
    }
  }, [reRegisterFace]);

  const captureAndCrop = async () => {
    if (capturedPhotos.length >= 5) return;
    const video = webcamRef.current.video;
    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
    if (detection) {
      const { x, y, width, height } = detection.box;
      const canvas = document.createElement('canvas');
      const size = Math.max(width, height); const margin = size * 0.3;
      const cropSize = size + margin * 2;
      canvas.width = 160; canvas.height = 160;
      canvas.getContext('2d').drawImage(video, Math.max(0, x + width/2 - cropSize/2), Math.max(0, y + height/2 - cropSize/2), cropSize, cropSize, 0, 0, 160, 160);
      canvas.toBlob(blob => setCapturedPhotos(prev => [...prev, blob]), 'image/jpeg', 1.0);
    } else { alert("⚠️ Wajah tidak terdeteksi!"); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const token = localStorage.getItem('access_token');
    const fd = new FormData();
    fd.append('name', editName); fd.append('opd_id', editOpdId);
    if (reRegisterFace && capturedPhotos.length >= 5) capturedPhotos.forEach((b, i) => fd.append('photos', b, `face_${i}.jpg`));
    try {
      const res = await axios.put(`${API_BASE}/users/update/${user.nip}`, fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      alert(`✅ ${res.data.message}`); onSaved(); onClose();
    } catch (err) { alert("❌ Gagal: " + (err.response?.data?.error || "Error")); }
    finally { setIsSaving(false); }
  };

  const idx = capturedPhotos.length;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${reRegisterFace ? 'max-w-5xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-2xl">
          <div><h2 className="text-xl font-bold text-gray-800">Edit Data ASN</h2><p className="text-sm text-gray-500">NIP: {user.nip}</p></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X size={20} className="text-gray-500"/></button>
        </div>
        <div className={`p-6 ${reRegisterFace ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}`}>
          <div className="flex flex-col gap-5">
            <div><label className="block text-sm font-semibold text-gray-600 mb-1">Nama Lengkap</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/></div>
            <div><label className="block text-sm font-semibold text-gray-600 mb-1">Instansi (OPD)</label>
              <select value={editOpdId} onChange={e => setEditOpdId(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="" disabled>-- Pilih OPD --</option>
                {opdList.map(o => <option key={o.id} value={o.id}>{o.nama} ({o.kode})</option>)}
              </select></div>
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <input type="checkbox" id="reReg" checked={reRegisterFace} onChange={e => { setReRegisterFace(e.target.checked); setCapturedPhotos([]); }} className="w-5 h-5"/>
              <label htmlFor="reReg" className="text-sm font-semibold text-amber-800 cursor-pointer">🔄 Re-register Wajah?</label>
            </div>
            {reRegisterFace && <div className="flex flex-col gap-2">{requiredPoses.map((p, i) => (
              <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border text-sm ${i < idx ? 'bg-green-50 border-green-200 text-green-700' : i === idx ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                {i < idx ? <CheckCircle2 size={16} className="text-green-500"/> : <Circle size={16}/>} {i+1}. {p}
              </div>))}</div>}
          </div>
          {reRegisterFace && <div className="flex flex-col gap-4">
            <div className="bg-gray-900 text-white p-3 rounded-t-xl text-center">
              {idx < 5 ? <><p className="text-gray-400 text-xs">Pose:</p><h3 className="text-lg font-bold text-yellow-400 animate-pulse">{requiredPoses[idx]}</h3></> : <h3 className="text-lg font-bold text-green-400">🎉 Selesai!</h3>}
            </div>
            <div className="relative bg-gray-100 rounded-b-xl overflow-hidden border-x-2 border-b-2 border-gray-900">
              <Webcam ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{facingMode:"user"}} className={`w-full transform scale-x-[-1] ${idx>=5?'opacity-50 blur-sm':''}`}/>
              {idx<5 && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-48 border-4 border-dashed border-yellow-400 rounded-[50%] pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]"/>}
            </div>
            <button onClick={captureAndCrop} disabled={!isModelsLoaded||idx>=5} className={`py-3 rounded-full font-bold text-sm ${idx>=5?'bg-gray-300 text-gray-500 cursor-not-allowed':'bg-blue-600 hover:bg-blue-700 text-white'}`}>📸 Jepret {Math.min(idx+1,5)}/5</button>
          </div>}
        </div>
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-100 font-medium">Batal</button>
          <button onClick={handleSave} disabled={isSaving||(reRegisterFace&&idx<5)} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2">
            {isSaving ? "Menyimpan..." : <><Save size={16}/> Simpan</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN: ManageASN Page
// ==========================================
const ManageASN = () => {
  const [asnList, setAsnList] = useState([]);
  const [opdList, setOpdList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const fetchASNData = async () => {
    const token = localStorage.getItem('access_token');
    try { const res = await axios.get(`${API_BASE}/manage-asn`, { headers: { Authorization: `Bearer ${token}` } }); setAsnList(res.data); }
    catch { console.error("Gagal mengambil data ASN"); }
  };
  const fetchOPDList = async () => {
    const token = localStorage.getItem('access_token');
    try { const res = await axios.get(`${API_BASE}/opd`, { headers: { Authorization: `Bearer ${token}` } }); setOpdList(res.data); }
    catch { console.error("Gagal mengambil daftar OPD"); }
  };

  useEffect(() => { fetchASNData(); fetchOPDList(); const i = setInterval(fetchASNData, 15000); return () => clearInterval(i); }, []);

  const filteredASN = asnList.filter(a => a.nama.toLowerCase().includes(searchQuery.toLowerCase()) || (a.nip || '').includes(searchQuery));

  const totalASN = asnList.length;
  const hadirCount = asnList.filter(a => a.status_hari_ini === "Hadir").length;
  const belumHadir = asnList.filter(a => a.status_hari_ini === "Belum Hadir").length;
  const sudahKeluar = asnList.filter(a => a.status_hari_ini === "Sudah Keluar").length;

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin hapus data ASN: ${nama}?`)) return;
    const token = localStorage.getItem('access_token');
    try { await axios.delete(`${API_BASE}/users/${id}`, { headers: { Authorization: `Bearer ${token}` } }); alert("Berhasil dihapus!"); fetchASNData(); }
    catch { alert("Gagal menghapus."); }
  };

  const handleRevokeAccess = async (aksesId, opdNama, asnNama) => {
    if (!window.confirm(`Cabut hak akses absen ${asnNama} di "${opdNama}"?`)) return;
    const token = localStorage.getItem('access_token');
    try {
      await axios.delete(`${API_BASE}/users/akses-opd/${aksesId}`, { headers: { Authorization: `Bearer ${token}` } });
      // Optimistic UI update — remove chip without full reload
      setAsnList(prev => prev.map(asn => ({
        ...asn,
        cross_opd_privileges: (asn.cross_opd_privileges || []).filter(p => p.akses_id !== aksesId)
      })));
      alert(`✅ Akses "${opdNama}" berhasil dicabut.`);
    } catch (err) { alert("❌ Gagal: " + (err.response?.data?.error || "Error")); }
  };

  // Role Badge
  const RoleBadge = ({ role }) => {
    const c = {
      super_admin: { label: 'Super Admin', cls: 'bg-violet-100 text-violet-700 ring-violet-300' },
      admin_opd:   { label: 'Admin OPD',   cls: 'bg-sky-100 text-sky-700 ring-sky-300' },
      asn:         { label: 'ASN',          cls: 'bg-gray-100 text-gray-600 ring-gray-300' },
    };
    const b = c[role] || c.asn;
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ${b.cls}`}><Shield size={10}/>{b.label}</span>;
  };

  // Status Badge
  const StatusBadge = ({ status }) => {
    const c = {
      'Hadir':        { cls: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
      'Sudah Keluar': { cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
      'Belum Hadir':  { cls: 'bg-red-100 text-red-600 border-red-200', dot: 'bg-red-500' },
    };
    const s = c[status] || c['Belum Hadir'];
    return <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center w-max gap-1.5 border ${s.cls}`}><span className={`w-2 h-2 rounded-full ${s.dot}`}/>{status}</span>;
  };

  const SummaryCard = ({ title, count, icon, border, text }) => (
    <div className={`p-6 rounded-xl shadow-sm border-l-4 ${border} bg-white flex items-center justify-between`}>
      <div><p className={`text-sm font-bold ${text} uppercase tracking-wider mb-1`}>{title}</p><h3 className="text-3xl font-extrabold text-gray-800">{count}</h3></div>
      <div className={`p-3 rounded-full bg-gray-50 ${text}`}>{icon}</div>
    </div>
  );

  const dateOpts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  return (
    <main className="p-8 w-full h-full">
      {/* Header */}
      <div className="flex justify-between items-end border-b-2 border-gray-300 pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manajemen ASN</h1>
          <p className="text-gray-500 mt-1">Kelola data pegawai dan pantau status harian</p>
        </div>
        <div className="text-right bg-white px-5 py-2 rounded-lg shadow-sm border flex items-center gap-3">
          <Clock className="text-blue-500" size={24}/>
          <div>
            <p className="text-sm font-semibold text-gray-500">{currentTime.toLocaleDateString('id-ID', dateOpts)}</p>
            <p className="text-xl font-bold text-gray-800 tracking-widest">{currentTime.toLocaleTimeString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <SummaryCard title="Total Terdaftar" count={totalASN} icon={<Users size={28}/>} border="border-green-500" text="text-green-600"/>
        <SummaryCard title="Hadir" count={hadirCount} icon={<UserCheck size={28}/>} border="border-blue-500" text="text-blue-600"/>
        <SummaryCard title="Sudah Pulang" count={sudahKeluar} icon={<LogOut size={28}/>} border="border-yellow-500" text="text-yellow-600"/>
        <SummaryCard title="Belum Hadir" count={belumHadir} icon={<UserX size={28}/>} border="border-red-500" text="text-red-600"/>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col h-[calc(100vh-370px)]">
        <div className="p-4 border-b bg-gray-50/50">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            <input type="text" placeholder="Cari NIP atau Nama..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"/>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#e9ecef] text-gray-700 text-[11px] font-semibold uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-5 py-4 w-14 text-center">Profil</th>
                <th className="px-5 py-4">Identitas</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Instansi</th>
                <th className="px-5 py-4">Status Hari Ini</th>
                <th className="px-5 py-4">Akses Lintas OPD</th>
                <th className="px-5 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-600">
              {filteredASN.length > 0 ? filteredASN.map(asn => (
                <tr key={asn.id} className="hover:bg-blue-50/50 transition">
                  <td className="px-5 py-4 text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-gray-200 flex items-center justify-center text-gray-500"><UserCircle2 size={24}/></div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-gray-800 block">{asn.nama}</span>
                    <span className="font-mono text-[11px] text-gray-400">{asn.nip}</span>
                  </td>
                  <td className="px-5 py-4"><RoleBadge role={asn.role}/></td>
                  <td className="px-5 py-4 text-sm">{asn.opd}</td>
                  <td className="px-5 py-4"><StatusBadge status={asn.status_hari_ini}/></td>
                  <td className="px-5 py-4">
                    {asn.cross_opd_privileges && asn.cross_opd_privileges.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {asn.cross_opd_privileges.map(p => (
                          <span key={p.akses_id} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-1 rounded-full ring-1 ring-purple-200">
                            {p.opd_nama}
                            <button onClick={() => handleRevokeAccess(p.akses_id, p.opd_nama, asn.nama)}
                              className="ml-0.5 text-purple-400 hover:text-red-500 transition" title="Cabut akses"><X size={12}/></button>
                          </span>
                        ))}
                      </div>
                    ) : <span className="text-gray-300 text-xs italic">—</span>}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setEditingUser(asn)} className="text-blue-500 hover:text-blue-700 p-1" title="Edit"><Edit size={18}/></button>
                      <button onClick={() => handleDelete(asn.id, asn.nama)} className="text-red-500 hover:text-red-700 p-1" title="Hapus"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="text-center py-16">
                  <div className="flex flex-col items-center gap-2"><Search size={32} className="text-gray-300"/><span className="text-gray-400">Tidak ada data ASN.</span></div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && <EditUserModal user={editingUser} opdList={opdList} onClose={() => setEditingUser(null)} onSaved={fetchASNData}/>}
    </main>
  );
};

export default ManageASN;