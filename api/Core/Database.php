<?php
// Core/Database.php - Wrapper Database PDO (Bagian Model)
// Penjelasan: File ini bertindak sebagai jembatan aplikasi ke database.
// Menggunakan pola rekayasa perangkat lunak Singleton/Wrapper.

class Database {
    private $host = 'localhost';
    private $user = 'root';
    private $pass = ''; // Sesuaikan dengan password XAMPP Anda
    private $db_name = 'kasir_stock';

    private $dbh; // Database Handler
    private $stmt; // Statement

    public function __construct() {
        // Data Source Name
        $dsn = 'mysql:host=' . $this->host . ';dbname=' . $this->db_name;
        
        $options = [
            PDO::ATTR_PERSISTENT => true, // Menjaga koneksi tetap menyala (optimasi db)
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ];

        try {
            $this->dbh = new PDO($dsn, $this->user, $this->pass, $options);
        } catch(PDOException $e) {
            // Mengembalikan error dalam bentuk JSON karena ini adalah API MVC
            http_response_code(500);
            echo json_encode(['error' => 'Koneksi database gagal: ' . $e->getMessage()]);
            exit;
        }
    }

    // Fungsi untuk mempersiapkan query (mencegah SQL Injection)
    public function query($query) {
        $this->stmt = $this->dbh->prepare($query);
    }

    // Fungsi untuk mengikat nilai binding ke parameter di query (misal: WHERE id = :id)
    public function bind($param, $value, $type = null) {
        if (is_null($type)) {
            switch (true) {
                case is_int($value):
                    $type = PDO::PARAM_INT;
                    break;
                case is_bool($value):
                    $type = PDO::PARAM_BOOL;
                    break;
                case is_null($value):
                    $type = PDO::PARAM_NULL;
                    break;
                default:
                    $type = PDO::PARAM_STR;
            }
        }
        $this->stmt->bindValue($param, $value, $type);
    }

    // Eksekusi query yang sudah disiapkan
    public function execute() {
        return $this->stmt->execute();
    }

    // Mengambil banyak data sekaligus (misal: list pelanggan)
    public function resultSet() {
        $this->execute();
        return $this->stmt->fetchAll();
    }

    // Mengambil satu data saja (detail pelanggan)
    public function single() {
        $this->execute();
        return $this->stmt->fetch();
    }

    // Menghitung jumlah baris yang terpengaruh (untuk insert / update / delete)
    public function rowCount() {
        return $this->stmt->rowCount();
    }

    // Mendapatkan ID terakhir yang baru di-insert
    public function lastInsertId() {
        return $this->dbh->lastInsertId();
    }

    // Dukungan transaksi database (jika sebuah proses gagal, kembalikan ke awal)
    public function beginTransaction() {
        return $this->dbh->beginTransaction();
    }

    public function commit() {
        return $this->dbh->commit();
    }

    public function rollBack() {
        return $this->dbh->rollBack();
    }
}
