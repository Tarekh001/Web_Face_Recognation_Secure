import { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';
import { CheckCircle2, Circle, Camera, Save, User } from 'lucide-react';

const RegisterUser = () => {
    const webcamRef = useRef(null);
    const [capturedPhotos, setCapturedPhotos] = useState([]);
    const [formData, setFormData] = useState({ nip: '', nama: '', opd_id: '' });
    const [opdList, setOpdList] = useState([]); // State untuk daftar OPD
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Daftar Pose yang Dibutuhkan
    const requiredPoses = [
        "Wajah Lurus & Ekpresi Netral",
        "Wajah Lurus & Tersenyum",
        "Menoleh Sedikit ke Kanan",
        "Menoleh Sedikit ke Kiri",
        "Sedikit Menunduk / Mendongak"
    ];

    useEffect(() => {
        const fetchOPD = async () => {
            const token = localStorage.getItem('access_token');
            try {
                const res = await axios.get('http://127.0.0.1:5000/api/opd', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOpdList(res.data);
                // Jika hanya ada 1 OPD (misal dia Admin OPD), otomatis pilih
                if (res.data.length === 1) {
                    setFormData(prev => ({ ...prev, opd_id: res.data[0].id }));
                }
            } catch (err) {
                console.error("Gagal mengambil daftar OPD");
            }
        };
        fetchOPD();
    }, []);
    
    useEffect(() => {
        const loadModels = async () => {
            try {
                // Pastikan file model Anda benar-benar ada di folder public/models/
                await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
                setIsModelsLoaded(true);
            } catch (error) {
                console.error("Gagal memuat model Face API:", error);
                alert("Gagal memuat modul kamera. Pastikan folder model tersedia.");
            }
        };
        
        loadModels();
    }, []);


    const captureAndCrop = async () => {
        if (capturedPhotos.length >= 5) return;

        const video = webcamRef.current.video;
        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());

        if (detection) {
            const { x, y, width, height } = detection.box;
            const canvas = document.createElement('canvas');
            
            const size = Math.max(width, height);
            const margin = size * 0.3; 
            const cropSize = size + (margin * 2);
            const cropX = Math.max(0, x + (width / 2) - (cropSize / 2));
            const cropY = Math.max(0, y + (height / 2) - (cropSize / 2));

            canvas.width = 160; 
            canvas.height = 160;
            const ctx = canvas.getContext('2d');

            ctx.drawImage(video, cropX, cropY, cropSize, cropSize, 0, 0, 160, 160);
            
            canvas.toBlob((blob) => {
                setCapturedPhotos(prev => [...prev, blob]);
            }, 'image/jpeg', 1.0);
            
        } else {
            alert("⚠️ Wajah tidak terdeteksi! Pastikan wajah Anda berada di dalam garis putus-putus dan ruangan cukup terang.");
        }
    };

    const handleRegister = async () => {
        if (!formData.nip || !formData.nama || !formData.opd_id) {
            alert("NIP, Nama, dan OPD wajib diisi terlebih dahulu!");
            return;
        }

        setIsLoading(true);
        const token = localStorage.getItem('access_token');
        const data = new FormData();
        data.append('nip', formData.nip);
        data.append('name', formData.nama);
        data.append('opd_id', formData.opd_id);
        data.append('source', 'web');
        
        capturedPhotos.forEach((blob, i) => data.append('photos', blob, `face_${i}.jpg`));

        try {
            await axios.post('http://127.0.0.1:5000/api/register', data, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert("✅ Data ASN Berhasil Didaftarkan!");
            setCapturedPhotos([]);
            setFormData({ nip: '', nama: '' });
        } catch (err) {
            alert("❌ Gagal daftar: " + (err.response?.data?.error || "Terjadi kesalahan server"));
        } finally {
            setIsLoading(false);
        }
    };

    const currentPoseIndex = capturedPhotos.length;

    return (
        <main className="p-8 w-full h-full bg-[#f4f7f6] overflow-y-auto">
            <div className="mb-6 border-b-2 border-gray-300 pb-4">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Registrasi Wajah ASN</h1>
                <p className="text-gray-500 mt-1">Daftarkan data biometrik pegawai baru ke dalam sistem</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">                
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <User size={20} className="text-blue-500" /> Identitas ASN
                        </h2>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Pilih Instansi (OPD)</label>
                                <select 
                                    value={formData.opd_id || ""}
                                    onChange={e => setFormData({...formData, opd_id: e.target.value})}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
                                >
                                    <option value="" disabled>-- Pilih Instansi OPD --</option>
                                    {opdList.map(opd => (
                                        <option key={opd.id} value={opd.id}>
                                            {opd.nama} ({opd.kode})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Nomor Induk Pegawai (NIP)</label>
                                <input 
                                    type="text" 
                                    placeholder="Masukkan NIP (Contoh: 1980...)" 
                                    value={formData.nip}
                                    onChange={e => setFormData({...formData, nip: e.target.value})} 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Nama Lengkap</label>
                                <input 
                                    type="text" 
                                    placeholder="Nama Sesuai KTP" 
                                    value={formData.nama}
                                    onChange={e => setFormData({...formData, nama: e.target.value})} 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-grow">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Camera size={20} className="text-blue-500" /> Daftar Pose Wajah
                        </h2>
                        <div className="flex flex-col gap-3">
                            {requiredPoses.map((pose, index) => {
                                const isCompleted = index < currentPoseIndex;
                                const isCurrent = index === currentPoseIndex;
                                
                                return (
                                    <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border ${
                                        isCompleted ? 'bg-green-50 border-green-200 text-green-700' :
                                        isCurrent ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-sm ring-1 ring-blue-100' :
                                        'bg-gray-50 border-gray-200 text-gray-400'
                                    }`}>
                                        {isCompleted ? <CheckCircle2 size={22} className="text-green-500" /> : <Circle size={22} />}
                                        <span className={`font-medium ${isCurrent ? 'font-bold' : ''}`}>
                                            {index + 1}. {pose}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {currentPoseIndex === 5 && (
                            <button 
                                onClick={handleRegister} 
                                disabled={isLoading}
                                className="mt-6 w-full flex justify-center items-center gap-2 bg-green-600 text-white p-4 rounded-lg font-bold hover:bg-green-700 disabled:bg-green-400 transition shadow-md"
                            >
                                {isLoading ? "Menyimpan..." : <><Save size={20} /> Simpan Data ke Database</>}
                            </button>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-7">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                        
                        <div className="w-full bg-gray-900 text-white p-4 rounded-t-xl text-center">
                            {currentPoseIndex < 5 ? (
                                <>
                                    <p className="text-gray-400 text-sm font-medium mb-1">Pose Selanjutnya:</p>
                                    <h3 className="text-2xl font-bold text-yellow-400 animate-pulse">
                                        {requiredPoses[currentPoseIndex]}
                                    </h3>
                                </>
                            ) : (
                                <h3 className="text-2xl font-bold text-green-400 py-3">
                                    🎉 Semua Pose Selesai!
                                </h3>
                            )}
                        </div>

                        <div className="relative w-full max-w-xl bg-gray-100 rounded-b-xl overflow-hidden flex justify-center border-x-2 border-b-2 border-gray-900">
                            <Webcam 
                                ref={webcamRef} 
                                screenshotFormat="image/jpeg" 
                                videoConstraints={{ facingMode: "user" }}
                                className={`w-full h-auto object-cover transform scale-x-[-1] ${currentPoseIndex >= 5 ? 'opacity-50 blur-sm' : ''}`}
                            />
                            
                            {currentPoseIndex < 5 && (
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-64 md:w-56 md:h-72 border-4 border-dashed border-yellow-400 rounded-[50%] pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                                </div>
                            )}
                        </div>

                        <p className="text-sm font-semibold text-gray-500 mt-4 mb-4">
                            {isModelsLoaded ? "✅ Sistem AI Siap Memindai" : "⏳ Memuat modul cerdas..."}
                        </p>

                        <button 
                            onClick={captureAndCrop} 
                            disabled={!isModelsLoaded || currentPoseIndex >= 5 || !formData.nip || !formData.nama || !formData.opd_id}
                            className={`px-10 py-4 rounded-full font-extrabold text-lg transition shadow-lg ${
                                currentPoseIndex >= 5 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' :
                                (!formData.nip || !formData.nama || !formData.opd_id) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' :
                                'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 active:scale-95'
                            }`}
                        >
                            📸 Jepret Pose {currentPoseIndex < 5 ? currentPoseIndex + 1 : 5} / 5
                        </button>

                        {(!formData.nip || !formData.nama || !formData.opd_id) && currentPoseIndex < 5 && (
                            <p className="text-red-500 text-sm mt-3 font-medium">
                                *Isi Instansi, NIP, dan Nama di sebelah kiri terlebih dahulu untuk mengaktifkan kamera.
                            </p>
                        )}
                    </div>
                </div>

            </div>
        </main>
    );
};

export default RegisterUser;