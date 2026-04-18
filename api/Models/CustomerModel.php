<?php
// Models/CustomerModel.php - Model Pelanggan
// Penjelasan: Mewakili entitas Pelanggan. Memiliki fungsi pengecekan apakah pelanggan punya transaksi untuk menghindari error foreign key.

class CustomerModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function getAllCustomers() {
        $this->db->query("SELECT * FROM customers ORDER BY name ASC");
        return $this->db->resultSet();
    }

    public function getCustomerById($id) {
        $this->db->query("SELECT * FROM customers WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function checkTransactionExists($customerId) {
        $this->db->query("SELECT COUNT(*) as count FROM transactions WHERE customer_id = :id");
        $this->db->bind(':id', $customerId);
        $result = $this->db->single();
        return $result['count'] > 0;
    }

    public function deleteCustomer($id) {
        $this->db->query("DELETE FROM customers WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }
}
