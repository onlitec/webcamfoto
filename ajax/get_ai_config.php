<?php
/**
 * Endpoint para obter configurações de IA do módulo WebcamFoto
 *
 * @return json Configurações de IA
 */

// Impede a exibição de erros fatais, que podem quebrar o JSON de resposta
ini_set('display_errors', 0);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

// Corrige problemas de CORS adicionando cabeçalhos permissivos
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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
    'config' => null,
    'debug' => array()
);

// Função para adicionar informações de debug à resposta
function addDebug($message) {
    global $response;
    $timestamp = date('Y-m-d H:i:s');
    $debugMessage = '[' . $timestamp . '] ' . $message;
    $response['debug'][] = $debugMessage;
    error_log("Webcamfoto AI Config: " . $debugMessage);
}

addDebug("Iniciando carregamento de configurações de IA");

try {
    // Carrega as bibliotecas principais do Dolibarr
    require_once '../../../main.inc.php';
    
    // Verificação de segurança - qualquer usuário pode acessar as configurações
    // mas apenas para leitura
    
    // Função para carregar configurações da tabela
    function loadIAConfig($db) {
        global $response;
        $sql = "SELECT model_name, settings FROM " . MAIN_DB_PREFIX . "webcamfoto_ia_config ORDER BY id DESC LIMIT 1";
        $resql = $db->query($sql);
        if ($resql) {
            if ($obj = $db->fetch_object($resql)) {
                return array('model_name' => $obj->model_name, 'settings' => json_decode($obj->settings, true));
            }
        } else {
            addDebug("Erro ao carregar configurações: " . $db->lasterror());
        }
        return array('model_name' => 'default', 'settings' => array()); // Configuração padrão se não encontrada
    }
    
    // Verificar se a tabela existe
    function ensureIAConfigTableExists($db) {
        global $response;
        $tableName = MAIN_DB_PREFIX . 'webcamfoto_ia_config';
        $sqlCheck = "SHOW TABLES LIKE '" . $db->escape($tableName) . "'";
        $resql = $db->query($sqlCheck);
        if ($resql && $db->num_rows($resql) == 0) {
            $sqlCreate = "CREATE TABLE " . $tableName . " (
                id INT AUTO_INCREMENT PRIMARY KEY,
                model_name VARCHAR(50) DEFAULT 'default',
                settings TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )";
            if (!$db->query($sqlCreate)) {
                addDebug("Erro ao criar tabela: " . $db->lasterror());
                return false;
            }
            addDebug("Tabela de configurações criada com sucesso");
        }
        return true;
    }
    
    // Garantir que a tabela existe
    if (!ensureIAConfigTableExists($db)) {
        throw new Exception("Falha ao verificar ou criar tabela de configurações");
    }
    
    // Carregar configurações da tabela
    $config = loadIAConfig($db);
    
    // Se não houver configurações na tabela, tentar carregar das constantes do Dolibarr
    if (empty($config['settings'])) {
        addDebug("Nenhuma configuração encontrada na tabela, tentando constantes do Dolibarr");
        
        // Carregar das constantes do Dolibarr
        $model = !empty($conf->global->WEBCAMFOTO_AI_PROVIDER) ? $conf->global->WEBCAMFOTO_AI_PROVIDER : 'default';
        $apiKey = !empty($conf->global->WEBCAMFOTO_AI_API_KEY) ? $conf->global->WEBCAMFOTO_AI_API_KEY : '';
        $scale = !empty($conf->global->WEBCAMFOTO_AI_SCALE) ? $conf->global->WEBCAMFOTO_AI_SCALE : 2;
        $quality = !empty($conf->global->WEBCAMFOTO_AI_QUALITY) ? $conf->global->WEBCAMFOTO_AI_QUALITY : 90;
        
        // Configurações específicas para o Pixelcut
        $pixelcutApiKey = !empty($conf->global->WEBCAMFOTO_PIXELCUT_API_KEY) ? $conf->global->WEBCAMFOTO_PIXELCUT_API_KEY : '';
        
        // Se o modelo for pixelcut e tivermos uma chave específica, usá-la
        if ($model == 'pixelcut' && !empty($pixelcutApiKey)) {
            $apiKey = $pixelcutApiKey;
        }
        
        // Criar configuração a partir das constantes
        $config = array(
            'model_name' => $model,
            'settings' => array(
                'api_key' => $apiKey,
                'scale' => $scale,
                'quality' => $quality,
                'prompt' => 'Aprimorar esta imagem de produto para e-commerce: melhorar qualidade, iluminação e nitidez.'
            )
        );
        
        addDebug("Configurações carregadas das constantes do Dolibarr: modelo=" . $model);
    } else {
        addDebug("Configurações carregadas da tabela: modelo=" . $config['model_name']);
    }
    
    // Definir resposta como sucesso
    $response['success'] = true;
    $response['config'] = $config;
    
} catch (Exception $e) {
    $response['error'] = $e->getMessage();
    addDebug("ERRO: " . $e->getMessage());
} catch (Throwable $t) {
    // Captura qualquer erro PHP 7+ que não seja Exception
    $response['error'] = "Erro interno: " . $t->getMessage();
    addDebug("ERRO FATAL: " . $t->getMessage());
}

// Retornar resposta em formato JSON
echo json_encode($response);
