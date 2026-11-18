import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Lock, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import API_BASE from '../config/api';
import logo from '../assets/Kab_Tangerang.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await axios.post(`${API_BASE}/login`, {
        username,
        password,
      });

      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user_role', response.data.user.role);
      localStorage.setItem('user_nip', response.data.user.nip || username);
      localStorage.setItem('user_username', response.data.user.username || username);

      navigate('/dashboard');
    } catch (error) {
      if (error.response) {
        setErrorMsg(error.response.data.message || 'NIP, username, atau kata sandi tidak sesuai.');
      } else {
        setErrorMsg('Gagal terhubung ke server presensi. Periksa koneksi jaringan Anda.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-dvh w-full flex flex-col justify-between px-4 py-6 sm:px-6"
      style={{
        background: 'linear-gradient(140deg, #091122 0%, #132d4e 48%, #0c3b5e 100%)',
      }}
    >
      {/* Landmark Header Ringkas Identitas Layanan */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-center sm:justify-between gap-3 text-slate-200">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.08] border border-white/15 text-xs font-semibold tracking-wide">
          <ShieldCheck size={14} className="text-sky-300 shrink-0" aria-hidden="true" />
          <span>Portal Resmi Pemerintah Kabupaten Tangerang</span>
        </div>
        <span className="hidden sm:inline text-xs font-medium text-slate-300">
          Sistem Manajemen Presensi Biometrik
        </span>
      </header>

      {/* Kartu Utama Login Terpusat (Komposisi Klasik yang Disempurnakan) */}
      <main className="flex-1 flex items-center justify-center py-6">
        <div className="w-full max-w-[450px] bg-white/95 backdrop-blur-md rounded-3xl border border-white/25 shadow-[0_28px_60px_-12px_rgba(5,10,24,0.55)] overflow-hidden">
          {/* Garis Aksen Statis Royal Sapphire ke Ocean (Tanpa Animasi Berulang - R-19) */}
          <div
            className="h-1.5 w-full"
            style={{
              background: 'linear-gradient(90deg, #1d4ed8 0%, #0284c7 50%, #1d4ed8 100%)',
            }}
            aria-hidden="true"
          />

          <div className="px-6 sm:px-9 pt-8 pb-7">
            {/* Lambang Resmi di Tengah Atas */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-soft-sm flex items-center justify-center p-2.5">
                <img
                  src={logo}
                  alt="Lambang Pemerintah Kabupaten Tangerang"
                  width="60"
                  height="60"
                  fetchPriority="high"
                  className="w-14 h-14 object-contain"
                />
              </div>
            </div>

            {/* Sapaan & Identitas Portal */}
            <div className="text-center mt-5 mb-6">
              <h1 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
                Selamat Datang
              </h1>
              <p className="text-sm font-semibold text-slate-700 mt-1">
                Portal Admin: Sistem Presensi Wajah
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-800 mt-1">
                Kabupaten Tangerang
              </p>
            </div>

            {/* Kotak Peringatan Galat */}
            {errorMsg && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-300 flex items-start gap-2.5 text-red-800 text-xs font-semibold"
              >
                <AlertCircle size={17} className="text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Formulir Otentikasi */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-xs font-bold text-slate-800 mb-1.5"
                >
                  NIP / Username
                </label>
                <div className="relative">
                  <User
                    size={18}
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                  />
                  <input
                    id="login-username"
                    type="text"
                    placeholder="Masukkan NIP atau username admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                    className="w-full min-h-[48px] pl-11 pr-4 py-3 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-500 rounded-xl text-sm font-medium text-slate-900 transition-all duration-150 focus:border-blue-700 focus:ring-4 focus:ring-blue-700/12 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-slate-800 mb-1.5"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan kata sandi akun"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="w-full min-h-[48px] pl-11 pr-12 py-3 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-500 rounded-xl text-sm font-medium text-slate-900 transition-all duration-150 focus:border-blue-700 focus:ring-4 focus:ring-blue-700/12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[50px] px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 active:bg-blue-900 active:translate-y-px text-white text-sm font-extrabold tracking-wide shadow-btn-primary hover:shadow-btn-primary-hover transition-all duration-150 inline-flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:active:translate-y-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                      <span>Memverifikasi Kredensial...</span>
                    </>
                  ) : (
                    <span>Masuk ke Portal</span>
                  )}
                </button>
              </div>
            </form>

            {/* Catatan Keamanan di Dalam Kartu (Kontras Tinggi >= 7.5:1) */}
            <div className="mt-6 pt-5 border-t border-slate-200 text-center">
              <p className="text-xs font-medium text-slate-600 leading-relaxed">
                Akses terbatas bagi operator resmi OPD dan Super Admin yang berwenang.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Landmark Footer Resmi */}
      <footer className="w-full max-w-5xl mx-auto text-center text-xs font-medium text-slate-300">
        <p>© 2026 Dinas Komunikasi dan Informatika Kabupaten Tangerang</p>
      </footer>
    </div>
  );
};

export default Login;
