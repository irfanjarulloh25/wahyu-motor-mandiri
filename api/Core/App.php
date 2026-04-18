<?php
// Core/App.php - Router Utama Aplikasi
// Penjelasan: Ini adalah "otak" routing MVC. Bertugas memecah URL menjadi bagian: Controller, Method, dan Parameter.

class App {
    protected $controller = 'Dashboard'; // Controller default (jika URL kosong)
    protected $method = 'index';         // Method default
    protected $params = [];              // Parameter URL

    public function __construct() {
        // Mendapatkan URL (misal: index.php?url=customers/detail/1)
        $url = $this->parseURL();

        // 1. Cek apakah file Controller yang di-request pengguna ada di direktori Controllers
        if (isset($url[0])) {
            $requestedController = ucfirst($url[0]); // Huruf depan wajib kapital (Konvensi OOP)
            if (file_exists('../api/Controllers/' . $requestedController . '.php')) {
                $this->controller = $requestedController;
                unset($url[0]);
            } else {
                // Jika route tidak ditemukan, kirim error 404 (Karena ini API)
                http_response_code(404);
                echo json_encode(['error' => 'Endpoint tidak ditemukan: ' . $requestedController]);
                exit;
            }
        }

        // Panggil (Require) file Controllernya
        require_once '../api/Controllers/' . $this->controller . '.php';
        
        // Instansiasi objek Controller yang terpilih
        $this->controller = new $this->controller;

        // 2. Cek apakah ada metode/fungsi (Method) yang di-request pada Controller tersebut
        if (isset($url[1])) {
            if (method_exists($this->controller, $url[1])) {
                $this->method = $url[1];
                unset($url[1]);
            }
        }

        // 3. Cek parameter tambahan (jika ada, masukkan array params)
        if (!empty($url)) {
            $this->params = array_values($url); // Susun ulang index array mulai dari 0
        }

        // Jalankan Controller dan Method, serta kirim Params jika ada parameter URL
        call_user_func_array([$this->controller, $this->method], $this->params);
    }

    // Fungsi untuk memecah `index.php?url=...` menjadi Array
    public function parseURL() {
        if (isset($_GET['url'])) {
            $url = rtrim($_GET['url'], '/'); // Hapus slash di akhir string
            $url = filter_var($url, FILTER_SANITIZE_URL); // Bersihkan URL dari karakter asing (Keamanan)
            $url = explode('/', $url); // Pecah URL berdasar '/' menjadi array [controller, method, param]
            return $url;
        }
        return [];
    }
}
