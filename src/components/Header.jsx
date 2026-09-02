import { useLocation } from 'react-router-dom';
import { Menu, PanelLeftClose, PanelLeftOpen, ShieldCheck, UserCircle, LogOut, Sparkles } from 'lucide-react';

const Header = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen, onLogout }) => {
  const location = useLocation();
  const userRole = localStorage.getItem('user_role');
  const userNip = localStorage.getItem('user_username') || localStorage.getItem('user_nip') || 'Admin';

  // Map route to human readable breadcrumb title
  const getPageTitle = (path) => {
    if (path.startsWith('/dashboard')) return { title: 'Dashboard Utama', category: 'Overview' };
    if (path.startsWith('/manage-asn')) return { title: 'Data Personel ASN', category: 'Manajemen' };
    if (path.startsWith('/manage-non-asn')) return { title: 'Data Personel Non-ASN', category: 'Manajemen' };
    if (path.startsWith('/register')) return { title: 'Registrasi Biometrik Wajah', category: 'Manajemen' };
    if (path.startsWith('/kegiatan')) return { title: 'Jadwal Kegiatan Luar Kantor', category: 'Kegiatan' };
    if (path.startsWith('/laporan-kegiatan')) return { title: 'Rekap Presensi Kegiatan', category: 'Laporan' };
    if (path.startsWith('/laporan/asn')) return { title: 'Laporan Presensi Harian ASN', category: 'Laporan' };
    if (path.startsWith('/laporan/non-asn')) return { title: 'Laporan Presensi Harian Non-ASN', category: 'Laporan' };
    if (path.startsWith('/master-data/opd')) return { title: 'Master Data OPD', category: 'Sistem' };
    if (path.startsWith('/master-data/devices')) return { title: 'Konfigurasi Mesin Kiosk', category: 'Sistem' };
    if (path.startsWith('/master-data/admin')) return { title: 'Manajemen Akun Admin', category: 'Sistem' };
    if (path.startsWith('/settings')) return { title: 'Pengaturan Jam Kerja & Libur', category: 'Sistem' };
    if (path.startsWith('/audit-trail')) return { title: 'Audit Trail & Aktivitas', category: 'Sistem' };
    return { title: 'Smart Presensi', category: 'Portal' };
  };

  const pageInfo = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-soft-xs transition-all">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        
        {/* Left Section: Mobile toggle, Collapse toggle, Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile Drawer Trigger */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:ring-2 focus:ring-blue-500/20"
            aria-label="Buka Menu"
          >
            <Menu size={20} />
          </button>

          {/* Desktop Collapse Trigger */}
          <button
            onClick={() => setIsCollapsed(prev => !prev)}
            className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors focus:ring-2 focus:ring-blue-500/20"
            title={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>

          {/* Breadcrumb Title */}
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              {pageInfo.category}
            </span>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight leading-tight">
              {pageInfo.title}
            </h1>
          </div>
        </div>

        {/* Right Section: Smart City Live Status, Profile Pill, Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Live System Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/60 shadow-soft-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-emerald-700 tracking-wide">
              Smart City AI Online
            </span>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-700">
              <UserCircle size={20} />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight max-w-[130px] truncate">
                {userNip}
              </span>
              <div className="flex items-center gap-1">
                <ShieldCheck size={10} className="text-blue-600" />
                <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase">
                  {userRole === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN OPD'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Logout Button */}
          <button
            onClick={onLogout}
            title="Keluar dari Akun"
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all focus:ring-2 focus:ring-red-500/20"
          >
            <LogOut size={18} />
          </button>

        </div>
      </div>
    </header>
  );
};

export default Header;
