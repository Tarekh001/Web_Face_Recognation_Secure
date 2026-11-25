// src/config/api.js
// Satu tempat untuk konfigurasi URL API.
// Default '/api' agar otomatis mengikuti domain/host yang dibuka (via Vite proxy / Nginx)
// dan tetap bisa di-override via VITE_API_BASE di .env atau .env.production jika backend beda host.

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default API_BASE;
