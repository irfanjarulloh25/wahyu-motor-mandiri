<?php
// Models/DashboardModel.php - Model Statistik Dashboard
// Penjelasan: Mengkalkulasi data dari banyak tabel sekaligus untuk ditampilkan di Dashboard halaman utama SPA.

class DashboardModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function getDashboardStats() {
        $today = date('Y-m-d');

        // Total Spareparts
        $this->db->query("SELECT COUNT(*) as total FROM spareparts");
        $sparepartsCount = $this->db->single()['total'];

        // Total Services
        $this->db->query("SELECT COUNT(*) as total FROM services");
        $servicesCount = $this->db->single()['total'];

        // Total Transactions Today
        $this->db->query("SELECT COUNT(*) as total FROM transactions WHERE DATE(transaction_date) = :today");
        $this->db->bind(':today', $today);
        $transactionsTodayCount = $this->db->single()['total'];

        // Revenue Today
        $this->db->query("SELECT SUM(total_amount) as total FROM transactions WHERE DATE(transaction_date) = :today");
        $this->db->bind(':today', $today);
        $revenueTodaySum = $this->db->single()['total'] ?: 0;

        // Monthly Revenue (Last 30 days)
        $this->db->query("SELECT SUM(total_amount) as total FROM transactions WHERE transaction_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
        $revenueMonthly = $this->db->single()['total'] ?: 0;

        // Low Stock Items (less than 5)
        $this->db->query("SELECT * FROM spareparts WHERE stock < 5 ORDER BY stock ASC LIMIT 5");
        $lowStock = $this->db->resultSet();

        return [
            'stats' => [
                'total_spareparts' => (int)$sparepartsCount,
                'total_services' => (int)$servicesCount,
                'transactions_today' => (int)$transactionsTodayCount,
                'revenue_today' => (float)$revenueTodaySum,
                'revenue_monthly' => (float)$revenueMonthly
            ],
            'low_stock' => $lowStock
        ];
    }
}
