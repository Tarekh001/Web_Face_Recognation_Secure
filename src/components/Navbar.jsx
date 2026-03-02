import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Hapus token dari memori browser
    localStorage.removeItem('access_token');
    // Arahkan kembali ke halaman login
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white w-64 min-h-screen p-6 flex flex-col">
      <div className="mb-10">
        <h2 className="text-xl font-bold text-blue-400">Smart Presensi</h2>
        <p className="text-xs text-gray-400">Diskominfo Tangerang</p>
      </div>

      <div className="flex flex-col gap-4 flex-grow">
        <Link to="/dashboard" className="hover:bg-gray-700 p-3 rounded transition">
          📊 Dashboard Laporan
        </Link>
        <Link to="/register" className="hover:bg-gray-700 p-3 rounded transition">
          📸 Tambah ASN Baru
        </Link>
        <Link to="/" className="hover:bg-gray-700 p-3 rounded transition text-gray-400 mt-4 border-t border-gray-700 pt-4">
          👁️ Ke Layar Scan Wajah
        </Link>
      </div>

      <button 
        onClick={handleLogout}
        className="mt-auto bg-red-600 hover:bg-red-700 p-3 rounded text-center font-bold transition"
      >
        Keluar (Logout)
      </button>
    </nav>
  );
};

export default Navbar;