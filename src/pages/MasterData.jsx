import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, MonitorSmartphone, UserCog, History, Wifi, WifiOff, CheckCircle, XCircle, Pencil, Trash2, X } from 'lucide-react';

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
  const [formDevice, setFormDevice] = useState({ sn: '', name: '', opd_id: '', nama_lokasi: '' });

  // Edit Modal States
  const [editModal, setEditModal] = useState(null); // { type: 'opd'|'admin'|'device', data: {...} }

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

  // --- CREATE Handlers ---
  const handleAddOPD = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post('http://127.0.0.1:5000/api/opd', formOpd, { headers });
      alert("OPD Berhasil Ditambahkan!");
      setFormOpd({ nama_opd: '', kode_opd: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || "Gagal menambahkan OPD");
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
      alert(err.response?.data?.error || err.response?.data?.message || "Gagal membuat Admin");
    } finally { setIsLoading(false); }
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post('http://127.0.0.1:5000/api/devices', formDevice, { headers });
      alert("Mesin Berhasil Didaftarkan!");
      setFormDevice({ sn: '', name: '', opd_id: '', nama_lokasi: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || "Gagal mendaftarkan mesin");
    } finally { setIsLoading(false); }
  };

  // --- UPDATE Handlers ---
  const handleUpdate = async () => {
    if (!editModal) return;
    setIsLoading(true);
    try {
      const { type, data } = editModal;
      if (type === 'opd') {
        await axios.put(`http://127.0.0.1:5000/api/opd/${data.id}`, { nama_opd: data.nama, kode_opd: data.kode }, { headers });
      } else if (type === 'admin') {
        const payload = { nama: data.nama, opd_id: data.opd_id };
        if (data.password) payload.password = data.password;
        await axios.put(`http://127.0.0.1:5000/api/admins/${data.id}`, payload, { headers });
      } else if (type === 'device') {
        await axios.put(`http://127.0.0.1:5000/api/devices/${data.sn}`, data, { headers });
      }
      alert("Data berhasil diperbarui!");
      setEditModal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || "Gagal memperbarui data");
    } finally { setIsLoading(false); }
  };

  // --- DELETE Handlers ---
  const handleDeleteOPD = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus OPD "${nama}"?`)) return;
    try {
      await axios.delete(`http://127.0.0.1:5000/api/opd/${id}`, { headers });
      alert(`OPD "${nama}" berhasil dihapus!`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || "Gagal menghapus OPD");
    }
  };

  const handleDeleteAdmin = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus Admin "${nama}"?`)) return;
    try {
      await axios.delete(`http://127.0.0.1:5000/api/admins/${id}`, { headers });
      alert(`Admin "${nama}" berhasil dihapus!`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || "Gagal menghapus Admin");
    }
  };

  const handleDeleteDevice = async (sn) => {
    if (!confirm(`Yakin ingin menghapus Device SN "${sn}"?`)) return;
    try {
      await axios.delete(`http://127.0.0.1:5000/api/devices/${sn}`, { headers });
      alert(`Device "${sn}" berhasil dihapus!`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || "Gagal menghapus Device");
    }
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
        
        {/* ============ TAB 1: OPD ============ */}
        {activeTab === 'opd' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-gray-50 p-5 rounded-lg border">
              <h3 className="font-bold text-gray-700 mb-4">Tambah OPD Baru</h3>
              <form onSubmit={handleAddOPD} className="flex flex-col gap-3">
                <input type="text" placeholder="Kode OPD (ex: OPD-002)" required value={formOpd.kode_opd} onChange={e => setFormOpd({...formOpd, kode_opd: e.target.value})} className="p-2 border rounded" />
                <input type="text" placeholder="Nama Instansi" required value={formOpd.nama_opd} onChange={e => setFormOpd({...formOpd, nama_opd: e.target.value})} className="p-2 border rounded" />
                <button type="submit" disabled={isLoading} className="bg-blue-600 text-white font-bold p-2 rounded hover:bg-blue-700">{isLoading ? 'Menyimpan...' : 'Simpan OPD'}</button>
              </form>
            </div>
            <div className="md:col-span-2">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-gray-100"><th className="p-3 border-b">Kode</th><th className="p-3 border-b">Nama Instansi</th><th className="p-3 border-b text-center w-24">Aksi</th></tr></thead>
                <tbody>
                  {opds.map(o => (
                    <tr key={o.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{o.kode}</td>
                      <td className="p-3">{o.nama}</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => setEditModal({ type: 'opd', data: { id: o.id, nama: o.nama, kode: o.kode } })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Pencil size={15} /></button>
                          <button onClick={() => handleDeleteOPD(o.id, o.nama)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Hapus"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============ TAB 2: ADMIN OPD ============ */}
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
                <button type="submit" disabled={isLoading} className="bg-blue-600 text-white font-bold p-2 rounded hover:bg-blue-700">{isLoading ? 'Membuat...' : 'Buat Akun'}</button>
              </form>
            </div>
            <div className="md:col-span-2">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-gray-100"><th className="p-3 border-b">NIP/Username</th><th className="p-3 border-b">Nama Admin</th><th className="p-3 border-b">Wilayah Instansi</th><th className="p-3 border-b text-center w-24">Aksi</th></tr></thead>
                <tbody>
                  {admins.map(a => (
                    <tr key={a.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{a.nip}</td>
                      <td className="p-3">{a.nama}</td>
                      <td className="p-3 text-blue-600 font-semibold">{a.opd}</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => setEditModal({ type: 'admin', data: { id: a.id, nip: a.nip, nama: a.nama, opd_id: opds.find(o => o.nama === a.opd)?.id || '', password: '' } })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Pencil size={15} /></button>
                          <button onClick={() => handleDeleteAdmin(a.id, a.nama)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Hapus"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============ TAB 3: DEVICE (MESIN) ============ */}
        {activeTab === 'device' && (
          <div className="space-y-6">
            {/* --- FORM REGISTRASI DEVICE --- */}
            <div className="bg-gray-50 p-5 rounded-lg border">
              <h3 className="font-bold text-gray-700 mb-2">Daftarkan Mesin Kios Baru</h3>
              <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
                <Wifi size={13} /> IP Address, MAC Address, dan Platform akan <b>otomatis terisi</b> saat perangkat pertama kali terhubung ke server (Heartbeat).
              </p>
              <form onSubmit={handleAddDevice} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" placeholder="Serial Number (SN) *" required value={formDevice.sn} onChange={e => setFormDevice({...formDevice, sn: e.target.value})} className="p-2 border rounded" />
                <input type="text" placeholder="Nama Device (Ex: Kios Absen Diskominfo)" value={formDevice.name} onChange={e => setFormDevice({...formDevice, name: e.target.value})} className="p-2 border rounded" />
                <input type="text" placeholder="Lokasi Penempatan (Ex: Lobi Lantai 1) *" required value={formDevice.nama_lokasi} onChange={e => setFormDevice({...formDevice, nama_lokasi: e.target.value})} className="p-2 border rounded" />
                <select required value={formDevice.opd_id} onChange={e => setFormDevice({...formDevice, opd_id: e.target.value})} className="p-2 border rounded">
                  <option value="" disabled>Alokasikan ke Instansi *</option>
                  {opds.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                </select>
                <div className="md:col-span-2">
                  <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold p-2.5 rounded-lg hover:bg-blue-700 transition">
                    {isLoading ? 'Mendaftarkan...' : 'Daftarkan Mesin'}
                  </button>
                </div>
              </form>
            </div>

            {/* --- TABEL DAFTAR DEVICE --- */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600">
                    <th className="p-3 border-b">S/N</th>
                    <th className="p-3 border-b">Nama Device</th>
                    <th className="p-3 border-b">IP Address</th>
                    <th className="p-3 border-b">Platform</th>
                    <th className="p-3 border-b">Lokasi</th>
                    <th className="p-3 border-b">Instansi</th>
                    <th className="p-3 border-b">Status</th>
                    <th className="p-3 border-b">Terakhir Aktif</th>
                    <th className="p-3 border-b text-center">Transaksi</th>
                    <th className="p-3 border-b text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map(d => (
                    <tr key={d.sn} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono text-xs font-semibold">{d.sn}</td>
                      <td className="p-3">
                        <div className="font-medium text-gray-800">{d.name || '-'}</div>
                        <div className="text-xs text-gray-400">{d.device_name || ''}</div>
                      </td>
                      <td className="p-3">
                        {d.ip_address ? (
                          <span className="flex items-center gap-1 text-green-700"><Wifi size={14} /> {d.ip_address}</span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400"><WifiOff size={14} /> -</span>
                        )}
                      </td>
                      <td className="p-3">
                        {d.platform ? <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">{d.platform}</span> : '-'}
                      </td>
                      <td className="p-3 text-gray-600">{d.lokasi}</td>
                      <td className="p-3 font-semibold text-gray-700">{d.opd}</td>
                      <td className="p-3">
                        {d.verified ? (
                          <span className="flex items-center gap-1 text-green-600 font-semibold text-xs"><CheckCircle size={14} /> Verified</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500 font-semibold text-xs"><XCircle size={14} /> Unverified</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-gray-500 whitespace-nowrap">{d.last_activity || 'Belum pernah'}</td>
                      <td className="p-3 text-center font-bold text-gray-700">{d.transaction_count}</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => setEditModal({ type: 'device', data: { sn: d.sn, name: d.name || '', device_name: d.device_name || '', ip_address: d.ip_address || '', mac_address: d.mac_address || '', platform: d.platform || '', nama_lokasi: d.lokasi || '', opd_id: d.opd_id || '', verified: d.verified } })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Pencil size={15} /></button>
                          <button onClick={() => handleDeleteDevice(d.sn)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Hapus"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============ TAB 4: AUDIT TRAIL (Read Only) ============ */}
        {activeTab === 'audit' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-700">Riwayat Aktivitas Sistem (100 Terakhir)</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">🔒 Read Only — Log tidak bisa diubah/dihapus</span>
            </div>
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
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          log.action.includes('DELETE') ? 'bg-red-100 text-red-700' :
                          log.action.includes('UPDATE') ? 'bg-yellow-100 text-yellow-700' :
                          log.action.includes('ADD') || log.action.includes('REGISTER') ? 'bg-green-100 text-green-700' :
                          'bg-gray-200 text-gray-700'
                        }`}>{log.action}</span>
                      </td>
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

      {/* ============ EDIT MODAL ============ */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-800">
                {editModal.type === 'opd' && 'Edit OPD'}
                {editModal.type === 'admin' && 'Edit Admin OPD'}
                {editModal.type === 'device' && `Edit Device — ${editModal.data.sn}`}
              </h3>
              <button onClick={() => setEditModal(null)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>

            <div className="flex flex-col gap-3">
              {/* OPD Edit Fields */}
              {editModal.type === 'opd' && (<>
                <label className="text-xs font-bold text-gray-500">Kode OPD</label>
                <input type="text" value={editModal.data.kode} onChange={e => setEditModal({...editModal, data: {...editModal.data, kode: e.target.value}})} className="p-2 border rounded" />
                <label className="text-xs font-bold text-gray-500">Nama Instansi</label>
                <input type="text" value={editModal.data.nama} onChange={e => setEditModal({...editModal, data: {...editModal.data, nama: e.target.value}})} className="p-2 border rounded" />
              </>)}

              {/* Admin Edit Fields */}
              {editModal.type === 'admin' && (<>
                <label className="text-xs font-bold text-gray-500">NIP / Username</label>
                <input type="text" value={editModal.data.nip} disabled className="p-2 border rounded bg-gray-100 cursor-not-allowed" />
                <label className="text-xs font-bold text-gray-500">Nama Lengkap</label>
                <input type="text" value={editModal.data.nama} onChange={e => setEditModal({...editModal, data: {...editModal.data, nama: e.target.value}})} className="p-2 border rounded" />
                <label className="text-xs font-bold text-gray-500">Penempatan Instansi</label>
                <select value={editModal.data.opd_id} onChange={e => setEditModal({...editModal, data: {...editModal.data, opd_id: e.target.value}})} className="p-2 border rounded">
                  <option value="">Pilih Instansi</option>
                  {opds.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                </select>
                <label className="text-xs font-bold text-gray-500">Password Baru (kosongkan jika tidak diubah)</label>
                <input type="password" placeholder="•••••••" value={editModal.data.password} onChange={e => setEditModal({...editModal, data: {...editModal.data, password: e.target.value}})} className="p-2 border rounded" />
              </>)}

              {/* Device Edit Fields */}
              {editModal.type === 'device' && (<>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500">Nama Device</label>
                    <input type="text" value={editModal.data.name} onChange={e => setEditModal({...editModal, data: {...editModal.data, name: e.target.value}})} className="p-2 border rounded w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Nama Perangkat</label>
                    <input type="text" value={editModal.data.device_name} onChange={e => setEditModal({...editModal, data: {...editModal.data, device_name: e.target.value}})} className="p-2 border rounded w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">IP Address</label>
                    <input type="text" value={editModal.data.ip_address} onChange={e => setEditModal({...editModal, data: {...editModal.data, ip_address: e.target.value}})} className="p-2 border rounded w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">MAC Address</label>
                    <input type="text" value={editModal.data.mac_address} onChange={e => setEditModal({...editModal, data: {...editModal.data, mac_address: e.target.value}})} className="p-2 border rounded w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Platform</label>
                    <select value={editModal.data.platform} onChange={e => setEditModal({...editModal, data: {...editModal.data, platform: e.target.value}})} className="p-2 border rounded w-full">
                      <option value="">-</option>
                      <option value="Android">Android</option>
                      <option value="iOS">iOS</option>
                      <option value="Web">Web</option>
                      <option value="Windows">Windows</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Lokasi</label>
                    <input type="text" value={editModal.data.nama_lokasi} onChange={e => setEditModal({...editModal, data: {...editModal.data, nama_lokasi: e.target.value}})} className="p-2 border rounded w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Instansi</label>
                    <select value={editModal.data.opd_id} onChange={e => setEditModal({...editModal, data: {...editModal.data, opd_id: e.target.value}})} className="p-2 border rounded w-full">
                      <option value="">-</option>
                      {opds.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editModal.data.verified} onChange={e => setEditModal({...editModal, data: {...editModal.data, verified: e.target.checked}})} className="w-4 h-4 rounded" />
                      <span className="text-sm font-semibold text-gray-700">Verified</span>
                    </label>
                  </div>
                </div>
              </>)}

              <button onClick={handleUpdate} disabled={isLoading} className="mt-3 bg-blue-600 text-white font-bold p-2.5 rounded-lg hover:bg-blue-700 transition">
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterData;