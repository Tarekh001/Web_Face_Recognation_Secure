import { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';

const RegisterUser = () => {
    const webcamRef = useRef(null);
    
    // 1. Definisi State (Ini yang sebelumnya menyebabkan "not defined")
    const [capturedPhotos, setCapturedPhotos] = useState([]);
    const [formData, setFormData] = useState({ nip: '', nama: '' });
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 2. Memuat model AI saat halaman dibuka
    useEffect(() => {
        const load = async () => {
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            setIsModelsLoaded(true);
        };
        load();
    }, []);

    // 3. Fungsi Gunting Virtual (Auto-Crop)
    const captureAndCrop = async () => {
        if (capturedPhotos.length >= 5) {
            alert("Sudah 5 foto terkumpul!");
            return;
        }

        const video = webcamRef.current.video;
        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());

        if (detection) {
            const { x, y, width, height } = detection.box;
            const canvas = document.createElement('canvas');
            
            // Rumus memotong agar fokus ke wajah (mengubah hasil webcam agar mirip hasil HP)
            const size = Math.max(width, height);
            const margin = size * 0.3; // Tambah sedikit ruang untuk dahi dan dagu
            const cropSize = size + (margin * 2);
            const cropX = Math.max(0, x + (width / 2) - (cropSize / 2));
            const cropY = Math.max(0, y + (height / 2) - (cropSize / 2));

            canvas.width = 160; 
            canvas.height = 160;
            const ctx = canvas.getContext('2d');

            // Gunting dan tempel
            ctx.drawImage(video, cropX, cropY, cropSize, cropSize, 0, 0, 160, 160);
            
            // Simpan gambar ke dalam wadah (array)
            canvas.toBlob((blob) => {
                setCapturedPhotos(prev => [...prev, blob]);
            }, 'image/jpeg', 1.0);
            
        } else {
            alert("Wajah tidak terdeteksi oleh AI, pastikan ruangan cukup terang!");
        }
    };

    // 4. Fungsi Kirim ke Database Flask
    const handleRegister = async () => {
        if (!formData.nip || !formData.nama) {
            alert("NIP dan Nama wajib diisi!");
            return;
        }

        setIsLoading(true);
        const token = localStorage.getItem('access_token');
        const data = new FormData();
        data.append('nip', formData.nip);
        data.append('name', formData.nama);
        
        // Memasukkan kelima foto sekaligus
        capturedPhotos.forEach((blob, i) => data.append('photos', blob, `face_${i}.jpg`));

        try {
            await axios.post('http://127.0.0.1:5000/api/register', data, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert("✅ Data ASN Berhasil Didaftarkan dan Disimpan!");
            // Kosongkan form kembali
            setCapturedPhotos([]);
            setFormData({ nip: '', nama: '' });
        } catch (err) {
            alert("❌ Gagal daftar: " + (err.response?.data?.error || "Terjadi kesalahan server"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 w-full h-full">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Registrasi Wajah ASN Baru</h1>
            
            <div className="bg-white p-6 rounded-xl shadow-sm max-w-2xl">
                <div className="flex flex-col gap-4 mb-6">
                    {/* Perbaikan Typo onChange ada di baris ini */}
                    <input 
                        type="text" 
                        placeholder="Masukkan NIP" 
                        value={formData.nip}
                        onChange={e => setFormData({...formData, nip: e.target.value})} 
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input 
                        type="text" 
                        placeholder="Nama Lengkap" 
                        value={formData.nama}
                        onChange={e => setFormData({...formData, nama: e.target.value})} 
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                
                <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="border-4 border-dashed border-gray-300 rounded-lg p-2 bg-gray-100">
                        <Webcam 
                            ref={webcamRef} 
                            screenshotFormat="image/jpeg" 
                            className="rounded w-[400px]"
                            videoConstraints={{ facingMode: "user" }}
                        />
                    </div>
                    <p className="text-sm font-semibold text-gray-500">
                        {isModelsLoaded ? "✅ AI Pendeteksi Wajah Siap." : "⏳ Memuat AI lokal..."}
                    </p>
                    <button 
                        onClick={captureAndCrop} 
                        disabled={!isModelsLoaded || capturedPhotos.length >= 5}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 transition"
                    >
                        Ambil Foto ({capturedPhotos.length}/5)
                    </button>
                    
                    {/* Panduan Foto */}
                    <p className="text-xs text-center text-gray-400 max-w-sm mt-2">
                        Instruksi: Ambil 5 pose berbeda (Lurus netral, Lurus senyum, Menoleh kiri, Menoleh kanan, Menunduk sedikit).
                    </p>
                </div>

                {/* Tombol Simpan hanya muncul jika sudah 5 foto */}
                {capturedPhotos.length === 5 && (
                    <button 
                        onClick={handleRegister} 
                        disabled={isLoading}
                        className="w-full bg-green-600 text-white p-4 rounded-lg font-bold hover:bg-green-700 disabled:bg-green-300 transition"
                    >
                        {isLoading ? "Menyimpan ke Server..." : "💾 Simpan Wajah ke Database"}
                    </button>
                )}
            </div>
        </div>
    );
};

export default RegisterUser;