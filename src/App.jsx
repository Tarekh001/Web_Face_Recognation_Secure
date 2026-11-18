import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterUser from './pages/RegisterUser';
import Navbar from './components/Navbar';
import ManageASN from './pages/ManageASN';
import ManageNonASN from './pages/ManageNonASN';
import OpdPage from './pages/OpdPage';
import AdminPage from './pages/AdminPage';
import DevicePage from './pages/DevicePage';
import AuditPage from './pages/AuditPage';
import SettingsPage from './pages/SettingsPage';
import JadwalKegiatan from './pages/JadwalKegiatan';
import LaporanKegiatan from './pages/LaporanKegiatan';
import ReportAsn from './pages/ReportAsn';
import ReportNonAsn from './pages/ReportNonAsn';
import JamKerjaPage from './pages/JamKerjaPage';
import SpotSyncPage from './pages/SpotSyncPage';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useState } from 'react';
import Header from './components/Header';
import useAutoLogout from './hooks/useAutoLogout';

// Komponen Pelindung Standar: Harus punya token
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
};

// Komponen Pelindung Khusus: Harus Super Admin
const SuperAdminRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('user_role');
  if (!token) return <Navigate to="/login" />;
  if (role !== 'super_admin') return <Navigate to="/dashboard" replace />;
  return children;
};

// Layout wrapper untuk halaman admin dengan lebar kontainer seragam di seluruh menu
const AdminLayout = ({ children }) => {
  useAutoLogout();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_nip');
    localStorage.removeItem('user_username');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-dvh min-h-dvh w-full bg-[#F3F6FA] overflow-hidden font-sans text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-blue-700 focus:text-white focus:text-xs focus:font-bold shadow-modal"
      >
        Lewati ke konten utama
      </a>

      {/* Collapsible & Mobile Sidebar */}
      <Navbar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          onLogout={handleLogout}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] bg-[#F3F6FA] p-4 sm:p-6 lg:px-8 lg:py-6 outline-none"
        >
          <div className="w-full max-w-[1600px] mx-auto">{children}</div>
        </main>
        <footer className="shrink-0 px-4 sm:px-6 lg:px-8 py-2.5 bg-white border-t border-[#DCE3EC] flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-slate-600">
          <span>Pemerintah Kabupaten Tangerang: Dinas Komunikasi dan Informatika</span>
          <span className="hidden sm:inline font-semibold text-slate-700">
            Sistem Manajemen Presensi Biometrik
          </span>
        </footer>
      </div>
    </div>
  );
};

// Global Axios Interceptor untuk respons 401 Unauthorized
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      Swal.fire({
        icon: 'warning',
        title: 'Sesi Telah Berakhir',
        text: 'Sesi otentikasi Anda telah habis. Silakan masuk kembali untuk melanjutkan.',
        confirmButtonColor: '#1D4ED8',
        confirmButtonText: 'Masuk Kembali',
        allowOutsideClick: false,
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_role');
          localStorage.removeItem('user_nip');
          localStorage.removeItem('user_username');
          window.location.href = '/login';
        }
      });
    }
    return Promise.reject(error);
  }
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Jalur Publik */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Jalur Privat: Admin OPD & Super Admin */}
        <Route path="/dashboard" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/register" element={<ProtectedRoute><AdminLayout><RegisterUser /></AdminLayout></ProtectedRoute>} />
        <Route path="/manage-asn" element={<ProtectedRoute><AdminLayout><ManageASN /></AdminLayout></ProtectedRoute>} />
        <Route path="/manage-non-asn" element={<ProtectedRoute><AdminLayout><ManageNonASN /></AdminLayout></ProtectedRoute>} />
        <Route path="/jam-kerja" element={<ProtectedRoute><AdminLayout><JamKerjaPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/kegiatan" element={<ProtectedRoute><AdminLayout><JadwalKegiatan /></AdminLayout></ProtectedRoute>} />
        <Route path="/laporan-kegiatan" element={<ProtectedRoute><AdminLayout><LaporanKegiatan /></AdminLayout></ProtectedRoute>} />
        <Route path="/laporan/asn" element={<ProtectedRoute><AdminLayout><ReportAsn /></AdminLayout></ProtectedRoute>} />
        <Route path="/laporan/non-asn" element={<ProtectedRoute><AdminLayout><ReportNonAsn /></AdminLayout></ProtectedRoute>} />

        {/* Jalur Super Admin: Master Data */}
        <Route path="/master-data" element={<SuperAdminRoute><AdminLayout><OpdPage /></AdminLayout></SuperAdminRoute>} />
        <Route path="/master-data/opd" element={<SuperAdminRoute><AdminLayout><OpdPage /></AdminLayout></SuperAdminRoute>} />
        <Route path="/master-data/admin" element={<SuperAdminRoute><AdminLayout><AdminPage /></AdminLayout></SuperAdminRoute>} />
        <Route path="/master-data/devices" element={<SuperAdminRoute><AdminLayout><DevicePage /></AdminLayout></SuperAdminRoute>} />
        <Route path="/master-data/spot-sync" element={<SuperAdminRoute><AdminLayout><SpotSyncPage /></AdminLayout></SuperAdminRoute>} />

        {/* Jalur Super Admin: Log Audit & Pengaturan Sistem */}
        <Route path="/audit-trail" element={<SuperAdminRoute><AdminLayout><AuditPage /></AdminLayout></SuperAdminRoute>} />
        <Route path="/settings" element={<SuperAdminRoute><AdminLayout><SettingsPage /></AdminLayout></SuperAdminRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
