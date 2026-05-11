import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Building2, Pencil, Trash2, X, Plus, Search } from 'lucide-react';

const API = 'http://127.0.0.1:5000/api';

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
    return opds.filter(o => (o.nama || '').toLowerCase().includes(q) || (o.kode || '').toLowerCase().includes(q));
  }, [opds, searchQuery]);

  const token = localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/opd`, { headers });
      setOpds(res.data);
    } catch (err) { console.error('Gagal mengambil data OPD', err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${API}/opd`, form, { headers });
      alert('OPD Berhasil Ditambahkan!');
      setForm({ nama_opd: '', kode_opd: '' });
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menambahkan OPD');
    } finally { setIsLoading(false); }
  };

  const handleUpdate = async () => {
    if (!editModal) return;
    setIsLoading(true);
    try {
      await axios.put(`${API}/opd/${editModal.id}`, { nama_opd: editModal.nama, kode_opd: editModal.kode }, { headers });
      alert('OPD berhasil diperbarui!');
      setEditModal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memperbarui OPD');
    } finally { setIsLoading(false); }
  };

  const handleDelete = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus OPD "${nama}"?`)) return;
    try {
      await axios.delete(`${API}/opd/${id}`, { headers });
      alert(`OPD "${nama}" berhasil dihapus!`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus OPD');
    }
  };

  return (
    <div className="p-8 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2"><Building2 size={24} /> Data OPD</h1>
          <p className="text-gray-500 text-sm mt-1">Manajemen Instansi / Organisasi Perangkat Daerah</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg transition shadow-md">
          <Plus size={18} /> New OPD
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Cari Kode atau Nama OPD..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm">
                <th className="p-4 border-b font-semibold w-16">#</th>
                <th className="p-4 border-b font-semibold">Kode OPD</th>
                <th className="p-4 border-b font-semibold">Nama Instansi</th>
                <th className="p-4 border-b font-semibold text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOpds.map((o, i) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition">
                  <td className="p-4 text-gray-400 text-sm">{i + 1}</td>
                  <td className="p-4 font-mono font-semibold text-sm text-gray-700">{o.kode}</td>
                  <td className="p-4 text-gray-800">{o.nama}</td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => setEditModal({ id: o.id, nama: o.nama, kode: o.kode })} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Edit"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(o.id, o.nama)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition" title="Hapus"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOpds.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">{searchQuery ? 'Tidak ditemukan.' : 'Belum ada data OPD.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-800">Tambah OPD Baru</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Kode OPD</label>
                <input type="text" placeholder="OPD-002" required value={form.kode_opd} onChange={e => setForm({...form, kode_opd: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Nama Instansi</label>
                <input type="text" placeholder="Dinas Komunikasi dan Informatika" required value={form.nama_opd} onChange={e => setForm({...form, nama_opd: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <button type="submit" disabled={isLoading} className="bg-blue-600 text-white font-bold p-2.5 rounded-lg hover:bg-blue-700 transition">{isLoading ? 'Menyimpan...' : 'Simpan OPD'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-800">Edit OPD</h3>
              <button onClick={() => setEditModal(null)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Kode OPD</label>
                <input type="text" value={editModal.kode} onChange={e => setEditModal({...editModal, kode: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Nama Instansi</label>
                <input type="text" value={editModal.nama} onChange={e => setEditModal({...editModal, nama: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <button onClick={handleUpdate} disabled={isLoading} className="bg-blue-600 text-white font-bold p-2.5 rounded-lg hover:bg-blue-700 transition">{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpdPage;
