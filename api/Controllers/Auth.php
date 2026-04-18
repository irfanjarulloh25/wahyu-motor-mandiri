<?php
// Controllers/Auth.php - Controller Autentikasi
// Penjelasan: Menangani alur verifikasi login, logout, dan cek sesi menggunakan arsitektur MVC (mewarisi class Base Controller).

class Auth extends Controller {

    // Method default (mencegah error jika dipanggil tanpa method)
    public function index() {
        $this->sendResponse(['error' => 'Method tidak diizinkan'], 405);
    }

    // Endpoint untuk Login (Diakses via api/index.php?url=auth/login)
    public function login() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $data = $this->getJsonInput(); // Fungsi dari Controller utama
            
            $username = trim($data['username'] ?? '');
            $password = trim($data['password'] ?? '');

            if (empty($username) || empty($password)) {
                $this->sendResponse(['error' => 'Username dan password wajib diisi'], 400);
            }

            // Memanggil AuthModel
            $authModel = $this->model('AuthModel');
            $user = $authModel->getUserByUsername($username);

            if ($user) {
                // Verifikasi password (teori: menggunakan hash bcrypt standar PHP)
                if (password_verify($password, $user['password'])) {
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['username'] = $user['username'];
                    $_SESSION['role'] = $user['role'];
                    
                    $this->sendResponse([
                        'message' => 'Login berhasil', 
                        'user' => [
                            'id' => $user['id'],
                            'username' => $user['username'],
                            'role' => $user['role'],
                            'full_name' => $user['full_name']
                        ]
                    ]);
                } else {
                    $this->sendResponse(['error' => 'Password salah'], 401);
                }
            } else {
                $this->sendResponse(['error' => 'User tidak ditemukan'], 401);
            }
        } else {
            $this->sendResponse(['error' => 'Hanya POST yang didukung'], 405);
        }
    }

    // Endpoint Check Session (Diakses via api/index.php?url=auth/check)
    public function check() {
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            if (isset($_SESSION['user_id'])) {
                $this->sendResponse([
                    'loggedIn' => true, 
                    'user' => [
                        'username' => $_SESSION['username'],
                        'role' => $_SESSION['role']
                    ]
                ]);
            } else {
                // Pastikan respons 200 dengan status false, bukan 401 (agar tidak terjadi masalah CORS/Promise rejections terlalu dini)
                $this->sendResponse(['loggedIn' => false]);
            }
        }
    }

    // Endpoint Logout (Diakses via api/index.php?url=auth/logout)
    public function logout() {
        if ($_SERVER['REQUEST_METHOD'] === 'GET' || $_SERVER['REQUEST_METHOD'] === 'POST') {
            session_destroy();
            $this->sendResponse(['message' => 'Anda telah berhasil keluar']);
        }
    }
}
