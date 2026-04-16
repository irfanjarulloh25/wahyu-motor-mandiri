<?php
// api/transactions.php - Transaction Management API
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$filter = $_GET['filter'] ?? 'all';

switch ($method) {
    case 'GET':
        if ($id) {
            // Get single transaction with details
            $stmt = $pdo->prepare("SELECT t.*, c.name as customer_name, c.license_plate, b.bank_name, b.account_number 
                                   FROM transactions t 
                                   JOIN customers c ON t.customer_id = c.id 
                                   LEFT JOIN banks b ON t.bank_id = b.id
                                   WHERE t.id = ?");
            $stmt->execute([$id]);
            $transaction = $stmt->fetch();
            
            if (!$transaction) sendResponse(['error' => 'Transaction not found'], 404);
            
            // Get spareparts
            $stmt = $pdo->prepare("SELECT ts.*, s.name 
                                   FROM transaction_spareparts ts 
                                   JOIN spareparts s ON ts.sparepart_id = s.id 
                                   WHERE ts.transaction_id = ?");
            $stmt->execute([$id]);
            $transaction['spareparts'] = $stmt->fetchAll();
            
            // Get services
            $stmt = $pdo->prepare("SELECT tsv.*, sv.name 
                                   FROM transaction_services tsv 
                                   JOIN services sv ON tsv.service_id = sv.id 
                                   WHERE tsv.transaction_id = ?");
            $stmt->execute([$id]);
            $transaction['services'] = $stmt->fetchAll();
            
            sendResponse($transaction);
        } else {
            // List transactions with filtering
            $dateCondition = "1=1";
            if ($filter === 'weekly') {
                $dateCondition = "YEARWEEK(t.transaction_date, 1) = YEARWEEK(CURDATE(), 1)";
            } elseif ($filter === 'monthly') {
                $dateCondition = "MONTH(t.transaction_date) = MONTH(CURDATE()) AND YEAR(t.transaction_date) = YEAR(CURDATE())";
            } elseif ($filter === 'yearly') {
                $dateCondition = "YEAR(t.transaction_date) = YEAR(CURDATE())";
            }

            $stmt = $pdo->query("SELECT t.*, c.name as customer_name, c.license_plate 
                                 FROM transactions t 
                                 JOIN customers c ON t.customer_id = c.id 
                                 WHERE $dateCondition
                                 ORDER BY t.transaction_date DESC");
            sendResponse($stmt->fetchAll());
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        
        try {
            $pdo->beginTransaction();
            
            // 1. Handle Customer
            $stmt = $pdo->prepare("SELECT id FROM customers WHERE name = ? AND license_plate = ?");
            $stmt->execute([$data['customer_name'], $data['license_plate']]);
            $customer = $stmt->fetch();
            
            if ($customer) {
                $customer_id = $customer['id'];
            } else {
                $stmt = $pdo->prepare("INSERT INTO customers (name, license_plate) VALUES (?, ?)");
                $stmt->execute([$data['customer_name'], $data['license_plate']]);
                $customer_id = $pdo->lastInsertId();
            }
            
            // 2. Create Transaction Header
            $stmt = $pdo->prepare("INSERT INTO transactions (customer_id, total_amount, payment_method, bank_id) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $customer_id, 
                $data['total_amount'], 
                $data['payment_method'] ?? 'cash',
                $data['bank_id'] ?? null
            ]);
            $transaction_id = $pdo->lastInsertId();
            
            // 3. Handle Spareparts
            if (!empty($data['spareparts'])) {
                foreach ($data['spareparts'] as $item) {
                    $stmt = $pdo->prepare("INSERT INTO transaction_spareparts (transaction_id, sparepart_id, quantity, price_at_transaction) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$transaction_id, $item['id'], $item['quantity'], $item['price']]);
                    
                    // Update Stock
                    $stmt = $pdo->prepare("UPDATE spareparts SET stock = stock - ? WHERE id = ?");
                    $stmt->execute([$item['quantity'], $item['id']]);
                }
            }
            
            // 4. Handle Services
            if (!empty($data['services'])) {
                foreach ($data['services'] as $item) {
                    $stmt = $pdo->prepare("INSERT INTO transaction_services (transaction_id, service_id, price_at_transaction) VALUES (?, ?, ?)");
                    $stmt->execute([$transaction_id, $item['id'], $item['price']]);
                }
            }
            
            $pdo->commit();
            sendResponse(['message' => 'Transaction created', 'id' => $transaction_id], 201);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            sendResponse(['error' => 'Transaction failed: ' . $e->getMessage()], 500);
        }
        break;

    case 'DELETE':
        if (!$id) sendResponse(['error' => 'ID required'], 400);
        
        try {
            $pdo->beginTransaction();
            
            // 1. Get items to restore stock
            $stmt = $pdo->prepare("SELECT ts.*, s.id as sparepart_id FROM transaction_spareparts ts 
                                   JOIN spareparts s ON ts.sparepart_id = s.id 
                                   WHERE ts.transaction_id = ?");
            $stmt->execute([$id]);
            $items = $stmt->fetchAll();
            
            foreach ($items as $item) {
                $stmt = $pdo->prepare("UPDATE spareparts SET stock = stock + ? WHERE id = ?");
                $stmt->execute([$item['quantity'], $item['sparepart_id']]);
            }
            
            // 2. Delete Details
            $stmt = $pdo->prepare("DELETE FROM transaction_spareparts WHERE transaction_id = ?");
            $stmt->execute([$id]);
            $stmt = $pdo->prepare("DELETE FROM transaction_services WHERE transaction_id = ?");
            $stmt->execute([$id]);
            
            // 3. Delete Header
            $stmt = $pdo->prepare("DELETE FROM transactions WHERE id = ?");
            $stmt->execute([$id]);
            
            $pdo->commit();
            sendResponse(['message' => 'Transaction deleted and stock restored']);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            sendResponse(['error' => 'Failed to delete transaction: ' . $e->getMessage()], 500);
        }
        break;

    default:
        sendResponse(['error' => 'Method not allowed'], 405);
        break;
}
?>

