<?php
// api/reports.php - Profit Analysis API
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

$filter = $_GET['filter'] ?? 'day'; // day, month, year

try {
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

    // 1. Total Revenue (Omzet)
    $stmt = $pdo->query("SELECT SUM(total_amount) FROM transactions t WHERE $dateCondition");
    $totalRevenue = $stmt->fetchColumn() ?: 0;

    // 2. Total Cost of Goods Sold (Modal Barang)
    // We join with current purchase_price for simplicity
    $stmt = $pdo->query("SELECT SUM(ts.quantity * s.purchase_price) 
                         FROM transaction_spareparts ts 
                         JOIN transactions t ON ts.transaction_id = t.id 
                         JOIN spareparts s ON ts.sparepart_id = s.id 
                         WHERE $dateCondition");
    $totalCost = $stmt->fetchColumn() ?: 0;

    // 3. Service Revenue
    $stmt = $pdo->query("SELECT SUM(tsv.price_at_transaction) 
                         FROM transaction_services tsv 
                         JOIN transactions t ON tsv.transaction_id = t.id 
                         WHERE $dateCondition");
    $serviceRevenue = $stmt->fetchColumn() ?: 0;

    // 4. Sparepart Revenue (Sales)
    $stmt = $pdo->query("SELECT SUM(ts.quantity * ts.price_at_transaction) 
                         FROM transaction_spareparts ts 
                         JOIN transactions t ON ts.transaction_id = t.id 
                         WHERE $dateCondition");
    $sparepartRevenue = $stmt->fetchColumn() ?: 0;

    // Calculations
    $sparepartProfit = $sparepartRevenue - $totalCost;
    $netProfit = $sparepartProfit + $serviceRevenue;

    sendResponse([
        'period_label' => $label,
        'stats' => [
            'total_revenue' => (float)$totalRevenue,
            'total_cost' => (float)$totalCost,
            'service_revenue' => (float)$serviceRevenue,
            'sparepart_revenue' => (float)$sparepartRevenue,
            'sparepart_profit' => (float)$sparepartProfit,
            'net_profit' => (float)$netProfit
        ]
    ]);

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to generate report: ' . $e->getMessage()], 500);
}
?>
