import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, UserPlus, ScanFace, LogOut, UserCircle, Users, Database, Building2, UserCog, MonitorSmartphone, ChevronDown, History, Settings, CalendarDays, ClipboardList } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [masterDataOpen, setMasterDataOpen] = useState(
    location.pathname.startsWith('/master-data')
  );

  // AMBIL DATA DARI LOCAL STORAGE
  const userRole = localStorage.getItem('user_role');
  const userNip = localStorage.getItem('user_username') || localStorage.getItem('user_nip') || 'Admin Instansi';

  const handleLogout = () => {
    // Bersihkan semua jejak saat logout
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_nip');
    localStorage.removeItem('user_username');
    navigate('/login');
  };

  // Menu Standar (Bisa diakses Super Admin & Admin OPD)
  const navItems = [
    { path: '/dashboard', label: 'Report Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/manage-asn', label: 'Daftar ASN', icon: <Users size={20} /> },
    { path: '/register', label: 'Add new ASN', icon: <UserPlus size={20} /> },
    { path: '/kegiatan', label: 'Jadwal Kegiatan', icon: <CalendarDays size={20} /> },
    { path: '/laporan-kegiatan', label: 'Laporan Kegiatan', icon: <ClipboardList size={20} /> }
  ];

  // Sub-menu Master Data (hanya Super Admin)
  const masterDataItems = [
    { path: '/master-data/opd', label: 'Data OPD', icon: <Building2 size={16} /> },
    { path: '/master-data/admin', label: 'Data Admin', icon: <UserCog size={16} /> },
    { path: '/master-data/devices', label: 'Data Perangkat', icon: <MonitorSmartphone size={16} /> },
    { path: '/audit-trail', label: 'Audit Trail', icon: <History size={16} /> },
  ];

  const isActiveRoute = (path) => location.pathname === path;
  const isMasterDataActive = location.pathname.startsWith('/master-data') || location.pathname === '/audit-trail';
  const isSettingsActive = location.pathname === '/settings';

  return (
    <nav className="bg-[#0057A4] text-white w-72 min-h-screen flex flex-col shadow-xl">
      {/* Header & Profile */}
      <div className="flex flex-col items-center pt-8 pb-6 border-b border-blue-400/30">
        <h2 className="text-xl font-extrabold tracking-wide">Smart Presensi</h2>
        <p className="text-xs text-blue-200 mb-6">Diskominfo Tangerangkab</p>

        <UserCircle size={64} strokeWidth={1.5} className="text-white mb-2" />
        {/* Tampilkan email/username secara dinamis */}
        <p className="text-sm font-medium px-4 text-center break-all">{userNip}</p> 
        <span className="mt-1 px-3 py-1 bg-blue-700 text-[10px] rounded-full uppercase tracking-wider font-bold">
          {userRole === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN OPD'}
        </span>
      </div>

      {/* Menu Links */}
      <div className="flex flex-col flex-grow py-6">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`text-[#f5f5f5] text-xs flex items-center gap-4 px-8 py-4 font-semibold transition ${isActiveRoute(item.path)
                ? 'bg-[#0074BA] border-l-4 border-white'
                : 'hover:bg-[#0074BA] border-l-4 border-transparent'
              }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}

        {/* MASTER DATA DROPDOWN — hanya Super Admin */}
        {userRole === 'super_admin' && (
          <div>
            {/* Dropdown Toggle */}
            <button
              onClick={() => setMasterDataOpen(!masterDataOpen)}
              className={`w-full text-[#f5f5f5] text-xs flex items-center gap-4 px-8 py-4 font-semibold transition ${
                isMasterDataActive
                  ? 'bg-[#0074BA] border-l-4 border-white'
                  : 'hover:bg-[#0074BA] border-l-4 border-transparent'
              }`}
            >
              <Database size={20} />
              <span className="flex-1 text-left">Master Data</span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${masterDataOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Sub-menus */}
            <div className={`overflow-hidden transition-all duration-200 ${masterDataOpen ? 'max-h-60' : 'max-h-0'}`}>
              {masterDataItems.map((sub) => (
                <Link
                  key={sub.path}
                  to={sub.path}
                  className={`text-[#d0e8ff] text-[11px] flex items-center gap-3 pl-16 pr-8 py-3 font-medium transition ${
                    isActiveRoute(sub.path)
                      ? 'bg-[#005fa8] text-white font-bold'
                      : 'hover:bg-[#005fa8] hover:text-white'
                  }`}
                >
                  {sub.icon}
                  {sub.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* PENGATURAN SISTEM — hanya Super Admin */}
        {userRole === 'super_admin' && (
          <Link
            to="/settings"
            className={`text-[#f5f5f5] text-xs flex items-center gap-4 px-8 py-4 font-semibold transition ${isSettingsActive
                ? 'bg-[#0074BA] border-l-4 border-white'
                : 'hover:bg-[#0074BA] border-l-4 border-transparent'
              }`}
          >
            <Settings size={20} />
            Pengaturan Sistem
          </Link>
        )}


        {/* Presensi ASN — paling bawah */}
        <Link
          to="/face-scan"
          className={`text-[#f5f5f5] text-xs flex items-center gap-4 px-8 py-4 font-semibold transition ${isActiveRoute('/face-scan')
              ? 'bg-[#0074BA] border-l-4 border-white'
              : 'hover:bg-[#0074BA] border-l-4 border-transparent'
            }`}
        >
          <ScanFace size={20} />
          Presensi ASN
        </Link>
      </div>

      {/* Logout */}
      <div className="mt-auto px-6 pb-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2.5 px-4 rounded-lg text-sm font-bold transition shadow-md"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;