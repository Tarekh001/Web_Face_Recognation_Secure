import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCog, Pencil, Trash2, X, Plus, Eye, EyeOff, ShieldCheck, Fingerprint } from 'lucide-react';

const API = 'http://127.0.0.1:5000/api';

const AdminPage = () => {
  const [admins, setAdmins] = useState([]);
  const [opds, setOpds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [showEditPw, setShowEditPw] = useState(false);
  const [form, setForm] = useState({ nip: '', username: '', nama_lengkap: '', password: '', opd_id: '' });

  const token = localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const [resAdmin, resOpd] = await Promise.all([
        axios.get(`${API}/admins`, { headers }),
        axios.get(`${API}/opd`, { headers }),
      ]);
      setAdmins(resAdmin.data);
      setOpds(resOpd.data);
    } catch (err) { console.error('Gagal mengambil data', err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${API}/admin/add`, form, { headers });
      alert('Admin OPD Berhasil Dibuat!');
      setForm({ nip: '', username: '', nama_lengkap: '', password: '', opd_id: '' });
      setShowModal(false);
      setShowPw(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Gagal membuat Admin');
    } finally { setIsLoading(false); }
  };

  const handleUpdate = async () => {
    if (!editModal) return;
    setIsLoading(true);
    try {
      const payload = { nama: editModal.nama, opd_id: editModal.opd_id };
      if (editModal.password) payload.password = editModal.password;
      await axios.put(`${API}/admins/${editModal.id}`, payload, { headers });
      alert('Admin berhasil diperbarui!');
      setEditModal(null);
      setShowEditPw(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memperbarui Admin');
    } finally { setIsLoading(false); }
  };

  const handleDelete = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus Admin "${nama}"?`)) return;
    try {
      await axios.delete(`${API}/admins/${id}`, { headers });
      alert(`Admin "${nama}" berhasil dihapus!`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus Admin');
    }
  };

  return (
    <div className="p-8 w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2"><UserCog size={24} /> Data Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Manajemen Akun Admin Operator Instansi</p>
        </div>
        <button onClick={() => { setShowModal(true); setShowPw(false); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg transition shadow-md">
          <Plus size={18} /> New Admin
        </button>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm">
              <th className="p-4 border-b font-semibold w-12">#</th>
              <th className="p-4 border-b font-semibold">NIP</th>
              <th className="p-4 border-b font-semibold">Username</th>
              <th className="p-4 border-b font-semibold">Nama Admin</th>
              <th className="p-4 border-b font-semibold">Wilayah Instansi</th>
              <th className="p-4 border-b font-semibold">Daftar Perangkat</th>
              <th className="p-4 border-b font-semibold text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a, i) => (
              <tr key={a.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition">
                <td className="p-4 text-gray-400 text-sm">{i + 1}</td>
                <td className="p-4">
                  <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">{a.nip || '—'}</span>
                  {/* Face registration status */}
                  {a.is_face_registered && (
                    <span className="ml-1.5 inline-flex" title="Wajah terdaftar">
                      <Fingerprint size={13} className="text-green-500" />
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <span className="text-sm text-gray-600">{a.username || <span className="text-gray-400 italic">—</span>}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-800 font-medium">{a.nama}</span>
                    {a.role === 'super_admin' && (
                      <span className="flex items-center gap-0.5 bg-purple-100 text-purple-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        <ShieldCheck size={10} /> SA
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4 text-blue-600 font-semibold text-sm">{a.opd}</td>
                <td className="p-4">
                  {a.bound_devices && a.bound_devices.length > 0
                    ? <div className="flex flex-wrap gap-1">
                        {a.bound_devices.map(sn => (
                          <span key={sn} className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">{sn}</span>
                        ))}
                      </div>
                    : <span className="text-gray-400 text-xs">Belum terikat</span>}
                </td>
                <td className="p-4 text-center">
                  <div className="flex justify-center gap-1">
                    {a.role !== 'super_admin' && (
                      <>
                        <button onClick={() => { setEditModal({ id: a.id, nip: a.nip, username: a.username, nama: a.nama, opd_id: a.opd_id || '', password: '' }); setShowEditPw(false); }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Edit"><Pencil size={15} /></button>
                        <button onClick={() => handleDelete(a.id, a.nama)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition" title="Hapus"><Trash2 size={15} /></button>
                      </>
                    )}
                    {a.role === 'super_admin' && <span className="text-gray-300 text-xs">—</span>}
                  </div>
                </td>
              </tr>
            ))}
            {admins.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">Belum ada data Admin.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* ── ADD ADMIN MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-800">Buat Akun Admin Baru</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">NIP Pegawai <span className="text-red-400">*</span></label>
                <input type="text" placeholder="199501012023011001" required value={form.nip} onChange={e => setForm({...form, nip: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
                <p className="text-[10px] text-gray-400 mt-1">NIP harus valid — digunakan oleh Face Recognition AI.</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Username / Email <span className="text-red-400">*</span></label>
                <input type="text" placeholder="admin.diskominfo" required value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                <p className="text-[10px] text-gray-400 mt-1">Digunakan untuk login ke Dashboard.</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Nama Lengkap <span className="text-red-400">*</span></label>
                <input type="text" placeholder="Ahmad Suryadi, S.Kom" required value={form.nama_lengkap} onChange={e => setForm({...form, nama_lengkap: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Password <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} placeholder="Minimal 6 karakter" required minLength={6} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full p-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Penempatan Instansi <span className="text-red-400">*</span></label>
                <select required value={form.opd_id} onChange={e => setForm({...form, opd_id: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="" disabled>Pilih Instansi</option>
                  {opds.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                </select>
              </div>
              <button type="submit" disabled={isLoading} className="bg-blue-600 text-white font-bold p-2.5 rounded-lg hover:bg-blue-700 transition">{isLoading ? 'Membuat...' : 'Buat Akun Admin'}</button>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT ADMIN MODAL ── */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-800">Edit Admin OPD</h3>
              <button onClick={() => setEditModal(null)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">NIP</label>
                  <input type="text" value={editModal.nip || ''} disabled className="w-full p-2.5 border rounded-lg bg-gray-100 cursor-not-allowed font-mono text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Username</label>
                  <input type="text" value={editModal.username || ''} disabled className="w-full p-2.5 border rounded-lg bg-gray-100 cursor-not-allowed text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Nama Lengkap</label>
                <input type="text" value={editModal.nama} onChange={e => setEditModal({...editModal, nama: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Penempatan Instansi</label>
                <select value={editModal.opd_id} onChange={e => setEditModal({...editModal, opd_id: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Pilih Instansi</option>
                  {opds.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Password Baru <span className="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span></label>
                <div className="relative">
                  <input type={showEditPw ? 'text' : 'password'} placeholder="••••••••" value={editModal.password} onChange={e => setEditModal({...editModal, password: e.target.value})} className="w-full p-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <button type="button" onClick={() => setShowEditPw(!showEditPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showEditPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button onClick={handleUpdate} disabled={isLoading} className="bg-blue-600 text-white font-bold p-2.5 rounded-lg hover:bg-blue-700 transition">{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
