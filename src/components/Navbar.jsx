import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, UserPlus, LogOut, Users, 
  Building2, UserCog, MonitorSmartphone, ChevronDown, 
  History, Settings, CalendarDays, ClipboardList, UserSquare2,
  FileText, SlidersHorizontal, X, Sparkles
} from 'lucide-react';

const Navbar = ({ isCollapsed, isMobileOpen, setIsMobileOpen, onLogout }) => {
  const location = useLocation();

  // Dropdown states
  const [personelOpen, setPersonelOpen] = useState(
    location.pathname.startsWith('/manage') || location.pathname.startsWith('/register')
  );
  const [laporanOpen, setLaporanOpen] = useState(
    location.pathname.startsWith('/laporan')
  );
  const [sistemOpen, setSistemOpen] = useState(
    location.pathname.startsWith('/master-data') || location.pathname === '/settings' || location.pathname === '/audit-trail'
  );

  // Close mobile drawer on route change
  useEffect(() => {
    if (setIsMobileOpen) setIsMobileOpen(false);
  }, [location.pathname, setIsMobileOpen]);

  const userRole = localStorage.getItem('user_role');

  const isActiveRoute = (path) => location.pathname === path;

  // Single Nav Item Component
  const NavItem = ({ to, icon: Icon, label, badge }) => {
    const active = isActiveRoute(to);
    return (
      <Link
        to={to}
        title={isCollapsed ? label : undefined}
        className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          active 
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-semibold' 
            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
        } ${isCollapsed ? 'justify-center px-2.5' : ''}`}
      >
        {/* Left Active Glow Bar */}
        {active && (
          <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full shadow-sm" />
        )}

        <Icon 
          size={19} 
          className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
            active ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
          }`} 
        />

        {!isCollapsed && (
          <div className="flex-1 flex items-center justify-between truncate">
            <span className="truncate">{label}</span>
            {badge && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                badge === 'ASN' ? 'bg-blue-500/30 text-blue-200 border border-blue-400/30' :
                badge === 'Non-ASN' ? 'bg-amber-500/30 text-amber-200 border border-amber-400/30' :
                'bg-slate-700 text-slate-300'
              }`}>
                {badge}
              </span>
            )}
          </div>
        )}
      </Link>
    );
  };

  // Dropdown Cluster Component
  const NavDropdown = ({ label, icon: Icon, isOpen, toggleOpen, children, isActive }) => {
    return (
      <div className="flex flex-col space-y-1">
        <button
          onClick={toggleOpen}
          title={isCollapsed ? label : undefined}
          className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full ${
            isActive && !isOpen 
              ? 'bg-slate-800 text-blue-400 font-semibold' 
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          } ${isCollapsed ? 'justify-center px-2.5' : ''}`}
        >
          <div className="flex items-center gap-3 truncate">
            <Icon 
              size={19} 
              className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'
              }`} 
            />
            {!isCollapsed && <span className="truncate">{label}</span>}
          </div>
          {!isCollapsed && (
            <ChevronDown 
              size={16} 
              className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} 
            />
          )}
        </button>

        {/* Dropdown Content */}
        {isOpen && !isCollapsed && (
          <div className="pl-4 pr-1 flex flex-col space-y-1 mt-1 border-l border-slate-800/80 ml-5 py-0.5">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside 
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 text-white shadow-2xl transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:w-20' : 'lg:w-72'
        } ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Branding Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-600/30 shrink-0">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col truncate">
                <span className="text-base font-extrabold tracking-tight text-white leading-tight">
                  Smart Presensi
                </span>
                <span className="text-[10px] font-semibold text-blue-400 tracking-wider uppercase">
                  Diskominfo AI Gate
                </span>
              </div>
            )}
          </div>

          {/* Close Mobile Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Clusters */}
        <div className="flex-1 py-5 px-3 space-y-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
          
          {/* CLUSTER: MAIN */}
          <div className="flex flex-col space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-1">
                Main
              </p>
            )}
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          </div>

          {/* CLUSTER: MANAJEMEN PERSONEL */}
          <div className="flex flex-col space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-1">
                Personel
              </p>
            )}
            <NavDropdown 
              label="Data Pegawai" 
              icon={Users} 
              isOpen={personelOpen} 
              toggleOpen={() => setPersonelOpen(!personelOpen)}
              isActive={location.pathname.startsWith('/manage') || location.pathname.startsWith('/register')}
            >
              <NavItem to="/manage-asn" icon={UserSquare2} label="Data ASN" badge="ASN" />
              <NavItem to="/manage-non-asn" icon={UserSquare2} label="Data Non-ASN" badge="Non-ASN" />
              <NavItem to="/register" icon={UserPlus} label="Pendaftaran Wajah" />
            </NavDropdown>
          </div>

          {/* CLUSTER: KEGIATAN */}
          <div className="flex flex-col space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-1">
                Kegiatan Luar
              </p>
            )}
            <NavItem to="/kegiatan" icon={CalendarDays} label="Jadwal Kegiatan" />
          </div>

          {/* CLUSTER: LAPORAN PRESENSI */}
          <div className="flex flex-col space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-1">
                Laporan
              </p>
            )}
            <NavDropdown 
              label="Rekapitulasi" 
              icon={ClipboardList} 
              isOpen={laporanOpen} 
              toggleOpen={() => setLaporanOpen(!laporanOpen)}
              isActive={location.pathname.startsWith('/laporan')}
            >
              <NavItem to="/laporan/asn" icon={FileText} label="Harian ASN" badge="ASN" />
              <NavItem to="/laporan/non-asn" icon={FileText} label="Harian Non-ASN" badge="Non-ASN" />
              <NavItem to="/laporan-kegiatan" icon={FileText} label="Kegiatan Instansi" />
            </NavDropdown>
          </div>

          {/* CLUSTER: SISTEM (Super Admin only) */}
          {userRole === 'super_admin' && (
            <div className="flex flex-col space-y-1">
              {(!isCollapsed || isMobileOpen) && (
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-1">
                  Sistem & Konfigurasi
                </p>
              )}
              <NavDropdown 
                label="Konfigurasi" 
                icon={Settings} 
                isOpen={sistemOpen} 
                toggleOpen={() => setSistemOpen(!sistemOpen)}
                isActive={location.pathname.startsWith('/master-data') || location.pathname === '/settings' || location.pathname === '/audit-trail'}
              >
                <NavItem to="/master-data/opd" icon={Building2} label="Master OPD" />
                <NavItem to="/master-data/devices" icon={MonitorSmartphone} label="Konfigurasi Kiosk" />
                <NavItem to="/master-data/admin" icon={UserCog} label="Data Admin" />
                <NavItem to="/settings" icon={SlidersHorizontal} label="Pengaturan Jam & Libur" />
                <NavItem to="/audit-trail" icon={History} label="Audit Trail" />
              </NavDropdown>
            </div>
          )}

        </div>

        {/* Footer / Quick Logout Button */}
        <div className="p-3 border-t border-slate-800/80 shrink-0">
          <button
            onClick={onLogout}
            title="Keluar"
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 border border-red-500/20 hover:border-transparent transition-all shadow-sm ${
              isCollapsed && !isMobileOpen ? 'justify-center px-2' : ''
            }`}
          >
            <LogOut size={18} className="shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span>Logout</span>}
          </button>
        </div>

      </aside>
    </>
  );
};

export default Navbar;