import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import {
  CalendarDays,
  Plus,
  Trash2,
  X,
  MapPin,
  Users,
  Building2,
  Globe,
  Search,
  Loader2,
  Navigation,
  ShieldCheck,
} from 'lucide-react';
import API_BASE from '../config/api';
import {
  useModalEscape,
  ErrorBanner,
  TableLoadingRow,
  TableErrorRow,
  notifyAlert,
  confirmAction,
} from '../components/UiFeedback';

// Fix Leaflet default marker icon (Vite bundler)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [-6.2088, 106.8456];

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
});

const MapController = ({ position, radius, onMapClick }) => {
  const map = useMap();

  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
      map.flyTo([e.latlng.lat, e.latlng.lng], map.getZoom());
    },
  });

  useEffect(() => {
    if (position[0] !== 0 && position[1] !== 0) {
      map.flyTo(position, 16, { duration: 0.8 });
    }
  }, [position, map]);

  return (
    <>
      <Marker
        position={position}
        draggable
        eventHandlers={{
          dragend(e) {
            const { lat, lng } = e.target.getLatLng();
            onMapClick(lat, lng);
          },
        }}
      />
      {radius > 0 && (
        <Circle
          center={position}
          radius={radius}
          pathOptions={{ color: '#1D4ED8', fillColor: '#1D4ED8', fillOpacity: 0.12, weight: 2 }}
        />
      )}
    </>
  );
};

const JadwalKegiatan = () => {
  const userRole = localStorage.getItem('user_role');
  const isSuperAdmin = userRole === 'super_admin';

  const [activeTab, setActiveTab] = useState('global'); // 'global' | 'internal'
  const [kegiatanList, setKegiatanList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Creation Modal State
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nama_kegiatan: '',
    keterangan: '',
    alamat_lokasi: '',
    latitude_target: '',
    longitude_target: '',
    radius_toleransi: 100,
    tanggal_mulai: '',
    tanggal_selesai: '',
    jam_mulai: '',
    jam_selesai: '',
  });
  const [isGeocoding, setIsGeocoding] = useState(false);

  // OPD Invitation State
  const [opdList, setOpdList] = useState([]);
  const [selectedOpdIds, setSelectedOpdIds] = useState([]);
  const [opdSearch, setOpdSearch] = useState('');
  const [isLoadingOpd, setIsLoadingOpd] = useState(false);
  const [opdError, setOpdError] = useState('');
  const [isGlobalToggle, setIsGlobalToggle] = useState(false);

  const resetForm = useCallback(() => {
    setShowForm(false);
    setFormData({
      nama_kegiatan: '',
      keterangan: '',
      alamat_lokasi: '',
      latitude_target: '',
      longitude_target: '',
      radius_toleransi: 100,
      tanggal_mulai: '',
      tanggal_selesai: '',
      jam_mulai: '',
      jam_selesai: '',
    });
    setSelectedOpdIds([]);
    setOpdSearch('');
  }, []);

  useModalEscape(showForm, resetForm);

  const formatDate = (d) => {
    if (!d) return '-';
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const fetchKegiatan = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.get(`${API_BASE}/kegiatan`, getAuthHeaders());
      setKegiatanList(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil data kegiatan:', err);
      setErrorMsg(err.response?.data?.error || 'Tidak dapat memuat daftar jadwal kegiatan dari server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKegiatan();
  }, [fetchKegiatan]);

  const fetchOpdList = useCallback(async () => {
    setIsLoadingOpd(true);
    setOpdError('');
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.get(`${API_BASE}/opd?scope=global`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setOpdList(data);
      } else {
        setOpdList([]);
      }
    } catch (err) {
      console.error('Gagal mengambil daftar OPD:', err);
      setOpdList([]);
      setOpdError('Daftar instansi OPD tidak dapat dimuat.');
    } finally {
      setIsLoadingOpd(false);
    }
  }, []);

  useEffect(() => {
    if (showForm) {
      fetchOpdList();
    }
  }, [showForm, fetchOpdList]);

  const openCreationModal = () => {
    setFormData({
      nama_kegiatan: '',
      keterangan: '',
      alamat_lokasi: '',
      latitude_target: '',
      longitude_target: '',
      radius_toleransi: 100,
      tanggal_mulai: '',
      tanggal_selesai: '',
      jam_mulai: '',
      jam_selesai: '',
    });
    setIsGlobalToggle(isSuperAdmin);
    setSelectedOpdIds([]);
    setOpdSearch('');
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  };

  const handleMapInteraction = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude_target: parseFloat(lat.toFixed(6)),
      longitude_target: parseFloat(lng.toFixed(6)),
    }));
  };

  const handleGeocode = async () => {
    const alamat = formData.alamat_lokasi.trim();
    if (!alamat) {
      return notifyAlert({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Masukkan alamat lokasi terlebih dahulu.',
      });
    }
    setIsGeocoding(true);
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(alamat)}&limit=1`
      );
      if (res.data && res.data.length > 0) {
        const { lat, lon } = res.data[0];
        setFormData((prev) => ({
          ...prev,
          latitude_target: parseFloat(parseFloat(lat).toFixed(6)),
          longitude_target: parseFloat(parseFloat(lon).toFixed(6)),
        }));
      } else {
        notifyAlert({
          icon: 'info',
          title: 'Lokasi Tidak Ditemukan',
          text: 'Alamat tidak ditemukan pada peta OpenStreetMap. Silakan klik titik koordinat secara langsung di peta.',
        });
      }
    } catch (err) {
      notifyAlert({ icon: 'error', title: 'Gagal Pencarian Alamat', text: err.message });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleToggleOpd = (opdId) => {
    setSelectedOpdIds((prev) =>
      prev.includes(opdId) ? prev.filter((id) => id !== opdId) : [...prev, opdId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama_kegiatan.trim()) {
      return notifyAlert({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Nama kegiatan wajib diisi.',
      });
    }
    if (!formData.tanggal_mulai || !formData.tanggal_selesai) {
      return notifyAlert({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Tanggal mulai dan tanggal selesai wajib diisi.',
      });
    }
    if (!isGlobalToggle && selectedOpdIds.length === 0) {
      return notifyAlert({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Pilih minimal satu instansi OPD yang diundang.',
      });
    }

    setIsSubmitting(true);
    try {
      const payload = {
        nama_kegiatan: formData.nama_kegiatan.trim(),
        keterangan: formData.keterangan.trim(),
        alamat_lokasi: formData.alamat_lokasi.trim(),
        latitude_target:
          formData.latitude_target !== '' ? Number(formData.latitude_target) : null,
        longitude_target:
          formData.longitude_target !== '' ? Number(formData.longitude_target) : null,
        radius_toleransi: Number(formData.radius_toleransi) || 100,
        tanggal_mulai: formData.tanggal_mulai,
        tanggal_selesai: formData.tanggal_selesai,
        jam_mulai: formData.jam_mulai || null,
        jam_selesai: formData.jam_selesai || null,
        is_global: isGlobalToggle,
        invited_opd_ids: isGlobalToggle ? [] : selectedOpdIds,
      };
      await axios.post(`${API_BASE}/kegiatan`, payload, getAuthHeaders());
      notifyAlert({
        icon: 'success',
        title: 'Berhasil',
        text: 'Jadwal kegiatan berhasil ditambahkan.',
        timer: 1800,
      });
      resetForm();
      fetchKegiatan();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Menambahkan',
        text: err.response?.data?.error || err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, nama) => {
    const ok = await confirmAction({
      title: 'Hapus Jadwal Kegiatan?',
      text: `Kegiatan "${nama}" akan dihapus secara permanen dari jadwal.`,
      confirmText: 'Ya, Hapus',
    });
    if (!ok) return;
    try {
      await axios.delete(`${API_BASE}/kegiatan/${id}`, getAuthHeaders());
      notifyAlert({
        icon: 'success',
        title: 'Terhapus',
        text: 'Jadwal kegiatan berhasil dihapus.',
        timer: 1500,
      });
      fetchKegiatan();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Menghapus',
        text: err.response?.data?.error || err.message,
      });
    }
  };

  const filteredOpdList = opdList.filter((o) => {
    const nama = (o.nama_opd || o.nama || '').toLowerCase();
    const kode = (o.kode_opd || o.kode || '').toLowerCase();
    const search = opdSearch.toLowerCase();
    return nama.includes(search) || kode.includes(search);
  });

  const mapPosition = [
    formData.latitude_target !== '' ? Number(formData.latitude_target) : DEFAULT_CENTER[0],
    formData.longitude_target !== '' ? Number(formData.longitude_target) : DEFAULT_CENTER[1],
  ];

  const globalEvents = kegiatanList.filter((k) => k.is_global === true);
  const internalEvents = kegiatanList.filter((k) => k.is_global !== true);
  const activeEvents = activeTab === 'global' ? globalEvents : internalEvents;

  return (
    <div className="space-y-5">
      {/* Header & Kontrol Tab */}
      <div className="surface-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <CalendarDays size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Jadwal Kegiatan Luar Kantor ({kegiatanList.length})
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Kelola jadwal kegiatan dinas luar dan area geofencing{' '}
              {isSuperAdmin ? 'seluruh OPD Pemerintah Daerah' : 'instansi OPD Anda'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            role="tablist"
            aria-label="Cakupan Jadwal Kegiatan"
            className="inline-flex flex-wrap gap-1.5 bg-slate-100 border border-slate-300 p-1 rounded-lg"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'global'}
              onClick={() => setActiveTab('global')}
              className={`inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-md text-xs font-bold transition-all active:translate-y-px ${
                activeTab === 'global'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Globe size={15} aria-hidden="true" />
              <span>Lintas OPD</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold tabular-nums ${
                  activeTab === 'global'
                    ? 'bg-blue-900 text-white'
                    : 'bg-white text-slate-700 border border-slate-300'
                }`}
              >
                {globalEvents.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'internal'}
              onClick={() => setActiveTab('internal')}
              className={`inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-md text-xs font-bold transition-all active:translate-y-px ${
                activeTab === 'internal'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Building2 size={15} aria-hidden="true" />
              <span>Internal OPD</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold tabular-nums ${
                  activeTab === 'internal'
                    ? 'bg-blue-900 text-white'
                    : 'bg-white text-slate-700 border border-slate-300'
                }`}
              >
                {internalEvents.length}
              </span>
            </button>
          </div>

          {activeTab === 'internal' && !isSuperAdmin && (
            <button type="button" onClick={openCreationModal} className="gov-btn-primary text-xs">
              <Plus size={16} aria-hidden="true" />
              <span>Tambah Kegiatan Internal</span>
            </button>
          )}
          {activeTab === 'global' && isSuperAdmin && (
            <button type="button" onClick={openCreationModal} className="gov-btn-primary text-xs">
              <Plus size={16} aria-hidden="true" />
              <span>Buat Kegiatan Global</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabel Data Jadwal Kegiatan */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">No</th>
                <th className="px-4 py-3.5">Nama dan Lokasi Kegiatan</th>
                <th className="px-4 py-3.5">Jadwal dan Radius</th>
                <th className="px-4 py-3.5 text-center">Cakupan dan Kehadiran</th>
                <th className="px-4 py-3.5 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-800">
              {isLoading ? (
                <TableLoadingRow colSpan={5} label="Memuat jadwal kegiatan dinas luar..." />
              ) : errorMsg ? (
                <TableErrorRow colSpan={5} message={errorMsg} onRetry={fetchKegiatan} />
              ) : activeEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 px-4">
                    <div className="flex flex-col items-center gap-2.5 max-w-md mx-auto">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600">
                        <CalendarDays size={22} aria-hidden="true" />
                      </div>
                      <p className="text-sm font-bold text-slate-900">
                        {activeTab === 'global'
                          ? 'Belum Ada Kegiatan Lintas OPD'
                          : 'Belum Ada Kegiatan Internal OPD'}
                      </p>
                      <p className="text-xs text-slate-600">
                        {activeTab === 'global'
                          ? 'Kegiatan global yang dijadwalkan untuk seluruh instansi akan tampil di tabel ini.'
                          : 'Jadwalkan kegiatan dinas luar internal agar pegawai dapat melakukan presensi berbasis lokasi.'}
                      </p>
                      {activeTab === 'internal' && !isSuperAdmin && (
                        <button
                          type="button"
                          onClick={openCreationModal}
                          className="gov-btn-primary text-xs mt-1"
                        >
                          <Plus size={15} aria-hidden="true" />
                          <span>Tambah Kegiatan Internal Pertama</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                activeEvents.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 text-center text-slate-600 font-mono text-xs tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 text-sm block">
                        {row.nama_kegiatan}
                      </span>
                      {row.keterangan && (
                        <span className="text-xs text-slate-600 block mt-0.5 line-clamp-2">
                          {row.keterangan}
                        </span>
                      )}
                      {row.alamat_lokasi && (
                        <span className="text-xs text-slate-700 flex items-center gap-1.5 mt-1">
                          <MapPin size={12} className="text-blue-700 shrink-0" aria-hidden="true" />
                          <span>{row.alamat_lokasi}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-semibold text-slate-900">
                        {formatDate(row.tanggal_mulai)}
                      </div>
                      <div className="text-xs text-slate-600">
                        s.d. {formatDate(row.tanggal_selesai)}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {(row.jam_mulai || row.jam_selesai) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300 tabular-nums">
                            {row.jam_mulai || '-'} s.d. {row.jam_selesai || '-'}
                          </span>
                        )}
                        {row.radius_toleransi && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-300 tabular-nums">
                            Radius {row.radius_toleransi} m
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                          row.is_global
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-amber-50 text-amber-900 border-amber-300'
                        }`}
                      >
                        <Building2 size={12} aria-hidden="true" />
                        <span>
                          {row.is_global ? 'Semua OPD' : `${row.jumlah_opd_diundang ?? 0} OPD`}
                        </span>
                      </span>
                      <span className="block mt-1.5 text-xs text-emerald-800 font-bold tabular-nums">
                        <Users size={12} className="inline mr-1" aria-hidden="true" />
                        {row.jumlah_hadir ?? 0} Hadir
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center">
                        {((activeTab === 'global' && isSuperAdmin) ||
                          (activeTab === 'internal' && !isSuperAdmin)) && (
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id, row.nama_kegiatan)}
                            aria-label={`Hapus kegiatan ${row.nama_kegiatan}`}
                            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200 active:translate-y-px rounded-lg transition-all border border-red-300"
                          >
                            <Trash2 size={14} aria-hidden="true" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PEMBUATAN JADWAL KEGIATAN */}
      {showForm && (
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center bg-slate-900/60 overflow-y-auto py-6 px-4"
          onClick={resetForm}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-kegiatan-title"
            className="surface-modal w-full max-w-3xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h2 id="modal-kegiatan-title" className="text-base font-extrabold flex items-center gap-2.5">
                {isSuperAdmin ? (
                  <>
                    <Globe size={18} aria-hidden="true" />
                    <span>Buat Kegiatan Global Lintas OPD</span>
                  </>
                ) : (
                  <>
                    <Building2 size={18} aria-hidden="true" />
                    <span>Buat Kegiatan Internal OPD</span>
                  </>
                )}
              </h2>
              <button
                type="button"
                onClick={resetForm}
                aria-label="Tutup formulir kegiatan"
                className="gov-icon-btn text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="kegiatan-nama"
                  className="block text-xs font-bold text-slate-800 mb-1.5"
                >
                  Nama Kegiatan <span className="text-red-700">*</span>
                </label>
                <input
                  id="kegiatan-nama"
                  type="text"
                  name="nama_kegiatan"
                  value={formData.nama_kegiatan}
                  onChange={handleInputChange}
                  placeholder={
                    isSuperAdmin
                      ? 'Contoh: Apel Gabungan ASN Pemerintah Daerah'
                      : 'Contoh: Rapat Koordinasi Dinas'
                  }
                  className="gov-input"
                />
              </div>

              <div>
                <label
                  htmlFor="kegiatan-ket"
                  className="block text-xs font-bold text-slate-800 mb-1.5"
                >
                  Keterangan Kegiatan
                </label>
                <textarea
                  id="kegiatan-ket"
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Tuliskan deskripsi singkat atau instruksi pakaian dinas..."
                  className="gov-input resize-none"
                />
              </div>

              {/* Tanggal (Responsif Mobile 1 Kolom -> Tablet 2 Kolom) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="kegiatan-tgl-mulai"
                    className="block text-xs font-bold text-slate-800 mb-1.5"
                  >
                    Tanggal Mulai <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="kegiatan-tgl-mulai"
                    type="date"
                    name="tanggal_mulai"
                    value={formData.tanggal_mulai}
                    onChange={handleInputChange}
                    className="gov-input font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label
                    htmlFor="kegiatan-tgl-selesai"
                    className="block text-xs font-bold text-slate-800 mb-1.5"
                  >
                    Tanggal Selesai <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="kegiatan-tgl-selesai"
                    type="date"
                    name="tanggal_selesai"
                    value={formData.tanggal_selesai}
                    onChange={handleInputChange}
                    className="gov-input font-mono tabular-nums"
                  />
                </div>
              </div>

              {/* Batas Jam */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="kegiatan-jam-mulai"
                    className="block text-xs font-bold text-slate-800 mb-1.5"
                  >
                    Jam Mulai
                  </label>
                  <input
                    id="kegiatan-jam-mulai"
                    type="time"
                    name="jam_mulai"
                    value={formData.jam_mulai}
                    onChange={handleInputChange}
                    className="gov-input font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label
                    htmlFor="kegiatan-jam-selesai"
                    className="block text-xs font-bold text-slate-800 mb-1.5"
                  >
                    Jam Selesai
                  </label>
                  <input
                    id="kegiatan-jam-selesai"
                    type="time"
                    name="jam_selesai"
                    value={formData.jam_selesai}
                    onChange={handleInputChange}
                    className="gov-input font-mono tabular-nums"
                  />
                </div>
              </div>

              {/* Seksi A: Geofencing Peta Lokasi */}
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <p className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={15} className="text-blue-700" aria-hidden="true" />
                    <span>Geofencing: Peta Lokasi Kegiatan</span>
                  </p>
                  <span className="text-xs text-slate-600">
                    Klik pada peta atau geser pin untuk menentukan koordinat
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="flex-1">
                    <label htmlFor="kegiatan-alamat" className="sr-only">
                      Alamat Lokasi Kegiatan
                    </label>
                    <input
                      id="kegiatan-alamat"
                      type="text"
                      name="alamat_lokasi"
                      value={formData.alamat_lokasi}
                      onChange={handleInputChange}
                      placeholder="Ketik alamat lokasi (contoh: Pusat Pemerintahan Tigaraksa)..."
                      className="gov-input"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGeocode}
                    disabled={isGeocoding}
                    className="gov-btn-primary text-xs shrink-0"
                  >
                    {isGeocoding ? (
                      <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Navigation size={15} aria-hidden="true" />
                    )}
                    <span>Cari Alamat</span>
                  </button>
                </div>

                <div
                  className="rounded-lg overflow-hidden border border-slate-400 relative z-0"
                  style={{ height: 220 }}
                >
                  <MapContainer
                    center={mapPosition}
                    zoom={15}
                    scrollWheelZoom
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapController
                      position={mapPosition}
                      radius={Number(formData.radius_toleransi) || 100}
                      onMapClick={handleMapInteraction}
                    />
                  </MapContainer>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="kegiatan-lat"
                      className="block text-xs font-bold text-slate-800 mb-1"
                    >
                      Latitude
                    </label>
                    <input
                      id="kegiatan-lat"
                      type="number"
                      step="any"
                      name="latitude_target"
                      value={formData.latitude_target}
                      onChange={handleNumberChange}
                      placeholder="-6.2088"
                      className="gov-input font-mono text-xs tabular-nums"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="kegiatan-lng"
                      className="block text-xs font-bold text-slate-800 mb-1"
                    >
                      Longitude
                    </label>
                    <input
                      id="kegiatan-lng"
                      type="number"
                      step="any"
                      name="longitude_target"
                      value={formData.longitude_target}
                      onChange={handleNumberChange}
                      placeholder="106.8456"
                      className="gov-input font-mono text-xs tabular-nums"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="kegiatan-radius"
                      className="block text-xs font-bold text-slate-800 mb-1"
                    >
                      Radius Toleransi (meter)
                    </label>
                    <input
                      id="kegiatan-radius"
                      type="number"
                      name="radius_toleransi"
                      value={formData.radius_toleransi}
                      onChange={handleNumberChange}
                      min={10}
                      className="gov-input font-mono text-xs tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Seksi B: Undangan OPD (Khusus Admin OPD) */}
              {!isSuperAdmin && (
                <div className="space-y-3">
                  <p className="block text-xs font-bold text-slate-800">
                    Cakupan Undangan Instansi OPD
                  </p>

                  <div className="p-1 bg-slate-100 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-1 border border-slate-300">
                    <button
                      type="button"
                      aria-pressed={isGlobalToggle}
                      onClick={() => setIsGlobalToggle(true)}
                      className={`flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-md text-xs font-bold transition-all active:translate-y-px ${
                        isGlobalToggle
                          ? 'bg-blue-700 text-white'
                          : 'text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Globe size={15} aria-hidden="true" />
                      <span>Semua OPD (Global)</span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={!isGlobalToggle}
                      onClick={() => setIsGlobalToggle(false)}
                      className={`flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-md text-xs font-bold transition-all active:translate-y-px ${
                        !isGlobalToggle
                          ? 'bg-blue-700 text-white'
                          : 'text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Building2 size={15} aria-hidden="true" />
                      <span>Pilih OPD Tertentu</span>
                      {!isGlobalToggle && selectedOpdIds.length > 0 && (
                        <span className="px-1.5 py-0.5 text-[11px] font-mono font-bold bg-blue-900 text-white rounded tabular-nums">
                          {selectedOpdIds.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {!isGlobalToggle && (
                    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white">
                      <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2.5">
                        <div>
                          <label htmlFor="opd-invite-search" className="sr-only">
                            Cari Nama atau Kode OPD
                          </label>
                          <div className="relative">
                            <Search
                              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                              size={15}
                              aria-hidden="true"
                            />
                            <input
                              id="opd-invite-search"
                              type="text"
                              placeholder="Cari nama atau kode OPD..."
                              value={opdSearch}
                              onChange={(e) => setOpdSearch(e.target.value)}
                              className="gov-input pl-9 text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs text-slate-700 tabular-nums">
                            Terpilih: <b className="text-blue-800">{selectedOpdIds.length}</b> dari{' '}
                            {filteredOpdList.length} OPD
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedOpdIds(filteredOpdList.map((o) => o.id))}
                              className="min-h-[44px] px-3 py-1.5 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors"
                            >
                              Pilih Semua
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedOpdIds([])}
                              className="min-h-[44px] px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-400 rounded-lg transition-colors"
                            >
                              Reset Pilihan
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-2">
                        <ErrorBanner message={opdError} onRetry={fetchOpdList} />
                      </div>

                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-200">
                        {isLoadingOpd ? (
                          <div
                            className="flex flex-col items-center justify-center py-10 gap-2 text-slate-700"
                            role="status"
                          >
                            <Loader2
                              size={20}
                              className="animate-spin text-blue-700"
                              aria-hidden="true"
                            />
                            <span className="text-xs font-semibold">Memuat daftar OPD...</span>
                          </div>
                        ) : filteredOpdList.length > 0 ? (
                          filteredOpdList.map((o) => {
                            const isSel = selectedOpdIds.includes(o.id);
                            return (
                              <label
                                key={o.id}
                                className={`flex items-center justify-between gap-3 min-h-[44px] px-3.5 py-2 transition-colors ${
                                  isSel ? 'bg-blue-50' : 'hover:bg-slate-50'
                                }`}
                              >
                                <span className="flex items-center gap-3 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isSel}
                                    onChange={() => handleToggleOpd(o.id)}
                                    className="w-4 h-4 rounded accent-blue-700 shrink-0"
                                  />
                                  <span
                                    className={`text-xs truncate ${
                                      isSel
                                        ? 'text-blue-950 font-bold'
                                        : 'text-slate-800 font-medium'
                                    }`}
                                  >
                                    {o.nama_opd || o.nama}
                                  </span>
                                </span>
                                <span className="font-mono text-[11px] text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded shrink-0">
                                  {o.kode_opd || o.kode || '-'}
                                </span>
                              </label>
                            );
                          })
                        ) : (
                          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                            <Building2
                              size={22}
                              className="text-slate-600 mb-2"
                              aria-hidden="true"
                            />
                            <p className="text-xs font-bold text-slate-900">
                              Instansi OPD Tidak Ditemukan
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {opdSearch
                                ? `Tidak ada hasil pencarian untuk "${opdSearch}".`
                                : 'Data instansi OPD belum tersedia.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {isGlobalToggle && (
                    <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 border border-blue-200 text-blue-800 flex items-center justify-center shrink-0">
                        <ShieldCheck size={18} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-950">
                          Kegiatan Global (Seluruh OPD)
                        </p>
                        <p className="text-xs text-blue-900 mt-0.5 leading-relaxed">
                          Seluruh personel ASN dan Non-ASN dari semua instansi OPD yang terdaftar dapat melakukan presensi pada kegiatan ini.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tombol Simpan / Batal */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button type="button" onClick={resetForm} className="gov-btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="gov-btn-primary">
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={15} aria-hidden="true" />
                      <span>Simpan Kegiatan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JadwalKegiatan;
