import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  CalendarDays, Plus, Trash2, X, MapPin, Users, Building2, Globe,
  Search, Loader2, Navigation, CheckSquare, Square, UserPlus, ShieldCheck
} from 'lucide-react';

// Fix Leaflet default marker icon (webpack/vite bundler issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const API_BASE = 'http://127.0.0.1:5000/api';
const DEFAULT_CENTER = [-6.2088, 106.8456];

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
});

// =====================================================================
// SUB-COMPONENT: Map Interaction Layer (inside MapContainer)
// =====================================================================
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
      map.flyTo(position, 16, { duration: 1.2 });
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
          pathOptions={{ color: '#0057A4', fillColor: '#0057A4', fillOpacity: 0.1, weight: 2 }}
        />
      )}
    </>
  );
};

// =====================================================================
// MAIN PAGE COMPONENT
// =====================================================================
const JadwalKegiatan = () => {
  const userRole = localStorage.getItem('user_role');
  const isSuperAdmin = userRole === 'super_admin';

  // === Tab State ===
  const [activeTab, setActiveTab] = useState('global'); // 'global' | 'internal'

  // === Data State ===
  const [kegiatanList, setKegiatanList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // === Creation Modal State ===
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nama_kegiatan: '', keterangan: '', alamat_lokasi: '',
    latitude_target: '', longitude_target: '', radius_toleransi: 100,
    tanggal_mulai: '', tanggal_selesai: '',
    jam_mulai: '', jam_selesai: '',
  });
  const [isGeocoding, setIsGeocoding] = useState(false);

  // === OPD Invitation State (replaces legacy NIP assignment) ===
  const [opdList, setOpdList] = useState([]);
  const [selectedOpdIds, setSelectedOpdIds] = useState([]);
  const [opdSearch, setOpdSearch] = useState('');
  const [isLoadingOpd, setIsLoadingOpd] = useState(false);
  const [isGlobalToggle, setIsGlobalToggle] = useState(false);

  // === Helpers ===
  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return d; }
  };

  // === API: Fetch Kegiatan ===
  const fetchKegiatan = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/kegiatan`, getAuthHeaders());
      setKegiatanList(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil data kegiatan:', err);
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchKegiatan(); }, [fetchKegiatan]);

  // === API: Fetch OPD list (for invitation multi-select) ===
  const fetchOpdList = useCallback(async () => {
    setIsLoadingOpd(true);
    try {
      const res = await axios.get(`${API_BASE}/opd`, getAuthHeaders());
      setOpdList(Array.isArray(res.data) ? res.data : []);
    } catch { setOpdList([]); }
    finally { setIsLoadingOpd(false); }
  }, []);

  // ─────────────────────────────────
  // CREATION MODAL LOGIC
  // ─────────────────────────────────
  const openCreationModal = () => {
    setFormData({
      nama_kegiatan: '', keterangan: '', alamat_lokasi: '',
      latitude_target: '', longitude_target: '', radius_toleransi: 100,
      tanggal_mulai: '', tanggal_selesai: '',
      jam_mulai: '', jam_selesai: '',
    });
    setIsGlobalToggle(isSuperAdmin);
    setSelectedOpdIds([]);
    setOpdSearch('');
    setShowForm(true);
    fetchOpdList();
  };

  const resetForm = () => {
    setShowForm(false);
    setFormData({
      nama_kegiatan: '', keterangan: '', alamat_lokasi: '',
      latitude_target: '', longitude_target: '', radius_toleransi: 100,
      tanggal_mulai: '', tanggal_selesai: '',
      jam_mulai: '', jam_selesai: '',
    });
    setSelectedOpdIds([]);
    setOpdSearch('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  };

  const handleMapInteraction = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude_target: parseFloat(lat.toFixed(6)),
      longitude_target: parseFloat(lng.toFixed(6)),
    }));
  };

  const handleGeocode = async () => {
    const alamat = formData.alamat_lokasi.trim();
    if (!alamat) {
      return Swal.fire({ icon: 'warning', title: 'Peringatan', text: 'Masukkan alamat lokasi terlebih dahulu.' });
    }
    setIsGeocoding(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(alamat)}&limit=1`);
      if (res.data && res.data.length > 0) {
        const { lat, lon } = res.data[0];
        setFormData(prev => ({
          ...prev,
          latitude_target: parseFloat(parseFloat(lat).toFixed(6)),
          longitude_target: parseFloat(parseFloat(lon).toFixed(6)),
        }));
      } else {
        Swal.fire({ icon: 'info', title: 'Tidak Ditemukan', text: 'Alamat tidak ditemukan.' });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal Geocoding', text: err.message });
    } finally { setIsGeocoding(false); }
  };

  // OPD toggle
  const handleToggleOpd = (opdId) => {
    setSelectedOpdIds(prev =>
      prev.includes(opdId) ? prev.filter(id => id !== opdId) : [...prev, opdId]
    );
  };

  // Submit creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama_kegiatan.trim()) {
      return Swal.fire({ icon: 'warning', title: 'Peringatan', text: 'Nama kegiatan wajib diisi.' });
    }
    if (!formData.tanggal_mulai || !formData.tanggal_selesai) {
      return Swal.fire({ icon: 'warning', title: 'Peringatan', text: 'Tanggal mulai dan selesai wajib diisi.' });
    }
    if (!isGlobalToggle && selectedOpdIds.length === 0) {
      return Swal.fire({ icon: 'warning', title: 'Peringatan', text: 'Pilih minimal satu OPD yang diundang.' });
    }

    setIsSubmitting(true);
    try {
      const payload = {
        nama_kegiatan: formData.nama_kegiatan.trim(),
        keterangan: formData.keterangan.trim(),
        alamat_lokasi: formData.alamat_lokasi.trim(),
        latitude_target: formData.latitude_target !== '' ? Number(formData.latitude_target) : null,
        longitude_target: formData.longitude_target !== '' ? Number(formData.longitude_target) : null,
        radius_toleransi: Number(formData.radius_toleransi) || 100,
        tanggal_mulai: formData.tanggal_mulai,
        tanggal_selesai: formData.tanggal_selesai,
        jam_mulai: formData.jam_mulai || null,
        jam_selesai: formData.jam_selesai || null,
        is_global: isGlobalToggle,
        invited_opd_ids: isGlobalToggle ? [] : selectedOpdIds,
      };
      await axios.post(`${API_BASE}/kegiatan`, payload, getAuthHeaders());
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Kegiatan berhasil ditambahkan.', timer: 2000, showConfirmButton: false });
      resetForm();
      fetchKegiatan();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal Menambahkan', text: err.response?.data?.error || err.message });
    } finally { setIsSubmitting(false); }
  };

  // === Delete ===
  const handleDelete = async (id, nama) => {
    const result = await Swal.fire({
      icon: 'warning', title: 'Hapus Kegiatan?', text: `"${nama}" akan dihapus permanen.`,
      showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`${API_BASE}/kegiatan/${id}`, getAuthHeaders());
      Swal.fire({ icon: 'success', title: 'Terhapus', timer: 1500, showConfirmButton: false });
      fetchKegiatan();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal Menghapus', text: err.response?.data?.error || err.message });
    }
  };

  // === Filtered OPD list ===
  const filteredOpdList = opdList.filter(o =>
    o.nama_opd?.toLowerCase().includes(opdSearch.toLowerCase()) ||
    o.kode_opd?.toLowerCase().includes(opdSearch.toLowerCase())
  );

  // Map position
  const mapPosition = [
    formData.latitude_target !== '' ? Number(formData.latitude_target) : DEFAULT_CENTER[0],
    formData.longitude_target !== '' ? Number(formData.longitude_target) : DEFAULT_CENTER[1],
  ];

  // Split data by scope for tabs
  const globalEvents = kegiatanList.filter(k => k.is_global === true);
  const internalEvents = kegiatanList.filter(k => k.is_global !== true);












  // =====================================================================
  // RENDER
  // =====================================================================
  return (
    <main className="p-8 w-full h-full">
      {/* ── Header ── */}
      <div className="border-b-2 border-gray-300 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <CalendarDays size={32} className="text-[#0057A4]" />
            Jadwal Kegiatan
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola jadwal kegiatan luar kantor & geofencing {isSuperAdmin ? 'seluruh OPD' : 'OPD Anda'}.
          </p>
        </div>
        {/* Top action button - contextual to active tab */}
        {activeTab === 'internal' && !isSuperAdmin && (
          <button onClick={openCreationModal}
            className="flex items-center gap-2 bg-[#005bb5] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
            <Plus size={18} /> Tambah Kegiatan Internal
          </button>
        )}
        {activeTab === 'global' && isSuperAdmin && (
          <button onClick={openCreationModal}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
            <Globe size={18} /> Buat Kegiatan Global
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('global')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'global'
              ? 'bg-white text-purple-700 shadow-sm ring-1 ring-purple-200'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}>
          <Globe size={16} />
          Undangan Lintas OPD (Global)
          <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'global' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-500'
          }`}>{globalEvents.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('internal')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'internal'
              ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}>
          <Building2 size={16} />
          Kegiatan Internal
          <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'internal' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
          }`}>{internalEvents.length}</span>
        </button>
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-4 w-10">#</th>
                <th className="px-4 py-4">Nama Kegiatan</th>
                <th className="px-4 py-4">Waktu</th>
                <th className="px-4 py-4 text-center">Peserta Terdaftar</th>
                <th className="px-4 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-gray-400 text-sm">Memuat data...</span>
                  </div>
                </td></tr>
              ) : (
                (() => {
                  const list = activeTab === 'global' ? globalEvents : internalEvents;
                  if (list.length === 0) {
                    return (
                      <tr><td colSpan="5" className="text-center py-16">
                        <div className="flex flex-col items-center gap-2">
                          <CalendarDays size={32} className="text-gray-300" />
                          <span className="text-gray-400">
                            {activeTab === 'global'
                              ? 'Belum ada undangan kegiatan lintas OPD.'
                              : 'Belum ada kegiatan internal.'}
                          </span>
                          {activeTab === 'internal' && !isSuperAdmin && (
                            <button onClick={openCreationModal} className="text-blue-500 text-sm hover:underline mt-1">
                              Tambah kegiatan internal pertama
                            </button>
                          )}
                        </div>
                      </td></tr>
                    );
                  }
                  return list.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-4 py-3.5 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-gray-800 text-sm block">{row.nama_kegiatan}</span>
                          {row.keterangan && <span className="text-[11px] text-gray-400 line-clamp-1">{row.keterangan}</span>}
                          {row.alamat_lokasi && (
                            <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin size={10} />{row.alamat_lokasi}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{formatDate(row.tanggal_mulai)}</div>
                          <div className="text-[11px] text-gray-400">s/d {formatDate(row.tanggal_selesai)}</div>
                          {(row.jam_mulai || row.jam_selesai) && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-600 ring-1 ring-sky-200">
                              {row.jam_mulai || '—'} - {row.jam_selesai || '—'}
                            </span>
                          )}
                          {row.radius_toleransi && (
                            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200">
                              {row.radius_toleransi} m
                            </span>
                          )}
                        </td>
                        {/* OPD & Kehadiran */}
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ring-1 ${
                            row.is_global
                              ? 'bg-purple-50 text-purple-700 ring-purple-200'
                              : 'bg-amber-50 text-amber-600 ring-amber-200'
                          }`}>
                            <Building2 size={11} /> {row.is_global ? 'Semua OPD' : `${row.jumlah_opd_diundang ?? 0} OPD`}
                          </span>
                          <span className="block mt-1 text-[10px] text-green-600 font-semibold">
                            <Users size={10} className="inline mr-0.5" />{row.jumlah_hadir ?? 0} Hadir
                          </span>
                        </td>
                        {/* Aksi */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {((activeTab === 'global' && isSuperAdmin) || (activeTab === 'internal' && !isSuperAdmin)) && (
                              <button onClick={() => handleDelete(row.id, row.nama_kegiatan)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition ring-1 ring-red-200">
                                <Trash2 size={13} /> Hapus
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                  ));
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          CREATION MODAL (Global or Internal)
         ══════════════════════════════════════════════ */}
      {showForm && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 overflow-y-auto py-6 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {isSuperAdmin
                  ? <><Globe size={20} className="text-purple-600" /> Buat Kegiatan Global</>
                  : <><Building2 size={20} className="text-emerald-600" /> Buat Kegiatan Internal</>}
              </h2>
              <button onClick={resetForm} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* ── Basic Info ── */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                  Nama Kegiatan <span className="text-red-500">*</span>
                </label>
                <input type="text" name="nama_kegiatan" value={formData.nama_kegiatan} onChange={handleInputChange}
                  placeholder={isSuperAdmin ? "Contoh: Rapat Koordinasi Lintas OPD" : "Contoh: Rapat Internal Dinas"}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Keterangan</label>
                <textarea name="keterangan" value={formData.keterangan} onChange={handleInputChange} rows={2}
                  placeholder="Deskripsi singkat kegiatan..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Tanggal Mulai <span className="text-red-500">*</span></label>
                  <input type="date" name="tanggal_mulai" value={formData.tanggal_mulai} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Tanggal Selesai <span className="text-red-500">*</span></label>
                  <input type="date" name="tanggal_selesai" value={formData.tanggal_selesai} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-600" />
                </div>
              </div>

              {/* Time Boundaries */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Jam Mulai</label>
                  <input type="time" name="jam_mulai" value={formData.jam_mulai} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Jam Selesai</label>
                  <input type="time" name="jam_selesai" value={formData.jam_selesai} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-600" />
                </div>
              </div>

              {/* ══════════════════════════════
                  SECTION A: GEOFENCING MAP
                 ══════════════════════════════ */}
              <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 space-y-4">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={14} /> Geofencing — Peta Interaktif
                </p>

                {/* Address + Geocode */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Alamat Lokasi</label>
                  <div className="flex gap-2">
                    <input type="text" name="alamat_lokasi" value={formData.alamat_lokasi} onChange={handleInputChange}
                      placeholder="Contoh: Jl. Raya Serang, Cikupa, Tangerang"
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    <button type="button" onClick={handleGeocode} disabled={isGeocoding}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#0057A4] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-60 whitespace-nowrap">
                      {isGeocoding ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                      Cari di Peta
                    </button>
                  </div>
                </div>

                {/* Coordinate Inputs */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Latitude</label>
                    <input type="number" step="any" name="latitude_target" value={formData.latitude_target}
                      onChange={handleNumberChange} placeholder="-6.175"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Longitude</label>
                    <input type="number" step="any" name="longitude_target" value={formData.longitude_target}
                      onChange={handleNumberChange} placeholder="106.827"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Radius (meter)</label>
                    <input type="number" name="radius_toleransi" value={formData.radius_toleransi}
                      onChange={handleNumberChange} min={10}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                </div>

                {/* Leaflet Map */}
                <div className="rounded-xl overflow-hidden border border-gray-300 shadow-inner" style={{ height: 300 }}>
                  <MapContainer center={mapPosition} zoom={15} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
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
                <p className="text-[10px] text-gray-400 italic">Klik pada peta atau geser pin untuk mengubah lokasi.</p>
              </div>

              {/* ══════════════════════════════════════
                  SECTION B: EMPLOYEE ASSIGNMENT
                  (Only for Admin OPD creating Internal)
                 ══════════════════════════════════════ */}
              {!isSuperAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                    Undangan OPD
                  </label>

                  {/* Toggle: Global vs Pilih OPD */}
                  <div className="flex gap-3 mb-3">
                    <button type="button" onClick={() => setIsGlobalToggle(true)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition ${
                        isGlobalToggle ? 'bg-[#0057A4] text-white border-[#0057A4] shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}>
                      <Globe size={16} /> Semua OPD (Global)
                    </button>
                    <button type="button" onClick={() => setIsGlobalToggle(false)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition ${
                        !isGlobalToggle ? 'bg-[#0057A4] text-white border-[#0057A4] shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}>
                      <Building2 size={16} /> Pilih OPD Tertentu
                    </button>
                  </div>

                  {/* OPD Checkbox List */}
                  {!isGlobalToggle && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="p-3 bg-gray-50 border-b border-gray-200 space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input type="text" placeholder="Cari nama OPD..."
                            value={opdSearch} onChange={e => setOpdSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-gray-500">
                            <span className="font-bold text-blue-600">{selectedOpdIds.length}</span> OPD dipilih
                          </span>
                          <div className="flex gap-2">
                            <button type="button"
                              onClick={() => setSelectedOpdIds(filteredOpdList.map(o => o.id))}
                              className="text-[11px] text-blue-600 hover:underline font-medium">Pilih semua</button>
                            <span className="text-gray-300">|</span>
                            <button type="button"
                              onClick={() => setSelectedOpdIds([])}
                              className="text-[11px] text-red-500 hover:underline font-medium">Batal semua</button>
                          </div>
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {isLoadingOpd ? (
                          <div className="flex items-center justify-center py-8 gap-2 text-gray-400 text-sm">
                            <Loader2 size={18} className="animate-spin" /> Memuat daftar OPD...
                          </div>
                        ) : filteredOpdList.length > 0 ? (
                          <table className="w-full text-sm border-collapse">
                            <thead className="bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
                              <tr><th className="px-3 py-2 w-8"></th><th className="px-3 py-2 text-left">Nama OPD</th><th className="px-3 py-2 text-left">Kode</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {filteredOpdList.map(o => {
                                const isSel = selectedOpdIds.includes(o.id);
                                return (
                                  <tr key={o.id} onClick={() => handleToggleOpd(o.id)}
                                    className={`cursor-pointer transition ${isSel ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                    <td className="px-3 py-2.5 text-center">
                                      {isSel ? <CheckSquare size={16} className="text-blue-600 mx-auto" /> : <Square size={16} className="text-gray-300 mx-auto" />}
                                    </td>
                                    <td className="px-3 py-2.5 font-medium text-gray-800">{o.nama_opd}</td>
                                    <td className="px-3 py-2.5 font-mono text-[11px] text-gray-400">{o.kode_opd}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-center py-8 text-gray-400 text-sm">Tidak ada OPD ditemukan.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Global info */}
                  {isGlobalToggle && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                      <ShieldCheck size={20} className="text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-purple-800">Kegiatan Global (Seluruh OPD)</p>
                        <p className="text-xs text-purple-600 mt-0.5">
                          Semua ASN dari seluruh OPD dapat melakukan presensi pada kegiatan ini.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={resetForm}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">Batal</button>
                <button type="submit" disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#005bb5] hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-sm disabled:opacity-60 disabled:cursor-wait">
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Plus size={16} /> Simpan Kegiatan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default JadwalKegiatan;
