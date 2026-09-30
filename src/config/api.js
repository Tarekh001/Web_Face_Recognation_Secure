// src/config/api.js
// Satu tempat untuk konfigurasi URL API.
// Di development: pakai nilai dari .env (http://127.0.0.1:5000/api)
// Di production build: pakai nilai dari .env.production (http://IP_SERVER:5000/api)

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000/api';

export default API_BASE;
