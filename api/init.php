<?php
// init.php - File Inisialisasi MVC
// Penjelasan: Menggabungkan (memanggil) semua class Core ke dalam satu file.
// Praktik umum untuk proyek mahasiswa agar index.php lebih bersih.

require_once 'Core/App.php';
require_once 'Core/Controller.php';
require_once 'Core/Database.php';

// Memulai Session dan Header Standar (Karena ini adalah rest API yang bersifat stateless atau cookie session base)
session_start();

// Header untuk memastikan format respons selalu JSON
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit; // Berhenti jika request adalah preflight (metode OPTIONS)
}
