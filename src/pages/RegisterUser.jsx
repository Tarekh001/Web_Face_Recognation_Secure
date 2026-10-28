import { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';
import API_BASE from '../config/api';
import { CheckCircle2, Circle, Camera, Save, User, RotateCcw, AlertCircle, CreditCard, Users } from 'lucide-react';

const RegisterUser = () => {
  const webcamRef = useRef(null);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [formData, setFormData] = useState({ nip: '', nama: '', opd_id: '' });
  const [opdList, setOpdList] = useState([]);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [regMode, setRegMode] = useState('ASN'); // 'ASN' or 'NON_ASN'

  const requiredPoses = [
    'Wajah Lurus & Ekspresi Netral',
    'Wajah Lurus & Tersenyum',
    'Menoleh Sedikit ke Kanan',
    'Menoleh Sedikit ke Kiri',
    'Sedikit Menunduk / Mendongak',
  ];

  useEffect(() => {
    const fetchOPD = async () => {
      const token = localStorage.getItem('access_token');
      try {
        const res = await axios.get(`${API_BASE}/opd`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = Array.isArray(res.data) ? res.data : [];
        setOpdList(list);
        if (list.length === 1) {
          setFormData((prev) => ({ ...prev, opd_id: list[0].id }));
        }
      } catch {
        console.error('Gagal mengambil daftar OPD');
      }
    };
    fetchOPD();
  }, []);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        setIsModelsLoaded(true);
      } catch (error) {
        console.error('Gagal memuat model Face API:', error);
        alert('Gagal memuat modul kamera. Pastikan folder model tersedia.');
      }
    };
    loadModels();
  }, []);

  const captureAndCrop = async () => {
    if (capturedPhotos.length >= 5) return;

    const video = webcamRef.current?.video;
    if (!video) return;
    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());

    if (detection) {
      const { x, y, width, height } = detection.box;
      const canvas = document.createElement('canvas');

      const size = Math.max(width, height);
      const margin = size * 0.3;
      const cropSize = size + margin * 2;
      const cropX = Math.max(0, x + width / 2 - cropSize / 2);
      const cropY = Math.max(0, y + height / 2 - cropSize / 2);

      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, cropX, cropY, cropSize, cropSize, 0, 0, 160, 160);

      canvas.toBlob(
        (blob) => {
          setCapturedPhotos((prev) => [...prev, blob]);
        },
        'image/jpeg',
        1.0
      );
    } else {
      alert('Wajah tidak terdeteksi! Pastikan wajah berada di dalam bingkai oval dan ruangan cukup terang.');
    }
  };

  const handleRegister = async () => {
    const isNonAsn = regMode === 'NON_ASN';
    const expectedLen = isNonAsn ? 16 : 18;
    const idLabel = isNonAsn ? 'NIK' : 'NIP';

    if (!formData.nip || formData.nip.length !== expectedLen) {
      alert(`${idLabel} harus tepat ${expectedLen} digit angka!`);
      return;
    }
    if (!formData.nama || !formData.opd_id) {
      alert(`${idLabel}, Nama Lengkap, dan Instansi OPD wajib diisi terlebih dahulu!`);
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem('access_token');
    const data = new FormData();
    data.append('nip', formData.nip);
    data.append('name', formData.nama);
    data.append('opd_id', formData.opd_id);
    data.append('role', regMode);
    data.append('source', 'web');

    capturedPhotos.forEach((blob, i) => data.append('photos', blob, `face_${i}.jpg`));

    try {
      await axios.post(`${API_BASE}/register`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      alert(isNonAsn ? 'Data Non-ASN berhasil didaftarkan!' : 'Data ASN berhasil didaftarkan!');
      setCapturedPhotos([]);
      setFormData({ nip: '', nama: '', opd_id: formData.opd_id });
    } catch (err) {
      alert('Gagal daftar: ' + (err.response?.data?.error || 'Terjadi kesalahan server'));
    } finally {
      setIsLoading(false);
    }
  };

  const currentPoseIndex = capturedPhotos.length;
  const expectedDigits = regMode === 'ASN' ? 18 : 16;
  const isIdentityReady =
    Boolean(formData.opd_id) &&
    Boolean(formData.nama.trim()) &&
    formData.nip.length === expectedDigits;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Form & Pose Checklist */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="glass-card p-6">
            <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <User size={16} />
              </div>
              <span>Identitas {regMode === 'ASN' ? 'Pegawai ASN' : 'Tenaga Non-ASN'}</span>
            </h2>

            {/* Segmented Mode Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4 border border-slate-200/70">
              <button
                type="button"
                onClick={() => {
                  setRegMode('ASN');
                  setFormData((p) => ({ ...p, nip: '' }));
                  setCapturedPhotos([]);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  regMode === 'ASN'
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <CreditCard size={14} />
                <span>ASN (NIP 18 Digit)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegMode('NON_ASN');
                  setFormData((p) => ({ ...p, nip: '' }));
                  setCapturedPhotos([]);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  regMode === 'NON_ASN'
                    ? 'bg-white text-amber-700 shadow-sm ring-1 ring-amber-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Users size={14} />
                <span>Non-ASN (NIK 16 Digit)</span>
              </button>
            </div>

            {regMode === 'NON_ASN' && (
              <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200/80 rounded-xl mb-4">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Mode Non-ASN:</strong> Untuk Tenaga Ahli, Honorer, atau Magang menggunakan NIK KTP (16 digit angka).
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Instansi (OPD)
                </label>
                <select
                  value={formData.opd_id || ''}
                  onChange={(e) => setFormData({ ...formData, opd_id: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-slate-50/70 focus:bg-white cursor-pointer"
                >
                  <option value="" disabled>-- Pilih Instansi OPD --</option>
                  {opdList.map((opd) => (
                    <option key={opd.id} value={opd.id}>
                      {opd.nama} ({opd.kode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {regMode === 'ASN' ? 'Nomor Induk Pegawai (NIP)' : 'Nomor Induk Kependudukan (NIK)'}
                  </label>
                  <span className={`text-[11px] font-mono font-bold ${
                    formData.nip.length === expectedDigits ? 'text-emerald-600' : 'text-slate-400'
                  }`}>
                    {formData.nip.length}/{expectedDigits} digit
                  </span>
                </div>
                <input
                  type="text"
                  placeholder={regMode === 'ASN' ? 'Masukkan 18 digit NIP...' : 'Masukkan 16 digit NIK...'}
                  maxLength={expectedDigits}
                  value={formData.nip}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, nip: val });
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-mono font-semibold tracking-wider text-slate-800 bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  placeholder="Masukkan nama lengkap beserta gelar..."
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 flex-grow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Camera size={16} />
                </div>
                <span>Tahapan 5 Pose Biometrik</span>
              </h2>
              {currentPoseIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setCapturedPhotos([])}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-red-600 cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Ulangi</span>
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {requiredPoses.map((pose, index) => {
                const isCompleted = index < currentPoseIndex;
                const isCurrent = index === currentPoseIndex;

                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm transition-all ${
                      isCompleted
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-700 font-semibold'
                        : isCurrent
                          ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold ring-1 ring-blue-100'
                          : 'bg-slate-50 border-slate-200/80 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    ) : (
                      <Circle size={18} className="shrink-0" />
                    )}
                    <span>
                      {index + 1}. {pose}
                    </span>
                  </div>
                );
              })}
            </div>

            {currentPoseIndex === 5 && (
              <button
                type="button"
                onClick={handleRegister}
                disabled={isLoading}
                className="mt-5 w-full flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-5 rounded-xl font-bold text-sm disabled:opacity-60 transition shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                {isLoading ? 'Menyimpan Biometrik...' : <><Save size={18} /> Simpan Data ke Database</>}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Webcam Capture */}
        <div className="lg:col-span-7">
          <div className="glass-card p-6 flex flex-col items-center">
            <div className="w-full max-w-xl bg-slate-900 text-white p-4 rounded-t-2xl text-center">
              {currentPoseIndex < 5 ? (
                <>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                    Instruksi Pose {currentPoseIndex + 1} dari 5
                  </p>
                  <h3 className="text-lg sm:text-xl font-extrabold text-amber-400">
                    {requiredPoses[currentPoseIndex]}
                  </h3>
                </>
              ) : (
                <h3 className="text-lg sm:text-xl font-extrabold text-emerald-400 py-1.5">
                  Seluruh 5 Pose Berhasil Direkam — Silakan Klik Simpan
                </h3>
              )}
            </div>

            <div className="relative w-full max-w-xl bg-slate-950 rounded-b-2xl overflow-hidden flex justify-center border-x border-b border-slate-800">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: 'user' }}
                className={`w-full h-auto object-cover transform scale-x-[-1] ${
                  currentPoseIndex >= 5 ? 'opacity-50 blur-sm' : ''
                }`}
              />

              {currentPoseIndex < 5 && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-44 h-60 md:w-52 md:h-68 border-4 border-dashed border-amber-400 rounded-[50%] pointer-events-none shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]" />
              )}
            </div>

            <div className="mt-4 flex flex-col items-center gap-3 w-full max-w-xl">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className={`w-2 h-2 rounded-full ${isModelsLoaded ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
                <span className={isModelsLoaded ? 'text-emerald-700' : 'text-slate-500'}>
                  {isModelsLoaded ? 'Detektor Wajah AI Aktif & Siap Memindai' : 'Memuat modul detektor wajah...'}
                </span>
              </div>

              <button
                type="button"
                onClick={captureAndCrop}
                disabled={!isModelsLoaded || currentPoseIndex >= 5 || !isIdentityReady}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-extrabold text-sm sm:text-base transition flex items-center justify-center gap-2 ${
                  !isModelsLoaded || currentPoseIndex >= 5 || !isIdentityReady
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 cursor-pointer active:scale-[0.98]'
                }`}
              >
                <Camera size={18} />
                <span>Ambil Foto Pose {currentPoseIndex < 5 ? currentPoseIndex + 1 : 5} / 5</span>
              </button>

              {!isIdentityReady && currentPoseIndex < 5 && (
                <p className="text-amber-700 bg-amber-50 border border-amber-200/80 px-3.5 py-2 rounded-xl text-xs font-semibold text-center">
                  Lengkapi Instansi OPD, {regMode === 'ASN' ? 'NIP (18 digit)' : 'NIK (16 digit)'}, dan Nama Lengkap di sebelah kiri untuk mengaktifkan tombol kamera.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterUser;
