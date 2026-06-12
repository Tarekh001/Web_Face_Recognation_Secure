import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const decodeJWT = (token) => {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

const useAutoLogout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const decoded = decodeJWT(token);
        if (!decoded || !decoded.exp) return;

        const currentTime = Math.floor(Date.now() / 1000);
        const timeLeft = decoded.exp - currentTime;

        if (timeLeft <= 0) {
            // Token sudah expired
            handleLogout();
        } else {
            // Set timeout agar pas dengan waktu expire token
            const timeoutId = setTimeout(() => {
                handleLogout();
            }, timeLeft * 1000);

            return () => clearTimeout(timeoutId);
        }
    }, [navigate]);

    const handleLogout = () => {
        Swal.fire({
            icon: 'warning',
            title: 'Sesi Telah Habis',
            text: 'Sesi Anda telah berakhir setelah 15 menit. Silakan login kembali untuk keamanan.',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Login Ulang',
            allowOutsideClick: false
        }).then((result) => {
            if (result.isConfirmed) {
                // Hapus sesi hanya ketika user sudah klik tombol OK
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_role');
                localStorage.removeItem('user_nip');
                localStorage.removeItem('user_username');
                
                navigate('/login');
            }
        });
    };
};

export default useAutoLogout;
