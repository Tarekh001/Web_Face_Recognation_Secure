import { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [reports, setReports] = useState([]);

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
    const interval = setInterval(fetchReports, 5000); // Update setiap 5 detik
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="p-8 w-full bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Laporan Presensi Hari Ini</h1>
        <p className="text-gray-500">Monitoring kehadiran ASN secara real-time</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-sm">
            <tr>
              <th className="px-6 py-4">NIP</th>
              <th className="px-6 py-4">Nama ASN</th>
              <th className="px-6 py-4">Waktu Scan</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reports.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-gray-500 font-medium">{log.nip}</td>
                <td className="px-6 py-4 text-gray-500">{log.nama}</td>
                <td className="px-6 py-4 text-gray-500">{log.waktu}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    log.tipe === 'masuk' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {log.tipe.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default Dashboard;