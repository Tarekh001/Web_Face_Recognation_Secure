import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE from '../config/api';
import {
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Radio,
  Search,
  Save,
  RotateCcw,
  Terminal,
  Server,
  Sliders,
  Loader2,
  Upload,
} from 'lucide-react';
import {
  TableLoadingRow,
  TableErrorRow,
  TablePaginationBar,
  notifyAlert,
  confirmAction,
} from '../components/UiFeedback';

const pct = (part, total) => {
  if (!total || total <= 0) return '0%';
  return `${Math.round((part / total) * 100)}%`;
};

const SpotStatusBadge = ({ status }) => {
  const norm = (status || 'pending').toLowerCase();
  if (norm === 'synced') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs whitespace-nowrap">
        <CheckCircle2 size={13} aria-hidden="true" />
        <span>Terkirim SPOT</span>
      </span>
    );
  }
  if (norm === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-red-800 border border-red-300 font-bold text-xs whitespace-nowrap">
        <AlertCircle size={13} aria-hidden="true" />
        <span>Gagal Kirim</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-300 font-bold text-xs whitespace-nowrap">
      <Clock size={13} aria-hidden="true" />
      <span>Menunggu Antrean</span>
    </span>
  );
};

const SpotSyncPage = () => {
  const [activeTab, setActiveTab] = useState('antrean');
  const [summary, setSummary] = useState({ total: 0, synced: 0, pending: 0, failed: 0 });
  const [config, setConfig] = useState({
    spot_base_url: 'https://absen.meteoronyx.my.id',
    spot_cron_enabled: true,
    spot_cron_interval_minutes: 5,
    spot_auto_push: true,
    spot_override_sn: '',
    spot_status_mode: 'in_out',
    spot_verify_mode: '15',
    spot_validation_val: '0',
    spot_workcode_val: '0',
    spot_last_cron_run: '-',
    spot_last_cron_summary: 'Belum ada eksekusi terjadwal',
  });

  const [logs, setLogs] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSyncingBatch, setIsSyncingBatch] = useState(false);
  const [isHandshaking, setIsHandshaking] = useState(false);
  const [pushingLogId, setPushingLogId] = useState(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);

  const fetchSpotStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.get(`${API_BASE}/spot/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.summary) setSummary(res.data.summary);
      if (res.data?.config) {
        setConfig((prev) => ({ ...prev, ...res.data.config }));
      }
    } catch (err) {
      console.error('Gagal mengambil status SPOT:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  const fetchSpotLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    setErrorMsg('');
    const token = localStorage.getItem('access_token');
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (statusFilter) params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await axios.get(`${API_BASE}/spot/logs`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotalRecords(res.data?.total_records ?? 0);
      if (res.data?.summary) setSummary(res.data.summary);
    } catch (err) {
      console.error('Gagal memuat log presensi SPOT:', err);
      setErrorMsg(
        err.response?.data?.error || 'Tidak dapat memuat daftar antrean log presensi SPOT dari server.'
      );
    } finally {
      setIsLoadingLogs(false);
    }
  }, [currentPage, itemsPerPage, statusFilter, searchQuery, startDate, endDate]);

  useEffect(() => {
    fetchSpotStatus();
  }, [fetchSpotStatus]);

  useEffect(() => {
    fetchSpotLogs();
  }, [fetchSpotLogs]);

  const handleSaveConfig = async (e) => {
    if (e) e.preventDefault();
    setIsSavingConfig(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.put(`${API_BASE}/spot/config`, config, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.config) {
        setConfig((prev) => ({ ...prev, ...res.data.config }));
      }
      notifyAlert({
        icon: 'success',
        title: 'Konfigurasi Tersimpan',
        text: res.data?.message || 'Pengaturan sinkronisasi SPOT dan format payload berhasil diperbarui.',
        timer: 1800,
      });
      fetchSpotLogs();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Menyimpan Konfigurasi',
        text: err.response?.data?.error || 'Terjadi kesalahan saat menyimpan pengaturan SPOT.',
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSyncPendingBatch = async () => {
    setIsSyncingBatch(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.post(
        `${API_BASE}/spot/sync-pending`,
        { limit: 100 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res.data || {};
      notifyAlert({
        icon: data.failed_count > 0 && data.synced_count === 0 ? 'warning' : 'success',
        title: 'Sinkronisasi Batch Selesai',
        text: `Diproses: ${data.total_processed || 0} log | Terkirim: ${data.synced_count || 0} | Gagal: ${data.failed_count || 0}`,
      });
      fetchSpotStatus();
      fetchSpotLogs();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Menjalankan Sinkronisasi',
        text: err.response?.data?.error || 'Terjadi kendala saat mengirim antrean log ke server SPOT.',
      });
    } finally {
      setIsSyncingBatch(false);
    }
  };

  const handleHandshakeDevices = async () => {
    const ok = await confirmAction({
      title: 'Kirim Handshake Perangkat ke SPOT?',
      text: `Sistem akan mendaftarkan SN perangkat kiosk ke ${config.spot_base_url} melalui protokol iClock (GET /iclock/cdata?options=all). Setelah handshake berhasil, verifikasi SN tersebut di panel Admin SPOT.`,
      confirmText: 'Ya, Kirim Handshake',
      isDanger: false,
    });
    if (!ok) return;

    setIsHandshaking(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.post(
        `${API_BASE}/spot/handshake-devices`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      notifyAlert({
        icon: res.data?.success_count > 0 ? 'success' : 'warning',
        title: 'Handshake Selesai',
        text: res.data?.message || 'Handshake perangkat ke server SPOT selesai dijalankan.',
      });
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Handshake Gagal',
        text: err.response?.data?.error || 'Tidak dapat menghubungi endpoint handshake server SPOT.',
      });
    } finally {
      setIsHandshaking(false);
    }
  };

  const handlePushSingleLog = async (row) => {
    setPushingLogId(row.log_id);
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.post(
        `${API_BASE}/spot/test-push`,
        {
          log_id: row.log_id,
          override_sn: config.spot_override_sn || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const ok = res.data?.ok;
      notifyAlert({
        icon: ok ? 'success' : 'warning',
        title: ok ? 'Log Berhasil Terkirim' : 'Ditolak oleh Server SPOT',
        text: `Respons Server SPOT (HTTP ${res.data?.status_code || '-'}): ${res.data?.response_text || '-'}`,
      });
      fetchSpotStatus();
      fetchSpotLogs();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Mengirim Log',
        text: err.response?.data?.error || 'Terjadi kesalahan saat mengirim ulang log presensi.',
      });
    } finally {
      setPushingLogId(null);
    }
  };

  const handleUploadPegawaiCsv = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploadingCsv(true);
    const token = localStorage.getItem('access_token');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${API_BASE}/spot/sync-pegawai-csv`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      notifyAlert({
        icon: 'success',
        title: 'Data Induk Pegawai Diperbarui',
        text: res.data?.message || 'Data pegawai ASN dan PIN SPOT berhasil disinkronkan.',
      });
      fetchSpotStatus();
      fetchSpotLogs();
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Gagal Memproses CSV Pegawai',
        text: err.response?.data?.error || 'Pastikan file berformat CSV (nip, nama, pin) dari SPOT.',
      });
    } finally {
      setIsUploadingCsv(false);
    }
  };

  const handleToggleCardStatus = (target) => {
    setStatusFilter((prev) => (prev === target ? '' : target));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const sampleStatusVal =
    config.spot_status_mode === 'always_0'
      ? '0'
      : config.spot_status_mode === 'auto_255'
        ? '255'
        : '0 (Masuk) / 1 (Pulang)';

  const samplePayloadLine = `14460\\t2026-10-21 07:25:10\\t${
    config.spot_status_mode === 'auto_255' ? '255' : '0'
  }\\t${config.spot_verify_mode || '15'}\\t${config.spot_validation_val ?? '0'}\\t${
    config.spot_workcode_val ?? '0'
  }`;

  return (
    <div className="w-full space-y-5">
      {/* Header Eksekutif Sinkronisasi SPOT */}
      <div className="surface-card p-5 sm:px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <Server size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight tabular-nums">
              Sinkronisasi Log Presensi SPOT ({summary.total.toLocaleString('id-ID')})
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Pengiriman otomatis log biometrik ASN ke server pusat menggunakan protokol ADMS / iClock ATTLOG
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="tablist"
            aria-label="Mode Halaman Sinkronisasi SPOT"
            className="inline-flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-300"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'antrean'}
              onClick={() => setActiveTab('antrean')}
              className={`inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-bold transition-all active:translate-y-px ${
                activeTab === 'antrean'
                  ? 'bg-blue-700 text-white shadow-btn-primary'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Server size={15} aria-hidden="true" />
              <span>Antrean & Log SPOT</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'konfigurasi'}
              onClick={() => setActiveTab('konfigurasi')}
              className={`inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-bold transition-all active:translate-y-px ${
                activeTab === 'konfigurasi'
                  ? 'bg-blue-700 text-white shadow-btn-primary'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sliders size={15} aria-hidden="true" />
              <span>Konfigurasi & Payload</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleHandshakeDevices}
            disabled={isHandshaking || isSyncingBatch}
            className="gov-btn-secondary"
          >
            {isHandshaking ? (
              <>
                <Loader2 size={15} className="animate-spin text-blue-700" aria-hidden="true" />
                <span>Mengirim Handshake...</span>
              </>
            ) : (
              <>
                <Radio size={15} className="text-blue-700" aria-hidden="true" />
                <span>Handshake Perangkat ke SPOT</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSyncPendingBatch}
            disabled={isSyncingBatch || isHandshaking}
            className="gov-btn-primary"
          >
            {isSyncingBatch ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                <span>Mengirim Antrean...</span>
              </>
            ) : (
              <>
                <Send size={15} aria-hidden="true" />
                <span>Kirim Antrean Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Kartu Metrik Interaktif */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Kartu 1 (Anchor): Total Log ASN */}
        <button
          type="button"
          aria-pressed={statusFilter === ''}
          onClick={() => {
            setStatusFilter('');
            setCurrentPage(1);
          }}
          className={`text-left rounded-2xl p-4 flex flex-col justify-between bg-[#0B1120] text-white border transition-all duration-150 shadow-card hover:border-blue-400 ${
            statusFilter === ''
              ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2 ring-offset-[#F3F6FA]'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between w-full gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
              Total Log Presensi ASN
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
              <Server size={15} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-extrabold text-white tracking-tight tabular-nums">
                {summary.total.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-bold text-blue-300">Log Transaksi</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">Khusus rekaman tabel presensi_asn</p>
          </div>
        </button>

        {/* Kartu 2: Terkirim ke SPOT */}
        <button
          type="button"
          aria-pressed={statusFilter === 'synced'}
          onClick={() => handleToggleCardStatus('synced')}
          className={`text-left surface-card p-4 flex flex-col justify-between transition-all duration-150 hover:border-emerald-600 hover:shadow-soft-sm ${
            statusFilter === 'synced' ? 'border-emerald-700 ring-2 ring-emerald-700 bg-emerald-50/40' : ''
          }`}
        >
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Terkirim ke SPOT
              </span>
              {statusFilter === 'synced' && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-700 text-white">
                  Aktif
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <CheckCircle2 size={15} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-800 tracking-tight tabular-nums">
                {summary.synced.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 tabular-nums">
                {pct(summary.synced, summary.total)}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">Diterima dengan respons HTTP 200 OK</p>
          </div>
        </button>

        {/* Kartu 3: Menunggu Antrean */}
        <button
          type="button"
          aria-pressed={statusFilter === 'pending'}
          onClick={() => handleToggleCardStatus('pending')}
          className={`text-left surface-card p-4 flex flex-col justify-between transition-all duration-150 hover:border-amber-600 hover:shadow-soft-sm ${
            statusFilter === 'pending' ? 'border-amber-700 ring-2 ring-amber-700 bg-amber-50/40' : ''
          }`}
        >
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                Menunggu Antrean
              </span>
              {statusFilter === 'pending' && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-800 text-white">
                  Aktif
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
              <Clock size={15} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-900 tracking-tight tabular-nums">
                {summary.pending.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 tabular-nums">
                {pct(summary.pending, summary.total)}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">Siap dikirim pada siklus Cron Job berikutnya</p>
          </div>
        </button>

        {/* Kartu 4: Gagal Terkirim */}
        <button
          type="button"
          aria-pressed={statusFilter === 'failed'}
          onClick={() => handleToggleCardStatus('failed')}
          className={`text-left surface-card p-4 flex flex-col justify-between transition-all duration-150 hover:border-red-600 hover:shadow-soft-sm ${
            statusFilter === 'failed' ? 'border-red-700 ring-2 ring-red-700 bg-red-50/40' : ''
          }`}
        >
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-800">
                Gagal Terkirim
              </span>
              {statusFilter === 'failed' && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-red-700 text-white">
                  Aktif
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-700 shrink-0">
              <AlertCircle size={15} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-red-700 tracking-tight tabular-nums">
                {summary.failed.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-bold text-red-800 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-200 tabular-nums">
                {pct(summary.failed, summary.total)}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">SN belum diverifikasi SPOT atau kendala jaringan</p>
          </div>
        </button>
      </div>

      {/* Panel Konfigurasi Endpoint, Cron Job, & Kustomisasi Payload ATTLOG */}
      {activeTab === 'konfigurasi' && (
      <div className="space-y-5">
      <form onSubmit={handleSaveConfig} className="surface-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800">
              <Sliders size={17} aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Pengaturan Server Tujuan, Jadwal Cron Job, & Format Payload ATTLOG
              </h3>
              <p className="text-xs text-slate-600">
                Kolom 1 (UserPIN) dan Kolom 2 (Time) dikunci dari data presensi ASN; 4 kolom protokol lainnya dapat disesuaikan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-800 font-semibold tabular-nums">
              Eksekusi Cron Terakhir: <b className="font-mono">{config.spot_last_cron_run || '-'}</b>
            </span>
          </div>
        </div>

        {/* Baris 1: Server Tujuan, Override SN, & Interval Cron */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="spot-base-url" className="gov-label">
              URL Server SPOT Tujuan
            </label>
            <input
              id="spot-base-url"
              type="url"
              required
              value={config.spot_base_url}
              onChange={(e) => setConfig({ ...config, spot_base_url: e.target.value })}
              placeholder="https://absen.meteoronyx.my.id"
              className="gov-input font-mono text-xs"
            />
            <p className="text-[11px] text-slate-600 mt-1">
              Target pengiriman <code className="font-mono">POST /iclock/cdata?table=ATTLOG</code>
            </p>
          </div>

          <div>
            <label htmlFor="spot-override-sn" className="gov-label">
              SN Mesin Override (Opsional)
            </label>
            <input
              id="spot-override-sn"
              type="text"
              value={config.spot_override_sn}
              onChange={(e) => setConfig({ ...config, spot_override_sn: e.target.value })}
              placeholder="Kosongkan untuk SN asli perangkat"
              className="gov-input font-mono text-xs"
            />
            <p className="text-[11px] text-slate-600 mt-1">
              Jika diisi, seluruh pengiriman menggunakan SN ini
            </p>
          </div>

          <div>
            <label htmlFor="spot-cron-interval" className="gov-label">
              Interval Cron Job Otomatis
            </label>
            <select
              id="spot-cron-interval"
              value={config.spot_cron_interval_minutes}
              onChange={(e) =>
                setConfig({ ...config, spot_cron_interval_minutes: Number(e.target.value) })
              }
              className="gov-select tabular-nums"
            >
              <option value={1}>Setiap 1 Menit</option>
              <option value={5}>Setiap 5 Menit (Direkomendasikan)</option>
              <option value={10}>Setiap 10 Menit</option>
              <option value={15}>Setiap 15 Menit</option>
              <option value={30}>Setiap 30 Menit</option>
              <option value={60}>Setiap 60 Menit</option>
            </select>
            <p className="text-[11px] text-slate-600 mt-1">
              Mengirim ulang log berstatus Menunggu atau Gagal secara berkala
            </p>
          </div>
        </div>

        {/* Baris 2: Kustomisasi 4 Kolom Tambahan Payload ATTLOG */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-200">
          <div>
            <label htmlFor="spot-status-mode" className="gov-label">
              Kolom 3: Status Kehadiran
            </label>
            <select
              id="spot-status-mode"
              value={config.spot_status_mode}
              onChange={(e) => setConfig({ ...config, spot_status_mode: e.target.value })}
              className="gov-select text-xs"
            >
              <option value="in_out">Sesuai Tipe Scan (0 = Masuk, 1 = Pulang)</option>
              <option value="always_0">Selalu 0 (Check-In Standar)</option>
              <option value="auto_255">255 (Otomatis oleh Server SPOT)</option>
            </select>
            <p className="text-[11px] text-slate-600 mt-1">
              Nilai saat ini: <b className="font-mono">{sampleStatusVal}</b>
            </p>
          </div>

          <div>
            <label htmlFor="spot-verify-mode" className="gov-label">
              Kolom 4: VerifyMode (Metode)
            </label>
            <select
              id="spot-verify-mode"
              value={config.spot_verify_mode}
              onChange={(e) => setConfig({ ...config, spot_verify_mode: e.target.value })}
              className="gov-select text-xs"
            >
              <option value="15">15 (Biometrik Wajah / Face Recognition)</option>
              <option value="1">1 (Sidik Jari / Fingerprint)</option>
              <option value="0">0 (Password / Standar)</option>
              <option value="200">200 (Kustom Terminal)</option>
            </select>
            <p className="text-[11px] text-slate-600 mt-1">
              Kode 15 adalah standar ZKTeco / iClock untuk pengenalan wajah
            </p>
          </div>

          <div>
            <label htmlFor="spot-validation-val" className="gov-label">
              Kolom 5: Validation (Reserved 1)
            </label>
            <input
              id="spot-validation-val"
              type="text"
              value={config.spot_validation_val}
              onChange={(e) => setConfig({ ...config, spot_validation_val: e.target.value })}
              className="gov-input font-mono text-xs"
            />
            <p className="text-[11px] text-slate-600 mt-1">Default standar iClock: 0</p>
          </div>

          <div>
            <label htmlFor="spot-workcode-val" className="gov-label">
              Kolom 6: WorkCode (Reserved 2)
            </label>
            <input
              id="spot-workcode-val"
              type="text"
              value={config.spot_workcode_val}
              onChange={(e) => setConfig({ ...config, spot_workcode_val: e.target.value })}
              className="gov-input font-mono text-xs"
            />
            <p className="text-[11px] text-slate-600 mt-1">Default standar iClock: 0</p>
          </div>
        </div>

        {/* Baris 3: Toggle Sakelar & Pratinjau Payload ATTLOG */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-3 border-t border-slate-200">
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none min-h-[44px]">
              <input
                type="checkbox"
                checked={Boolean(config.spot_cron_enabled)}
                onChange={(e) => setConfig({ ...config, spot_cron_enabled: e.target.checked })}
                className="w-4 h-4 rounded border-slate-400 text-blue-700 focus:ring-blue-600"
              />
              <span className="text-xs font-bold text-slate-800">
                Aktifkan Cron Job Otomatis di Latar Belakang
              </span>
            </label>

            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none min-h-[44px]">
              <input
                type="checkbox"
                checked={Boolean(config.spot_auto_push)}
                onChange={(e) => setConfig({ ...config, spot_auto_push: e.target.checked })}
                className="w-4 h-4 rounded border-slate-400 text-blue-700 focus:ring-blue-600"
              />
              <span className="text-xs font-bold text-slate-800">
                Kirim Langsung Saat Pegawai Scan Wajah di Kiosk
              </span>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono border border-slate-700">
              <Terminal size={14} className="text-sky-400 shrink-0" aria-hidden="true" />
              <span className="text-slate-400">Contoh Payload:</span>
              <code className="text-emerald-300 font-bold">{samplePayloadLine}</code>
            </div>

            <button
              type="submit"
              disabled={isSavingConfig || isLoadingStatus}
              className="gov-btn-primary"
            >
              {isSavingConfig ? (
                <>
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={15} aria-hidden="true" />
                  <span>Simpan Konfigurasi SPOT</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="surface-card p-5 sm:px-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">
            Sinkronisasi Data Induk Pegawai ASN (CSV SPOT)
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Unggah file CSV terbaru dari server SPOT (<code className="font-mono">nip, nama, pin</code>) untuk memperbarui tabel{' '}
            <code className="font-mono">data_pegawai</code> dan menyelaraskan PIN pada <code className="font-mono">users_asn</code> serta log antrean secara otomatis.
          </p>
        </div>

        <label
          className={`gov-btn-secondary cursor-pointer ${
            isUploadingCsv ? 'opacity-60 pointer-events-none' : ''
          }`}
        >
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleUploadPegawaiCsv}
            disabled={isUploadingCsv}
            className="sr-only"
          />
          {isUploadingCsv ? (
            <>
              <Loader2 size={15} className="animate-spin text-blue-700" aria-hidden="true" />
              <span>Memproses CSV...</span>
            </>
          ) : (
            <>
              <Upload size={15} className="text-blue-700" aria-hidden="true" />
              <span>Unggah CSV Data Pegawai</span>
            </>
          )}
        </label>
      </div>
      </div>
      )}

      {/* Tabel Antrean & Riwayat Pengiriman Log Presensi ASN */}
      {activeTab === 'antrean' && (
      <div className="surface-card overflow-hidden">
        <div className="gov-table-toolbar">
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <div className="w-full sm:w-72">
              <label htmlFor="spot-log-search" className="sr-only">
                Cari Nama, NIP, PIN SPOT, atau SN Mesin
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                  size={16}
                  aria-hidden="true"
                />
                <input
                  id="spot-log-search"
                  type="text"
                  placeholder="Cari nama, NIP, PIN SPOT, atau SN..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="gov-input pl-9"
                />
              </div>
            </div>

            <div className="w-full sm:w-48">
              <label htmlFor="spot-status-select" className="sr-only">
                Filter Status Pengiriman SPOT
              </label>
              <select
                id="spot-status-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="gov-select text-xs"
              >
                <option value="">Seluruh Status Pengiriman</option>
                <option value="synced">Terkirim SPOT (Synced)</option>
                <option value="pending">Menunggu Antrean (Pending)</option>
                <option value="failed">Gagal Kirim (Failed)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                aria-label="Tanggal mulai"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="gov-input text-xs w-36"
              />
              <span className="text-xs text-slate-600 font-semibold">s.d.</span>
              <input
                type="date"
                aria-label="Tanggal akhir"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="gov-input text-xs w-36"
              />
            </div>

            {(statusFilter || searchQuery || startDate || endDate) && (
              <button type="button" onClick={handleResetFilters} className="gov-btn-secondary">
                <RotateCcw size={14} aria-hidden="true" />
                <span>Atur Ulang</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-600 font-medium hidden xl:inline">
              Ringkasan Cron: <b className="text-slate-800">{config.spot_last_cron_summary}</b>
            </span>
            <span className="font-semibold text-slate-700 tabular-nums">
              Total <b className="text-slate-900">{totalRecords}</b> log
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="gov-table min-w-[1040px]">
            <thead>
              <tr>
                <th className="w-14 text-center">No</th>
                <th>Pegawai ASN</th>
                <th className="whitespace-nowrap text-center">PIN SPOT</th>
                <th className="whitespace-nowrap">Waktu Scan & Tipe</th>
                <th className="whitespace-nowrap">SN Mesin</th>
                <th>Payload ATTLOG (6 Kolom Tab)</th>
                <th>Status & Respons SPOT</th>
                <th className="w-40 text-center sticky right-0 bg-slate-50 border-l border-slate-200">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoadingLogs ? (
                <TableLoadingRow colSpan={8} label="Memuat antrean log presensi SPOT..." />
              ) : errorMsg ? (
                <TableErrorRow colSpan={8} message={errorMsg} onRetry={fetchSpotLogs} />
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 px-4 text-center">
                    <p className="text-sm font-bold text-slate-900">
                      Tidak Ada Log Presensi ASN untuk Kriteria Ini
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Sesuaikan filter status atau rentang tanggal untuk melihat riwayat pengiriman ke server SPOT.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((row, idx) => (
                  <tr key={row.log_id}>
                    <td className="text-center text-xs font-mono text-slate-600 tabular-nums">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>

                    <td>
                      <div className="font-bold text-slate-900 text-sm">{row.nama_lengkap}</div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="font-mono text-xs text-slate-600 tabular-nums">
                          {row.nip}
                        </span>
                        {row.nama_opd && (
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded-md truncate max-w-[180px]">
                            {row.nama_opd}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="text-center whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 tabular-nums">
                        {row.user_pin || '-'}
                      </span>
                    </td>

                    <td className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                          {row.waktu_scan || '-'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                            row.tipe_absen === 'OUT'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {row.tipe_absen === 'OUT' ? 'PULANG (1)' : 'MASUK (0)'}
                        </span>
                      </div>
                    </td>

                    <td className="whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-300">
                        {row.device_sn || '-'}
                      </span>
                    </td>

                    <td>
                      <code className="inline-block font-mono text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-300 whitespace-pre">
                        {(row.payload || '').replace(/\t/g, ' \\t ')}
                      </code>
                    </td>

                    <td>
                      <div className="flex flex-col items-start gap-1">
                        <SpotStatusBadge status={row.spot_sync_status} />
                        {row.spot_response && (
                          <span
                            className="text-[11px] text-slate-600 font-mono truncate max-w-[230px]"
                            title={row.spot_response}
                          >
                            {row.spot_response}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="text-center sticky right-0 bg-white border-l border-slate-200">
                      <button
                        type="button"
                        onClick={() => handlePushSingleLog(row)}
                        disabled={pushingLogId === row.log_id}
                        aria-label={`Kirim ulang log ${row.nama_lengkap} ke SPOT`}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-300 rounded-lg transition-all disabled:opacity-50"
                      >
                        {pushingLogId === row.log_id ? (
                          <>
                            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                            <span>Mengirim...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw size={13} aria-hidden="true" />
                            <span>Kirim Ulang</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePaginationBar
          currentPage={currentPage}
          totalItems={totalRecords}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
          unitLabel="log presensi ASN"
        />
      </div>
      )}
    </div>
  );
};

export default SpotSyncPage;
