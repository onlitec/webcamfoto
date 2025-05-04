<?php
/**
 * Página dedicada para captura de fotos via webcam
 *
 * @author     Webcamfoto Module
 * @copyright  2025 Webcamfoto Module
 * @license    GNU GPLv3
 */

// Carrega o ambiente do Dolibarr
if (!defined('NOTOKENRENEWAL')) define('NOTOKENRENEWAL', 1); // Desativa renovação de token
require_once '../../../../main.inc.php';

// Verifica se há um ID de produto
$productId = GETPOST('id', 'int');
if (empty($productId)) {
    die("Erro: ID do produto não especificado");
}

// Verifica permissões
if (!$user->rights->produit->lire) {
    accessforbidden();
}

$title = 'Captura de Fotos - Produto #' . $productId;
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title><?php echo $title; ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Estilos básicos do Dolibarr -->
    <link rel="stylesheet" type="text/css" href="<?php echo DOL_URL_ROOT; ?>/theme/common/fontawesome-5/css/all.min.css">
    <link rel="stylesheet" type="text/css" href="<?php echo DOL_URL_ROOT . '/' . (empty($conf->global->MAIN_THEME) ? 'theme/eldy' : ('theme/' . $conf->global->MAIN_THEME)); ?>/style.css">
    
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background-color: #f8f9fa;
        }
        .page-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .page-title {
            margin-bottom: 20px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }
        .webcam-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .webcam-column {
            width: 49%;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 10px;
            background-color: white;
        }
        .webcam-title {
            text-align: center;
            font-weight: bold;
            margin-bottom: 10px;
            padding: 5px;
            background-color: #f8f9fa;
            border-radius: 4px;
        }
        .webcam-video-container, .webcam-canvas-container {
            height: 350px;
            background-color: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
            border-radius: 4px;
            overflow: hidden;
        }
        .webcam-video, .webcam-canvas {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        .camera-select {
            width: 100%;
            margin-bottom: 10px;
            padding: 6px;
        }
        .webcam-controls {
            display: flex;
            justify-content: center;
            gap: 5px;
        }
        .button-row {
            display: flex;
            justify-content: center;
            margin-top: 20px;
            gap: 10px;
        }
        .success-message {
            background-color: #00AB55;
            color: white;
            padding: 10px;
            border-radius: 4px;
            text-align: center;
            margin-bottom: 20px;
            display: none;
            font-weight: bold;
        }
        .error-message {
            background-color: #E63757;
            color: white;
            padding: 10px;
            border-radius: 4px;
            text-align: center;
            margin-bottom: 20px;
            display: none;
            font-weight: bold;
        }
        .btn {
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            border: none;
        }
        .btn-blue {
            background-color: #2C7BE5;
            color: white;
        }
        .btn-blue:hover {
            background-color: #1A56A0;
        }
        .btn-red {
            background-color: #E63757;
            color: white;
        }
        .btn-red:hover {
            background-color: #C11F3B;
        }
        .btn-yellow {
            background-color: #F6C23E;
            color: white;
        }
        .btn-yellow:hover {
            background-color: #D4A012;
        }
        .btn-green {
            background-color: #00AB55;
            color: white;
        }
        .btn-green:hover {
            background-color: #007B3D;
        }
    </style>
</head>
<body>
    <div class="page-container">
        <h1 class="page-title"><?php echo $title; ?></h1>
        
        <div class="success-message" id="success-message"></div>
        <div class="error-message" id="error-message"></div>
        
        <div class="webcam-container">
            <div class="webcam-column">
                <div class="webcam-title">Câmera 1</div>
                <select class="camera-select" id="camera-select-1">
                    <option value="">Carregando câmeras...</option>
                </select>
                <div class="webcam-video-container" id="webcam-video-container-1">
                    <video class="webcam-video" id="webcam-video-1" autoplay playsinline></video>
                </div>
                <div class="webcam-canvas-container" id="webcam-canvas-container-1" style="display: none;">
                    <canvas class="webcam-canvas" id="webcam-canvas-1"></canvas>
                </div>
                <div class="webcam-controls">
                    <button class="btn btn-blue" id="capture-1">Capturar</button>
                    <button class="btn btn-yellow" id="retake-1" style="display: none;">Nova Foto</button>
                    <button class="btn btn-green" id="save-1" style="display: none;">Salvar</button>
                </div>
            </div>
            
            <div class="webcam-column">
                <div class="webcam-title">Câmera 2</div>
                <select class="camera-select" id="camera-select-2">
                    <option value="">Carregando câmeras...</option>
                </select>
                <div class="webcam-video-container" id="webcam-video-container-2">
                    <video class="webcam-video" id="webcam-video-2" autoplay playsinline></video>
                </div>
                <div class="webcam-canvas-container" id="webcam-canvas-container-2" style="display: none;">
                    <canvas class="webcam-canvas" id="webcam-canvas-2"></canvas>
                </div>
                <div class="webcam-controls">
                    <button class="btn btn-blue" id="capture-2">Capturar</button>
                    <button class="btn btn-yellow" id="retake-2" style="display: none;">Nova Foto</button>
                    <button class="btn btn-green" id="save-2" style="display: none;">Salvar</button>
                </div>
            </div>
        </div>
        
        <div class="button-row">
            <button class="btn btn-blue" id="capture-both">Capturar Ambas</button>
            <button class="btn btn-green" id="save-both" style="display: none;">Salvar Ambas</button>
            <button class="btn btn-red" id="close-window">Fechar</button>
        </div>
    </div>
</body>
<script src="js/webcam_page.js"></script>
</html>
