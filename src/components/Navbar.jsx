import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  LogOut,
  Users,
  Building2,
  UserCog,
  MonitorSmartphone,
  ChevronDown,
  History,
  Settings,
  CalendarDays,
  ClipboardList,
  UserSquare2,
  FileText,
  SlidersHorizontal,
  X,
  Clock,
  RefreshCw,
} from 'lucide-react';
import logoKab from '../assets/Kab_Tangerang.png';
import { useModalEscape } from './UiFeedback';

const Navbar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen, onLogout }) => {
  const location = useLocation();

  const [personelOpen, setPersonelOpen] = useState(
    location.pathname.startsWith('/manage') ||
      location.pathname.startsWith('/register') ||
      location.pathname.startsWith('/jam-kerja')
  );
  const [laporanOpen, setLaporanOpen] = useState(location.pathname.startsWith('/laporan'));
  const [sistemOpen, setSistemOpen] = useState(
    location.pathname.startsWith('/master-data') ||
      location.pathname === '/settings' ||
      location.pathname === '/audit-trail'
  );

  useEffect(() => {
    if (setIsMobileOpen) setIsMobileOpen(false);
  }, [location.pathname, setIsMobileOpen]);

  useModalEscape(Boolean(isMobileOpen), () => {
    if (setIsMobileOpen) setIsMobileOpen(false);
  });

  const userRole = localStorage.getItem('user_role');
  const isActiveRoute = (path) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label, badge }) => {
    const active = isActiveRoute(to);
    return (
      <Link
        to={to}
        title={isCollapsed ? label : undefined}
        aria-current={active ? 'page' : undefined}
        className={`group relative flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-xl text-[13px] transition-all duration-150 ${
          active
            ? 'bg-blue-700 text-white font-bold shadow-btn-primary'
            : 'text-slate-300 font-medium hover:bg-white/[0.06] hover:text-white'
        } ${isCollapsed && !isMobileOpen ? 'justify-center px-2.5' : ''}`}
      >
        <Icon
          size={18}
          aria-hidden="true"
          className={`shrink-0 transition-colors ${
            active ? 'text-white' : 'text-slate-400 group-hover:text-white'
          }`}
        />

        {(!isCollapsed || isMobileOpen) && (
          <div className="flex-1 flex items-center justify-between gap-2 truncate">
            <span className="truncate">{label}</span>
            {badge && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                  active
                    ? 'bg-blue-900/80 text-white border border-blue-400/50'
                    : badge === 'ASN'
                      ? 'bg-slate-800/90 text-blue-200 border border-slate-700'
                      : 'bg-slate-800/90 text-amber-200 border border-slate-700'
                }`}
              >
                {badge}
              </span>
            )}
          </div>
        )}
      </Link>
    );
  };

  const NavDropdown = ({ label, icon: Icon, isOpen, toggleOpen, children, isActive }) => {
    const handleClick = () => {
      if (isCollapsed && !isMobileOpen && setIsCollapsed) {
        setIsCollapsed(false);
        if (!isOpen) toggleOpen();
        return;
      }
      toggleOpen();
    };
    return (
      <div className="flex flex-col space-y-1">
        <button
          type="button"
          onClick={handleClick}
          aria-expanded={isOpen}
          title={isCollapsed ? label : undefined}
          className={`group flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-xl text-[13px] transition-all duration-150 w-full ${
            isActive && !isOpen
              ? 'bg-white/[0.08] text-white font-bold border border-white/10'
              : 'text-slate-300 font-medium hover:bg-white/[0.06] hover:text-white'
          } ${isCollapsed && !isMobileOpen ? 'justify-center px-2.5' : ''}`}
        >
          <div className="flex items-center gap-3 truncate">
            <Icon
              size={18}
              aria-hidden="true"
              className={`shrink-0 transition-colors ${
                isActive ? 'text-sky-300' : 'text-slate-400 group-hover:text-white'
              }`}
            />
            {(!isCollapsed || isMobileOpen) && <span className="truncate">{label}</span>}
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                isOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          )}
        </button>

        {isOpen && (!isCollapsed || isMobileOpen) && (
          <div className="pl-3 pr-0.5 flex flex-col space-y-1 mt-1 border-l border-slate-700/80 ml-5 py-0.5">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/65 z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Navigasi utama portal admin"
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0B1120] border-r border-slate-800/90 text-white transition-all duration-200 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-[276px]'
        } ${isMobileOpen ? 'translate-x-0 w-[276px] shadow-modal' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header Identitas Instansi */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/90 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-center p-1.5 shrink-0">
              <img
                src={logoKab}
                alt="Lambang Kabupaten Tangerang"
                width="28"
                height="28"
                fetchPriority="high"
                className="w-7 h-7 object-contain"
              />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-extrabold tracking-tight text-white leading-tight truncate">
                  Smart Presensi
                </span>
                <span className="text-[11px] font-semibold text-slate-300 leading-tight truncate mt-0.5">
                  Pemkab Tangerang
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Tutup menu navigasi"
            className="lg:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Kelompok Menu Navigasi */}
        <nav className="flex-1 py-5 px-3 space-y-5 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-1">
                Menu Utama
              </p>
            )}
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard Utama" />
          </div>

          <div className="flex flex-col space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-1">
                Kepegawaian
              </p>
            )}
            <NavDropdown
              label="Data Pegawai"
              icon={Users}
              isOpen={personelOpen}
              toggleOpen={() => setPersonelOpen(!personelOpen)}
              isActive={
                location.pathname.startsWith('/manage') ||
                location.pathname.startsWith('/register') ||
                location.pathname.startsWith('/jam-kerja')
              }
            >
              <NavItem to="/manage-asn" icon={UserSquare2} label="Data ASN" badge="ASN" />
              <NavItem to="/manage-non-asn" icon={UserSquare2} label="Data Non-ASN" badge="Non-ASN" />
              <NavItem to="/jam-kerja" icon={Clock} label="Jam Kerja & Shift" />
              <NavItem to="/register" icon={UserPlus} label="Pendaftaran Wajah" />
            </NavDropdown>
          </div>

          <div className="flex flex-col space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-1">
                Dinas Luar
              </p>
            )}
            <NavItem to="/kegiatan" icon={CalendarDays} label="Jadwal Kegiatan" />
          </div>

          <div className="flex flex-col space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-1">
                Pelaporan
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

          {userRole === 'super_admin' && (
            <div className="flex flex-col space-y-1">
              {(!isCollapsed || isMobileOpen) && (
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-1">
                  Administrasi Sistem
                </p>
              )}
              <NavDropdown
                label="Konfigurasi"
                icon={Settings}
                isOpen={sistemOpen}
                toggleOpen={() => setSistemOpen(!sistemOpen)}
                isActive={
                  location.pathname.startsWith('/master-data') ||
                  location.pathname === '/settings' ||
                  location.pathname === '/audit-trail'
                }
              >
                <NavItem to="/master-data/opd" icon={Building2} label="Master OPD" />
                <NavItem to="/master-data/devices" icon={MonitorSmartphone} label="Perangkat Kiosk" />
                <NavItem to="/master-data/admin" icon={UserCog} label="Akun Admin OPD" />
                <NavItem to="/master-data/spot-sync" icon={RefreshCw} label="Sinkronisasi SPOT" />
                <NavItem to="/settings" icon={SlidersHorizontal} label="Jam Kiosk & Libur" />
                <NavItem to="/audit-trail" icon={History} label="Log Audit Sistem" />
              </NavDropdown>
            </div>
          )}
        </nav>

        {/* Tombol Keluar */}
        <div className="p-3 border-t border-slate-800/90 shrink-0">
          <button
            type="button"
            onClick={onLogout}
            title="Keluar dari sistem"
            aria-label="Keluar dari sistem"
            className={`w-full flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-xl text-[13px] font-bold text-red-300 hover:text-white bg-white/[0.04] hover:bg-red-700 border border-white/10 hover:border-red-700 transition-all duration-150 active:translate-y-px ${
              isCollapsed && !isMobileOpen ? 'justify-center px-2' : ''
            }`}
          >
            <LogOut size={18} className="shrink-0" aria-hidden="true" />
            {(!isCollapsed || isMobileOpen) && <span>Keluar Sistem</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Navbar;
