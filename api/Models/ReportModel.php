<?php
// Models/ReportModel.php - Model Pelaporan (Keuangan)
// Penjelasan: Mewakili hasil analisis untung-rugi bengkel (Laba), dengan filter berdasarkan hari, bulan, dan tahun.

class ReportModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function generateReport($filter) {
        $dateCondition = "";
        switch ($filter) {
            case 'year':
                $dateCondition = "YEAR(t.transaction_date) = YEAR(CURDATE())";
                $label = "Tahun Ini (" . date('Y') . ")";
                break;
            case 'month':
                $dateCondition = "MONTH(t.transaction_date) = MONTH(CURDATE()) AND YEAR(t.transaction_date) = YEAR(CURDATE())";
                $label = "Bulan Ini (" . date('F Y') . ")";
                break;
            case 'day':
            default:
                $dateCondition = "DATE(t.transaction_date) = CURDATE()";
                $label = "Hari Ini (" . date('d M Y') . ")";
                break;
        }

        // 1. Total Pendapatan
        $this->db->query("SELECT SUM(total_amount) as total FROM transactions t WHERE $dateCondition");
        $totalRevenue = $this->db->single()['total'] ?: 0;

        // 2. Total Modal Barang
        $this->db->query("SELECT SUM(ts.quantity * s.purchase_price) as total 
                             FROM transaction_spareparts ts 
                             JOIN transactions t ON ts.transaction_id = t.id 
                             JOIN spareparts s ON ts.sparepart_id = s.id 
                             WHERE $dateCondition");
        $totalCost = $this->db->single()['total'] ?: 0;

        // 3. Pemasukan dari Service
        $this->db->query("SELECT SUM(tsv.price_at_transaction) as total 
                             FROM transaction_services tsv 
                             JOIN transactions t ON tsv.transaction_id = t.id 
                             WHERE $dateCondition");
        $serviceRevenue = $this->db->single()['total'] ?: 0;

        // 4. Pemasukan dari Suku Cadang (Harga Jual)
        $this->db->query("SELECT SUM(ts.quantity * ts.price_at_transaction) as total 
                             FROM transaction_spareparts ts 
                             JOIN transactions t ON ts.transaction_id = t.id 
                             WHERE $dateCondition");
        $sparepartRevenue = $this->db->single()['total'] ?: 0;

        // Laba
        $sparepartProfit = $sparepartRevenue - $totalCost;
        $netProfit = $sparepartProfit + $serviceRevenue;

        return [
            'period_label' => $label,
            'stats' => [
                'total_revenue' => (float)$totalRevenue,
                'total_cost' => (float)$totalCost,
                'service_revenue' => (float)$serviceRevenue,
                'sparepart_revenue' => (float)$sparepartRevenue,
                'sparepart_profit' => (float)$sparepartProfit,
                'net_profit' => (float)$netProfit
            ]
        ];
    }
}
