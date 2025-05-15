/**
 * Script independente para injetar o botão de captura de foto na página do produto
 * Este script não depende do webcam.js, garantindo que o botão sempre apareça
 */
(function() {
    "use strict";

    // Verifica se estamos na página de produto
    function isProductPage() {
        const url = window.location.href;
        return url.includes('/product/card.php') || url.includes('/product/fiche.php');
    }

    // Adiciona o botão à barra de ações
    function addCaptureButton() {
        if (!isProductPage()) {
            console.log('WebcamFoto: Não estamos na página de produto');
            return;
        }

        console.log('WebcamFoto: Injetando botão de captura na página de produto');
        
        // Encontra a div de ação que já existe na página
        const actionDivs = document.querySelectorAll('.tabsAction');
        if (actionDivs.length === 0) {
            console.error('WebcamFoto: Não foi possível encontrar a div de ações');
            return;
        }

        // Adiciona o botão diretamente
        const actionDiv = actionDivs[0];
        const captureButton = document.createElement('a');
        captureButton.className = 'butAction';
        captureButton.innerHTML = '<i class="fa fa-camera"></i> Capturar Foto';
        captureButton.href = 'javascript:void(0);';
        captureButton.onclick = function() {
            if (typeof window.openWebcamModal === 'function') {
                window.openWebcamModal();
            } else {
                console.error('WebcamFoto: Função openWebcamModal não definida');
                alert('Erro ao abrir a câmera. Por favor, atualize a página e tente novamente.');
            }
        };

        // Adiciona o botão ao final da div de ações
        actionDiv.appendChild(captureButton);
        console.log('WebcamFoto: Botão de captura injetado com sucesso');
    }

    // Executa quando o DOM estiver carregado
    document.addEventListener('DOMContentLoaded', function() {
        console.log('WebcamFoto: Script de injeção de botão iniciado');
        addCaptureButton();
    });

    // Tenta adicionar o botão novamente após alguns segundos (para casos onde o DOM muda dinamicamente)
    setTimeout(function() {
        addCaptureButton();
    }, 1000);

})();
