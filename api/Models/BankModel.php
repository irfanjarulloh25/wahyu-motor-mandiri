<?php
// Models/BankModel.php - Model Rekening Bank
// Penjelasan: Mewakili tabel banks di database. Menangani kueri pengelolaan daftar rekening bank.

class BankModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function getAllBanks() {
        $this->db->query("SELECT * FROM banks ORDER BY bank_name ASC");
        return $this->db->resultSet();
    }

    public function getBankById($id) {
        $this->db->query("SELECT * FROM banks WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function createBank($data) {
        $this->db->query("INSERT INTO banks (bank_name, account_number, account_holder) VALUES (:bank_name, :account_number, :account_holder)");
        $this->db->bind(':bank_name', $data['bank_name']);
        $this->db->bind(':account_number', $data['account_number']);
        $this->db->bind(':account_holder', $data['account_holder'] ?? '');
        $this->db->execute();
        return $this->db->lastInsertId();
    }

    public function updateBank($id, $data) {
        $this->db->query("UPDATE banks SET bank_name = :bank_name, account_number = :account_number, account_holder = :account_holder WHERE id = :id");
        $this->db->bind(':bank_name', $data['bank_name']);
        $this->db->bind(':account_number', $data['account_number']);
        $this->db->bind(':account_holder', $data['account_holder'] ?? '');
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    public function deleteBank($id) {
        $this->db->query("DELETE FROM banks WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }
}
