import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FaceScan from './pages/FaceScan';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterUser from './pages/RegisterUser';
import Navbar from './components/NavBar';

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
            {/* Kunci tampilan di sini: h-screen dan w-full */}
            <div className="flex h-screen w-full bg-[#f4f7f6] overflow-hidden">
              <Navbar /> 
              {/* flex-1 akan membuat area ini mengisi seluruh sisa layar di sebelah kanan Navbar */}
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
      </Routes>
    </Router>
  );
}

export default App;