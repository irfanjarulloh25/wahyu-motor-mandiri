<?php
// Models/TransactionModel.php - Model Transaksi
// Penjelasan: Ini adalah model paling kompleks yang mengurus riwayat belanja dan manipulasi stok.
// Memanfaatkan PDO transactions untuk menjaga integritas data (jika di tengah jalan gagal, maka akan dikembalikan ke awal).

class TransactionModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function getTransactionById($id) {
        // Data utama transaksi
        $this->db->query("SELECT t.*, c.name as customer_name, c.license_plate, b.bank_name, b.account_number 
                               FROM transactions t 
                               JOIN customers c ON t.customer_id = c.id 
                               LEFT JOIN banks b ON t.bank_id = b.id
                               WHERE t.id = :id");
        $this->db->bind(':id', $id);
        $transaction = $this->db->single();

        if ($transaction) {
            // Suku cadang yang dibeli
            $this->db->query("SELECT ts.*, s.name 
                                   FROM transaction_spareparts ts 
                                   JOIN spareparts s ON ts.sparepart_id = s.id 
                                   WHERE ts.transaction_id = :id");
            $this->db->bind(':id', $id);
            $transaction['spareparts'] = $this->db->resultSet();

            // Layanan service yang dipakai
            $this->db->query("SELECT tsv.*, sv.name 
                                   FROM transaction_services tsv 
                                   JOIN services sv ON tsv.service_id = sv.id 
                                   WHERE tsv.transaction_id = :id");
            $this->db->bind(':id', $id);
            $transaction['services'] = $this->db->resultSet();
        }

        return $transaction;
    }

    public function getAllTransactions($filter = 'all') {
        $dateCondition = "1=1";
        if ($filter === 'weekly') {
            $dateCondition = "YEARWEEK(t.transaction_date, 1) = YEARWEEK(CURDATE(), 1)";
        } elseif ($filter === 'monthly') {
            $dateCondition = "MONTH(t.transaction_date) = MONTH(CURDATE()) AND YEAR(t.transaction_date) = YEAR(CURDATE())";
        } elseif ($filter === 'yearly') {
            $dateCondition = "YEAR(t.transaction_date) = YEAR(CURDATE())";
        }

        $this->db->query("SELECT t.*, c.name as customer_name, c.license_plate 
                             FROM transactions t 
                             JOIN customers c ON t.customer_id = c.id 
                             WHERE $dateCondition
                             ORDER BY t.transaction_date DESC");
        return $this->db->resultSet();
    }

    public function processTransaction($data) {
        try {
            $this->db->beginTransaction();
            
            // 1. Mengurus Pelanggan (Cari jika ada, Buat jika belum)
            $this->db->query("SELECT id FROM customers WHERE name = :name AND license_plate = :plate");
            $this->db->bind(':name', $data['customer_name']);
            $this->db->bind(':plate', $data['license_plate']);
            $customer = $this->db->single();
            
            if ($customer) {
                $customer_id = $customer['id'];
            } else {
                $this->db->query("INSERT INTO customers (name, license_plate) VALUES (:name, :plate)");
                $this->db->bind(':name', $data['customer_name']);
                $this->db->bind(':plate', $data['license_plate']);
                $this->db->execute();
                $customer_id = $this->db->lastInsertId();
            }
            
            // 2. Buat header Transaksi
            $this->db->query("INSERT INTO transactions (customer_id, total_amount, payment_method, bank_id) VALUES (:customer_id, :total_amount, :payment_method, :bank_id)");
            $this->db->bind(':customer_id', $customer_id);
            $this->db->bind(':total_amount', $data['total_amount']);
            $this->db->bind(':payment_method', $data['payment_method'] ?? 'cash');
            $this->db->bind(':bank_id', $data['bank_id'] ?? null);
            $this->db->execute();
            $transaction_id = $this->db->lastInsertId();
            
            // 3. Masukkan spareparts dan kurangi stok
            if (!empty($data['spareparts'])) {
                foreach ($data['spareparts'] as $item) {
                    $this->db->query("INSERT INTO transaction_spareparts (transaction_id, sparepart_id, quantity, price_at_transaction) VALUES (:tid, :sid, :qty, :price)");
                    $this->db->bind(':tid', $transaction_id);
                    $this->db->bind(':sid', $item['id']);
                    $this->db->bind(':qty', $item['quantity']);
                    $this->db->bind(':price', $item['price']);
                    $this->db->execute();
                    
                    // Otomatis kurangi (Update) Stok
                    $this->db->query("UPDATE spareparts SET stock = stock - :qty WHERE id = :sid");
                    $this->db->bind(':qty', $item['quantity']);
                    $this->db->bind(':sid', $item['id']);
                    $this->db->execute();
                }
            }
            
            // 4. Masukkan daftar servis
            if (!empty($data['services'])) {
                foreach ($data['services'] as $item) {
                    $this->db->query("INSERT INTO transaction_services (transaction_id, service_id, price_at_transaction) VALUES (:tid, :sid, :price)");
                    $this->db->bind(':tid', $transaction_id);
                    $this->db->bind(':sid', $item['id']);
                    $this->db->bind(':price', $item['price']);
                    $this->db->execute();
                }
            }
            
            // Jika semua selamat tanpa error, nyatakan beres!
            $this->db->commit();
            return $transaction_id;
            
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e; // Lempar kembali pesan error ke Controller
        }
    }

    public function revertAndDeleteTransaction($id) {
        try {
            $this->db->beginTransaction();
            
            // 1. Ambil data barang yang dibeli untuk mengembalikan nilai stok
            $this->db->query("SELECT ts.*, s.id as sparepart_id FROM transaction_spareparts ts 
                                   JOIN spareparts s ON ts.sparepart_id = s.id 
                                   WHERE ts.transaction_id = :id");
            $this->db->bind(':id', $id);
            $items = $this->db->resultSet();
            
            // Kembalikan Stok (Tambah kembali)
            foreach ($items as $item) {
                $this->db->query("UPDATE spareparts SET stock = stock + :qty WHERE id = :sid");
                $this->db->bind(':qty', $item['quantity']);
                $this->db->bind(':sid', $item['sparepart_id']);
                $this->db->execute();
            }
            
            // 2. Hapus Relasi Transaksi (Detail)
            $this->db->query("DELETE FROM transaction_spareparts WHERE transaction_id = :id");
            $this->db->bind(':id', $id);
            $this->db->execute();
            
            $this->db->query("DELETE FROM transaction_services WHERE transaction_id = :id");
            $this->db->bind(':id', $id);
            $this->db->execute();
            
            // 3. Hapus Transaksi Inti
            $this->db->query("DELETE FROM transactions WHERE id = :id");
            $this->db->bind(':id', $id);
            $this->db->execute();
            
            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
