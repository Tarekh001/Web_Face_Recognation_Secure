import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  UserCircle,
  LogOut,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import API_BASE from '../config/api';

const Header = ({ isCollapsed, setIsCollapsed, setIsMobileOpen, onLogout }) => {
  const location = useLocation();
  const userRole = localStorage.getItem('user_role');
  const userNip = localStorage.getItem('user_username') || localStorage.getItem('user_nip') || 'Admin';

  // Status koneksi nyata ke backend API (R-36 & R-38)
  const [apiStatus, setApiStatus] = useState('checking'); // 'online' | 'offline' | 'checking'

  const checkApiConnection = useCallback(async () => {
    setApiStatus('checking');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${API_BASE}/opd/list`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      });
      setApiStatus(res.ok ? 'online' : 'offline');
    } catch {
      setApiStatus('offline');
    } finally {
      clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    checkApiConnection();
    const interval = setInterval(checkApiConnection, 30000);
    const onOnline = () => checkApiConnection();
    const onOffline = () => setApiStatus('offline');
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [checkApiConnection]);

  const getPageTitle = (path) => {
    if (path.startsWith('/dashboard')) return { title: 'Dashboard Utama', category: 'Ringkasan' };
    if (path.startsWith('/manage-asn')) return { title: 'Data Pegawai ASN', category: 'Kepegawaian' };
    if (path.startsWith('/manage-non-asn')) return { title: 'Data Pegawai Non-ASN', category: 'Kepegawaian' };
    if (path.startsWith('/jam-kerja')) return { title: 'Manajemen Jam Kerja & Shift', category: 'Kepegawaian' };
    if (path.startsWith('/register')) return { title: 'Pendaftaran Biometrik Wajah', category: 'Kepegawaian' };
    if (path.startsWith('/kegiatan')) return { title: 'Jadwal Kegiatan Luar Kantor', category: 'Dinas Luar' };
    if (path.startsWith('/laporan-kegiatan')) return { title: 'Rekapitulasi Presensi Kegiatan', category: 'Pelaporan' };
    if (path.startsWith('/laporan/asn')) return { title: 'Laporan Presensi Harian ASN', category: 'Pelaporan' };
    if (path.startsWith('/laporan/non-asn')) return { title: 'Laporan Presensi Harian Non-ASN', category: 'Pelaporan' };
    if (path.startsWith('/master-data/opd') || path === '/master-data') return { title: 'Master Data OPD', category: 'Konfigurasi Sistem' };
    if (path.startsWith('/master-data/devices')) return { title: 'Konfigurasi Perangkat Kiosk', category: 'Konfigurasi Sistem' };
    if (path.startsWith('/master-data/admin')) return { title: 'Manajemen Akun Admin OPD', category: 'Konfigurasi Sistem' };
    if (path.startsWith('/master-data/spot-sync')) return { title: 'Sinkronisasi Log Presensi SPOT', category: 'Konfigurasi Sistem' };
    if (path.startsWith('/settings')) return { title: 'Pengaturan Jam Kiosk & Hari Libur', category: 'Konfigurasi Sistem' };
    if (path.startsWith('/audit-trail')) return { title: 'Log Audit & Aktivitas Sistem', category: 'Konfigurasi Sistem' };
    return { title: 'Portal Admin Presensi', category: 'Sistem Presensi' };
  };

  const pageInfo = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-[#DCE3EC] shadow-soft-xs">
      <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* Kiri: Tombol Menu Mobile berlabel, Toggle Sidebar Desktop, & Judul Halaman */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Buka menu navigasi"
            className="lg:hidden inline-flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-lg border border-slate-500 bg-white text-slate-800 hover:bg-slate-50 text-xs font-bold shadow-soft-xs transition-colors shrink-0"
          >
            <Menu size={18} aria-hidden="true" />
            <span>Menu</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label={isCollapsed ? 'Perluas bilah navigasi samping' : 'Perkecil bilah navigasi samping'}
            title={isCollapsed ? 'Perluas bilah samping' : 'Perkecil bilah samping'}
            className="hidden lg:inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-300 transition-colors shrink-0"
          >
            {isCollapsed ? (
              <PanelLeftOpen size={20} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={20} aria-hidden="true" />
            )}
          </button>

          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800 truncate">
              {pageInfo.category}
            </span>
            <h1 className="text-base sm:text-[18px] font-extrabold text-slate-900 tracking-tight leading-tight truncate">
              {pageInfo.title}
            </h1>
          </div>
        </div>

        {/* Kanan: Indikator Koneksi API Nyata, Identitas Pengguna, & Tombol Keluar */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={checkApiConnection}
            title="Klik untuk memeriksa ulang keterhubungan server API"
            aria-label={`Status koneksi server: ${
              apiStatus === 'online'
                ? 'Server Terhubung'
                : apiStatus === 'offline'
                  ? 'Server Terputus'
                  : 'Memeriksa koneksi server'
            }. Klik untuk periksa ulang.`}
            className={`hidden md:inline-flex items-center gap-2 min-h-[44px] px-3 py-1.5 rounded-lg border text-xs font-bold transition-all active:translate-y-px ${
              apiStatus === 'online'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                : apiStatus === 'offline'
                  ? 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100'
                  : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {apiStatus === 'online' ? (
              <>
                <Wifi size={14} className="text-emerald-700 shrink-0" aria-hidden="true" />
                <span>Server Terhubung</span>
              </>
            ) : apiStatus === 'offline' ? (
              <>
                <WifiOff size={14} className="text-red-700 shrink-0" aria-hidden="true" />
                <span>Server Terputus</span>
              </>
            ) : (
              <>
                <RefreshCw size={14} className="animate-spin text-slate-600 shrink-0" aria-hidden="true" />
                <span>Memeriksa Server</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2.5 min-h-[44px] px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300">
            <div className="w-7 h-7 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
              <UserCircle size={18} aria-hidden="true" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight max-w-[130px] truncate tabular-nums">
                {userNip}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck size={11} className="text-blue-700 shrink-0" aria-hidden="true" />
                <span className="text-[10px] font-bold tracking-wider text-blue-800 uppercase">
                  {userRole === 'super_admin' ? 'Super Admin' : 'Admin OPD'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="Keluar dari akun"
            aria-label="Keluar dari akun"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-slate-700 hover:text-red-800 hover:bg-red-50 border border-slate-400 hover:border-red-300 transition-all active:translate-y-px"
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
