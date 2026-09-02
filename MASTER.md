# 🏛️ SMART PRESENSI GOVERNMENT — DESIGN SYSTEM MASTER SPECIFICATION
> **Architecture & Visual System: Modern Enterprise SaaS with Soft Glassmorphism**  
> **Domain:** Smart City Government (Diskominfo Attendance & Identity AI)  
> **Tech Stack:** React.js, Tailwind CSS, Lucide Icons, Leaflet Maps  
> **Version:** 2.0 (Dual-Mode: ASN & Non-ASN Ready)

---

## 1. Design Philosophy & Direction

| Pilar | Prinsip Desain | Implementasi Visual |
|---|---|---|
| **Authority & Trust** | Estetika Smart City Government yang berwibawa, modern, dan formal. | Palet Deep Navy (`#0F172A`), Royal Sapphire (`#1D4ED8`), dan Clean Slate. |
| **Clarity & Efficiency** | Hirarki visual tegas untuk pemantauan ratusan OPD, ribuan ASN, dan perangkat kiosk. | Tipografi tabular untuk NIP/NIK, status badge berpendar lembut, dan kontras WCAG AA (≥ 4.5:1). |
| **Tactile Soft UI & Glassmorphism** | Kedalaman visual modern tanpa mengorbankan performa render tabel data. | Kartu *frosted glass* (`backdrop-blur-md`, `bg-white/85`), border halus (`border-white/60`), dan shadow multi-layer tipis. |
| **Cognitive Simplicity** | Memudahkan Admin OPD dan Super Admin membedakan entitas secara instan. | Diferensiasi badge: **ASN (Royal Blue / Emerald)** vs **Non-ASN (Amber Warm Glow)**. |

---

## 2. Color Palette & Token Architecture

```
Primitive Token ───► Semantic Token ───► Component Utility (Tailwind)
```

### 2.1 Primary & Brand Colors (Smart City Sapphire)
```css
--color-primary-50:  #EFF6FF; /* Background Tint */
--color-primary-100: #DBEAFE; /* Soft Highlight */
--color-primary-200: #BFDBFE; /* Border Light */
--color-primary-500: #3B82F6; /* Active Interactive */
--color-primary-600: #2563EB; /* Main Brand Accent */
--color-primary-700: #1D4ED8; /* Buttons & Primary Nav */
--color-primary-800: #1E40AF; /* Sidebar Brand Header */
--color-primary-900: #1E3A8A; /* Sidebar Container Dark */
--color-primary-950: #0F172A; /* Slate Navy Depth */
```

### 2.2 Functional & Status Tokens
* **ON_TIME / Approved / Active:** Emerald Clean (`#10B981` / `#059669`) — `bg-emerald-50 text-emerald-700 ring-emerald-300`
* **LATE / Warning / Action Required:** Crimson Rose (`#EF4444` / `#DC2626`) — `bg-red-50 text-red-700 ring-red-300`
* **NON-ASN Identity:** Warm Amber (`#F59E0B` / `#D97706`) — `bg-amber-50 text-amber-800 ring-amber-300`
* **ABSENT / Inactive / Unknown:** Slate Neutral (`#64748B`) — `bg-slate-100 text-slate-600 ring-slate-200`
* **Live Kiosk / Device Online:** Cyan Glow (`#06B6D4` / `#0EA5E9`) — `bg-cyan-50 text-cyan-700 ring-cyan-300`

### 2.3 Surface & Glassmorphism Tokens
* **App Canvas Background:** `#F8FAFC` (Slate 50) dengan aksen *radial subtle mesh* `#EFF6FF`.
* **Glass Card Surface:** `rgba(255, 255, 255, 0.85)` + `backdrop-filter: blur(12px)`.
* **Glass Card Border:** `rgba(255, 255, 255, 0.60)` / Dark Mode `rgba(255, 255, 255, 0.10)`.
* **Glass Modal / Popover:** `rgba(255, 255, 255, 0.95)` + `backdrop-filter: blur(20px)` + `shadow-glass-lg`.

---

## 3. Typography Hierarchy

### 3.1 Font Family Pairing
* **Display & Body Font:** `Plus Jakarta Sans`, `Inter`, `sans-serif` (Enterprise Grade readability, geometric clean curves).
* **Data & Numerical Font:** `JetBrains Mono`, `ui-monospace`, `monospace` (Digunakan khusus untuk NIP 18 digit, NIK 16 digit, Device Serial Number, Jam Presensi `HH:MM:SS`, dan Koordinat GPS).

### 3.2 Type Scale
| Level | Size / Line-height | Weight | Penggunaan |
|---|---|---|---|
| **Display Header** | `30px / 36px (1.875rem)` | `800 (Extrabold)` | Judul Utama Halaman (`Dashboard`, `Laporan Harian`) |
| **Section Title** | `20px / 28px (1.25rem)` | `700 (Bold)` | Header Tabel, Modal Header, Statistik Card Title |
| **Body Primary** | `14px / 20px (0.875rem)` | `500 (Medium) / 600` | Tabel Row, Label Form, Item Navigasi |
| **Body Secondary** | `12px / 16px (0.75rem)` | `400 (Regular)` | Subtext, Deskripsi Form, Meta Timestamps |
| **Micro Caption / Badge** | `11px / 14px (0.6875rem)` | `700 (Bold)` | Status Pill, NIP Subtitle, Role Tag |

---

## 4. Spacing, Elevation & Shadows

### 4.1 Elevation Levels (Soft UI)
```css
/* Tailwind custom shadow extensions */
shadow-soft-xs:  0 1px 2px 0 rgba(15, 23, 42, 0.04);
shadow-soft-sm:  0 2px 4px -1px rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04);
shadow-soft-md:  0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04);
shadow-soft-lg:  0 12px 24px -4px rgba(15, 23, 42, 0.10), 0 4px 10px -2px rgba(15, 23, 42, 0.05);
shadow-glass:    0 8px 32px 0 rgba(31, 38, 135, 0.07);
shadow-glass-lg: 0 16px 48px 0 rgba(31, 38, 135, 0.12);
```

### 4.2 Border Radius System
* **Badges / Micro Tags:** `rounded-full` / `rounded-md (6px)`
* **Inputs & Controls:** `rounded-xl (12px)`
* **Cards & Table Containers:** `rounded-2xl (16px)`
* **Modals & Flyouts:** `rounded-3xl (24px)`

---

## 5. UI Component Specifications

### 5.1 Glassmorphic Data Card / Metric Widget
```jsx
<div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-glass hover:shadow-soft-lg transition-all duration-300">
  <div className="flex items-center justify-between">
    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total ASN Hadir</p>
    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
      <Users size={20} />
    </div>
  </div>
  <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">1,248</p>
  <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600">
    <span>↑ 98.4%</span>
    <span className="text-slate-400 font-normal">dari total 1,268 pegawai</span>
  </div>
</div>
```

### 5.2 Filter Bar Container (Modern Toolbar)
```jsx
<div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 shadow-soft-sm mb-6 flex flex-wrap items-end gap-4">
  {/* Search with Inset Soft Style */}
  <div className="flex-1 min-w-[240px]">
    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Pencarian</label>
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input 
        type="text" 
        placeholder="Cari NIP / NIK / Nama..." 
        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
      />
    </div>
  </div>
</div>
```

### 5.3 High-Precision Role & Status Badges
* **ASN Badge:** `<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 ring-1 ring-blue-200">ASN</span>`
* **Non-ASN Badge:** `<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-200">Non-ASN</span>`
* **Tepat Waktu:** `<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"><CheckCircle2 size={12}/> Tepat Waktu</span>`
* **Terlambat:** `<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600 ring-1 ring-red-200"><Clock size={12}/> Terlambat (15m)</span>`

---

## 6. Accessibility & Motion Rules (WCAG 2.1 AA)

1. **Interactive Minimum Touch Target:** Semua button, icon toggle, dan pagination controls minimal `40x40px` (desktop) dan `44x44px` (mobile).
2. **Focus Visibility:** Semua form control dan button memiliki ring fokus yang jelas: `focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`.
3. **Contrast Safe Text:** Teks di atas container glassmorphic harus menggunakan `text-slate-800` atau `text-slate-900` untuk memastikan kontras rasio minimal `4.5:1`.
4. **Reduced Motion Safe:** Transisi CSS maksimal `200ms–300ms` dengan kurva `ease-out`. Animasi spin loader menggunakan SVG ringan.
