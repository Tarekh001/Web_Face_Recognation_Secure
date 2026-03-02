import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FaceScan from './pages/FaceScan';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterUser from './pages/RegisterUser';
import Navbar from './components/Navbar';

// Komponen Pelindung: Hanya admin yang punya token yang bisa lewat
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
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
            <div className="flex">
              <Navbar /> {/* Sidebar Navigasi */}
              <Dashboard />
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/register" element={
          <ProtectedRoute>
            <div className="flex">
              <Navbar />
              <RegisterUser />
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;