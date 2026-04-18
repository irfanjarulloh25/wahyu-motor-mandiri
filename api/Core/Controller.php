<?php
// Core/Controller.php - Controller Utama
// Penjelasan: Kelas dasar (induk) yang akan diturunkan (extends) oleh semua Controller lainnya.
// Bertugas memanggil Model yang dibutuhkan dan memiliki utilitas standar seperti mengirim respons JSON.

class Controller {

    // Fungsi untuk memanggil (instansiasi) Model
    public function model($model) {
        require_once '../api/Models/' . $model . '.php';
        return new $model; // Membuat objek baru dari model yang dipilih
    }

    // Fungsi utilitas untuk memberikan output JSON sesuai format API standar
    public function sendResponse($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json');
        
        // Memastikan tidak ada output lain sebelum json output
        echo json_encode($data);
        exit;
    }

    // Fungsi untuk mendapatkan input JSON (biasanya dipakai di POST/PUT method)
    public function getJsonInput() {
        return json_decode(file_get_contents("php://input"), true);
    }
}
