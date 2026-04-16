<?php
// api/spareparts.php - Spareparts Management API
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM spareparts WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse($stmt->fetch());
        } else {
            $stmt = $pdo->query("SELECT * FROM spareparts WHERE is_active = 1 ORDER BY name ASC");
            sendResponse($stmt->fetchAll());
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("INSERT INTO spareparts (name, rack_position, stock, purchase_price, selling_price, is_active) VALUES (?, ?, ?, ?, ?, 1)");
        $stmt->execute([$data['name'], $data['rack_position'] ?? '-', $data['stock'], $data['purchase_price'], $data['selling_price']]);
        sendResponse(['message' => 'Sparepart added', 'id' => $pdo->lastInsertId()], 201);
        break;

    case 'PUT':
        if (!$id) sendResponse(['error' => 'ID required'], 400);
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("UPDATE spareparts SET name = ?, rack_position = ?, stock = ?, purchase_price = ?, selling_price = ? WHERE id = ?");
        $stmt->execute([$data['name'], $data['rack_position'] ?? '-', $data['stock'], $data['purchase_price'], $data['selling_price'], $id]);
        sendResponse(['message' => 'Sparepart updated']);
        break;

    case 'DELETE':
        if (!$id) sendResponse(['error' => 'ID required'], 400);
        $stmt = $pdo->prepare("UPDATE spareparts SET is_active = 0 WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(['message' => 'Sparepart deleted (soft delete)']);
        break;

    default:
        sendResponse(['error' => 'Method not allowed'], 405);
        break;
}
?>
