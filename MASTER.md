# MASTER DESIGN SYSTEM: PORTAL ADMIN SMART PRESENSI
**Pemerintah Kabupaten Tangerang - Dinas Komunikasi dan Informatika**

## 1. Arah Desain & Karakter Visual (`R-37`)
- **Konteks Produk:** Sistem Manajemen Presensi Biometrik Wajah ASN & Non-ASN lintas OPD dan shift operasional.
- **Karakter & Mood:** *Modern Executive Civic* (otoritatif, elegan, bersih, dan presisi untuk administrasi pemerintahan modern).
- **Dials:**
  - `ENERGY 2` (Balanced / Modern Executive: kanvas alabaster `#F3F6FA`, permukaan kartu putih berdimensi lembut `shadow-card`, sidebar *Deep Midnight Navy* `#0B1120`, dan kartu otentikasi terpusat di atas latar *Deep Navy-Ocean*).
  - `RHYTHM 2` (Hierarki terstruktur antarseksi dengan standar lebar kontainer seragam `max-w-[1600px]` di seluruh halaman).
  - `MOTION 2` (Transisi mikro terukur `150ms-200ms` pada hover, fokus, dan interaksi kontrol tanpa animasi berulang tanpa henti, menghormati `prefers-reduced-motion`).
- **Mode Tema (`R-21`):** Intentional High-Contrast Light Mode (`color-scheme: light`) untuk kenyamanan baca tabel ribuan baris di ruang kerja pemerintahan.

## 2. Palet Warna & Standar Kontras WCAG AA (`R-25` & `R-29`)
- **Warna Inti (2-3 Core):**
  - Sidebar & Latar Portal Login: *Deep Midnight Navy* (`#0B1120`) dan *Deep Ocean* (`#122B49` / `#0D3B5E`) dengan teks putih (`18.8:1`), `Slate 300` (`#CBD5E1`, `12.6:1`), dan label grup `Slate 400` (`#94A3B8`, `7.4:1`).
  - Kanvas & Permukaan Kartu: Kanvas `#F3F6FA` dan permukaan `#FFFFFF` dengan garis tepi kontainer `#DCE3EC` serta batas kontrol interaktif `Slate 500` (`#64748B`, rasio `4.76:1` >= `3.0:1`).
  - Teks Utama & Sekunder: `Slate 900` (`#0F172A`, `17.85:1`), `Slate 700` (`#334155`, `10.35:1`), dan `Slate 600` (`#475569`, `7.58:1`).
- **Warna Aksen Tunggal:**
  - `Royal Sapphire` (`#1D4ED8`, kontras teks putih `6.70:1`) untuk tombol tindakan utama, indikator menu/tab aktif, dan cincin fokus `:focus-visible`.
- **Token Status Semantik:**
  - Hadir / Aktif / Terhubung: `Emerald 700/800` di atas `Emerald 50/100`.
  - Peringatan / Belum Pulang / Non-ASN: `Amber 800/950` di atas `Amber 50/100`.
  - Terlambat / Gagal / Hapus: `Red 700/800` di atas `Red 50/100` atau tombol `Red 700` dengan teks putih (`5.91:1`).

## 3. Tipografi & Standar Seragam Tabel (`R-06`)
- Maksimal **2 keluarga font**: `Plus Jakarta Sans` dan `JetBrains Mono` dengan `font-variant-numeric: tabular-nums`.
- **Standar Anatomi Tabel (`.gov-table`):** Seluruh halaman data dan seluruh submenu Konfigurasi menggunakan lebar kontainer identik (`w-full max-w-[1600px]`), `.gov-table-toolbar` (`min-h-[68px]`), tinggi header `44px` (`h-11`), tinggi baris data `56px` (`h-[56px]`), kolom pertama `No` (`w-14 text-center`), dan bilah paginasi bawah `<TablePaginationBar />`.

## 4. Skala Sudut, Elevasi Bertingkat, & Aksesibilitas (`R-03`, `R-10`, `R-11`, `R-12`, `R-32`)
- **Skala Border Radius 4 Tingkat:** `6px` (`rounded-md` lencana), `10px` (`rounded-lg` input & tombol), `14px` (`rounded-xl` panel dalam), `18px` (`rounded-2xl` kartu utama & modal), `24px` (`rounded-3xl` kartu fokus portal login).
- **Aturan Elevasi & Glassmorphism:** Panel dalam dan baris tabel datar (`shadow-none`), kartu utama memakai kedalaman lembut (`shadow-card`), modal/laci memakai `shadow-modal`, dan aksen `backdrop-blur` dibatasi maksimal 1 elemen pada kartu fokus halaman Login (`R-10`).
- **Ukuran Sentuh & Keyboard:** Seluruh kontrol minimal `44x44px`, ramah `Tab`/`Enter`/`Escape`, dan menampilkan `:focus-visible` `2px solid #1D4ED8`.

## 5. Tata Bahasa & Kejujuran Antarmuka (`R-02`, `R-16`, `R-27`, `R-38`)
- Bahasa Indonesia kedinasan yang lugas, alami, tanpa em-dash (`—`) atau en-dash (`–`), tanpa emoji dekoratif, dan tanpa *buzzword* AI.
- Setiap tampilan data menyediakan **Loading State**, **Empty State**, dan **Error State** (+ tombol **Coba Lagi** / **Muat Ulang**).
