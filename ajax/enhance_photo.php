<?php
/**
 * Manipula a requisição AJAX para aprimorar imagens com IA
 * 
 * @author     Webcamfoto Module
 * @copyright  2025 Webcamfoto Module
 * @license    GNU GPLv3
 */

// Impede a exibição de erros fatais, que podem quebrar o JSON de resposta
ini_set('display_errors', 0);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

// Log para depuração
error_log("Webcamfoto AI: Requisição de aprimoramento iniciada");

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
    $timestamp = date('Y-m-d H:i:s');
    $debugMessage = '[' . $timestamp . '] ' . $message;
    $response['debug'][] = $debugMessage;
    error_log("Webcamfoto AI: " . $debugMessage);
}

addDebug("Script de aprimoramento iniciado");

$start_time = microtime(true); // Início do timer de performance
addDebug("Iniciando solicitação");

// Função para criar a tabela de configurações se não existir
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
            $response['error'] = 'Falha ao criar tabela de configurações.';
            return false;
        }
        addDebug("Tabela de configurações criada com sucesso");
    } else {
        addDebug("Tabela de configurações já existe");
    }
    return true;
}

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

// Função para salvar configurações na tabela
function saveIAConfig($db, $model_name, $settings) {
    global $response;
    $settings_json = $db->escape(json_encode($settings));
    $sql = "INSERT INTO " . MAIN_DB_PREFIX . "webcamfoto_ia_config (model_name, settings) VALUES ('" . $db->escape($model_name) . "', '" . $settings_json . "') ON DUPLICATE KEY UPDATE settings = '" . $settings_json . "', updated_at = CURRENT_TIMESTAMP";
    if (!$db->query($sql)) {
        addDebug("Erro ao salvar configurações: " . $db->lasterror());
        $response['error'] = 'Falha ao salvar configurações.';
        return false;
    }
    return true;
}

try {
    // Inicializa o ambiente Dolibarr mínimo necessário
    require '../../../main.inc.php';
    require_once DOL_DOCUMENT_ROOT.'/core/lib/files.lib.php';
    
    // Verifica se é POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método de requisição inválido (esperava POST)');
    }
    
    addDebug("Método POST verificado");
    
    // Executar a verificação e criação da tabela após inicializar o banco de dados
    ensureIAConfigTableExists($db);
    
    // Carregar configurações no início
    $config = loadIAConfig($db);
    $model = $config['model_name'] ?? 'default';
    $api_key = GETPOST('api_key', 'alpha') ?: ($config['settings']['api_key'] ?? ''); // Prioriza config salva
    
    // Obtém os dados da requisição
    $request_body = file_get_contents('php://input');
    $jsonData = null;
    
    // Primeiro tenta processar como FormData
    $action = isset($_POST['action']) ? $_POST['action'] : '';
    
    // Obtém configurações enviadas ou constantes do módulo
    $api_key = isset($_POST['api_key']) ? $_POST['api_key'] : '';
    $model   = isset($_POST['model']) ? $_POST['model'] : 'stability-ai/sdxl';

    // Se não veio via POST, tenta das configurações do módulo Webcamfoto
    if (empty($api_key) && !empty($conf->global->WEBCAMFOTO_AI_API_KEY)) {
        $api_key = $conf->global->WEBCAMFOTO_AI_API_KEY;
        addDebug("Usando chave API do setup Webcamfoto");
    }

    if ($model === 'stability-ai/sdxl' && !empty($conf->global->WEBCAMFOTO_AI_PROVIDER)) {
        $providerSetup = $conf->global->WEBCAMFOTO_AI_PROVIDER;
        switch(strtolower($providerSetup)) {
            case 'pixelcut':
                $model = 'pixelcut';
                break;
            case 'openai':
                $model = 'openai/dalle3';
                break;
            case 'anthropic':
                $model = 'anthropic/claude';
                break;
            case 'stability':
                $model = 'stability-ai/sdxl';
                break;
        }
        addDebug("Modelo definido pelo setup Webcamfoto: $model");
    }
    
    $image_data = '';
    
    // Se enviado como FormData com um arquivo
    if (isset($_FILES['image']) && !empty($_FILES['image']['tmp_name'])) {
        addDebug("Arquivo de imagem recebido por upload");
        // Lê o arquivo temporário
        $image_data = file_get_contents($_FILES['image']['tmp_name']);
        // Converte para base64
        $image_data = 'data:image/jpeg;base64,' . base64_encode($image_data);
    }
    // Se enviado como FormData com dados base64
    elseif (isset($_POST['image_data'])) {
        addDebug("Dados de imagem recebidos via POST");
        $image_data = $_POST['image_data'];
    }
    // Se enviado como JSON payload
    elseif (!empty($request_body)) {
        addDebug("Tentando processar como JSON");
        $jsonData = json_decode($request_body, true);
        if ($jsonData !== null) {
            $action = isset($jsonData['action']) ? $jsonData['action'] : '';
            $api_key = isset($jsonData['api_key']) ? $jsonData['api_key'] : '';
            $model = isset($jsonData['model']) ? $jsonData['model'] : 'stability-ai/sdxl';
            
            if (isset($jsonData['image_data'])) {
                $image_data = $jsonData['image_data'];
            }
        }
    }
    
    // Verifica dados mínimos necessários
    if (empty($image_data)) {
        throw new Exception('Dados da imagem não fornecidos');
    }
    
    // Verifica o formato da imagem (data:image/jpeg;base64,...)
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
    
    // Verifica a ação solicitada
    if ($action === 'enhance' && !empty($api_key)) {
        // Aprimoramento com IA (usando API configurada no Dolibarr)
        addDebug("Iniciando aprimoramento com IA usando modelo: " . $model);
        
        // Cria arquivo temporário com a imagem
        $tmpImageFile = tempnam(sys_get_temp_dir(), 'webcamfoto_');
        file_put_contents($tmpImageFile, $image_data_decoded);
        
        // Determine qual API usar com base no modelo
        if (strpos($model, 'openai') !== false) {
            // Usar OpenAI
            $enhancedImageData = callOpenAIAPI($api_key, $tmpImageFile);
            addDebug("Processamento com OpenAI realizado");
        } 
        else if (strpos($model, 'anthropic') !== false) {
            // Usar Anthropic (Claude)
            $enhancedImageData = callAnthropicAPI($api_key, $tmpImageFile);
            addDebug("Processamento com Anthropic realizado");
        }
        else if ($model === 'pixelcut') {
            // Usar Pixelcut
            $pixelcutApiKey = !empty($conf->global->WEBCAMFOTO_PIXELCUT_API_KEY) 
                ? $conf->global->WEBCAMFOTO_PIXELCUT_API_KEY 
                : $api_key;
            
            // Parâmetros configuráveis via módulo
            $scale = !empty($conf->global->WEBCAMFOTO_AI_SCALE) 
                ? intval($conf->global->WEBCAMFOTO_AI_SCALE) 
                : 2;  // Padrão: dobrar resolução
            
            $pixelcutHeaders = [
                'Content-Type: multipart/form-data',
                'X-API-KEY: ' . $pixelcutApiKey,
                'Accept: application/json'
            ];

            $pixelcutData = [
                'image' => new CURLFile($tmpImageFile, mime_content_type($tmpImageFile)),
                'scale' => $scale
            ];

            $ch = curl_init('https://api.developer.pixelcut.ai/v1/upscale');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $pixelcutHeaders);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $pixelcutData);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

            $pixelcutResponse = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode === 200) {
                $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

                if (strpos($contentType, 'image/') === 0) {
                    // Resposta é o binário da imagem
                    $enhancedImageData = $pixelcutResponse;
                    addDebug("Pixelcut retornou imagem binária (scale: $scale)");
                } else {
                    // Espera JSON com result_url
                    $responseData = json_decode($pixelcutResponse, true);
                    if (isset($responseData['result_url'])) {
                        $enhancedImageData = file_get_contents($responseData['result_url']);
                        addDebug("Pixelcut: Imagem baixada de result_url (scale: $scale)");
                    } else {
                        throw new Exception('Resposta da Pixelcut sem result_url. Conteúdo: ' . $pixelcutResponse);
                    }
                }
            } else {
                throw new Exception("Erro Pixelcut: " . $pixelcutResponse);
            }
        }
        else {
            // Modelo padrão: Stability AI ou simulação
            if (!empty($api_key) && strpos($model, 'stability') !== false) {
                $enhancedImageData = callStabilityAPI($api_key, $tmpImageFile);
                addDebug("Processamento com Stability AI realizado");
            } else {
                // Simulação para desenvolvimento/testes
                addDebug("SIMULAÇÃO: Nenhuma API real configurada, simulando aprimoramento");
                $enhancedImageData = simulateEnhancement($tmpImageFile);
            }
        }
        
        // Limpa o arquivo temporário
        unlink($tmpImageFile);
        
        // Codifica em base64 para retorno
        $enhancedImageBase64 = 'data:image/jpeg;base64,' . base64_encode($enhancedImageData);
        
        // Retorna a imagem aprimorada
        $response['success'] = true;
        $response['enhancedImageData'] = $enhancedImageBase64;
        addDebug("Aprimoramento com IA concluído com sucesso");
    } else if (isset($_POST['adjustments']) || (isset($jsonData) && isset($jsonData['adjustments']))) {
        // Aplicação de ajustes manuais
        $adjustments = isset($_POST['adjustments']) ? json_decode($_POST['adjustments'], true) : $jsonData['adjustments'];
        
        addDebug("Aplicando ajustes manuais: " . json_encode($adjustments));
        
        // Aplica os ajustes à imagem
        $tmpImagePath = tempnam(sys_get_temp_dir(), 'adjusted_');
        file_put_contents($tmpImagePath, $image_data_decoded);
        
        $adjustedImage = applyAdjustments($tmpImagePath, $adjustments);
        
        // Convertendo de volta para base64
        $adjustedImageBase64 = 'data:image/jpeg;base64,' . base64_encode($adjustedImage);
        
        unlink($tmpImagePath); // Remove o arquivo temporário
        
        // Retorna a imagem ajustada
        $response['success'] = true;
        $response['adjustedImageData'] = $adjustedImageBase64;
        addDebug("Ajustes aplicados com sucesso");
    } else {
        throw new Exception('Ação não especificada ou chave de API ausente');
    }
} catch (Exception $e) {
    $duration = microtime(true) - $start_time;
    $response['performance'] = array('duration_seconds' => round($duration, 4));
    $response['error'] = $e->getMessage();
    addDebug("ERRO: " . $e->getMessage() . " | Duração: " . round($duration, 4) . "s");
} catch (Throwable $t) {
    // Captura qualquer erro PHP 7+ que não seja Exception
    $duration = microtime(true) - $start_time;
    $response['performance'] = array('duration_seconds' => round($duration, 4));
    $response['error'] = "Erro interno: " . $t->getMessage();
    addDebug("ERRO FATAL: " . $t->getMessage() . " | Duração: " . round($duration, 4) . "s");
}

// Adicionar duração à resposta de sucesso também
if ($response['success']) {
    $duration = microtime(true) - $start_time;
    $response['performance'] = array('duration_seconds' => round($duration, 4));
    addDebug("Solicitação bem-sucedida | Duração: " . round($duration, 4) . "s");
}

// Retorna resposta como JSON
$response['debug'] = array_unique($response['debug']); // Evitar duplicatas de debug se necessário
echo json_encode($response);

/**
 * Simula um aprimoramento de imagem com IA
 * Em um ambiente de produção, isso seria substituído por uma chamada real à API de IA
 * 
 * @param string $imagePath Caminho para o arquivo de imagem temporário
 * @return string Dados binários da imagem aprimorada
 */
function simulateEnhancement($imagePath) {
    // Carrega a imagem
    $image = imagecreatefromjpeg($imagePath);
    
    // Simula melhorias básicas (em produção seria feito pela API de IA)
    
    // Aumenta contraste levemente
    imagefilter($image, IMG_FILTER_CONTRAST, 10);
    
    // Suaviza a imagem
    imagefilter($image, IMG_FILTER_SMOOTH, 5);
    
    // Aumenta brilho suavemente
    imagefilter($image, IMG_FILTER_BRIGHTNESS, 5);
    
    // Aumenta saturação simulando cores mais vivas
    imagefilter($image, IMG_FILTER_COLORIZE, 0, 0, 0, 5);
    
    // Captura a saída para retornar como string
    ob_start();
    imagejpeg($image, null, 95);
    $imageData = ob_get_clean();
    
    // Libera memória
    imagedestroy($image);
    
    return $imageData;
}

/**
 * Chama a API da OpenAI (DALL-E) para aprimorar uma imagem
 * 
 * @param string $apiKey Chave da API
 * @param string $imagePath Caminho para o arquivo de imagem temporário
 * @return string Dados binários da imagem aprimorada
 */
function callOpenAIAPI($apiKey, $imagePath) {
    global $response;
    addDebug("Chamando API da OpenAI (DALL-E)");
    
    // URL da API
    $apiUrl = 'https://api.openai.com/v1/images/edits';
    
    // Carrega a imagem
    $image = file_get_contents($imagePath);
    
    // Prepara a requisição cURL
    $ch = curl_init();
    
    // Define as opções da requisição
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    
    // Cria um arquivo temporário para a máscara (totalmente branca, sem alterações)
    $maskPath = tempnam(sys_get_temp_dir(), 'mask_');
    $maskImage = imagecreatetruecolor(1, 1);
    $white = imagecolorallocate($maskImage, 255, 255, 255);
    imagefilledrectangle($maskImage, 0, 0, 1, 1, $white);
    imagepng($maskImage, $maskPath);
    imagedestroy($maskImage);
    
    // Prepara os dados para a API
    $prompt = "Aprimorar esta imagem de produto para e-commerce: melhorar qualidade, iluminação e nitidez.";
    
    // Prepara os dados multipart
    $postFields = [
        'image' => new CURLFile($imagePath),
        'mask' => new CURLFile($maskPath),
        'prompt' => $prompt,
        'n' => 1,
        'size' => '1024x1024',
        'response_format' => 'url'
    ];
    
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: multipart/form-data'
    ]);
    
    // Executa a requisição
    $apiResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    // Fecha a conexão cURL
    curl_close($ch);
    
    // Remove o arquivo temporário da máscara
    unlink($maskPath);
    
    // Verifica se a requisição foi bem-sucedida
    if ($httpCode == 200) {
        $jsonResponse = json_decode($apiResponse, true);
        if (isset($jsonResponse['data'][0]['url'])) {
            // Baixa a imagem resultante
            $imageUrl = $jsonResponse['data'][0]['url'];
            addDebug("Imagem gerada pela OpenAI: " . $imageUrl);
            $enhancedImage = file_get_contents($imageUrl);
            return $enhancedImage;
        } else {
            addDebug("ERRO: Formato de resposta inesperado da OpenAI");
            // Retorna simulação em caso de erro
            return simulateEnhancement($imagePath);
        }
    } else {
        addDebug("ERRO na API da OpenAI: HTTP $httpCode - $apiResponse");
        // Retorna simulação em caso de erro
        return simulateEnhancement($imagePath);
    }
}

/**
 * Chama a API da Stability.ai para aprimorar uma imagem
 * 
 * @param string $apiKey Chave da API
 * @param string $imagePath Caminho para o arquivo de imagem temporário
 * @return string Dados binários da imagem aprimorada
 */
function callStabilityAPI($apiKey, $imagePath) {
    global $response;
    addDebug("Chamando API da Stability.ai");
    
    // URL da API para image-to-image
    $apiUrl = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image';
    
    // Carrega a imagem
    $imageContent = file_get_contents($imagePath);
    $base64Image = base64_encode($imageContent);
    
    // Prepara os dados para a API
    $payload = json_encode([
        'image' => $base64Image,
        'init_image_mode' => 'IMAGE_STRENGTH',
        'image_strength' => 0.35, // Força da imagem original (valor entre 0 e 1)
        'steps' => 40,
        'cfg_scale' => 7,
        'samples' => 1,
        'text_prompts' => [
            [
                'text' => 'Aprimorar esta imagem de produto para e-commerce: melhorar qualidade, iluminação e nitidez.',
                'weight' => 1
            ],
            [
                'text' => 'baixa qualidade, desfocado, pixelado, distorção, ruído', 
                'weight' => -1 // Prompt negativo
            ]
        ]
    ]);
    
    // Prepara a requisição cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    
    // Executa a requisição
    $apiResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    // Fecha a conexão cURL
    curl_close($ch);
    
    // Verifica se a requisição foi bem-sucedida
    if ($httpCode == 200) {
        $jsonResponse = json_decode($apiResponse, true);
        if (isset($jsonResponse['artifacts'][0]['base64'])) {
            // Decodifica a imagem resultante
            $enhancedImage = base64_decode($jsonResponse['artifacts'][0]['base64']);
            return $enhancedImage;
        } else {
            addDebug("ERRO: Formato de resposta inesperado da Stability.ai");
            // Retorna simulação em caso de erro
            return simulateEnhancement($imagePath);
        }
    } else {
        addDebug("ERRO na API da Stability.ai: HTTP $httpCode - $apiResponse");
        // Retorna simulação em caso de erro
        return simulateEnhancement($imagePath);
    }
}

/**
 * Chama a API da Anthropic (Claude) para aprimorar uma imagem
 * 
 * @param string $apiKey Chave da API
 * @param string $imagePath Caminho para o arquivo de imagem temporário
 * @return string Dados binários da imagem aprimorada
 */
function callAnthropicAPI($apiKey, $imagePath) {
    global $response;
    addDebug("A API Anthropic não possui capacidade nativa de geração/modificação de imagens. Usando simulação.");
    
    // Como a Claude da Anthropic não suporta diretamente modificação de imagens,
    // usamos a simulação como fallback
    return simulateEnhancement($imagePath);
}

/**
 * Aplica ajustes manuais à imagem
 * 
 * @param string $imagePath Caminho para o arquivo de imagem temporário
 * @param array $adjustments Array com os ajustes a serem aplicados
 * @return string Dados binários da imagem ajustada
 */
function applyAdjustments($imagePath, $adjustments) {
    // Carrega a imagem
    $image = imagecreatefromjpeg($imagePath);
    
    // Aplicar brilho se especificado
    if (isset($adjustments['brightness'])) {
        $brightness = (int)$adjustments['brightness'];
        if ($brightness != 0) {
            imagefilter($image, IMG_FILTER_BRIGHTNESS, $brightness);
        }
    }
    
    // Aplicar contraste se especificado
    if (isset($adjustments['contrast'])) {
        $contrast = (int)$adjustments['contrast'];
        if ($contrast != 0) {
            imagefilter($image, IMG_FILTER_CONTRAST, $contrast);
        }
    }
    
    // Aplicar saturação se especificado
    if (isset($adjustments['saturation'])) {
        $saturation = (int)$adjustments['saturation'];
        if ($saturation > 0) {
            imagefilter($image, IMG_FILTER_COLORIZE, 0, 0, 0, $saturation);
        } elseif ($saturation < 0) {
            // Reduz saturação (converte parcialmente para escala de cinza)
            $matrix = array(
                array(0.3, 0.3, 0.3),
                array(0.3, 0.3, 0.3),
                array(0.3, 0.3, 0.3)
            );
            
            // Aplica a matriz de forma proporcional à quantidade de dessaturação
            $saturation = abs($saturation) / 100;
            imageconvolution($image, $matrix, 1, 0);
        }
    }
    
    // Remover fundo (simulação simplificada)
    if (isset($adjustments['removeBg']) && $adjustments['removeBg']) {
        // Em produção, isso seria uma chamada para um serviço específico de remoção de fundo
        // Aqui apenas simulamos uma remoção muito simples baseada em cor
        
        // Cria uma nova imagem com canal alfa
        $width = imagesx($image);
        $height = imagesy($image);
        $newImage = imagecreatetruecolor($width, $height);
        
        // Habilita a transparência
        imagealphablending($newImage, false);
        imagesavealpha($newImage, true);
        
        // Preenche com transparência
        $transparent = imagecolorallocatealpha($newImage, 255, 255, 255, 127);
        imagefilledrectangle($newImage, 0, 0, $width, $height, $transparent);
        
        // Simula uma detecção muito básica (apenas para demonstração)
        // Copia os pixels não brancos da imagem original
        for ($x = 0; $x < $width; $x++) {
            for ($y = 0; $y < $height; $y++) {
                $color = imagecolorat($image, $x, $y);
                $r = ($color >> 16) & 0xFF;
                $g = ($color >> 8) & 0xFF;
                $b = $color & 0xFF;
                
                // Se não for muito claro (branco), copia para a nova imagem
                if ($r < 245 || $g < 245 || $b < 245) {
                    imagesetpixel($newImage, $x, $y, $color);
                }
            }
        }
        
        // Substitui a imagem original pela nova com fundo transparente
        imagedestroy($image);
        $image = $newImage;
    }
    
    // Captura a saída para retornar como string
    ob_start();
    imagejpeg($image, null, 95);
    $imageData = ob_get_clean();
    
    // Libera memória
    imagedestroy($image);
    
    return $imageData;
}
