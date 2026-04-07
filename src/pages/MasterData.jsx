import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, MonitorSmartphone, UserCog, History } from 'lucide-react';

const MasterData = () => {
  const [activeTab, setActiveTab] = useState('opd');
  const [opds, setOpds] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  // Form States
  const [formOpd, setFormOpd] = useState({ nama_opd: '', kode_opd: '' });
  const [formAdmin, setFormAdmin] = useState({ nip: '', nama: '', password: '', opd_id: '' });
  const [formDevice, setFormDevice] = useState({ sn: '', opd_id: '', nama_lokasi: '' });

  const token = localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const [resOpd, resAdmin, resDevice, resAudit] = await Promise.all([
        axios.get('http://127.0.0.1:5000/api/opd', { headers }),
        axios.get('http://127.0.0.1:5000/api/admins', { headers }),
        axios.get('http://127.0.0.1:5000/api/devices', { headers }),
        axios.get('http://127.0.0.1:5000/api/audit-logs', { headers })
      ]);
      setOpds(resOpd.data);
      setAdmins(resAdmin.data);
      setDevices(resDevice.data);
      setAuditLogs(resAudit.data);
    } catch (error) {
      console.error("Gagal mengambil data master", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers ---
  const handleAddOPD = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post('http://127.0.0.1:5000/api/opd', formOpd, { headers });
      alert("OPD Berhasil Ditambahkan!");
      setFormOpd({ nama_opd: '', kode_opd: '' });
      fetchData();
    } catch (err) {
      alert("Gagal menambahkan OPD");
    } finally { setIsLoading(false); }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post('http://127.0.0.1:5000/api/admin/add', formAdmin, { headers });
      alert("Admin OPD Berhasil Dibuat!");
      setFormAdmin({ nip: '', nama: '', password: '', opd_id: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal membuat Admin");
    } finally { setIsLoading(false); }
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post('http://127.0.0.1:5000/api/devices', formDevice, { headers });
      alert("Mesin Berhasil Didaftarkan!");
      setFormDevice({ sn: '', opd_id: '', nama_lokasi: '' });
      fetchData();
    } catch (err) {
      alert("Gagal mendaftarkan mesin");
    } finally { setIsLoading(false); }
  };

  return (
    <div className="p-8 w-full max-w-6xl mx-auto">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Pusat Kendali Sistem</h1>
      <p className="text-gray-500 mb-8">Manajemen Instansi, Operator, dan Perangkat Keras Kabupaten Tangerang</p>

      {/* Tabs Navigation */}
      <div className="flex space-x-4 mb-6 border-b pb-3">
        <button onClick={() => setActiveTab('opd')} className={`flex items-center gap-2 px-4 py-2 font-bold rounded-lg transition ${activeTab === 'opd' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}>
          <Building2 size={18} /> Instansi (OPD)
        </button>
        <button onClick={() => setActiveTab('admin')} className={`flex items-center gap-2 px-4 py-2 font-bold rounded-lg transition ${activeTab === 'admin' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}>
          <UserCog size={18} /> Admin OPD
        </button>
        <button onClick={() => setActiveTab('device')} className={`flex items-center gap-2 px-4 py-2 font-bold rounded-lg transition ${activeTab === 'device' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}>
          <MonitorSmartphone size={18} /> Mesin Pemindai
        </button>
        <button onClick={() => setActiveTab('audit')} className={`flex items-center gap-2 px-4 py-2 font-bold rounded-lg transition ${activeTab === 'audit' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}>
          <History size={18} /> Audit Trail
        </button>
      </div>

      {/* TABS CONTENT */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        
        {/* TAB 1: OPD */}
        {activeTab === 'opd' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-gray-50 p-5 rounded-lg border">
              <h3 className="font-bold text-gray-700 mb-4">Tambah OPD Baru</h3>
              <form onSubmit={handleAddOPD} className="flex flex-col gap-3">
                <input type="text" placeholder="Kode OPD (ex: OPD-002)" required value={formOpd.kode_opd} onChange={e => setFormOpd({...formOpd, kode_opd: e.target.value})} className="p-2 border rounded" />
                <input type="text" placeholder="Nama Instansi" required value={formOpd.nama_opd} onChange={e => setFormOpd({...formOpd, nama_opd: e.target.value})} className="p-2 border rounded" />
                <button type="submit" disabled={isLoading} className="bg-blue-600 text-white font-bold p-2 rounded hover:bg-blue-700">Simpan OPD</button>
              </form>
            </div>
            <div className="md:col-span-2">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-gray-100"><th className="p-3 border-b">Kode</th><th className="p-3 border-b">Nama Instansi</th></tr></thead>
                <tbody>
                  {opds.map(o => <tr key={o.id} className="border-b hover:bg-gray-50"><td className="p-3 font-medium">{o.kode}</td><td className="p-3">{o.nama}</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ADMIN OPD */}
        {activeTab === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-gray-50 p-5 rounded-lg border">
              <h3 className="font-bold text-gray-700 mb-4">Buat Akun Admin</h3>
              <form onSubmit={handleAddAdmin} className="flex flex-col gap-3">
                <input type="text" placeholder="NIP / Username" required value={formAdmin.nip} onChange={e => setFormAdmin({...formAdmin, nip: e.target.value})} className="p-2 border rounded" />
                <input type="text" placeholder="Nama Lengkap" required value={formAdmin.nama} onChange={e => setFormAdmin({...formAdmin, nama: e.target.value})} className="p-2 border rounded" />
                <input type="password" placeholder="Password Login" required value={formAdmin.password} onChange={e => setFormAdmin({...formAdmin, password: e.target.value})} className="p-2 border rounded" />
                <select required value={formAdmin.opd_id} onChange={e => setFormAdmin({...formAdmin, opd_id: e.target.value})} className="p-2 border rounded">
                  <option value="" disabled>Pilih Penempatan Instansi</option>
                  {opds.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                </select>
                <button type="submit" disabled={isLoading} className="bg-blue-600 text-white font-bold p-2 rounded hover:bg-blue-700">Buat Akun</button>
              </form>
            </div>
            <div className="md:col-span-2">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-gray-100"><th className="p-3 border-b">NIP/Username</th><th className="p-3 border-b">Nama Admin</th><th className="p-3 border-b">Wilayah Instansi</th></tr></thead>
                <tbody>
                  {admins.map(a => <tr key={a.id} className="border-b hover:bg-gray-50"><td className="p-3 font-medium">{a.nip}</td><td className="p-3">{a.nama}</td><td className="p-3 text-blue-600 font-semibold">{a.opd}</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DEVICE (MESIN) */}
        {activeTab === 'device' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-gray-50 p-5 rounded-lg border">
              <h3 className="font-bold text-gray-700 mb-4">Daftarkan Mesin Kios</h3>
              <form onSubmit={handleAddDevice} className="flex flex-col gap-3">
                <input type="text" placeholder="Serial Number (SN) / ID Unik" required value={formDevice.sn} onChange={e => setFormDevice({...formDevice, sn: e.target.value})} className="p-2 border rounded" />
                <input type="text" placeholder="Detail Lokasi (Ex: Pintu Lobi Utama)" required value={formDevice.nama_lokasi} onChange={e => setFormDevice({...formDevice, nama_lokasi: e.target.value})} className="p-2 border rounded" />
                <select required value={formDevice.opd_id} onChange={e => setFormDevice({...formDevice, opd_id: e.target.value})} className="p-2 border rounded">
                  <option value="" disabled>Alokasikan ke Instansi</option>
                  {opds.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                </select>
                <button type="submit" disabled={isLoading} className="bg-blue-600 text-white font-bold p-2 rounded hover:bg-blue-700">Tautkan Mesin</button>
              </form>
            </div>
            <div className="md:col-span-2">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-gray-100"><th className="p-3 border-b">S/N Mesin</th><th className="p-3 border-b">Lokasi Penempatan</th><th className="p-3 border-b">Milik Instansi</th></tr></thead>
                <tbody>
                  {devices.map(d => <tr key={d.sn} className="border-b hover:bg-gray-50"><td className="p-3 font-mono text-sm">{d.sn}</td><td className="p-3">{d.lokasi}</td><td className="p-3 font-semibold text-gray-600">{d.opd}</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div>
            <h3 className="font-bold text-gray-700 mb-4">Riwayat Aktivitas Sistem (100 Terakhir)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600">
                    <th className="p-3 border-b">Waktu</th>
                    <th className="p-3 border-b">Aksi</th>
                    <th className="p-3 border-b">Tabel Target</th>
                    <th className="p-3 border-b">Keterangan Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.log_id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-blue-600 font-medium whitespace-nowrap">{log.waktu}</td>
                      <td className="p-3 font-bold text-gray-700">{log.action}</td>
                      <td className="p-3"><span className="bg-gray-200 px-2 py-1 rounded text-xs">{log.target}</span></td>
                      <td className="p-3 text-gray-600">{log.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MasterData;