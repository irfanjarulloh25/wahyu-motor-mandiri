<?php
// Models/ServiceModel.php - Model Jasa
// Penjelasan: Mewakili tabel services. Memiliki logika "soft delete" yaitu mengubah is_active menjadi 0.

class ServiceModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function getAllActiveServices() {
        $this->db->query("SELECT * FROM services WHERE is_active = 1 ORDER BY name ASC");
        return $this->db->resultSet();
    }

    public function getServiceById($id) {
        $this->db->query("SELECT * FROM services WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function createService($data) {
        $this->db->query("INSERT INTO services (name, price, is_active) VALUES (:name, :price, 1)");
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':price', $data['price']);
        $this->db->execute();
        return $this->db->lastInsertId();
    }

    public function updateService($id, $data) {
        $this->db->query("UPDATE services SET name = :name, price = :price WHERE id = :id");
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':price', $data['price']);
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    public function softDeleteService($id) {
        // Kita hanya nonaktifkan agar nota transaksi lama tetap valid terbaca
        $this->db->query("UPDATE services SET is_active = 0 WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }
}
