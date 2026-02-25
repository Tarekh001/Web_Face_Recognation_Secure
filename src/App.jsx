import { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import * as faceapi from '@vladmandic/face-api'; // Import AI Lokal
import './App.css';

function App() {
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

      const response = await axios.post('http://127.0.0.1:5000/api/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data[0] !== "unknown") {
        setResult({ nip: response.data[0], name: response.data[1] });
        setStatus("✅ Presensi Berhasil!");
      } else {
        setStatus("❌ Wajah tidak terdaftar.");
      }

      // Beri jeda 4 detik sebelum sistem mulai mencari wajah lagi
      setTimeout(() => {
        setResult(null);
        setStatus("Sistem Siap. Silakan menghadap kamera.");
        setIsScanning(true);
      }, 4000);

    } catch (error) {
      console.error("Error server Flask:", error);
      setStatus("Server sedang sibuk/mati.");
      setIsScanning(true); // Izinkan scan ulang jika gagal
    }
  }, []);

  // 2. Loop Pendeteksi Wajah Lokal (Berjalan setiap 1 detik)
  useEffect(() => {
    let interval;
    if (modelsLoaded && isScanning) {
      interval = setInterval(async () => {
        // Pastikan video sudah menyala
        if (webcamRef.current && webcamRef.current.video.readyState === 4) {
          const video = webcamRef.current.video;
          
          // AI Lokal mengecek layar: "Ada wajah nggak ya?"
          const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
          
          if (detection) {
            // JIKA ADA WAJAH:
            console.log("Wajah terdeteksi oleh browser! Akurasi:", detection.score);
            
            // 1. Hentikan loop pencarian agar tidak dobel
            setIsScanning(false); 
            clearInterval(interval);
            
            // 2. Jepret foto dan kirim ke Flask
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) sendToFlask(imageSrc);
          } else {
            // JIKA TIDAK ADA WAJAH: Diam saja, server Flask aman dari spam.
            console.log("Tidak ada wajah, server istirahat...");
          }
        }
      }, 1000); // Mengecek setiap 1000ms (1 detik)
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

export default App;