import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import API_BASE from '../config/api';
import {
  MonitorSmartphone,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
  X,
  Info,
  Unlink,
  Search,
  Shield,
  ShieldOff,
} from 'lucide-react';
import {
  useModalEscape,
  TableLoadingRow,
  TableErrorRow,
  TablePaginationBar,
  notifyAlert,
  confirmAction,
} from '../components/UiFeedback';

const DevicePage = () => {
  const [devices, setDevices] = useState([]);
  const [opds, setOpds] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useModalEscape(Boolean(editModal), () => setEditModal(null));

  const filteredDevices = useMemo(() => {
    if (!searchQuery.trim()) return devices;
    const q = searchQuery.toLowerCase();
    return devices.filter(
      (d) =>
        (d.sn || '').toLowerCase().includes(q) ||
        (d.lokasi || '').toLowerCase().includes(q) ||
        (d.device_name || '').toLowerCase().includes(q) ||
        (d.opd || '').toLowerCase().includes(q)
    );
  }, [devices, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredDevices.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedDevices = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return filteredDevices.slice(start, start + itemsPerPage);
  }, [filteredDevices, safePage, itemsPerPage]);

  const fetchData = useCallback(async () => {
    setIsFetching(true);
    setErrorMsg('');
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [resDev, resOpd] = await Promise.all([
        axios.get(`${API_BASE}/devices`, { headers }),
        axios.get(`${API_BASE}/opd`, { headers }),
      ]);
      setDevices(Array.isArray(resDev.data) ? resDev.data : []);
      setOpds(Array.isArray(resOpd.data) ? resOpd.data : []);
    } catch (err) {
      console.error('Gagal mengambil data perangkat', err);
      setErrorMsg(
        err.response?.data?.error || 'Tidak dapat memuat daftar mesin kiosk dari server.'
      );
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUnbind = async (sn) => {
    const ok = await confirmAction({
      title: 'Lepas Kaitan Perangkat?',
      text: `Perangkat "${sn}" akan dilepas dari instansi OPD dan otomatis keluar dari sesi kiosk.`,
      confirmText: 'Ya, Lepas Kaitan',
      isDanger: false,
    });
    if (!ok) return;
    setIsSaving(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.put(
        `${API_BASE}/devices/${sn}/unbind`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      notifyAlert({
        icon: 'success',
        title: 'Kaitan Dilepas',
        text: res.data.message || 'Perangkat berhasil dilepas dari instansi.',
        timer: 1800,
      });
      fetchData();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Melepas Kaitan',
        text: err.response?.data?.error || 'Terjadi kesalahan saat melepas kaitan perangkat.',
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
      await axios.put(`${API_BASE}/devices/${editModal.sn}`, editModal, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notifyAlert({
        icon: 'success',
        title: 'Tersimpan',
        text: 'Konfigurasi perangkat kiosk berhasil diperbarui.',
        timer: 1600,
      });
      setEditModal(null);
      fetchData();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.response?.data?.error || 'Terjadi kesalahan saat menyimpan konfigurasi.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (sn) => {
    const ok = await confirmAction({
      title: 'Hapus Permanen Perangkat?',
      text: `Perangkat "${sn}" akan dihapus permanen dari registri perangkat kiosk.`,
      confirmText: 'Ya, Hapus Permanen',
    });
    if (!ok) return;
    const token = localStorage.getItem('access_token');
    try {
      await axios.delete(`${API_BASE}/devices/${sn}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notifyAlert({
        icon: 'success',
        title: 'Terhapus',
        text: `Perangkat "${sn}" telah dihapus dari sistem.`,
        timer: 1600,
      });
      fetchData();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Menghapus',
        text: err.response?.data?.error || 'Terjadi kesalahan saat menghapus perangkat.',
      });
    }
  };

  const activeCount = devices.filter((d) => d.verified).length;

  return (
    <div className="w-full space-y-5">
      {/* Header Standar Konfigurasi */}
      <div className="surface-card p-5 sm:px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <MonitorSmartphone size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight tabular-nums">
              Konfigurasi Mesin Kiosk ({devices.length})
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Pemantauan terminal biometrik lapangan, status ikatan OPD, dan proteksi keaslian wajah
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-800 tabular-nums">
          <CheckCircle size={15} aria-hidden="true" />
          <span>{activeCount} Mesin Terverifikasi</span>
        </div>
      </div>

      {/* Tabel Standar Konfigurasi */}
      <div className="surface-card overflow-hidden">
        <div className="gov-table-toolbar">
          <div className="w-full sm:w-80">
            <label htmlFor="device-search-input" className="sr-only">
              Cari Nomor Seri, Lokasi, Nama Perangkat, atau OPD
            </label>
            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                size={16}
                aria-hidden="true"
              />
              <input
                id="device-search-input"
                type="text"
                placeholder="Cari SN, lokasi, nama perangkat, atau OPD..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="gov-input pl-9"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
              <Info size={14} className="text-blue-700 shrink-0" aria-hidden="true" />
              <span>Terdaftar otomatis saat aktivasi aplikasi Kiosk Mobile</span>
            </span>
            <span className="hidden sm:inline text-slate-300" aria-hidden="true">|</span>
            <span className="font-semibold text-slate-700 tabular-nums">
              Total <b className="text-slate-900">{filteredDevices.length}</b> perangkat
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="gov-table min-w-[1040px]">
            <thead>
              <tr>
                <th className="w-14 text-center">No</th>
                <th className="whitespace-nowrap">SN Mesin</th>
                <th>Instansi OPD</th>
                <th>Lokasi Penempatan</th>
                <th className="w-32">Status</th>
                <th>Terdaftar Oleh</th>
                <th className="whitespace-nowrap">Terakhir Aktif</th>
                <th className="w-32 text-center">Anti-Spoof</th>
                <th className="w-52 text-center sticky right-0 bg-slate-50 border-l border-slate-200">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                <TableLoadingRow colSpan={9} label="Memuat daftar perangkat kiosk..." />
              ) : errorMsg ? (
                <TableErrorRow colSpan={9} message={errorMsg} onRetry={fetchData} />
              ) : paginatedDevices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 px-4 text-center">
                    <p className="text-sm font-bold text-slate-900">
                      {searchQuery
                        ? 'Perangkat Kiosk Tidak Ditemukan'
                        : 'Belum Ada Perangkat Kiosk Terdaftar'}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {searchQuery
                        ? `Tidak ada SN atau lokasi yang cocok dengan "${searchQuery}".`
                        : 'Perangkat akan muncul secara otomatis setelah diaktifkan melalui aplikasi Kiosk Mobile.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedDevices.map((d, i) => (
                  <tr key={d.sn}>
                    <td className="text-center text-xs font-mono text-slate-600 tabular-nums">
                      {(safePage - 1) * itemsPerPage + i + 1}
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300">
                        {d.sn}
                      </span>
                      {d.device_name && (
                        <div className="text-xs text-slate-600 mt-1 font-medium">
                          {d.device_name}
                        </div>
                      )}
                    </td>
                    <td className="font-semibold text-slate-900">
                      {d.opd || (
                        <span className="text-slate-600 italic font-normal">Belum terikat</span>
                      )}
                    </td>
                    <td className="text-slate-700 text-xs">{d.lokasi || '-'}</td>
                    <td>
                      {d.verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs">
                          <CheckCircle size={13} aria-hidden="true" />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-red-800 border border-red-300 font-bold text-xs">
                          <XCircle size={13} aria-hidden="true" />
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </td>
                    <td className="text-xs font-semibold text-slate-700">
                      {d.registered_by_name || '-'}
                    </td>
                    <td className="text-xs text-slate-700 whitespace-nowrap font-mono tabular-nums">
                      {d.last_activity || 'Belum pernah'}
                    </td>
                    <td className="text-center">
                      {d.anti_spoofing_enabled !== false ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300"
                          title="Proteksi Anti-Spoofing aktif"
                        >
                          <Shield size={12} aria-hidden="true" />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300"
                          title="Proteksi Anti-Spoofing dinonaktifkan"
                        >
                          <ShieldOff size={12} aria-hidden="true" />
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </td>
                    <td className="text-center sticky right-0 bg-white border-l border-slate-200">
                      <div className="flex justify-center items-center gap-1.5">
                        {d.verified && d.opd && (
                          <button
                            type="button"
                            onClick={() => handleUnbind(d.sn)}
                            disabled={isSaving}
                            aria-label={`Lepas kaitan instansi perangkat ${d.sn}`}
                            title="Lepas kaitan dari OPD"
                            className="inline-flex items-center justify-center gap-1 min-h-[44px] px-3 py-2 text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 active:translate-y-px border border-amber-400 rounded-lg transition-all"
                          >
                            <Unlink size={13} aria-hidden="true" />
                            <span>Lepas Kaitan</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setEditModal({
                              sn: d.sn,
                              name: d.name || '',
                              nama_lokasi: d.lokasi || '',
                              opd_id: d.opd_id || '',
                              verified: d.verified,
                              anti_spoofing_enabled: d.anti_spoofing_enabled !== false,
                            })
                          }
                          aria-label={`Ubah konfigurasi perangkat ${d.sn}`}
                          title="Ubah Perangkat"
                          className="gov-icon-btn text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200"
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(d.sn)}
                          aria-label={`Hapus permanen perangkat ${d.sn}`}
                          title="Hapus Permanen"
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
          totalItems={filteredDevices.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
          unitLabel="perangkat"
        />
      </div>

      {/* Modal Ubah Perangkat */}
      {editModal && (
        <div
          className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setEditModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-edit-device-title"
            className="surface-modal w-full max-w-lg overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#0B1120] text-white flex justify-between items-center">
              <h3 id="modal-edit-device-title" className="text-base font-extrabold">
                Ubah Perangkat: <span className="font-mono text-sky-300">{editModal.sn}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditModal(null)}
                aria-label="Tutup dialog ubah perangkat"
                className="gov-icon-btn text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="edit-device-name"
                    className="text-xs font-bold text-slate-800 mb-1.5 block"
                  >
                    Nama Perangkat
                  </label>
                  <input
                    id="edit-device-name"
                    type="text"
                    value={editModal.name}
                    onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                    className="gov-input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-device-lokasi"
                    className="text-xs font-bold text-slate-800 mb-1.5 block"
                  >
                    Lokasi Penempatan
                  </label>
                  <input
                    id="edit-device-lokasi"
                    type="text"
                    value={editModal.nama_lokasi}
                    onChange={(e) => setEditModal({ ...editModal, nama_lokasi: e.target.value })}
                    className="gov-input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-device-opd"
                    className="text-xs font-bold text-slate-800 mb-1.5 block"
                  >
                    Instansi OPD
                  </label>
                  <select
                    id="edit-device-opd"
                    value={editModal.opd_id}
                    onChange={(e) => setEditModal({ ...editModal, opd_id: e.target.value })}
                    className="gov-select"
                  >
                    <option value="">Belum Terikat OPD</option>
                    {opds.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2.5 min-h-[44px] px-3 py-2 w-full rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 select-none">
                    <input
                      type="checkbox"
                      checked={editModal.verified}
                      onChange={(e) => setEditModal({ ...editModal, verified: e.target.checked })}
                      className="w-4 h-4 rounded accent-blue-700 shrink-0"
                    />
                    <span className="text-xs font-bold text-slate-900">
                      Status Terverifikasi (Aktif)
                    </span>
                  </label>
                </div>
              </div>

              {/* Sakelar Anti-Spoofing Aksesibel */}
              <div
                className={`rounded-xl border p-4 ${
                  editModal.anti_spoofing_enabled
                    ? 'border-emerald-300 bg-emerald-50/70'
                    : 'border-amber-400 bg-amber-50/80'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-lg border shrink-0 ${
                        editModal.anti_spoofing_enabled
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                          : 'bg-amber-100 border-amber-300 text-amber-900'
                      }`}
                    >
                      {editModal.anti_spoofing_enabled ? (
                        <Shield size={20} aria-hidden="true" />
                      ) : (
                        <ShieldOff size={20} aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Proteksi Keaslian Wajah (Anti-Spoofing)
                      </h4>
                      <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                        Analisis multi-bingkai untuk menolak percobaan kecurangan menggunakan foto cetak maupun layar gawai.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={editModal.anti_spoofing_enabled}
                    aria-label="Aktifkan proteksi keaslian wajah Anti-Spoofing"
                    onClick={() =>
                      setEditModal({
                        ...editModal,
                        anti_spoofing_enabled: !editModal.anti_spoofing_enabled,
                      })
                    }
                    className="min-h-[44px] min-w-[56px] inline-flex items-center justify-center p-1 shrink-0 rounded-lg"
                  >
                    <span
                      className={`relative inline-block w-12 h-7 rounded-full border transition-colors ${
                        editModal.anti_spoofing_enabled
                          ? 'bg-emerald-700 border-emerald-800'
                          : 'bg-slate-500 border-slate-600'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${
                          editModal.anti_spoofing_enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </span>
                  </button>
                </div>

                <p
                  className={`mt-2.5 text-xs font-bold ${
                    editModal.anti_spoofing_enabled ? 'text-emerald-900' : 'text-amber-950'
                  }`}
                >
                  {editModal.anti_spoofing_enabled
                    ? 'Proteksi keaslian wajah aktif: perangkat terlindungi dari serangan pemalsuan foto atau layar.'
                    : 'Perhatian: Pemeriksaan keaslian wajah dimatikan khusus pada perangkat ini.'}
                </p>
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

export default DevicePage;
