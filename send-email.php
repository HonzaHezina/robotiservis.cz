<?php
/**
 * Jednoduchý skript pro odesílání emailů z chatbota
 */

// Povolení CORS pro přístup z JavaScriptu
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Pro OPTIONS požadavky (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Kontrola metody
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metoda není povolena']);
    exit;
}

// Vytvoření složky pro logy, pokud neexistuje
if (!file_exists('logs')) {
    mkdir('logs', 0755, true);
}

// Čtení dat z požadavku
$data = json_decode(file_get_contents('php://input'), true);

// Validace požadovaných polí
if (empty($data) || empty($data['name']) || empty($data['email']) || empty($data['message'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Chybí povinné údaje']);
    exit;
}

// Základní validace emailu
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Neplatná emailová adresa']);
    exit;
}

// Příprava proměnných
$name = htmlspecialchars($data['name']);
$email = htmlspecialchars($data['email']);
$message = htmlspecialchars($data['message']);

// Cílová emailová adresa
$to = 'hezina@gmail.com';

// Předmět emailu
$subject = 'Nová zpráva z chatbota na webu';

// Hlavičky emailu
$headers = "From: RovotiServis Chatbot <info@hezina.cz>\r\n";
$headers .= "Reply-To: $name <$email>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";

// Tělo emailu v HTML formátu
$email_body = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
        }
        h2 { color: #6C63FF; }
        .container { padding: 20px; }
        .info { margin-bottom: 10px; }
        .message { 
            background-color: #f5f5f5; 
            padding: 15px; 
            border-radius: 5px;
            margin-top: 15px;
        }
        .footer { 
            font-size: 12px; 
            color: #777; 
            margin-top: 30px; 
            border-top: 1px solid #eee; 
            padding-top: 10px; 
        }
    </style>
</head>
<body>
    <div class='container'>
        <h2>Nová zpráva z chatbota</h2>
        <div class='info'><strong>Jméno:</strong> $name</div>
        <div class='info'><strong>Email:</strong> $email</div>
        <div class='info'><strong>Datum:</strong> " . date('d.m.Y H:i:s') . "</div>
        <div class='message'>
            <strong>Zpráva:</strong><br>
            " . nl2br($message) . "
        </div>
        <div class='footer'>
            Tato zpráva byla odeslána z chatbota na vašem webu.
        </div>
    </div>
</body>
</html>";

// Nastavení SMTP parametrů pro Wedos
ini_set('SMTP', 'wes1-smtp.wedos.net');
ini_set('smtp_port', 587);
ini_set('sendmail_from', 'info@coumis.cz');

// Odeslání emailu
$success = mail($to, $subject, $email_body, $headers);

// Logování výsledku
$log_message = "[" . date('Y-m-d H:i:s') . "] ";
$log_message .= "Od: $name <$email> - ";
$log_message .= $success ? "ÚSPĚCH" : "CHYBA";
$log_message .= "\n";
file_put_contents('logs/email_log.txt', $log_message, FILE_APPEND);

// Odpověď
if ($success) {
    echo json_encode(['success' => true, 'message' => 'Email úspěšně odeslán']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Došlo k chybě při odesílání emailu']);
}
