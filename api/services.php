<?php
// api/services.php - Services Management API
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM services WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse($stmt->fetch());
        } else {
            $stmt = $pdo->query("SELECT * FROM services WHERE is_active = 1 ORDER BY name ASC");
            sendResponse($stmt->fetchAll());
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("INSERT INTO services (name, price, is_active) VALUES (?, ?, 1)");
        $stmt->execute([$data['name'], $data['price']]);
        sendResponse(['message' => 'Service added', 'id' => $pdo->lastInsertId()], 201);
        break;

    case 'PUT':
        if (!$id) sendResponse(['error' => 'ID required'], 400);
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("UPDATE services SET name = ?, price = ? WHERE id = ?");
        $stmt->execute([$data['name'], $data['price'], $id]);
        sendResponse(['message' => 'Service updated']);
        break;

    case 'DELETE':
        if (!$id) sendResponse(['error' => 'ID required'], 400);
        $stmt = $pdo->prepare("UPDATE services SET is_active = 0 WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(['message' => 'Service deleted (soft delete)']);
        break;

    default:
        sendResponse(['error' => 'Method not allowed'], 405);
        break;
}
?>
