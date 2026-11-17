import { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';
import API_BASE from '../config/api';
import {
  CheckCircle2,
  Circle,
  Camera,
  Save,
  User,
  RotateCcw,
  AlertCircle,
  CreditCard,
  Users,
  Loader2,
} from 'lucide-react';
import { ErrorBanner, notifyAlert } from '../components/UiFeedback';

const RegisterUser = () => {
  const webcamRef = useRef(null);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [formData, setFormData] = useState({ nip: '', nama: '', opd_id: '' });
  const [opdList, setOpdList] = useState([]);
  const [isLoadingOpd, setIsLoadingOpd] = useState(true);
  const [opdError, setOpdError] = useState('');
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [modelError, setModelError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [regMode, setRegMode] = useState('ASN'); // 'ASN' or 'NON_ASN'

  const requiredPoses = [
    'Wajah Lurus & Ekspresi Netral',
    'Wajah Lurus & Tersenyum',
    'Menoleh Sedikit ke Kanan',
    'Menoleh Sedikit ke Kiri',
    'Sedikit Menunduk / Mendongak',
  ];

  const fetchOPD = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    setIsLoadingOpd(true);
    setOpdError('');
    try {
      const res = await axios.get(`${API_BASE}/opd`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setOpdList(list);
      if (list.length === 1) {
        setFormData((prev) => ({ ...prev, opd_id: list[0].id }));
      }
    } catch (err) {
      console.error('Gagal mengambil daftar OPD:', err);
      setOpdError(err.response?.data?.error || 'Gagal memuat daftar instansi OPD dari server.');
    } finally {
      setIsLoadingOpd(false);
    }
  }, []);

  useEffect(() => {
    fetchOPD();
  }, [fetchOPD]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        if (faceapi.tf) {
          try {
            await faceapi.tf.setBackend('webgl');
            await faceapi.tf.ready();
          } catch {
            await faceapi.tf.setBackend('cpu');
            await faceapi.tf.ready();
          }
        }
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        setIsModelsLoaded(true);
      } catch (error) {
        console.error('Gagal memuat model deteksi wajah:', error);
        setModelError('Gagal memuat modul detektor wajah. Pastikan berkas model tersedia di folder /models.');
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
      notifyAlert({
        icon: 'warning',
        title: 'Wajah Belum Terdeteksi',
        text: 'Pastikan wajah berada tepat di dalam bingkai oval dan pencahayaan ruangan memadai.',
      });
    }
  };

  const handleRegister = async () => {
    const isNonAsn = regMode === 'NON_ASN';
    const expectedLen = isNonAsn ? 16 : 18;
    const idLabel = isNonAsn ? 'NIK' : 'NIP';

    if (!formData.nip || formData.nip.length !== expectedLen) {
      return notifyAlert({
        icon: 'warning',
        title: `Format ${idLabel} Belum Sesuai`,
        text: `${idLabel} wajib terdiri atas tepat ${expectedLen} digit angka.`,
      });
    }
    if (!formData.nama.trim() || !formData.opd_id) {
      return notifyAlert({
        icon: 'warning',
        title: 'Data Belum Lengkap',
        text: `${idLabel}, Nama Lengkap, dan Instansi OPD wajib dilengkapi terlebih dahulu.`,
      });
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
      notifyAlert({
        icon: 'success',
        title: 'Pendaftaran Berhasil',
        text: isNonAsn
          ? 'Data biometrik Tenaga Non-ASN berhasil disimpan.'
          : 'Data biometrik Pegawai ASN berhasil disimpan.',
        timer: 2200,
      });
      setCapturedPhotos([]);
      setFormData({ nip: '', nama: '', opd_id: formData.opd_id });
    } catch (err) {
      notifyAlert({
        icon: 'error',
        title: 'Pendaftaran Gagal',
        text: err.response?.data?.error || 'Terjadi kendala saat menyimpan data ke server.',
      });
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
      {opdError && <ErrorBanner message={opdError} onRetry={fetchOPD} />}
      {modelError && <ErrorBanner message={modelError} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Kolom Formulir Identitas & Daftar 5 Pose */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="surface-card p-6">
            <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                <User size={16} />
              </div>
              <span>Identitas {regMode === 'ASN' ? 'Pegawai ASN' : 'Tenaga Non-ASN'}</span>
            </h2>

            {/* Pemilih Kategori Pegawai */}
            <div
              className="flex bg-slate-100 p-1 rounded-lg mb-4 border border-slate-300 gap-1"
              role="group"
              aria-label="Pilih kategori pendaftaran pegawai"
            >
              <button
                type="button"
                aria-pressed={regMode === 'ASN'}
                onClick={() => {
                  setRegMode('ASN');
                  setFormData((p) => ({ ...p, nip: '' }));
                  setCapturedPhotos([]);
                }}
                className={`flex-1 flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-md text-xs font-bold transition-colors ${
                  regMode === 'ASN'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <CreditCard size={14} />
                <span>ASN (NIP 18 Digit)</span>
              </button>
              <button
                type="button"
                aria-pressed={regMode === 'NON_ASN'}
                onClick={() => {
                  setRegMode('NON_ASN');
                  setFormData((p) => ({ ...p, nip: '' }));
                  setCapturedPhotos([]);
                }}
                className={`flex-1 flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-md text-xs font-bold transition-colors ${
                  regMode === 'NON_ASN'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Users size={14} />
                <span>Non-ASN (NIK 16 Digit)</span>
              </button>
            </div>

            {regMode === 'NON_ASN' && (
              <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-300 rounded-lg mb-4">
                <AlertCircle size={16} className="text-amber-800 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed">
                  <strong>Kategori Non-ASN:</strong> Digunakan untuk Tenaga Ahli, Pegawai Tidak Tetap, atau Peserta Magang menggunakan NIK KTP 16 digit.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="reg-opd-select"
                  className="block text-xs font-bold text-slate-800 mb-1.5"
                >
                  Instansi OPD <span className="text-red-700">*</span>
                </label>
                <select
                  id="reg-opd-select"
                  value={formData.opd_id || ''}
                  disabled={isLoadingOpd}
                  onChange={(e) => setFormData({ ...formData, opd_id: e.target.value })}
                  className="gov-select"
                >
                  <option value="" disabled>
                    {isLoadingOpd ? 'Memuat daftar OPD...' : 'Pilih Instansi OPD'}
                  </option>
                  {opdList.map((opd) => (
                    <option key={opd.id} value={opd.id}>
                      {opd.nama} ({opd.kode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="reg-id-input" className="block text-xs font-bold text-slate-800">
                    {regMode === 'ASN' ? 'Nomor Induk Pegawai (NIP)' : 'Nomor Induk Kependudukan (NIK)'}{' '}
                    <span className="text-red-700">*</span>
                  </label>
                  <span
                    className={`text-xs font-mono font-bold tabular-nums ${
                      formData.nip.length === expectedDigits ? 'text-emerald-800' : 'text-slate-600'
                    }`}
                  >
                    {formData.nip.length}/{expectedDigits} digit
                  </span>
                </div>
                <input
                  id="reg-id-input"
                  type="text"
                  inputMode="numeric"
                  placeholder={regMode === 'ASN' ? 'Masukkan 18 digit angka NIP' : 'Masukkan 16 digit angka NIK'}
                  maxLength={expectedDigits}
                  value={formData.nip}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, nip: val });
                  }}
                  className="gov-input font-mono font-semibold tracking-wider tabular-nums"
                />
              </div>

              <div>
                <label htmlFor="reg-name-input" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Nama Lengkap <span className="text-red-700">*</span>
                </label>
                <input
                  id="reg-name-input"
                  type="text"
                  placeholder="Masukkan nama lengkap beserta gelar"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="gov-input"
                />
              </div>
            </div>
          </div>

          <div className="surface-card p-6 flex-grow">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800 shrink-0">
                  <Camera size={16} />
                </div>
                <span>Tahapan 5 Pose Wajah</span>
              </h2>
              {currentPoseIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setCapturedPhotos([])}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-lg border border-slate-400 bg-white hover:bg-red-50 text-xs font-bold text-slate-700 hover:text-red-800 hover:border-red-300 transition-colors"
                >
                  <RotateCcw size={14} />
                  <span>Ulangi Foto</span>
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {requiredPoses.map((pose, index) => {
                const isCompleted = index < currentPoseIndex;
                const isCurrent = index === currentPoseIndex;

                return (
                  <div
                    key={pose}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-xs sm:text-sm ${
                      isCompleted
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                        : isCurrent
                          ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                          : 'bg-slate-50 border-slate-300 text-slate-600 font-medium'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
                    ) : (
                      <Circle size={18} className="text-slate-500 shrink-0" />
                    )}
                    <span className="tabular-nums">
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
                className="mt-5 w-full min-h-[48px] flex justify-center items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white py-3 px-5 rounded-lg font-bold text-sm disabled:opacity-60 transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Menyimpan Data Biometrik...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Simpan Data ke Database</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Kolom Pratinjau Kamera */}
        <div className="lg:col-span-7">
          <div className="surface-card p-5 sm:p-6 flex flex-col items-center">
            <div className="w-full max-w-xl bg-slate-900 text-white p-4 rounded-t-lg text-center border border-slate-800">
              {currentPoseIndex < 5 ? (
                <>
                  <p className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-1 tabular-nums">
                    Instruksi Pose {currentPoseIndex + 1} dari 5
                  </p>
                  <h3 className="text-lg sm:text-xl font-extrabold text-amber-300">
                    {requiredPoses[currentPoseIndex]}
                  </h3>
                </>
              ) : (
                <h3 className="text-base sm:text-lg font-extrabold text-emerald-300 py-1">
                  Seluruh 5 Pose Berhasil Direkam. Silakan Klik Tombol Simpan Data.
                </h3>
              )}
            </div>

            <div className="relative w-full max-w-xl bg-slate-950 rounded-b-lg overflow-hidden flex justify-center border-x border-b border-slate-800">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: 'user' }}
                className={`w-full h-auto object-cover transform scale-x-[-1] ${
                  currentPoseIndex >= 5 ? 'opacity-50' : ''
                }`}
              />

              {currentPoseIndex < 5 && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-44 h-60 md:w-52 md:h-68 border-4 border-dashed border-amber-300 rounded-[50%] pointer-events-none shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]" />
              )}
            </div>

            <div className="mt-4 flex flex-col items-center gap-3 w-full max-w-xl">
              <div className="flex items-center gap-2 text-xs font-bold" role="status">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isModelsLoaded ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}
                />
                <span className={isModelsLoaded ? 'text-emerald-800' : 'text-slate-700'}>
                  {isModelsLoaded
                    ? 'Detektor Wajah Siap Memindai'
                    : 'Memuat modul detektor wajah...'}
                </span>
              </div>

              <button
                type="button"
                onClick={captureAndCrop}
                disabled={!isModelsLoaded || currentPoseIndex >= 5 || !isIdentityReady}
                className={`w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-lg font-bold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 tabular-nums ${
                  !isModelsLoaded || currentPoseIndex >= 5 || !isIdentityReady
                    ? 'bg-slate-200 text-slate-600 border border-slate-300'
                    : 'bg-blue-700 hover:bg-blue-800 text-white'
                }`}
              >
                <Camera size={18} />
                <span>Ambil Foto Pose {currentPoseIndex < 5 ? currentPoseIndex + 1 : 5} / 5</span>
              </button>

              {!isIdentityReady && currentPoseIndex < 5 && (
                <p className="text-amber-900 bg-amber-50 border border-amber-300 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-center">
                  Lengkapi Instansi OPD, {regMode === 'ASN' ? 'NIP (18 digit)' : 'NIK (16 digit)'}, dan Nama Lengkap pada formulir identitas untuk mengaktifkan tombol kamera.
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
