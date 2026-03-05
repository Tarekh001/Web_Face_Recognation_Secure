import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Users, UserCheck, UserX, LogOut, 
  Search, Trash2, Edit, Clock, UserCircle2 
} from 'lucide-react';

const ManageASN = () => {
  const [asnList, setAsnList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Jam Real-time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchASNData = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.get('http://127.0.0.1:5000/api/manage-asn', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAsnList(res.data);
    } catch (err) {
      console.error("Gagal mengambil data manajemen ASN");
    }
  };

  useEffect(() => {
    fetchASNData();
    const interval = setInterval(fetchASNData, 10000); // Update otomatis tiap 10 detik
    return () => clearInterval(interval);
  }, []);

  // Filter Search
  const filteredASN = asnList.filter(asn => 
    asn.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
    asn.nip.includes(searchQuery)
  );

  // Kalkulasi Quick Wins
  const totalASN = asnList.length;
  const sudahHadir = asnList.filter(a => a.status_hari_ini === "Sudah Hadir").length;
  const belumHadir = asnList.filter(a => a.status_hari_ini === "Belum Hadir").length;
  const sudahKeluar = asnList.filter(a => a.status_hari_ini === "Sudah Keluar").length;

  const handleDelete = async (id, nama) => {
    if(window.confirm(`Yakin ingin menghapus data ASN: ${nama}? Semua data wajah dan presensinya akan ikut terhapus.`)) {
      const token = localStorage.getItem('access_token');
      try {
        await axios.delete(`http://127.0.0.1:5000/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Data berhasil dihapus!");
        fetchASNData(); // Refresh tabel
      } catch (err) {
        alert("Gagal menghapus data.");
      }
    }
  };

  // Komponen Kartu Ringkasan
  const SummaryCard = ({ title, count, icon, color, bgColor, textColor }) => (
    <div className={`p-6 rounded-xl shadow-sm border-l-4 ${color} ${bgColor} flex items-center justify-between`}>
      <div>
        <p className={`text-sm font-bold ${textColor} uppercase tracking-wider mb-1`}>{title}</p>
        <h3 className="text-3xl font-extrabold text-gray-800">{count}</h3>
      </div>
      <div className={`p-3 rounded-full ${color.replace('border-', 'bg-').replace('500', '100')} ${textColor}`}>
        {icon}
      </div>
    </div>
  );

  // Format Tanggal Indonesia
  const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  return (
    <main className="p-8 w-full h-full">
      {/* Header & Real-time Clock */}
      <div className="flex justify-between items-end border-b-2 border-gray-300 pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manajemen ASN</h1>
          <p className="text-gray-500 mt-1">Kelola data pegawai aktif dan pantau status harian</p>
        </div>
        <div className="text-right bg-white px-5 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
          <Clock className="text-blue-500" size={24} />
          <div>
            <p className="text-sm font-semibold text-gray-500">
              {currentTime.toLocaleDateString('id-ID', optionsDate)}
            </p>
            <p className="text-xl font-bold text-gray-800 tracking-widest">
              {currentTime.toLocaleTimeString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Wins (Summary Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <SummaryCard title="Total Terdaftar" count={totalASN} icon={<Users size={28} />} color="border-green-500" bgColor="bg-white" textColor="text-green-600" />
        <SummaryCard title="Hadir (Aktif)" count={sudahHadir} icon={<UserCheck size={28} />} color="border-blue-500" bgColor="bg-white" textColor="text-blue-600" />
        <SummaryCard title="Sudah Pulang" count={sudahKeluar} icon={<LogOut size={28} />} color="border-yellow-500" bgColor="bg-white" textColor="text-yellow-600" />
        <SummaryCard title="Belum Hadir" count={belumHadir} icon={<UserX size={28} />} color="border-red-500" bgColor="bg-white" textColor="text-red-600" />
      </div>

      {/* Toolbar & Tabel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-320px)]">
        
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari NIP atau Nama ASN..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#e9ecef] text-gray-700 text-sm font-semibold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 w-20 text-center">Profil</th>
                <th className="px-6 py-4">NIP</th>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Status Hari Ini</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-600">
              {filteredASN.length > 0 ? (
                filteredASN.map((asn) => (
                  <tr key={asn.id} className="hover:bg-blue-50/50 transition duration-150">
                    <td className="px-6 py-4 text-center flex justify-center">
                      {/* Placeholder Foto Profil */}
                      {asn.avatar_url ? (
                        <img src={asn.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                          <UserCircle2 size={24} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">{asn.nip}</td>
                    <td className="px-6 py-4 font-semibold">{asn.nama}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center w-max gap-1.5 ${
                        asn.status_hari_ini === 'Sudah Hadir' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                        asn.status_hari_ini === 'Sudah Keluar' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                        'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          asn.status_hari_ini === 'Sudah Hadir' ? 'bg-blue-500' : 
                          asn.status_hari_ini === 'Sudah Keluar' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></span>
                        {asn.status_hari_ini}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button className="text-blue-500 hover:text-blue-700 transition" title="Edit Data">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(asn.id, asn.nama)} className="text-red-500 hover:text-red-700 transition" title="Hapus Data">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-400">
                    Tidak ada data ASN yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
};

export default ManageASN;