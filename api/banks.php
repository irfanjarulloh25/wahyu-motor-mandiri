<?php
// api/banks.php - Bank Management API
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM banks WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse($stmt->fetch());
        } else {
            $stmt = $pdo->query("SELECT * FROM banks ORDER BY bank_name ASC");
            sendResponse($stmt->fetchAll());
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['bank_name']) || empty($data['account_number'])) {
            sendResponse(['error' => 'Bank name and account number are required'], 400);
        }

        $stmt = $pdo->prepare("INSERT INTO banks (bank_name, account_number, account_holder) VALUES (?, ?, ?)");
        $stmt->execute([$data['bank_name'], $data['account_number'], $data['account_holder'] ?? '']);
        sendResponse(['message' => 'Bank added', 'id' => $pdo->lastInsertId()], 201);
        break;

    case 'PUT':
        if (!$id) sendResponse(['error' => 'ID required'], 400);
        $data = json_decode(file_get_contents("php://input"), true);

        $stmt = $pdo->prepare("UPDATE banks SET bank_name = ?, account_number = ?, account_holder = ? WHERE id = ?");
        $stmt->execute([
            $data['bank_name'],
            $data['account_number'],
            $data['account_holder'] ?? '',
            $id
        ]);
        sendResponse(['message' => 'Bank updated']);
        break;

    case 'DELETE':
        if (!$id) sendResponse(['error' => 'ID required'], 400);
        $stmt = $pdo->prepare("DELETE FROM banks WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(['message' => 'Bank deleted']);
        break;

    default:
        sendResponse(['error' => 'Method not allowed'], 405);
        break;
}
?>
