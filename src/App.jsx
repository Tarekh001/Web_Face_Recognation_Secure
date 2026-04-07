import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FaceScan from './pages/FaceScan';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterUser from './pages/RegisterUser';
import Navbar from './components/NavBar';
import ManageASN from './pages/ManageASN';
import MasterData from './pages/MasterData'; // Kita akan buat file ini selanjutnya

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
  if (role !== 'super_admin') return <Navigate to="/dashboard" replace />; // Usir ke dashboard
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Jalur Publik: Untuk ASN absen */}
        <Route path="/" element={<FaceScan />} />
        
        {/* Jalur Login Admin */}
        <Route path="/login" element={<Login />} />

        {/* Jalur Privat: Dashboard Admin & Registrasi */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div className="flex h-screen w-full bg-[#f4f7f6] overflow-hidden">
              <Navbar /> 
              <div className="flex-1 h-full overflow-y-auto">
                <Dashboard />
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/register" element={
          <ProtectedRoute>
            <div className="flex h-screen w-full bg-[#f4f7f6] overflow-hidden">
              <Navbar />
              <div className="flex-1 h-full overflow-y-auto">
                <RegisterUser />
              </div>
            </div>
          </ProtectedRoute>
        } />

        <Route path="/manage-asn" element={
          <ProtectedRoute>
            <div className="flex h-screen w-full bg-[#f4f7f6] overflow-hidden">
              <Navbar />
              <div className="flex-1 h-full overflow-y-auto">
                <ManageASN />
              </div>
            </div>
          </ProtectedRoute>
        } />

        {/* JALUR SUPER ADMIN KHUSUS: MASTER DATA */}
        <Route path="/master-data" element={
          <SuperAdminRoute>
            <div className="flex h-screen w-full bg-[#f4f7f6] overflow-hidden">
              <Navbar />
              <div className="flex-1 h-full overflow-y-auto">
                <MasterData />
              </div>
            </div>
          </SuperAdminRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;