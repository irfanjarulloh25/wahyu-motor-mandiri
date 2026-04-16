<?php
// api/auth.php - Authentication Logic
require_once 'config.php';

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if ($action === 'login') {
        $username = trim($data['username'] ?? '');
        $password = trim($data['password'] ?? '');

        if (empty($username) || empty($password)) {
            sendResponse(['error' => 'Username and password required'], 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user) {
            if (password_verify($password, $user['password'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['role'] = $user['role'];
                sendResponse(['message' => 'Login successful', 'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'role' => $user['role'],
                    'full_name' => $user['full_name']
                ]]);
            } else {
                sendResponse(['error' => 'Password mismatch. Received length: ' . strlen($password)], 401);
            }
        } else {
            sendResponse(['error' => 'User not found: ' . $username], 401);
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'check') {
        if (isset($_SESSION['user_id'])) {
            sendResponse(['loggedIn' => true, 'user' => [
                'username' => $_SESSION['username'],
                'role' => $_SESSION['role']
            ]]);
        } else {
            sendResponse(['loggedIn' => false]);
        }
    }

    if ($action === 'logout') {
        session_destroy();
        sendResponse(['message' => 'Logged out successfully']);
    }
}
?>
