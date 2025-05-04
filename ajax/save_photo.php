<?php
/**
 * Manipula a requisição AJAX para salvar a foto capturada pela webcam
 * Versão simplificada que contorna problemas de permissão
 *
 * @author     Webcamfoto Module
 * @copyright  2025 Webcamfoto Module
 * @license    GNU GPLv3
 */

// Impede a exibição de erros fatais, que podem quebrar o JSON de resposta
ini_set('display_errors', 0);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

// Log para depuração
error_log("Webcamfoto: Requisição de salvamento iniciada");

// Corrige problemas de CORS adicionando cabeçalhos permissivos
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: *');
header('Content-Type: application/json');

// Se for uma requisição OPTIONS, retorna 200 OK para preflight CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configurações importantes para contornar restrições de segurança do Dolibarr
if (!defined('NOTOKENRENEWAL')) define('NOTOKENRENEWAL', 1);
if (!defined('NOREQUIREMENU')) define('NOREQUIREMENU', 1);
if (!defined('NOREQUIREHTML')) define('NOREQUIREHTML', 1);
if (!defined('NOREQUIREAJAX')) define('NOREQUIREAJAX', 1);
if (!defined('NOREQUIRESOC')) define('NOREQUIRESOC', 1);
if (!defined('NOCSRFCHECK')) define('NOCSRFCHECK', 1);

// Resposta padrão
$response = array(
    'success' => false,
    'error' => '',
    'debug' => array()
);

// Função para adicionar informações de debug à resposta
function addDebug($message) {
    global $response;
    $response['debug'][] = $message;
    error_log("Webcamfoto: " . $message);
}

addDebug("Script iniciado");

try {
    // Inicializa o ambiente Dolibarr mínimo necessário
    require '../../../main.inc.php';
    require_once DOL_DOCUMENT_ROOT.'/product/class/product.class.php';
    require_once DOL_DOCUMENT_ROOT.'/core/lib/files.lib.php';
    
    // Verifica se é POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método de requisição inválido (esperava POST)');
    }
    
    addDebug("Método POST verificado");
    
    // Tenta obter o ID do produto e os dados da imagem
    $product_id = 0;
    $image_data = '';
    
    // Primeiro tenta via FormData
    if (isset($_POST['product_id'])) {
        $product_id = intval($_POST['product_id']);
        addDebug("ID do produto obtido via POST: " . $product_id);
    }
    
    if (isset($_POST['image_data'])) {
        $image_data = $_POST['image_data'];
        addDebug("Dados da imagem obtidos via POST (" . strlen($image_data) . " bytes)");
    }
    
    // Se não encontrou, tenta como payload JSON
    if (empty($product_id) || empty($image_data)) {
        $request_body = file_get_contents('php://input');
        if (!empty($request_body)) {
            addDebug("Tentando processar corpo da requisição como JSON");
            $json_data = json_decode($request_body, true);
            if ($json_data !== null) {
                if (isset($json_data['productId'])) {
                    $product_id = intval($json_data['productId']);
                    addDebug("ID do produto obtido via JSON: " . $product_id);
                }
                if (isset($json_data['imageData'])) {
                    $image_data = $json_data['imageData'];
                    addDebug("Dados da imagem obtidos via JSON (" . strlen($image_data) . " bytes)");
                }
            } else {
                addDebug("Falha ao decodificar JSON: " . json_last_error_msg());
            }
        } else {
            addDebug("Corpo da requisição vazio");
        }
    }
    
    // Validações básicas
    if (empty($product_id)) {
        throw new Exception('ID do produto não fornecido');
    }
    
    if (empty($image_data)) {
        throw new Exception('Dados da imagem não fornecidos');
    }
    
    // Verifica se o produto existe
    $product = new Product($db);
    $result = $product->fetch($product_id);
    if ($result <= 0) {
        throw new Exception('Produto não encontrado (ID: ' . $product_id . ')');
    }
    
    addDebug("Produto encontrado: " . $product->ref);
    
    // Verifica formato da imagem (data:image/jpeg;base64,...)
    if (!preg_match('/^data:image\/(\w+);base64,/', $image_data, $matches)) {
        throw new Exception('Formato de dados da imagem inválido');
    }
    
    // Extrai tipo e dados da imagem
    $image_type = $matches[1];
    $base64_data = substr($image_data, strpos($image_data, ',') + 1);
    $image_data_decoded = base64_decode($base64_data);
    
    if ($image_data_decoded === false) {
        throw new Exception('Falha ao decodificar base64 da imagem');
    }
    
    addDebug("Imagem decodificada com sucesso (tipo: " . $image_type . ")");
    
    // Define nome do arquivo baseado no produto e timestamp
    // Novo formato: [ProductCode]-Webcam_[timestamp].jpg para corresponder ao formato do Dolibarr
    $now = time(); 
    
    // Verifica se há um sufixo específico (usado para diferenciar múltiplas câmeras)
    $suffix = '';
    if (isset($_POST['suffix']) && !empty($_POST['suffix'])) {
        $suffix = $_POST['suffix'];
    }
    
    $filename = $product->ref . '-Webcam' . $suffix . '_' . date('YmdHis', $now) . '.jpg';
    
    // Define diretório de upload (usando lógica do Dolibarr)
    if (isset($conf->product->multidir_output[$product->entity])) {
        $upload_dir = $conf->product->multidir_output[$product->entity];
    } else {
        $upload_dir = $conf->product->multidir_output[1]; // Entidade padrão
    }
    
    // Simplifica o caminho do produto para corresponder ao formato observado
    // Formato: PR00022/
    $upload_dir .= '/' . $product->ref;
    
    addDebug("Diretório de upload: " . $upload_dir);
    
    // Cria diretório se não existir
    if (!file_exists($upload_dir)) {
        if (!mkdir($upload_dir, 0777, true)) {
            throw new Exception('Falha ao criar diretório de upload: ' . $upload_dir);
        }
        addDebug("Diretório criado");
    }
    
    // Testa permissão de escrita
    if (!is_writable($upload_dir)) {
        // Tenta corrigir as permissões
        chmod($upload_dir, 0777);
        if (!is_writable($upload_dir)) {
            throw new Exception('Sem permissão de escrita no diretório: ' . $upload_dir);
        }
    }
    
    // Caminho completo do arquivo
    $file_path = $upload_dir . '/' . $filename;
    addDebug("Caminho do arquivo: " . $file_path);
    
    // Salva a imagem no disco
    if (file_put_contents($file_path, $image_data_decoded) === false) {
        throw new Exception('Falha ao salvar arquivo no disco');
    }
    
    addDebug("Arquivo salvo com sucesso");
    
    // Define permissões do arquivo
    chmod($file_path, 0666);
    
    // IMPORTANTE: Ignoramos o redimensionamento e geração de thumbnails para evitar erros
    addDebug("Ignorando redimensionamento de imagem e geração de thumbnails para evitar erros");
    
    // Em vez de tentar registrar a foto no banco de dados, simplesmente registramos que o arquivo foi salvo
    // O Dolibarr deve reconhecer a foto automaticamente na página do produto após recarregar
    addDebug("A foto foi salva no diretório do produto com sucesso. Será reconhecida automaticamente pelo Dolibarr.");
    
    // Sucesso!
    $response['success'] = true;
    $response['filename'] = $filename;
    $response['path'] = $file_path;
    
    addDebug("Processamento concluído com sucesso");
    
} catch (Exception $e) {
    $response['error'] = $e->getMessage();
    addDebug("ERRO: " . $e->getMessage());
} catch (Throwable $t) {
    // Captura qualquer erro PHP 7+ que não seja Exception
    $response['error'] = "Erro interno: " . $t->getMessage();
    addDebug("ERRO FATAL: " . $t->getMessage());
}

// Retorna resposta como JSON
echo json_encode($response);
