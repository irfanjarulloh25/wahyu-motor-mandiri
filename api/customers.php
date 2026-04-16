<?php
// api/customers.php - Customer Management API
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse($stmt->fetch());
        } else {
            $stmt = $pdo->query("SELECT * FROM customers ORDER BY name ASC");
            sendResponse($stmt->fetchAll());
        }
        break;

    case 'DELETE':
        if (!$id) sendResponse(['error' => 'ID required'], 400);
        
        try {
            // Check if customer has transactions first to provide a better error message
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM transactions WHERE customer_id = ?");
            $stmt->execute([$id]);
            if ($stmt->fetchColumn() > 0) {
                sendResponse(['error' => 'Tidak dapat menghapus pelanggan yang sudah memiliki riwayat transaksi.'], 400);
            }

            $stmt = $pdo->prepare("DELETE FROM customers WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse(['message' => 'Data pelanggan berhasil dihapus']);
        } catch (Exception $e) {
            sendResponse(['error' => 'Gagal menghapus pelanggan: ' . $e->getMessage()], 500);
        }
        break;

    default:
        sendResponse(['error' => 'Method not allowed'], 405);
        break;
}
?>
