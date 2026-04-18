<?php
// Models/AuthModel.php - Model Autentikasi
// Penjelasan: Model ini khusus mengelola alur data yang berkaitan dengan tabel `users` untuk proses login/sesi.

class AuthModel {
    private $db;

    public function __construct() {
        $this->db = new Database(); // Memanggil instance DB
    }

    // Mengambil data user berdasarkan username
    public function getUserByUsername($username) {
        $this->db->query("SELECT * FROM users WHERE username = :username");
        $this->db->bind(':username', $username);
        return $this->db->single(); // Mengembalikan hanya 1 baris
    }
}
