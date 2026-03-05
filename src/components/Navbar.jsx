import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, UserPlus, ScanFace, LogOut, UserCircle, Users } from 'lucide-react';


const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Report Dashboard', icon: <LayoutDashboard size={20} className='text-white' /> },
    { path: '/manage-asn', label: 'Daftar ASN', icon: <Users size={20} /> },
    { path: '/register', label: 'Add new ASN', icon: <UserPlus size={20} className='text-white' /> },
    { path: '/', label: 'Presensi ASN', icon: <ScanFace size={20} className='text-white' /> },
  ];

  return (
    <nav className="bg-[#0057A4] text-white w-72 min-h-screen flex flex-col shadow-xl">
      {/* Header & Profile */}
      <div className="flex flex-col items-center pt-8 pb-6 border-b border-blue-400/30">
        <h2 className="text-xl font-extrabold tracking-wide">Smart Presensi</h2>
        <p className="text-xs text-blue-200 mb-6">Diskominfo Tangerangkab</p>
        
        <UserCircle size={64} strokeWidth={1.5} className="text-white mb-2" />
        <p className="text-sm font-medium">admin001@diskominfo.go.id</p>
      </div>

      {/* Menu Links */}
      <div className="flex flex-col flex-grow py-6">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`text-[#f5f5f5] text-xs flex items-start gap-4 px-8 py-4 font-semibold transition ${
              location.pathname === item.path 
                ? 'bg-[#0074BA] border-l-4 border-white' 
                : 'hover:bg-[#0074BA] border-l-4 border-transparent'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
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