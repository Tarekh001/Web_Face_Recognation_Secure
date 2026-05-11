import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FaceScan from './pages/FaceScan';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterUser from './pages/RegisterUser';
import Navbar from './components/NavBar';
import ManageASN from './pages/ManageASN';
import OpdPage from './pages/OpdPage';
import AdminPage from './pages/AdminPage';
import DevicePage from './pages/DevicePage';
import AuditPage from './pages/AuditPage';
import SettingsPage from './pages/SettingsPage';

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
const AdminLayout = ({ children }) => (
  <div className="flex h-screen w-full bg-[#f4f7f6] overflow-hidden">
    <Navbar />
    <div className="flex-1 h-full overflow-y-auto">
      {children}
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Jalur Publik */}
        <Route path="/" element={<FaceScan />} />
        <Route path="/login" element={<Login />} />

        {/* Jalur Privat: Admin OPD & Super Admin */}
        <Route path="/dashboard" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/register" element={<ProtectedRoute><AdminLayout><RegisterUser /></AdminLayout></ProtectedRoute>} />
        <Route path="/manage-asn" element={<ProtectedRoute><AdminLayout><ManageASN /></AdminLayout></ProtectedRoute>} />

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