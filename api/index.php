<?php
// index.php - Front Controller MVC
// Penjelasan: Semua permintaan (request) masuk dari frontend harus melalui file ini.
// Di sinilah router aplikasi mulai dipanggil dan bekerja.

require_once 'init.php';

// Menjalankan (Instansiasi) Class App (Router)
$app = new App();
