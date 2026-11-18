import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import API_BASE from '../config/api';
import { Building2, Pencil, Trash2, X, Plus, Search } from 'lucide-react';
import {
  useModalEscape,
  TableLoadingRow,
  TableErrorRow,
  TablePaginationBar,
  notifyAlert,
  confirmAction,
} from '../components/UiFeedback';

const OpdPage = () => {
  const [opds, setOpds] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [form, setForm] = useState({ nama_opd: '', kode_opd: '' });

  useModalEscape(showModal, () => setShowModal(false));
  useModalEscape(Boolean(editModal), () => setEditModal(null));

  const filteredOpds = useMemo(() => {
    if (!searchQuery.trim()) return opds;
    const q = searchQuery.toLowerCase();
    return opds.filter(
      (o) => (o.nama || '').toLowerCase().includes(q) || (o.kode || '').toLowerCase().includes(q)
    );
  }, [opds, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredOpds.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOpds = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return filteredOpds.slice(start, start + itemsPerPage);
  }, [filteredOpds, safePage, itemsPerPage]);

  const fetchData = useCallback(async () => {
    setIsFetching(true);
    setErrorMsg('');
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.get(`${API_BASE}/opd`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpds(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Gagal mengambil data OPD', err);
      setErrorMsg(
        err.response?.data?.error || 'Tidak dapat memuat daftar instansi OPD dari server.'
      );
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('access_token');
    try {
      await axios.post(`${API_BASE}/opd`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm({ nama_opd: '', kode_opd: '' });
      setShowModal(false);
      notifyAlert({
        icon: 'success',
        title: 'Berhasil',
        text: 'Data instansi OPD baru berhasil ditambahkan.',
        timer: 1600,
      });
      fetchData();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Menambahkan OPD',
        text: err.response?.data?.error || 'Terjadi kesalahan saat menyimpan data OPD.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    if (!editModal) return;
    setIsSaving(true);
    const token = localStorage.getItem('access_token');
    try {
      await axios.put(
        `${API_BASE}/opd/${editModal.id}`,
        { nama_opd: editModal.nama, kode_opd: editModal.kode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditModal(null);
      notifyAlert({
        icon: 'success',
        title: 'Tersimpan',
        text: 'Perubahan data instansi OPD berhasil disimpan.',
        timer: 1600,
      });
      fetchData();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Memperbarui OPD',
        text: err.response?.data?.error || 'Terjadi kesalahan saat memperbarui data OPD.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, nama) => {
    const ok = await confirmAction({
      title: 'Hapus Instansi OPD?',
      text: `Instansi "${nama}" akan dihapus dari daftar master OPD.`,
      confirmText: 'Ya, Hapus',
    });
    if (!ok) return;
    const token = localStorage.getItem('access_token');
    try {
      await axios.delete(`${API_BASE}/opd/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notifyAlert({
        icon: 'success',
        title: 'Terhapus',
        text: `Instansi "${nama}" telah dihapus.`,
        timer: 1500,
      });
      fetchData();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Menghapus OPD',
        text:
          err.response?.data?.error ||
          'Pastikan tidak ada pegawai atau mesin yang masih terikat pada OPD ini.',
      });
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Header Standar Konfigurasi */}
      <div className="surface-card p-5 sm:px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <Building2 size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight tabular-nums">
              Daftar Organisasi Perangkat Daerah ({opds.length})
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Manajemen kode unik dan nama resmi instansi Pemerintah Kabupaten Tangerang
            </p>
          </div>
        </div>
        <button type="button" onClick={() => setShowModal(true)} className="gov-btn-primary">
          <Plus size={16} aria-hidden="true" />
          <span>Tambah OPD</span>
        </button>
      </div>

      {/* Tabel Standar Konfigurasi */}
      <div className="surface-card overflow-hidden">
        <div className="gov-table-toolbar">
          <div className="w-full sm:w-80">
            <label htmlFor="opd-search-input" className="sr-only">
              Cari Kode atau Nama OPD
            </label>
            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                size={16}
                aria-hidden="true"
              />
              <input
                id="opd-search-input"
                type="text"
                placeholder="Cari kode atau nama instansi OPD..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="gov-input pl-9"
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-700 tabular-nums">
            Total <b className="text-slate-900">{filteredOpds.length}</b> instansi terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="gov-table min-w-[760px]">
            <thead>
              <tr>
                <th className="w-14 text-center">No</th>
                <th className="w-48">Kode OPD</th>
                <th>Nama Resmi Instansi</th>
                <th className="w-32 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                <TableLoadingRow colSpan={4} label="Memuat daftar instansi OPD..." />
              ) : errorMsg ? (
                <TableErrorRow colSpan={4} message={errorMsg} onRetry={fetchData} />
              ) : paginatedOpds.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 px-4 text-center">
                    <p className="text-sm font-bold text-slate-900">
                      {searchQuery
                        ? 'Instansi OPD Tidak Ditemukan'
                        : 'Belum Ada Data Instansi OPD'}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {searchQuery
                        ? `Tidak ada kode atau nama instansi yang cocok dengan "${searchQuery}".`
                        : 'Klik tombol "Tambah OPD" di bagian atas untuk mendaftarkan instansi baru.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedOpds.map((o, i) => (
                  <tr key={o.id}>
                    <td className="text-center text-xs font-mono text-slate-600 tabular-nums">
                      {(safePage - 1) * itemsPerPage + i + 1}
                    </td>
                    <td>
                      <span className="inline-block font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 tabular-nums">
                        {o.kode}
                      </span>
                    </td>
                    <td className="font-semibold text-slate-900">{o.nama}</td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditModal({ id: o.id, nama: o.nama, kode: o.kode })}
                          aria-label={`Ubah instansi ${o.nama}`}
                          title="Ubah OPD"
                          className="gov-icon-btn text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200"
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(o.id, o.nama)}
                          aria-label={`Hapus instansi ${o.nama}`}
                          title="Hapus OPD"
                          className="gov-icon-btn text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePaginationBar
          currentPage={safePage}
          totalItems={filteredOpds.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
          unitLabel="instansi"
        />
      </div>

      {/* Modal Tambah OPD */}
      {showModal && (
        <div
          className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-add-opd-title"
            className="surface-modal w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#0B1120] text-white flex justify-between items-center">
              <h3 id="modal-add-opd-title" className="text-base font-extrabold">
                Tambah Instansi OPD Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Tutup dialog tambah OPD"
                className="gov-icon-btn text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="add-kode-opd"
                  className="text-xs font-bold text-slate-800 mb-1.5 block"
                >
                  Kode OPD <span className="text-red-700">*</span>
                </label>
                <input
                  id="add-kode-opd"
                  type="text"
                  placeholder="Contoh: OPD-002"
                  required
                  value={form.kode_opd}
                  onChange={(e) => setForm({ ...form, kode_opd: e.target.value })}
                  className="gov-input font-mono"
                />
              </div>
              <div>
                <label
                  htmlFor="add-nama-opd"
                  className="text-xs font-bold text-slate-800 mb-1.5 block"
                >
                  Nama Resmi Instansi <span className="text-red-700">*</span>
                </label>
                <input
                  id="add-nama-opd"
                  type="text"
                  placeholder="Contoh: Dinas Komunikasi dan Informatika"
                  required
                  value={form.nama_opd}
                  onChange={(e) => setForm({ ...form, nama_opd: e.target.value })}
                  className="gov-input"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="gov-btn-secondary"
                >
                  Batal
                </button>
                <button type="submit" disabled={isSaving} className="gov-btn-primary">
                  {isSaving ? 'Menyimpan...' : 'Simpan OPD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ubah OPD */}
      {editModal && (
        <div
          className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4"
          onClick={() => setEditModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-edit-opd-title"
            className="surface-modal w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#0B1120] text-white flex justify-between items-center">
              <h3 id="modal-edit-opd-title" className="text-base font-extrabold">
                Ubah Data Instansi OPD
              </h3>
              <button
                type="button"
                onClick={() => setEditModal(null)}
                aria-label="Tutup dialog ubah OPD"
                className="gov-icon-btn text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="edit-kode-opd"
                  className="text-xs font-bold text-slate-800 mb-1.5 block"
                >
                  Kode OPD <span className="text-red-700">*</span>
                </label>
                <input
                  id="edit-kode-opd"
                  type="text"
                  required
                  value={editModal.kode}
                  onChange={(e) => setEditModal({ ...editModal, kode: e.target.value })}
                  className="gov-input font-mono"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-nama-opd"
                  className="text-xs font-bold text-slate-800 mb-1.5 block"
                >
                  Nama Resmi Instansi <span className="text-red-700">*</span>
                </label>
                <input
                  id="edit-nama-opd"
                  type="text"
                  required
                  value={editModal.nama}
                  onChange={(e) => setEditModal({ ...editModal, nama: e.target.value })}
                  className="gov-input"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="gov-btn-secondary"
                >
                  Batal
                </button>
                <button type="submit" disabled={isSaving} className="gov-btn-primary">
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpdPage;
