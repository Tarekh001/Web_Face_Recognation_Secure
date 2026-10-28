import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import API_BASE from '../config/api';
import {
  UserCog,
  Pencil,
  Trash2,
  X,
  Plus,
  Eye,
  EyeOff,
  ShieldCheck,
  Fingerprint,
  Search,
} from 'lucide-react';

const AdminPage = () => {
  const [admins, setAdmins] = useState([]);
  const [opds, setOpds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [showEditPw, setShowEditPw] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    nip: '',
    username: '',
    nama_lengkap: '',
    password: '',
    opd_id: '',
  });

  const filteredAdmins = useMemo(() => {
    if (!searchQuery.trim()) return admins;
    const q = searchQuery.toLowerCase();
    return admins.filter(
      (a) =>
        (a.nama || '').toLowerCase().includes(q) ||
        (a.nip || '').toLowerCase().includes(q) ||
        (a.username || '').toLowerCase().includes(q) ||
        (a.opd || '').toLowerCase().includes(q)
    );
  }, [admins, searchQuery]);

  const token = localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const [resAdmin, resOpd] = await Promise.all([
        axios.get(`${API_BASE}/admins`, { headers }),
        axios.get(`${API_BASE}/opd`, { headers }),
      ]);
      setAdmins(Array.isArray(resAdmin.data) ? resAdmin.data : []);
      setOpds(Array.isArray(resOpd.data) ? resOpd.data : []);
    } catch (err) {
      console.error('Gagal mengambil data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${API_BASE}/admin/add`, form, { headers });
      alert('Admin OPD Berhasil Dibuat!');
      setForm({ nip: '', username: '', nama_lengkap: '', password: '', opd_id: '' });
      setShowModal(false);
      setShowPw(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Gagal membuat Admin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editModal) return;
    setIsLoading(true);
    try {
      const payload = { nama: editModal.nama, opd_id: editModal.opd_id };
      if (editModal.password) payload.password = editModal.password;
      await axios.put(`${API_BASE}/admins/${editModal.id}`, payload, { headers });
      alert('Admin berhasil diperbarui!');
      setEditModal(null);
      setShowEditPw(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memperbarui Admin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus Admin "${nama}"?`)) return;
    try {
      await axios.delete(`${API_BASE}/admins/${id}`, { headers });
      alert(`Admin "${nama}" berhasil dihapus!`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus Admin');
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Top Action Card */}
      <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <UserCog size={20} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Manajemen Akun Admin Operator ({admins.length})
            </h2>
            <p className="text-xs text-slate-500">
              Kelola hak akses operator instansi OPD dan integrasi biometrik buka kunci kiosk
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowModal(true);
            setShowPw(false);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <Plus size={16} /> Tambah Admin OPD
        </button>
      </div>

      {/* Search + Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-200/80 bg-white/60 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari NIP, Username, Nama, atau OPD..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Menampilkan <b className="text-slate-800">{filteredAdmins.length}</b> akun
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-4 py-3.5 w-12 text-center">#</th>
                <th className="px-4 py-3.5 whitespace-nowrap">NIP & Biometrik</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Username Login</th>
                <th className="px-4 py-3.5">Nama Admin</th>
                <th className="px-4 py-3.5">Wilayah Instansi</th>
                <th className="px-4 py-3.5">Perangkat Terikat</th>
                <th className="px-4 py-3.5 text-center w-28 sticky right-0 bg-slate-50/95">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredAdmins.map((a, i) => (
                <tr key={a.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3.5 text-center text-xs font-mono text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200/80">
                        {a.nip || '—'}
                      </span>
                      {a.is_face_registered && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 text-[10px] font-bold"
                          title="Biometrik wajah terdaftar (dapat buka kunci kiosk)"
                        >
                          <Fingerprint size={11} /> AI
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="text-xs font-medium text-slate-600">
                      {a.username || <span className="text-slate-400 italic">—</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 font-bold">{a.nama}</span>
                      {a.role === 'super_admin' && (
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 ring-1 ring-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <ShieldCheck size={11} /> Super Admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-blue-700 font-semibold text-xs whitespace-nowrap">
                    {a.opd || '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    {a.bound_devices && a.bound_devices.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {a.bound_devices.map((sn) => (
                          <span
                            key={sn}
                            className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono"
                          >
                            {sn}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">Belum terikat</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center sticky right-0 bg-white/95">
                    <div className="flex justify-center gap-1">
                      {a.role !== 'super_admin' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditModal({
                                id: a.id,
                                nip: a.nip,
                                username: a.username,
                                nama: a.nama,
                                opd_id: a.opd_id || '',
                                password: '',
                              });
                              setShowEditPw(false);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                            title="Edit Admin"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(a.id, a.nama)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                            title="Hapus Admin"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAdmins.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                    {searchQuery ? 'Akun Admin tidak ditemukan.' : 'Belum ada data Admin.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD ADMIN MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-4 mb-5 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Buat Akun Admin OPD Baru</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                  NIP Pegawai <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="199501012023011001"
                  required
                  value={form.nip}
                  onChange={(e) => setForm({ ...form, nip: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-mono text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  NIP harus sesuai dengan data pegawai agar terhubung ke Face Recognition AI.
                </p>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                  Username / Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="admin.diskominfo"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ahmad Suryadi, S.Kom"
                  required
                  value={form.nama_lengkap}
                  onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full p-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                  Penempatan Instansi <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.opd_id}
                  onChange={(e) => setForm({ ...form, opd_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-sm"
                >
                  <option value="" disabled>
                    Pilih Instansi OPD
                  </option>
                  {opds.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? 'Membuat...' : 'Buat Akun Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ADMIN MODAL */}
      {editModal && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setEditModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-4 mb-5 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Edit Admin OPD</h3>
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                    NIP
                  </label>
                  <input
                    type="text"
                    value={editModal.nip || ''}
                    disabled
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editModal.username || ''}
                    disabled
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={editModal.nama}
                  onChange={(e) => setEditModal({ ...editModal, nama: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                  Penempatan Instansi
                </label>
                <select
                  value={editModal.opd_id}
                  onChange={(e) => setEditModal({ ...editModal, opd_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-sm"
                >
                  <option value="">Pilih Instansi</option>
                  {opds.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                  Password Baru{' '}
                  <span className="text-slate-400 font-normal normal-case">
                    (kosongkan jika tidak diubah)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showEditPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={editModal.password}
                    onChange={(e) => setEditModal({ ...editModal, password: e.target.value })}
                    className="w-full p-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPw(!showEditPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showEditPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
