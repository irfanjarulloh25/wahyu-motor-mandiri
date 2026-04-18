<?php
// Models/SparepartModel.php - Model Suku Cadang
// Penjelasan: Mewakili tabel spareparts. Menggunakan logika is_active untuk soft delete agar riwayat pembelian lampau tidak error saat referensi komponen hilang.

class SparepartModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function getAllActiveSpareparts() {
        $this->db->query("SELECT * FROM spareparts WHERE is_active = 1 ORDER BY name ASC");
        return $this->db->resultSet();
    }

    public function getSparepartById($id) {
        $this->db->query("SELECT * FROM spareparts WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function createSparepart($data) {
        $this->db->query("INSERT INTO spareparts (name, rack_position, stock, purchase_price, selling_price, is_active) VALUES (:name, :rack_position, :stock, :purchase_price, :selling_price, 1)");
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':rack_position', $data['rack_position'] ?? '-');
        $this->db->bind(':stock', $data['stock']);
        $this->db->bind(':purchase_price', $data['purchase_price']);
        $this->db->bind(':selling_price', $data['selling_price']);
        $this->db->execute();
        return $this->db->lastInsertId();
    }

    public function updateSparepart($id, $data) {
        $this->db->query("UPDATE spareparts SET name = :name, rack_position = :rack_position, stock = :stock, purchase_price = :purchase_price, selling_price = :selling_price WHERE id = :id");
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':rack_position', $data['rack_position'] ?? '-');
        $this->db->bind(':stock', $data['stock']);
        $this->db->bind(':purchase_price', $data['purchase_price']);
        $this->db->bind(':selling_price', $data['selling_price']);
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    public function softDeleteSparepart($id) {
        $this->db->query("UPDATE spareparts SET is_active = 0 WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }
}
