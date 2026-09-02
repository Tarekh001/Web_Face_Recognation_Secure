import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FaceScan from './pages/FaceScan';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterUser from './pages/RegisterUser';
import Navbar from './components/NavBar';
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

// Layout wrapper untuk halaman admin
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
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-800">
      {/* Collapsible & Mobile Sidebar */}
      <Navbar 
        isCollapsed={isCollapsed} 
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
        <main className="flex-1 overflow-y-auto bg-slate-50/70">
          {children}
        </main>
      </div>
    </div>
  );
};

// Global Axios Interceptor for 401 Unauthorized responses
axios.interceptors.response.use(
    (response) => response, 
    (error) => {
        if (error.response && error.response.status === 401) {
            Swal.fire({
                icon: 'warning',
                title: 'Sesi Telah Habis',
                text: 'Sesi Anda telah berakhir. Silakan login kembali untuk keamanan.',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Login Ulang',
                allowOutsideClick: false
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
        <Route path="/face-scan" element={<FaceScan />} />
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Jalur Privat: Admin OPD & Super Admin */}
        <Route path="/dashboard" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/register" element={<ProtectedRoute><AdminLayout><RegisterUser /></AdminLayout></ProtectedRoute>} />
        <Route path="/manage-asn" element={<ProtectedRoute><AdminLayout><ManageASN /></AdminLayout></ProtectedRoute>} />
        <Route path="/manage-non-asn" element={<ProtectedRoute><AdminLayout><ManageNonASN /></AdminLayout></ProtectedRoute>} />
        <Route path="/kegiatan" element={<ProtectedRoute><AdminLayout><JadwalKegiatan /></AdminLayout></ProtectedRoute>} />
        <Route path="/laporan-kegiatan" element={<ProtectedRoute><AdminLayout><LaporanKegiatan /></AdminLayout></ProtectedRoute>} />
        <Route path="/laporan/asn" element={<ProtectedRoute><AdminLayout><ReportAsn /></AdminLayout></ProtectedRoute>} />
        <Route path="/laporan/non-asn" element={<ProtectedRoute><AdminLayout><ReportNonAsn /></AdminLayout></ProtectedRoute>} />

        {/* Jalur Super Admin: Master Data — masing-masing komponen terpisah */}
        <Route path="/master-data" element={<SuperAdminRoute><AdminLayout><OpdPage /></AdminLayout></SuperAdminRoute>} />
        <Route path="/master-data/opd" element={<SuperAdminRoute><AdminLayout><OpdPage /></AdminLayout></SuperAdminRoute>} />
        <Route path="/master-data/admin" element={<SuperAdminRoute><AdminLayout><AdminPage /></AdminLayout></SuperAdminRoute>} />
        <Route path="/master-data/devices" element={<SuperAdminRoute><AdminLayout><DevicePage /></AdminLayout></SuperAdminRoute>} />

        {/* Jalur Super Admin: Audit Trail */}
        <Route path="/audit-trail" element={<SuperAdminRoute><AdminLayout><AuditPage /></AdminLayout></SuperAdminRoute>} />

        {/* Jalur Super Admin: Pengaturan Sistem */}
        <Route path="/settings" element={<SuperAdminRoute><AdminLayout><SettingsPage /></AdminLayout></SuperAdminRoute>} />
      </Routes>
    </Router>
  );
}

export default App;