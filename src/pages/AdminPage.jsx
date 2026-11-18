import { useState, useEffect, useMemo, useCallback } from 'react';
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
import {
  useModalEscape,
  TableLoadingRow,
  TableErrorRow,
  TablePaginationBar,
  notifyAlert,
  confirmAction,
} from '../components/UiFeedback';

const AdminPage = () => {
  const [admins, setAdmins] = useState([]);
  const [opds, setOpds] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [showEditPw, setShowEditPw] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [form, setForm] = useState({
    nip: '',
    username: '',
    nama_lengkap: '',
    password: '',
    opd_id: '',
  });

  useModalEscape(showModal, () => setShowModal(false));
  useModalEscape(Boolean(editModal), () => setEditModal(null));

  const filteredAdmins = useMemo(() => {
    if (!searchQuery.trim()) return admins;
    const q = searchQuery.toLowerCase();
    return admins.filter(
      (a) =>
        (a.nama || '').toLowerCase().includes(q) ||
        (a.nip || '').toLowerCase().includes(q) ||
        (a.username || '').toLowerCase().includes(q) ||
        (a.opd || a.nama_opd || '').toLowerCase().includes(q)
    );
  }, [admins, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedAdmins = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return filteredAdmins.slice(start, start + itemsPerPage);
  }, [filteredAdmins, safePage, itemsPerPage]);

  const fetchData = useCallback(async () => {
    setIsFetching(true);
    setErrorMsg('');
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [resAdmin, resOpd] = await Promise.all([
        axios.get(`${API_BASE}/admins`, { headers }),
        axios.get(`${API_BASE}/opd`, { headers }),
      ]);
      setAdmins(Array.isArray(resAdmin.data) ? resAdmin.data : []);
      setOpds(Array.isArray(resOpd.data) ? resOpd.data : []);
    } catch (err) {
      console.error('Gagal mengambil data admin', err);
      setErrorMsg(
        err.response?.data?.error || 'Tidak dapat memuat daftar akun operator admin dari server.'
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
      await axios.post(`${API_BASE}/admin/add`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notifyAlert({
        icon: 'success',
        title: 'Berhasil',
        text: 'Akun Admin OPD berhasil dibuat.',
        timer: 1800,
      });
      setForm({ nip: '', username: '', nama_lengkap: '', password: '', opd_id: '' });
      setShowModal(false);
      setShowPw(false);
      fetchData();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Membuat Akun',
        text:
          err.response?.data?.error ||
          err.response?.data?.message ||
          'Terjadi kesalahan saat membuat akun Admin OPD.',
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
      const payload = { nama: editModal.nama, opd_id: editModal.opd_id };
      if (editModal.password) payload.password = editModal.password;
      await axios.put(`${API_BASE}/admins/${editModal.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notifyAlert({
        icon: 'success',
        title: 'Tersimpan',
        text: 'Data akun Admin OPD berhasil diperbarui.',
        timer: 1800,
      });
      setEditModal(null);
      setShowEditPw(false);
      fetchData();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Memperbarui',
        text: err.response?.data?.error || 'Terjadi kesalahan saat menyimpan perubahan.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, nama) => {
    const ok = await confirmAction({
      title: 'Hapus Akun Admin?',
      text: `Akun operator "${nama}" akan dicabut hak aksesnya dari panel admin.`,
      confirmText: 'Ya, Hapus',
    });
    if (!ok) return;
    const token = localStorage.getItem('access_token');
    try {
      await axios.delete(`${API_BASE}/admins/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notifyAlert({
        icon: 'success',
        title: 'Terhapus',
        text: `Akun Admin "${nama}" berhasil dihapus.`,
        timer: 1600,
      });
      fetchData();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Menghapus',
        text: err.response?.data?.error || 'Terjadi kesalahan saat menghapus akun Admin.',
      });
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Header Standar Konfigurasi */}
      <div className="surface-card p-5 sm:px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <UserCog size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight tabular-nums">
              Manajemen Akun Admin Operator ({admins.length})
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Kelola hak akses operator instansi OPD dan otorisasi biometrik buka kunci perangkat kiosk
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowModal(true);
            setShowPw(false);
          }}
          className="gov-btn-primary"
        >
          <Plus size={16} aria-hidden="true" />
          <span>Tambah Admin OPD</span>
        </button>
      </div>

      {/* Tabel Standar Konfigurasi */}
      <div className="surface-card overflow-hidden">
        <div className="gov-table-toolbar">
          <div className="w-full sm:w-80">
            <label htmlFor="admin-search-input" className="sr-only">
              Cari NIP, Username, Nama, atau OPD
            </label>
            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                size={16}
                aria-hidden="true"
              />
              <input
                id="admin-search-input"
                type="text"
                placeholder="Cari NIP, username, nama, atau OPD..."
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
            Total <b className="text-slate-900">{filteredAdmins.length}</b> akun terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="gov-table min-w-[960px]">
            <thead>
              <tr>
                <th className="w-14 text-center">No</th>
                <th className="whitespace-nowrap">NIP dan Biometrik</th>
                <th className="whitespace-nowrap">Username Login</th>
                <th>Nama Admin</th>
                <th>Wilayah Instansi</th>
                <th>Perangkat Terikat</th>
                <th className="w-32 text-center sticky right-0 bg-slate-50 border-l border-slate-200">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                <TableLoadingRow colSpan={7} label="Memuat daftar akun operator admin..." />
              ) : errorMsg ? (
                <TableErrorRow colSpan={7} message={errorMsg} onRetry={fetchData} />
              ) : paginatedAdmins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 px-4 text-center">
                    <p className="text-sm font-bold text-slate-900">
                      {searchQuery
                        ? 'Akun Admin Tidak Ditemukan'
                        : 'Belum Ada Akun Admin Terdaftar'}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {searchQuery
                        ? `Tidak ada akun yang cocok dengan kata kunci "${searchQuery}".`
                        : 'Tambahkan akun operator baru melalui tombol "Tambah Admin OPD".'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedAdmins.map((a, i) => (
                  <tr key={a.id}>
                    <td className="text-center text-xs font-mono text-slate-600 tabular-nums">
                      {(safePage - 1) * itemsPerPage + i + 1}
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md border border-slate-300 tabular-nums">
                          {a.nip || '-'}
                        </span>
                        {a.is_face_registered && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold"
                            title="Biometrik wajah terdaftar untuk buka kunci perangkat kiosk"
                          >
                            <Fingerprint size={12} aria-hidden="true" />
                            <span>Biometrik</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="text-xs font-semibold text-slate-700">
                        {a.username || '-'}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-slate-900 font-bold">{a.nama}</span>
                        {a.role === 'super_admin' && (
                          <span className="inline-flex items-center gap-1 bg-[#0B1120] text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                            <ShieldCheck size={12} aria-hidden="true" />
                            <span>Super Admin</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-blue-800 font-semibold text-xs whitespace-nowrap">
                      {a.opd || a.nama_opd || '-'}
                    </td>
                    <td>
                      {a.bound_devices && a.bound_devices.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {a.bound_devices.map((sn) => (
                            <span
                              key={sn}
                              className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-md font-mono"
                            >
                              {sn}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">Belum terikat</span>
                      )}
                    </td>
                    <td className="text-center sticky right-0 bg-white border-l border-slate-200">
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
                              aria-label={`Ubah akun admin ${a.nama}`}
                              title="Ubah Admin"
                              className="gov-icon-btn text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200"
                            >
                              <Pencil size={16} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(a.id, a.nama)}
                              aria-label={`Hapus akun admin ${a.nama}`}
                              title="Hapus Admin"
                              className="gov-icon-btn text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200"
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-600 text-xs font-medium py-2">Sistem</span>
                        )}
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
          totalItems={filteredAdmins.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
          unitLabel="akun"
        />
      </div>

      {/* MODAL TAMBAH ADMIN */}
      {showModal && (
        <div
          className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-add-admin-title"
            className="surface-modal w-full max-w-md overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#0B1120] text-white flex justify-between items-center">
              <h3 id="modal-add-admin-title" className="text-base font-extrabold">
                Buat Akun Admin OPD Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Tutup dialog buat akun admin"
                className="gov-icon-btn text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="add-admin-nip"
                  className="text-xs font-bold text-slate-800 mb-1.5 block"
                >
                  NIP Pegawai <span className="text-red-700">*</span>
                </label>
                <input
                  id="add-admin-nip"
                  type="text"
                  placeholder="Masukkan 18 digit NIP pegawai"
                  required
                  value={form.nip}
                  onChange={(e) => setForm({ ...form, nip: e.target.value })}
                  className="gov-input font-mono tabular-nums"
                />
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  NIP wajib sesuai dengan data pegawai agar terhubung ke verifikasi biometrik wajah kiosk.
                </p>
              </div>
              <div>
                <label
                  htmlFor="add-admin-username"
                  className="text-xs font-bold text-slate-800 mb-1.5 block"
                >
                  Username Login <span className="text-red-700">*</span>
                </label>
                <input
                  id="add-admin-username"
                  type="text"
                  placeholder="Contoh: admin.instansi"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="gov-input"
                />
              </div>
              <div>
                <label
                  htmlFor="add-admin-nama"
                  className="text-xs font-bold text-slate-800 mb-1.5 block"
                >
                  Nama Lengkap <span className="text-red-700">*</span>
                </label>
                <input
                  id="add-admin-nama"
                  type="text"
                  placeholder="Masukkan nama lengkap beserta gelar"
                  required
                  value={form.nama_lengkap}
                  onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                  className="gov-input"
                />
              </div>
              <div>
                <label
                  htmlFor="add-admin-password"
                  className="text-xs font-bold text-slate-800 mb-1.5 block"
                >
                  Kata Sandi <span className="text-red-700">*</span>
                </label>
                <div className="relative">
                  <input
                    id="add-admin-password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="gov-input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="absolute right-0 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 hover:text-slate-900"
                  >
                    {showPw ? (
                      <EyeOff size={17} aria-hidden="true" />
                    ) : (
                      <Eye size={17} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="add-admin-opd"
                  className="text-xs font-bold text-slate-800 mb-1.5 block"
                >
                  Penempatan Instansi OPD <span className="text-red-700">*</span>
                </label>
                <select
                  id="add-admin-opd"
                  required
                  value={form.opd_id}
                  onChange={(e) => setForm({ ...form, opd_id: e.target.value })}
                  className="gov-select"
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
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="gov-btn-secondary"
                >
                  Batal
                </button>
                <button type="submit" disabled={isSaving} className="gov-btn-primary">
                  {isSaving ? 'Membuat...' : 'Buat Akun Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UBAH ADMIN */}
      {editModal && (
        <div
          className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setEditModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-edit-admin-title"
            className="surface-modal w-full max-w-md overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#0B1120] text-white flex justify-between items-center">
              <h3 id="modal-edit-admin-title" className="text-base font-extrabold">
                Ubah Akun Admin OPD
              </h3>
              <button
                type="button"
                onClick={() => setEditModal(null)}
                aria-label="Tutup dialog ubah admin"
                className="gov-icon-btn text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="edit-admin-nip"
                    className="text-xs font-bold text-slate-700 mb-1.5 block"
                  >
                    NIP
                  </label>
                  <input
                    id="edit-admin-nip"
                    type="text"
                    value={editModal.nip || ''}
                    disabled
                    className="gov-input bg-slate-100 text-slate-600 border-slate-300 font-mono text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-admin-username"
                    className="text-xs font-bold text-slate-700 mb-1.5 block"
                  >
                    Username
                  </label>
                  <input
                    id="edit-admin-username"
                    type="text"
                    value={editModal.username || ''}
                    disabled
                    className="gov-input bg-slate-100 text-slate-600 border-slate-300 text-xs"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="edit-admin-nama"
                  className="text-xs font-bold text-slate-800 mb-1.5 block"
                >
                  Nama Lengkap <span className="text-red-700">*</span>
                </label>
                <input
                  id="edit-admin-nama"
                  type="text"
                  required
                  value={editModal.nama}
                  onChange={(e) => setEditModal({ ...editModal, nama: e.target.value })}
                  className="gov-input"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-admin-opd"
                  className="text-xs font-bold text-slate-800 mb-1.5 block"
                >
                  Penempatan Instansi OPD
                </label>
                <select
                  id="edit-admin-opd"
                  value={editModal.opd_id}
                  onChange={(e) => setEditModal({ ...editModal, opd_id: e.target.value })}
                  className="gov-select"
                >
                  <option value="">Pilih Instansi OPD</option>
                  {opds.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="edit-admin-password"
                  className="text-xs font-bold text-slate-800 mb-1.5 block"
                >
                  Kata Sandi Baru{' '}
                  <span className="text-slate-600 font-normal">(kosongkan jika tidak diubah)</span>
                </label>
                <div className="relative">
                  <input
                    id="edit-admin-password"
                    type={showEditPw ? 'text' : 'password'}
                    placeholder="Masukkan kata sandi baru"
                    value={editModal.password}
                    onChange={(e) => setEditModal({ ...editModal, password: e.target.value })}
                    className="gov-input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPw(!showEditPw)}
                    aria-label={
                      showEditPw ? 'Sembunyikan kata sandi baru' : 'Tampilkan kata sandi baru'
                    }
                    className="absolute right-0 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 hover:text-slate-900"
                  >
                    {showEditPw ? (
                      <EyeOff size={17} aria-hidden="true" />
                    ) : (
                      <Eye size={17} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
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

export default AdminPage;
