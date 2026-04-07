# Web_Face_Recognation_Secure

# Smart Presensi - Face Recognition AI Secure

Sistem informasi presensi cerdas terintegrasi untuk Aparatur Sipil Negara (ASN). Proyek ini memanfaatkan teknologi kecerdasan buatan (FaceNet) untuk pengenalan wajah biometrik, arsitektur microservices ringan, dan isolasi data multi-instansi.

## Arsitektur Sistem

Sistem ini terbagi menjadi empat pilar utama yang saling berkomunikasi melalui RESTful API.

### 1. Backend (Python / Flask)
Berperan sebagai otak komputasi dan gerbang keamanan utama.
* Framework: Flask dengan Flask-SQLAlchemy & Flask-CORS.
* Keamanan: Autentikasi berbasis JSON Web Token (JWT) dengan Role-Based Access Control (RBAC).
* AI Module: Pemrosesan embedding wajah menggunakan model FaceNet lokal.
* Sinkronisasi: Skrip mandiri (`sync_data.py`) untuk memigrasikan data legacy ke database utama.

### 2. Database (Relational SQL)
Pusat penyimpanan data transaksional dan master data.
* Master Data: Menyimpan referensi Organisasi Perangkat Daerah (OPD), daftar ASN, dan mesin pemindai fisik.
* Transaksional: Tabel presensi yang dipartisi berdasarkan bulan untuk menjaga performa kueri pada data berskala besar.
* Audit Trail: Pencatatan riwayat aktivitas administratif (CRUD) secara ketat.

### 3. Frontend Web (React / Vite)
Antarmuka administratif berbasis web untuk pengelola sistem.
* Styling: Tailwind CSS untuk desain responsif dan modern.
* Pendaftaran Biometrik: Antarmuka `RegisterUser` dengan Guided UI (Face Overlay & Visual Checklist) yang menggunakan `@vladmandic/face-api` untuk deteksi wajah klien.
* Dashboard Admin: Tabel pelaporan dinamis dengan fitur pencarian, filter, dan ekspor CSV.

### 4. Mobile App (Flutter) - [Dalam Pengembangan]
Aplikasi pendamping untuk ASN di lapangan.
* Liveness Detection: Mengintegrasikan Google ML Kit (Native Android/iOS) untuk mencegah spoofing wajah (misal: deteksi kedipan).
* Integrasi Kamera: Pengambilan gambar presisi yang dikirimkan langsung ke endpoint Flask melalui HTTP Multipart Request.

## Alur Kerja Utama (Workflow)

1. Pendaftaran: Admin mendaftarkan data NIP dan menangkap 5 sampel wajah ASN melalui Web.
2. Ekstraksi Fitur: Flask memproses foto, menghasilkan file embedding (.pkl), dan menyimpannya di server.
3. Presensi: ASN memindai wajah melalui Web Kamera atau Aplikasi Mobile.
4. Validasi: Sistem memverifikasi Liveness (khusus mobile), mengekstrak embedding wajah baru, dan membandingkannya dengan database menggunakan jarak Euclidean (Threshold).
5. Pencatatan: Jika wajah cocok dan ASN berada di OPD yang sesuai, sistem mencatat waktu absensi berdasarkan aturan jam kerja.
