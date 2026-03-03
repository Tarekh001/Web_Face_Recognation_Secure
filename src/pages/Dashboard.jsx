import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Upload, ArrowUpDown, Search, Calendar } from 'lucide-react';

const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'waktu', direction: 'desc' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchReports = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.get('http://127.0.0.1:5000/api/report', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data);
    } catch (err) {
      console.error("Gagal mengambil laporan");
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 5000); 
    return () => clearInterval(interval);
  }, []);

  // --- LOGIKA FILTER & SORTING ---
  const processedData = useMemo(() => {
    let result = [...reports];

    // 1. Filter Nama / NIP
    if (searchQuery) {
      result = result.filter(r => 
        r.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.nip.includes(searchQuery)
      );
    }

    // 2. Filter Bulan (waktu format: "YYYY-MM-DD HH:MM:SS")
    if (selectedMonth) {
      result = result.filter(r => r.waktu.startsWith(selectedMonth));
    }

    // 3. Sorting
    result.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [reports, searchQuery, selectedMonth, sortConfig]);

  // --- LOGIKA PAGINATION ---
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const currentData = processedData.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- FITUR EXPORT CSV ---
  const handleExportCSV = () => {
    if (processedData.length === 0) return alert("Tidak ada data untuk diexport");
    
    // Header CSV
    let csvContent = "NIP,Nama ASN,Tanggal Absensi,Waktu Absensi,Status\n";
    
    // Data CSV
    processedData.forEach(row => {
      const tanggal = row.waktu.split(' ')[0];
      const jam = row.waktu.split(' ')[1];
      csvContent += `${row.nip},${row.nama},${tanggal},${jam},${row.tipe.toUpperCase()}\n`;
    });

    // Proses Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Laporan_Presensi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="p-8 w-full h-full">
      
      <div className="border-b-2 border-gray-300 pb-4 mb-6 flex justify-between items-end">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Laporan Presensi ASN</h1>
      </div>

      {/* Toolbar: Export, Search, Filter */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-[#005bb5] hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-semibold transition shadow-sm"
        >
          <Upload size={18} />
          Export CSV
        </button>

        <div className="flex gap-4 items-center w-full            ">
          {/* Pencarian */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari NIP atau Nama..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10 pr-4 py-2 bg bg-[#f5f5f5] border border-[#424242] rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64"
            />
          </div>

          {/* Filter Bulan */}
          <div className="relative flex items-center">
             <Calendar className="absolute left-3 text-gray-400" size={18} />
             <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
                className="pl-10 pr-4 py-2 bg bg-[#f5f5f5] border border-[#424242] rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-500"
             />
          </div>
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#e9ecef] text-gray-700 text-sm font-semibold">
            <tr>
              <th className="px-6 py-4">NIP</th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-gray-300 transition"
                onClick={() => handleSort('nama')}
              >
                <div className="flex items-center gap-2">Nama ASN <ArrowUpDown size={14} /></div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-gray-300 transition"
                onClick={() => handleSort('waktu')}
              >
                <div className="flex items-center gap-2">Tanggal Absensi <ArrowUpDown size={14} /></div>
              </th>
              <th className="px-6 py-4">Waktu Absensi</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-600">
            {currentData.length > 0 ? (
              currentData.map((log) => {
                const tanggal = log.waktu.split(' ')[0];
                const jam = log.waktu.split(' ')[1];
                return (
                  <tr key={log.id} className="hover:bg-blue-50/50 transition duration-150">
                    <td className="px-6 py-4 font-medium text-gray-800">{log.nip}</td>
                    <td className="px-6 py-4">{log.nama}</td>
                    <td className="px-6 py-4">{tanggal}</td>
                    <td className="px-6 py-4">{jam}</td>
                    <td className="px-6 py-4">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide ${
                        log.tipe === 'masuk' 
                        ? 'bg-[#d1e7dd] text-[#0f5132] border border-[#badbcc]' 
                        : 'bg-[#f8d7da] text-[#842029] border border-[#f5c2c7]'
                      }`}>
                        {log.tipe.charAt(0).toUpperCase() + log.tipe.slice(1)}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-400">Belum ada data presensi yang sesuai.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center text-sm text-gray-500">
          <p>Menampilkan Halaman {currentPage} dari {totalPages}</p>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

    </main>
  );
};

export default Dashboard;