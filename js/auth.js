// js/auth.js - Authentication Logic
import { API } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const authPage = document.getElementById('auth-page');
    const mainLayout = document.getElementById('main-layout');
    const logoutBtn = document.getElementById('logout-btn');
    const displayUser = document.getElementById('display-user');

    const checkAuth = async () => {
        try {
            const data = await API.get('auth/check');
            if (data.loggedIn) {
                showApp(data.user);
            } else {
                showAuth();
            }
        } catch (e) {
            showAuth();
        }
    };

    const showApp = (user) => {
        authPage.style.display = 'none';
        mainLayout.style.display = 'block';
        if (displayUser) displayUser.textContent = user.username;
        app.init(); // Initialize main app logic
    };

    const showAuth = () => {
        authPage.style.display = 'flex';
        mainLayout.style.display = 'none';
    };

    loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(loginForm);
    const username = formData.get('username');
    const password = formData.get('password');

    // 🔄 Loading
    Swal.fire({
        title: 'Sedang Login...',
        text: 'Mohon tunggu sebentar',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        },
        background: '#1e293b',
        color: '#f8fafc'
    });

    try {
        const data = await API.post('auth/login', { username, password });

        // ✅ Success Login
        Swal.fire({
            icon: 'success',
            title: 'Login Berhasil!',
            text: `Selamat datang, ${data.user.username}`,
            timer: 1500,
            showConfirmButton: false,
            background: '#1e293b',
            color: '#f8fafc'
        });

        showApp(data.user);

    } catch (e) {
        // ❌ Error Login
        Swal.fire({
            icon: 'error',
            title: 'Login Gagal!',
            text: 'Username atau password salah',
            background: '#1e293b',
            color: '#f8fafc'
        });
    }
});

    logoutBtn.addEventListener('click', async () => {

    const confirm = await Swal.fire({
        title: 'Yakin mau keluar?',
        text: 'Anda akan logout dari sistem',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Keluar',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#ef4444',
        background: '#1e293b',
        color: '#f8fafc'
    });

    if (!confirm.isConfirmed) return;

    try {
        await API.get('auth/logout');

        // ✅ Success Logout
        Swal.fire({
            icon: 'success',
            title: 'Berhasil Logout',
            timer: 1500,
            showConfirmButton: false,
            background: '#1e293b',
            color: '#f8fafc'
        });

        showAuth();

    } catch (e) {
        // ❌ Error Logout
        Swal.fire({
            icon: 'error',
            title: 'Logout Gagal',
            text: 'Terjadi kesalahan',
            background: '#1e293b',
            color: '#f8fafc'
        });
    }
});

    checkAuth();
});
