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
    <div className="container">
      <h2>Presensi Cerdas Diskominfo</h2>
      <p className="status-text">{status}</p>

      <div className="camera-wrapper">
        <Webcam
          audio={false}
          ref={webcamRef}
          // 1. Paksa kualitas JPEG menjadi 100% (defaultnya 0.92)
          screenshotQuality={1} 
          // 2. Gunakan format yang paling disukai AI
          screenshotFormat="image/jpeg"
          // 3. Paksa resolusi HD (720p) agar tidak buram
          videoConstraints={{ 
            width: 1280, 
            height: 720, 
            facingMode: "user" 
          }}
          className="webcam-video"
        />
        <div className="face-guide"></div>
      </div>

      {result && (
        <div className="result-card">
          <h3>Data Cocok!</h3>
          <p className="name">{result.name}</p>
          <p className="nip">NIP: {result.nip}</p>
        </div>
      )}
    </div>
  );
}

export default FaceScan;