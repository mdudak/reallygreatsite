<?php
// CLI script to initialize gifts.db with ids 0..30 and reserved = 0
// Run: php init-db.php

$dbFile = __DIR__ . '/gifts.db';

try {
    $pdo = new PDO('sqlite:' . $dbFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create table if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS gifts (
        id INTEGER PRIMARY KEY,
        reserved INTEGER NOT NULL DEFAULT 0
    );");

    // Insert or replace ids 0..30 with reserved = 0
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('INSERT OR REPLACE INTO gifts (id, reserved) VALUES (:id, :reserved)');
    for ($i = 1; $i <= 31; $i++) {
        $stmt->execute([':id' => $i, ':reserved' => 0]);
    }
    $pdo->commit();

    echo "Initialized database at: $dbFile\n";
    echo "Inserted ids 0..30 with reserved = 0\n";
    exit(0);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) { $pdo->rollBack(); }
    fwrite(STDERR, "Failed to initialize database: " . $e->getMessage() . "\n");
    exit(1);
}
