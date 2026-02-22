<?php
// Nastavení hlaviček pro JSON odpověď
header('Content-Type: application/json');

// Inicializace odpovědi
$response = [
    'success' => false,
    'message' => ''
];

// Ochrana proti přímému přístupu k souboru
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = 'Neplatný typ požadavku.';
    echo json_encode($response);
    exit;
}

// Kontrola anti-spam honeypot pole
if (!empty($_POST['honeypot'])) {
    // Je to pravděpodobně robot - odešleme zdánlivý úspěch
    $response['success'] = true;
    $response['message'] = 'Formulář byl úspěšně odeslán.';
    echo json_encode($response);
    exit;
}

// Kontrola časového razítka pro rychlé odeslání (ochrana proti rychlým botům)
$minTimeToFill = 3; // Minimální čas v sekundách pro vyplnění formuláře
if (isset($_POST['timestamp']) && (time() - intval($_POST['timestamp']) < $minTimeToFill)) {
    // Formulář byl odeslán příliš rychle, pravděpodobně bot
    sleep(2); // Přidáme zpoždění, aby to nebylo tak zřejmé
    $response['success'] = true;
    $response['message'] = 'Formulář byl úspěšně odeslán.';
    echo json_encode($response);
    exit;
}

// Validace povinných polí
$required_fields = ['name', 'email', 'service', 'message'];
$missing_fields = [];

foreach ($required_fields as $field) {
    if (empty($_POST[$field])) {
        $missing_fields[] = $field;
    }
}

if (!empty($missing_fields)) {
    $response['message'] = 'Chybí povinná pole: ' . implode(', ', $missing_fields);
    echo json_encode($response);
    exit;
}

// Validace emailu
if (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
    $response['message'] = 'Neplatný formát e-mailu.';
    echo json_encode($response);
    exit;
}

// Validace telefonu (pokud je vyplněn)
if (!empty($_POST['phone']) && !preg_match('/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{3,6}$/', $_POST['phone'])) {
    $response['message'] = 'Neplatný formát telefonu.';
    echo json_encode($response);
    exit;
}

// Získání a ošetření dat z formuláře
$name = htmlspecialchars($_POST['name']);
$email = htmlspecialchars($_POST['email']);
$phone = !empty($_POST['phone']) ? htmlspecialchars($_POST['phone']) : 'Neuvedeno';
$service = htmlspecialchars($_POST['service']);
$message = htmlspecialchars($_POST['message']);

// Mapování hodnot služeb na čitelnější názvy
$service_types = [
    'maintenance' => 'Preventivní údržba',
    'repair' => 'Diagnostika a opravy',
    'upgrade' => 'Upgrady a aktualizace',
    'humanoid' => 'Servis humanoidních robotů',
    'industrial' => 'Průmyslové aplikace',
    'contract' => 'Servisní smlouva',
    'other' => 'Jiné'
];

$service_name = isset($service_types[$service]) ? $service_types[$service] : $service;

// Informace o odesílateli a příjemci
$to = 'hezina@gmail.com'; // E-mailová adresa příjemce
$subject = "Nový požadavek - {$service_name}";

// Vytvoření HTML e-mailu
$email_message = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Nový kontaktní formulář</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        h1 { color: #00a8e8; }
        .info { margin-bottom: 20px; }
        .label { font-weight: bold; }
        .footer { margin-top: 30px; font-size: 12px; color: #777; }
    </style>
</head>
<body>
    <div class='container'>
        <h1>Nový kontaktní požadavek</h1>
        <p>Byl přijat nový požadavek z kontaktního formuláře na webu.</p>
        
        <div class='info'>
            <p><span class='label'>Jméno:</span> {$name}</p>
            <p><span class='label'>E-mail:</span> {$email}</p>
            <p><span class='label'>Telefon:</span> {$phone}</p>
            <p><span class='label'>Služba:</span> {$service_name}</p>
            <p><span class='label'>Zpráva:</span></p>
            <p>{$message}</p>
        </div>
        
        <div class='footer'>
            <p>Tento e-mail byl automaticky vygenerován z kontaktního formuláře na webu RobotiServis.cz.</p>
            <p>Odesláno: " . date('d.m.Y H:i:s') . "</p>
            <p>IP adresa odesílatele: " . $_SERVER['REMOTE_ADDR'] . "</p>
        </div>
    </div>
</body>
</html>
";

// Nastavení pro SMTP odesílání
$smtp_server = 'wes1-smtp.wedos.net'; // Primární SMTP server Wedos
$smtp_port = 587; // Port pro TLS
$smtp_username = 'info@coumis.cz'; // SMTP uživatelské jméno
//$smtp_password = 'VAŠE_HESLO'; // SMTP heslo - musíte nahradit vaším skutečným heslem

// Alternativní SMTP server, který lze použít, pokud primární selže
$smtp_server_alt = 'wes1-smtp2.wedos.net';

// Odesílání e-mailu pomocí PHPMailer-like funkce (zjednodušená implementace bez knihovny)
function send_smtp_email($to, $subject, $message, $from_email, $from_name, $reply_to, $smtp_server, $smtp_port, $smtp_username, $smtp_password) {
    // Vytvoření unikátního hranice pro části e-mailu
    $boundary = md5(time());
    
    // Hlavičky e-mailu
    $headers = "From: $from_name <$from_email>\r\n";
    $headers .= "Reply-To: $reply_to\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";
    
    // Tělo e-mailu
    $body = "--$boundary\r\n";
    $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $body .= strip_tags($message) . "\r\n";
    
    $body .= "--$boundary\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $body .= $message . "\r\n";
    
    $body .= "--$boundary--\r\n";
    
    // Připojení k SMTP serveru
    $smtp_conn = fsockopen($smtp_server, $smtp_port, $errno, $errstr, 30);
    if (!$smtp_conn) {
        return "Chyba připojení k SMTP serveru: $errstr ($errno)";
    }
    
    // Kontrola odpovědi serveru
    if (fgets($smtp_conn, 515) === false) {
        return "Žádná odpověď od SMTP serveru";
    }
    
    // EHLO command
    fputs($smtp_conn, "EHLO " . $_SERVER['HTTP_HOST'] . "\r\n");
    if (fgets($smtp_conn, 515) === false) {
        return "Chyba při EHLO";
    }
    
    // Čtení všech EHLO odpovědí
    while (substr(fgets($smtp_conn, 515), 3, 1) !== ' ') {
    }
    
    // STARTTLS command
    fputs($smtp_conn, "STARTTLS\r\n");
    if (substr(fgets($smtp_conn, 515), 0, 3) !== '220') {
        return "Chyba při STARTTLS";
    }
    
    // Upgrade na TLS spojení
    stream_socket_enable_crypto($smtp_conn, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
    
    // EHLO znovu po TLS
    fputs($smtp_conn, "EHLO " . $_SERVER['HTTP_HOST'] . "\r\n");
    if (fgets($smtp_conn, 515) === false) {
        return "Chyba při EHLO po TLS";
    }
    
    // Čtení všech EHLO odpovědí
    while (substr(fgets($smtp_conn, 515), 3, 1) !== ' ') {
    }
    
    // AUTH LOGIN
    fputs($smtp_conn, "AUTH LOGIN\r\n");
    if (substr(fgets($smtp_conn, 515), 0, 3) !== '334') {
        return "Chyba při AUTH LOGIN";
    }
    
    // Odeslání uživatelského jména
    fputs($smtp_conn, base64_encode($smtp_username) . "\r\n");
    if (substr(fgets($smtp_conn, 515), 0, 3) !== '334') {
        return "Chyba při autentizaci uživatelského jména";
    }
    
    // Odeslání hesla
    fputs($smtp_conn, base64_encode($smtp_password) . "\r\n");
    if (substr(fgets($smtp_conn, 515), 0, 3) !== '235') {
        return "Chyba při autentizaci hesla";
    }
    
    // MAIL FROM command
    fputs($smtp_conn, "MAIL FROM: <$from_email>\r\n");
    if (substr(fgets($smtp_conn, 515), 0, 3) !== '250') {
        return "Chyba při MAIL FROM";
    }
    
    // RCPT TO command
    fputs($smtp_conn, "RCPT TO: <$to>\r\n");
    if (substr(fgets($smtp_conn, 515), 0, 3) !== '250') {
        return "Chyba při RCPT TO";
    }
    
    // DATA command
    fputs($smtp_conn, "DATA\r\n");
    if (substr(fgets($smtp_conn, 515), 0, 3) !== '354') {
        return "Chyba při DATA";
    }
    
    // Odeslání e-mailu
    fputs($smtp_conn, "Subject: $subject\r\n");
    fputs($smtp_conn, $headers);
    fputs($smtp_conn, "\r\n");
    fputs($smtp_conn, $body);
    fputs($smtp_conn, ".\r\n");
    
    if (substr(fgets($smtp_conn, 515), 0, 3) !== '250') {
        return "Chyba při odesílání e-mailu";
    }
    
    // QUIT command
    fputs($smtp_conn, "QUIT\r\n");
    fclose($smtp_conn);
    
    return true;
}

// Alternativní funkce odesílání e-mailu pomocí PHP mail() - jako záloha
function send_mail($to, $subject, $message, $from_email, $from_name, $reply_to) {
    $headers = "From: $from_name <$from_email>\r\n";
    $headers .= "Reply-To: $reply_to\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    
    return mail($to, $subject, $message, $headers);
}

// Uložení do logu
$log_file = 'form_log.txt';
$log_entry = date('[Y-m-d H:i:s]') . " - {$name} ({$email}) - {$service_name}\n";

try {
    file_put_contents($log_file, $log_entry, FILE_APPEND);
} catch (Exception $e) {
    // Pokud není možné zapisovat do logu, pokračujeme dál
}

// Pokus o odeslání e-mailu pomocí SMTP
$result = send_smtp_email(
    $to,
    $subject,
    $email_message,
    'info@coumis.cz', // Od e-mail
    'RobotiServis.cz', // Od jméno
    $email, // Reply-To adresa (e-mail návštěvníka)
    $smtp_server,
    $smtp_port,
    $smtp_username,
    $smtp_password
);

// Pokud SMTP selže, zkusíme alternativní server
if ($result !== true) {
    $result = send_smtp_email(
        $to,
        $subject,
        $email_message,
        'info@coumis.cz',
        'RobotiServis.cz',
        $email,
        $smtp_server_alt,
        $smtp_port,
        $smtp_username,
        $smtp_password
    );
}

// Pokud SMTP stále selhává, zkusíme PHP mail() jako poslední možnost
if ($result !== true) {
    $result = send_mail(
        $to,
        $subject,
        $email_message,
        'info@coumis.cz',
        'RobotiServis.cz',
        $email
    );
}

// Kontrola výsledku odesílání
if ($result === true) {
    $response['success'] = true;
    $response['message'] = 'Děkujeme za váš požadavek. Budeme vás kontaktovat co nejdříve.';
} else {
    $response['message'] = 'Došlo k chybě při odesílání e-mailu: ' . $result;
    
    // Záložní mechanismus - uložení zprávy do souboru v případě, že mail selže
    try {
        $backup_file = 'form_backup.txt';
        $backup_content = "===== NOVÝ POŽADAVEK =====\n";
        $backup_content .= "Čas: " . date('Y-m-d H:i:s') . "\n";
        $backup_content .= "Jméno: {$name}\n";
        $backup_content .= "E-mail: {$email}\n";
        $backup_content .= "Telefon: {$phone}\n";
        $backup_content .= "Služba: {$service_name}\n";
        $backup_content .= "Zpráva: {$message}\n";
        $backup_content .= "============================\n\n";
        
        file_put_contents($backup_file, $backup_content, FILE_APPEND);
        $response['success'] = true;
        $response['message'] = 'Děkujeme za váš požadavek. Budeme vás kontaktovat co nejdříve.';
    } catch (Exception $e) {
        // Pokračujeme s chybovou zprávou
    }
}

// Vrácení JSON odpovědi
echo json_encode($response);
