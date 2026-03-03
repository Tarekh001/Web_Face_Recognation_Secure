import { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import * as faceapi from '@vladmandic/face-api'; // Import AI Lokal
import '../App.css';

function FaceScan() {
  const webcamRef = useRef(null);
  const [status, setStatus] = useState("Memuat sistem AI lokal...");
  const [result, setResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // 1. Memuat Model AI ke Browser saat web pertama kali dibuka
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Mengambil otak mini dari folder public/models
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        setModelsLoaded(true);
        setStatus("Sistem Siap. Silakan menghadap kamera.");
      } catch (err) {
        console.error("Gagal memuat model lokal:", err);
        setStatus("Error: Model AI lokal tidak ditemukan.");
      }
    };
    loadModels();
  }, []);

  // Fungsi Konversi Gambar (Tetap sama)
  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){ u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, {type: mime});
  };

  // Fungsi Tembak ke Server Flask
  const sendToFlask = useCallback(async (imageSrc) => {
    try {
      setStatus("Wajah terdeteksi! Mengirim ke server...");
      const file = dataURLtoFile(imageSrc, 'scan.jpg');
      const formData = new FormData();
      formData.append('photo', file);

      // Tembak API
      const response = await axios.post('http://127.0.0.1:5000/api/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // --- PERBAIKAN: Menangkap Format JSON Baru dari Flask ---
      if (response.data && response.data.nip && response.data.nip !== "unknown") {
        setResult({ nip: response.data.nip, name: response.data.name });
        // Tampilkan pesan "Presensi masuk Berhasil" dan jamnya
        setStatus(`✅ ${response.data.status} pada ${response.data.waktu}`); 
      } else {
        setStatus("❌ Wajah tidak terdaftar.");
      }

      // Reset kamera setelah 4 detik
      setTimeout(() => {
        setResult(null);
        setStatus("Sistem Siap. Silakan menghadap kamera.");
        setIsScanning(true);
      }, 4000);

    } catch (error) {
      console.error("Error server Flask:", error);
      
      // --- PERBAIKAN: Menangkap Pesan Penolakan (403/400) dari Flask ---
      if (error.response && error.response.data && error.response.data.message) {
         // Akan menampilkan: "⛔ Maaf Muhamad Tarekh, sekarang bukan jam presensi."
         setStatus(`⛔ ${error.response.data.message}`);
      } else {
         setStatus("❌ Server sedang sibuk/mati.");
      }

      // Reset kamera setelah 4 detik meskipun error
      setTimeout(() => {
        setResult(null);
        setStatus("Sistem Siap. Silakan menghadap kamera.");
        setIsScanning(true);
      }, 4000);
    }
  }, []);

  // 2. Loop Pendeteksi Wajah Lokal
  useEffect(() => {
    let interval;
    if (modelsLoaded && isScanning) {
      interval = setInterval(async () => {
        if (webcamRef.current && webcamRef.current.video.readyState === 4) {
          const video = webcamRef.current.video;
          
          // AI Lokal mendeteksi wajah
          const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
          
          if (detection) {
            console.log("Wajah ditemukan! Bersiap memotong gambar...");
            setIsScanning(false); 
            clearInterval(interval);
            
            // --- PROSES CROPPING (GUNTING VIRTUAL) ---
            const { x, y, width, height } = detection.box;
            
            // 1. Buat ukuran potongan menjadi KOTAK (Square) agar sesuai target_size=(160,160) di Flask
            const size = Math.max(width, height);
            
            // 2. Tambahkan margin 30% agar wajah tidak terpotong terlalu ketat (rambut dan dagu masuk)
            const margin = size * 0.3;
            const cropSize = size + (margin * 2);
            
            // 3. Tentukan titik potong (koordinat sudut kiri atas)
            const cropX = Math.max(0, x + (width / 2) - (cropSize / 2));
            const cropY = Math.max(0, y + (height / 2) - (cropSize / 2));

            // 4. Siapkan Canvas
            const canvas = document.createElement('canvas');
            canvas.width = cropSize;
            canvas.height = cropSize;
            const ctx = canvas.getContext('2d');
            
            // 5. Gunting video dan tempel ke Canvas
            ctx.drawImage(
              video, 
              cropX, cropY, cropSize, cropSize, // Sumber dari video
              0, 0, cropSize, cropSize          // Tujuan di canvas
            );
            
            // 6. Ubah hasil potongan ke format JPEG kualitas tinggi
            const croppedImageSrc = canvas.toDataURL('image/jpeg', 1.0);
            
            // Kirim gambar yang SUDAH DIPOTONG KOTAK ke Flask
            sendToFlask(croppedImageSrc);
          }
        }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [modelsLoaded, isScanning, sendToFlask]);

  return (
    // Background layar penuh mode gelap
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 font-sans relative">
      
      {/* Header Aplikasi */}
      <div className="absolute top-8 left-0 right-0 text-center z-10">
        <h2 className="text-3xl font-extrabold text-white tracking-wider mb-2 drop-shadow-md">
          PRESENSI CERDAS <span className="text-blue-500">DISKOMINFO</span>
        </h2>
        <p className={`text-lg font-medium px-6 py-2 rounded-full inline-block shadow-sm ${
          status.includes("Berhasil") || status.includes("✅") ? "bg-green-500/20 text-green-300" :
          status.includes("❌") || status.includes("⛔") ? "bg-red-500/20 text-red-300" :
          "bg-blue-500/20 text-blue-300 animate-pulse"
        }`}>
          {status}
        </p>
      </div>

      {/* Wadah Kamera (Camera Wrapper) */}
      <div className="relative w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800 bg-black mt-16">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotQuality={1} 
          screenshotFormat="image/jpeg"
          videoConstraints={{ 
            width: 1280, 
            height: 720, 
            facingMode: "user" 
          }}
          className="w-full h-auto object-cover transform scale-x-[-1]" // scale-x-[-1] efek cermin (mirror)
        />
        
        {/* Face Guide (Kotak Panduan Wajah) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 border-4 border-dashed border-blue-500/70 rounded-2xl bg-blue-500/10 pointer-events-none flex items-center justify-center">
          {/* Efek sudut kamera pemindai */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400"></div>
        </div>
      </div>

      {/* Kartu Hasil (Result Card) - Muncul Pop-up dari bawah */}
      {result && (
        <div className="absolute bottom-12 bg-green-500 text-white px-10 py-5 rounded-2xl shadow-xl transform transition-all animate-bounce flex flex-col items-center">
          <h3 className="text-xl font-bold mb-1">Data Cocok!</h3>
          <p className="text-2xl font-extrabold uppercase tracking-wide">{result.name}</p>
          <p className="text-green-100 font-medium tracking-widest mt-1">{result.nip}</p>
        </div>
      )}
      
      {/* Tombol Login Admin (Pojok Kanan Bawah) */}
      <a href="/login" className="absolute bottom-6 right-6 text-gray-500 hover:text-white text-sm font-medium transition flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-lg">
        🔒 Login Admin
      </a>

    </div>
  );
}

export default FaceScan;