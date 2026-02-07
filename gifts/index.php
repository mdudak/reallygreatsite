<?php

// Simple SQLite-backed gifts API
// Supports:
//  - GET /gifts           -> list all gifts as JSON [{"id":0,"reserved":0},...]
//  - PUT /gifts/{id}      -> mark given id as reserved (reserved = 1)

// Configuration
$dbFile = __DIR__ . '/gifts.db';

// Helpers
function send_json($data, $status = 200) {
    header_remove();
    header('Content-Type: application/json; charset=utf-8');
    // Allow basic CORS for local testing
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function get_db($dbFile) {
    try {
        $pdo = new PDO('sqlite:' . $dbFile);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        // Ensure table exists
        $pdo->exec("CREATE TABLE IF NOT EXISTS gifts (
            id INTEGER PRIMARY KEY,
            reserved INTEGER NOT NULL DEFAULT 0
        );");
        return $pdo;
    } catch (Exception $e) {
        send_json(['error' => 'Failed to open database: ' . $e->getMessage()], 500);
    }
}

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // CORS preflight
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit;
}

// Parse request path to find /gifts and optional id
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = array_values(array_filter(explode('/', $uri), function($s){ return $s !== ''; }));

// Find the position of 'gifts' in the path
$giftsPos = null;
foreach ($segments as $i => $seg) {
    if (strtolower($seg) === 'gifts') { $giftsPos = $i; break; }
}

if ($giftsPos === null) {
    send_json(['error' => 'Not Found'], 404);
}

$id = null;
if (isset($segments[$giftsPos + 1])) {
    $id = $segments[$giftsPos + 1];
}

$method = $_SERVER['REQUEST_METHOD'];
$pdo = get_db($dbFile);

if ($method === 'GET' && $id === null) {
    // List all gifts
    $stmt = $pdo->query('SELECT id, reserved FROM gifts ORDER BY id ASC');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // Cast reserved to boolean-like value (true/false) or keep 0/1? The example used true/false.
    // We'll return JSON with reserved as boolean for clarity.
    $out = array_map(function($r){
        return ['id' => (int)$r['id'], 'reserved' => (bool)$r['reserved']];
    }, $rows);
    send_json($out);
}

if ($method === 'PUT' && $id !== null) {
    // Validate id is integer
    if (!is_numeric($id) || intval($id) < 0) {
        send_json(['error' => 'Invalid id'], 400);
    }
    $id = intval($id);

    // Check exists
    $stmt = $pdo->prepare('SELECT id, reserved FROM gifts WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        send_json(['error' => 'Not found'], 404);
    }

    // Update reserved to true (1)
    $update = $pdo->prepare('UPDATE gifts SET reserved = 1 WHERE id = :id');
    $update->execute([':id' => $id]);

    // Return updated object
    send_json(['id' => $id, 'reserved' => true]);
}

// Unsupported method or path
send_json(['error' => 'Method Not Allowed or malformed path'], 405);

