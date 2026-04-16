<?php
// api/check_db.php - Utility to verify database and seed admin user
require_once 'config.php';

echo "<h1>Database Check Utility</h1>";

try {
    // 1. Check if table 'users' exists
    $result = $pdo->query("SHOW TABLES LIKE 'users'");
    if ($result->rowCount() == 0) {
        echo "<p style='color:red'>[ERROR] Table 'users' does not exist. Please import database.sql via phpMyAdmin.</p>";
    } else {
        echo "<p style='color:green'>[OK] Table 'users' exists.</p>";
        
        // 1.5 Ensure column length is 255 (to prevent truncation)
        $pdo->exec("ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NOT NULL");
        echo "<p style='color:green'>[OK] Password column verified as VARCHAR(255).</p>";

        // 1.6 Add rack_position column if missing
        $cols = $pdo->query("SHOW COLUMNS FROM spareparts LIKE 'rack_position'")->fetch();
        if (!$cols) {
            $pdo->exec("ALTER TABLE spareparts ADD COLUMN rack_position VARCHAR(100) DEFAULT '-' AFTER name");
            echo "<p style='color:green'>[OK] Added 'rack_position' column to spareparts.</p>";
        }
        
        // 2. Check for admin user
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = 'admin'");
        $stmt->execute();
        $admin = $stmt->fetch();
        
        if (!$admin) {
            echo "<p>[INFO] Admin user not found. Creating default admin...</p>";
            $hashedPassword = password_hash('password', PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)");
            $stmt->execute(['admin', $hashedPassword, 'Administrator', 'admin']);
            echo "<p style='color:green'>[OK] Default admin created! Username: <b>admin</b>, Password: <b>password</b></p>";
        } else {
            echo "<p style='color:green'>[OK] Admin user exists.</p>";
            
            // 3. Update password just in case it was plain text or wrong
            $hashedPassword = password_hash('password', PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE username = 'admin'");
            $stmt->execute([$hashedPassword]);
            echo "<p style='color:orange'>[INFO] Admin password has been RESET to 'password' with correct encryption.</p>";
        }
    }
} catch (Exception $e) {
    echo "<p style='color:red'>[ERROR] Connection failed: " . $e->getMessage() . "</p>";
}

echo "<hr><p><a href='../index.html'>Back to Application</a></p>";
?>
