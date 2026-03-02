import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Mencegah halaman refresh
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/login', {
        username: username,
        password: password
      });

      // 1. Jika berhasil, simpan Kunci Token ke memori browser
      localStorage.setItem('access_token', response.data.access_token);
      
      // 2. Arahkan paksa masuk ke dalam Dashboard
      navigate('/dashboard');
      
    } catch (error) {
      if (error.response) {
        setErrorMsg(error.response.data.message);
      } else {
        setErrorMsg("Gagal terhubung ke server Flask.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Login Admin</h2>
        
        {errorMsg && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="NIP / Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            {isLoading ? "Memeriksa..." : "MASUK"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;