<?php
// api/dashboard.php - Dashboard Statistics API
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

try {
    // Total Spareparts
    $sparepartsCount = $pdo->query("SELECT COUNT(*) FROM spareparts")->fetchColumn();
    
    // Total Services
    $servicesCount = $pdo->query("SELECT COUNT(*) FROM services")->fetchColumn();
    
    // Total Transactions Today
    $today = date('Y-m-d');
    $transactionsToday = $pdo->prepare("SELECT COUNT(*) FROM transactions WHERE DATE(transaction_date) = ?");
    $transactionsToday->execute([$today]);
    $transactionsTodayCount = $transactionsToday->fetchColumn();
    
    // Revenue Today
    $revenueToday = $pdo->prepare("SELECT SUM(total_amount) FROM transactions WHERE DATE(transaction_date) = ?");
    $revenueToday->execute([$today]);
    $revenueTodaySum = $revenueToday->fetchColumn() ?: 0;
    
    // Monthly Revenue (Last 30 days)
    $revenueMonthly = $pdo->query("SELECT SUM(total_amount) FROM transactions WHERE transaction_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)")->fetchColumn() ?: 0;
    
    // Low Stock Items (less than 5)
    $lowStock = $pdo->query("SELECT * FROM spareparts WHERE stock < 5 ORDER BY stock ASC LIMIT 5")->fetchAll();

    sendResponse([
        'stats' => [
            'total_spareparts' => (int)$sparepartsCount,
            'total_services' => (int)$servicesCount,
            'transactions_today' => (int)$transactionsTodayCount,
            'revenue_today' => (float)$revenueTodaySum,
            'revenue_monthly' => (float)$revenueMonthly
        ],
        'low_stock' => $lowStock
    ]);

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to fetch dashboard data: ' . $e->getMessage()], 500);
}
?>
