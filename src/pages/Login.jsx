import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/Kab_Tangerang.png';

// ─── Logo placeholder: drop your actual PNG at src/assets/logo-tangerang.png ───
// import logo from '../assets/logo-tangerang.png';

// ─── Inline SVG Icons (no external dependency needed) ───
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
    <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
    <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
    <path d="m2 2 20 20" />
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

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
      const response = await axios.post('http://127.0.0.1:5000/api/login', {
        username: username,
        password: password
      });

      // 1. Simpan Kunci Token ke memori browser
      localStorage.setItem('access_token', response.data.access_token);

      // 2. TAMBAHAN: Simpan Role, NIP, dan Username untuk UI
      localStorage.setItem('user_role', response.data.user.role);
      localStorage.setItem('user_nip', response.data.user.nip || username);
      localStorage.setItem('user_username', response.data.user.username || username);

      // 3. Arahkan paksa masuk ke dalam Dashboard
      navigate('/dashboard');

    } catch (error) {
      if (error.response) {
        setErrorMsg(error.response.data.message);
      } else {
        setErrorMsg("Gagal terhubung ke server. Periksa koneksi jaringan Anda.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ─── Animated background particles ─── */}
      <div className="login-bg-particles">
        <div className="login-particle login-particle-1" />
        <div className="login-particle login-particle-2" />
        <div className="login-particle login-particle-3" />
        <div className="login-particle login-particle-4" />
        <div className="login-particle login-particle-5" />
      </div>

      {/* ─── Glass Card ─── */}
      <div className="login-card">
        {/* ── Top Accent Bar ── */}
        <div className="login-card-accent" />

        <div className="login-logo-container">
          <img src={logo} className="login-logo-img" />
        </div>

        {/* ── Header Text ── */}
        <div className="login-header">
          <h1 className="login-title">Selamat Datang</h1>
          <p className="login-subtitle">Portal Admin — Sistem Presensi Wajah</p>
          <p className="login-org">Kabupaten Tangerang</p>
        </div>

        {/* ── Error Message ── */}
        {errorMsg && (
          <div className="login-error" role="alert">
            <AlertIcon />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleLogin} className="login-form">
          {/* Username field */}
          <div className="login-input-group">
            <label htmlFor="login-username" className="login-label">NIP / Username</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon"><UserIcon /></span>
              <input
                id="login-username"
                type="text"
                placeholder="Masukkan NIP atau username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="login-input-group">
            <label htmlFor="login-password" className="login-label">Password</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon"><LockIcon /></span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input login-input-password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-eye-btn"
                tabIndex={-1}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="login-submit-btn"
          >
            {isLoading ? (
              <span className="login-spinner-wrap">
                <span className="login-spinner" />
                Memeriksa...
              </span>
            ) : (
              'MASUK'
            )}
          </button>
        </form>

        {/* ── Footer ── */}
        <div className="login-footer">
          <p>© 2026 Diskominfo Kabupaten Tangerang</p>
          <p>Sistem Presensi Wajah</p>
        </div>
      </div>

      <style>{`
        /* ═══════════════════════════════════════════════
           LOGIN PAGE — Modern Government Portal
           ═══════════════════════════════════════════════ */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #0c4a6e 100%);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        /* ── Floating background particles ── */
        .login-bg-particles {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }
        .login-particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(56, 189, 248, 0.08);
          animation: loginFloat 20s ease-in-out infinite;
        }
        .login-particle-1 { width: 300px; height: 300px; top: -80px; right: -60px; animation-delay: 0s; }
        .login-particle-2 { width: 200px; height: 200px; bottom: -50px; left: -40px; animation-delay: -5s; background: rgba(99, 102, 241, 0.06); }
        .login-particle-3 { width: 150px; height: 150px; top: 40%; left: 10%; animation-delay: -10s; }
        .login-particle-4 { width: 100px; height: 100px; bottom: 20%; right: 15%; animation-delay: -7s; background: rgba(16, 185, 129, 0.06); }
        .login-particle-5 { width: 250px; height: 250px; top: 10%; right: 30%; animation-delay: -12s; background: rgba(99, 102, 241, 0.04); }

        @keyframes loginFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -30px) scale(1.05); }
          50% { transform: translate(-20px, 20px) scale(0.95); }
          75% { transform: translate(15px, 10px) scale(1.02); }
        }

        /* ── Glass Card ── */
        .login-card {
          width: 100%;
          max-width: 440px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow:
            0 25px 50px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
          position: relative;
          overflow: hidden;
          z-index: 10;
          animation: loginCardEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes loginCardEnter {
          from { opacity: 0; transform: translateY(30px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Top accent gradient bar ── */
        .login-card-accent {
          height: 5px;
          background: linear-gradient(90deg, #2563eb, #0ea5e9, #06b6d4, #2563eb);
          background-size: 200% 100%;
          animation: loginAccentSlide 4s ease infinite;
        }
        @keyframes loginAccentSlide {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* ── Logo / Shield ── */
        .login-logo-container {
          display: flex;
          justify-content: center;
          padding-top: 36px;
        }
        .login-shield-icon {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: linear-gradient(135deg, #2563eb, #0ea5e9);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
          animation: loginPulseGlow 3s ease-in-out infinite;
        }
        @keyframes loginPulseGlow {
          0%, 100% { box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3); }
          50% { box-shadow: 0 8px 32px rgba(37, 99, 235, 0.45); }
        }
        .login-logo-img {
          width: 72px;
          height: 72px;
          object-fit: contain;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
        }

        /* ── Header ── */
        .login-header {
          text-align: center;
          padding: 24px 32px 8px;
        }
        .login-title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px;
          letter-spacing: -0.5px;
        }
        .login-subtitle {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          margin: 0 0 4px;
        }
        .login-org {
          font-size: 13px;
          font-weight: 600;
          color: #2563eb;
          margin: 0;
          letter-spacing: 0.3px;
        }

        /* ── Error ── */
        .login-error {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 32px 0;
          padding: 12px 16px;
          background: linear-gradient(135deg, #fef2f2, #fff1f2);
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #dc2626;
          font-size: 13px;
          font-weight: 500;
          animation: loginShake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        @keyframes loginShake {
          0%, 100% { transform: translateX(0); }
          10%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }

        /* ── Form ── */
        .login-form {
          padding: 24px 32px 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .login-label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          letter-spacing: 0.2px;
        }
        .login-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .login-input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          pointer-events: none;
          transition: color 0.2s ease;
        }
        .login-input-wrapper:focus-within .login-input-icon {
          color: #2563eb;
        }
        .login-input {
          width: 100%;
          padding: 14px 16px 14px 46px;
          font-size: 15px;
          font-family: inherit;
          font-weight: 500;
          color: #0f172a;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 14px;
          outline: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .login-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }
        .login-input:hover {
          border-color: #cbd5e1;
          background: #f1f5f9;
        }
        .login-input:focus {
          border-color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }
        .login-input-password {
          padding-right: 50px;
        }

        /* ── Eye toggle ── */
        .login-eye-btn {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .login-eye-btn:hover {
          color: #475569;
          background: rgba(0, 0, 0, 0.04);
        }

        /* ── Submit Button ── */
        .login-submit-btn {
          width: 100%;
          padding: 16px;
          font-size: 15px;
          font-family: inherit;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: #ffffff;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border: none;
          border-radius: 14px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
          margin-top: 4px;
        }
        .login-submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .login-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
        }
        .login-submit-btn:hover:not(:disabled)::before {
          opacity: 1;
        }
        .login-submit-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
        }
        .login-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .login-submit-btn > * {
          position: relative;
          z-index: 1;
        }

        /* ── Spinner ── */
        .login-spinner-wrap {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 1;
        }
        .login-spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: loginSpin 0.7s linear infinite;
        }
        @keyframes loginSpin {
          to { transform: rotate(360deg); }
        }

        /* ── Footer ── */
        .login-footer {
          text-align: center;
          padding: 24px 32px 28px;
        }
        .login-footer p {
          margin: 0;
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.6;
        }
        .login-footer p:first-child {
          font-weight: 500;
        }

        /* ── Mobile Responsive ── */
        @media (max-width: 480px) {
          .login-page { padding: 16px; }
          .login-card { border-radius: 20px; }
          .login-form { padding: 20px 24px 0; }
          .login-header { padding: 20px 24px 8px; }
          .login-footer { padding: 20px 24px 24px; }
          .login-error { margin: 0 24px; }
          .login-title { font-size: 22px; }
          .login-input { padding: 12px 14px 12px 42px; font-size: 14px; }
          .login-submit-btn { padding: 14px; font-size: 14px; }
        }

        /* ── Large screens ── */
        @media (min-width: 768px) {
          .login-card { max-width: 460px; }
          .login-title { font-size: 28px; }
        }
      `}</style>
    </div>
  );
};

export default Login;