import * as faceapi from '@vladmandic/face-api';

let initPromise = null;

/**
 * Inisialisasi TensorFlow.js & TinyFaceDetector secara aman (singleton, tanpa backend WASM).
 * Menghapus backend 'wasm' dan 'webgpu' sebelum memanggil tf.ready() agar browser tidak
 * pernah meminta file .wasm eksternal yang berujung CompileError saat tidak tersedia.
 */
export async function initFaceDetector() {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const tf = faceapi.tf;
    if (tf) {
      try {
        const registry = tf.engine?.()?.registryFactory;
        if (registry) {
          if ('wasm' in registry) {
            try {
              tf.removeBackend('wasm');
            } catch {
              // Abaikan jika backend belum aktif
            }
          }
          if ('webgpu' in registry) {
            try {
              tf.removeBackend('webgpu');
            } catch {
              // Abaikan jika backend belum aktif
            }
          }
        }

        let backendReady = false;
        try {
          backendReady = Boolean(await tf.setBackend('webgl'));
        } catch {
          backendReady = false;
        }

        if (!backendReady) {
          const cpuOk = Boolean(await tf.setBackend('cpu'));
          if (!cpuOk) {
            throw new Error('Backend TensorFlow.js (webgl dan cpu) tidak tersedia pada browser ini.');
          }
        }

        await tf.ready();
      } catch (err) {
        throw new Error(err?.message || 'Gagal menginisialisasi engine TensorFlow.js.');
      }
    }

    if (!faceapi.nets.tinyFaceDetector.isLoaded) {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    }

    return true;
  })().catch((err) => {
    initPromise = null;
    throw err;
  });

  return initPromise;
}

/**
 * Mendeteksi 1 wajah pada elemen <video> lalu melakukan square crop dengan margin proporsional
 * agar tetap terbaca optimal oleh MTCNN di backend. Mengembalikan null jika wajah tidak terdeteksi.
 */
export async function captureFaceBlobFromVideo(video) {
  if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
    throw new Error('Aliran kamera belum siap. Tunggu beberapa saat lalu coba kembali.');
  }

  const detection = await faceapi.detectSingleFace(
    video,
    new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 })
  );

  if (!detection) {
    return null;
  }

  const vidW = video.videoWidth;
  const vidH = video.videoHeight;
  const { x, y, width, height } = detection.box;

  const baseSize = Math.max(width, height);
  const cropSize = Math.max(1, Math.min(Math.round(baseSize * 1.9), vidW, vidH));
  const cropX = Math.max(0, Math.min(vidW - cropSize, Math.round(x + width / 2 - cropSize / 2)));
  const cropY = Math.max(0, Math.min(vidH - cropSize, Math.round(y + height / 2 - cropSize / 2)));

  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Konteks kanvas 2D tidak tersedia pada browser.');
  }

  ctx.drawImage(video, cropX, cropY, cropSize, cropSize, 0, 0, 480, 480);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Gagal mengonversi tangkapan wajah menjadi berkas JPEG.'));
        }
      },
      'image/jpeg',
      0.95
    );
  });
}
