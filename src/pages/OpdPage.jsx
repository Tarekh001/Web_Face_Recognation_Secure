import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import API_BASE from '../config/api';
import { Building2, Pencil, Trash2, X, Plus, Search } from 'lucide-react';

const OpdPage = () => {
  const [opds, setOpds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ nama_opd: '', kode_opd: '' });

  const filteredOpds = useMemo(() => {
    if (!searchQuery.trim()) return opds;
    const q = searchQuery.toLowerCase();
    return opds.filter(
      (o) => (o.nama || '').toLowerCase().includes(q) || (o.kode || '').toLowerCase().includes(q)
    );
  }, [opds, searchQuery]);

  const token = localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/opd`, { headers });
      setOpds(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Gagal mengambil data OPD', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${API_BASE}/opd`, form, { headers });
      setForm({ nama_opd: '', kode_opd: '' });
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menambahkan OPD');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editModal) return;
    setIsLoading(true);
    try {
      await axios.put(
        `${API_BASE}/opd/${editModal.id}`,
        { nama_opd: editModal.nama, kode_opd: editModal.kode },
        { headers }
      );
      setEditModal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memperbarui OPD');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus OPD "${nama}"?`)) return;
    try {
      await axios.delete(`${API_BASE}/opd/${id}`, { headers });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus OPD');
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Top Action Card */}
      <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Daftar Organisasi Perangkat Daerah ({opds.length})
            </h2>
            <p className="text-xs text-slate-500">Manajemen kode unik dan nama instansi Pemerintah Daerah</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <Plus size={16} /> Tambah OPD
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-200/80 bg-white/60">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari Kode atau Nama OPD..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-4 py-3.5 w-14 text-center">#</th>
                <th className="px-4 py-3.5">Kode OPD</th>
                <th className="px-4 py-3.5">Nama Instansi</th>
                <th className="px-4 py-3.5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredOpds.map((o, i) => (
                <tr key={o.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3.5 text-center text-xs font-mono text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                      {o.kode}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">{o.nama}</td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditModal({ id: o.id, nama: o.nama, kode: o.kode })}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                        title="Edit OPD"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(o.id, o.nama)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        title="Hapus OPD"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOpds.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400 text-sm">
                    {searchQuery ? 'Instansi OPD tidak ditemukan.' : 'Belum ada data OPD.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">Tambah OPD Baru</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-xl cursor-pointer">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Kode OPD</label>
                <input
                  type="text"
                  placeholder="Contoh: OPD-002"
                  required
                  value={form.kode_opd}
                  onChange={(e) => setForm({ ...form, kode_opd: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Nama Instansi</label>
                <input
                  type="text"
                  placeholder="Contoh: Dinas Komunikasi dan Informatika"
                  required
                  value={form.nama_opd}
                  onChange={(e) => setForm({ ...form, nama_opd: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition cursor-pointer"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan OPD'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">Edit OPD</h3>
              <button onClick={() => setEditModal(null)} className="p-1.5 hover:bg-slate-100 rounded-xl cursor-pointer">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Kode OPD</label>
                <input
                  type="text"
                  value={editModal.kode}
                  onChange={(e) => setEditModal({ ...editModal, kode: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Nama Instansi</label>
                <input
                  type="text"
                  value={editModal.nama}
                  onChange={(e) => setEditModal({ ...editModal, nama: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isLoading}
                className="bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition cursor-pointer"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpdPage;
