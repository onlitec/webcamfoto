/**
 * Módulo para adicionar o botão de IA no WebcamFoto - Versão Direta
 * 
 * @author     Webcamfoto Module
 * @copyright  2025 Webcamfoto Module
 * @license    GNU GPLv3
 */

(function() {
    "use strict";
    
    console.log("AI Button Module Loaded - Versão Direta");

    // Adiciona os estilos necessários para os botões de IA
    function addStyles() {
        if (document.getElementById('webcamfoto-ai-styles')) return;
        
        console.log("Adicionando estilos para botões de IA");
        const styleEl = document.createElement('style');
        styleEl.id = 'webcamfoto-ai-styles';
        styleEl.textContent = `
            .button.webcamfoto-button-purple {
                background-color: #8a2be2 !important;
                color: white !important;
                margin-left: 5px;
                margin-right: 5px;
                display: inline-block;
            }
            
            .button.webcamfoto-button-purple:hover {
                background-color: #7a1dd2 !important;
            }
            
            /* Garantir que o botão seja visível */
            #webcamfoto-enhance-1, #webcamfoto-enhance-2 {
                display: inline-block !important;
            }
        `;
        document.head.appendChild(styleEl);
    }

    // Função para injetar diretamente os botões na interface atual
    function injectButtons() {
        console.log("Injetando botões de IA na interface...");
        
        // Primeira câmera - verifica se o botão de retake está visível (o que significa que uma foto foi capturada)
        const retakeBtn1 = document.getElementById('webcamfoto-retake-1');
        const saveBtn1 = document.getElementById('webcamfoto-save-1');
        
        if (retakeBtn1 && window.getComputedStyle(retakeBtn1).display !== 'none') {
            console.log("Foto da câmera 1 capturada, verificando botão de IA");
            
            // Procura os controles da câmera 1
            const controls1 = retakeBtn1.parentNode;
            
            if (controls1) {
                // Verifica se o botão já existe
                let enhanceBtn1 = document.getElementById('webcamfoto-enhance-1');
                
                if (!enhanceBtn1) {
                    console.log("Criando botão de IA para câmera 1");
                    enhanceBtn1 = document.createElement('button');
                    enhanceBtn1.id = 'webcamfoto-enhance-1';
                    enhanceBtn1.className = 'button butAction webcamfoto-button-purple';
                    enhanceBtn1.textContent = 'Otimizar com IA';
                    enhanceBtn1.style.display = 'inline-block';
                    
                    // Insere após o botão salvar
                    if (saveBtn1 && saveBtn1.nextSibling) {
                        controls1.insertBefore(enhanceBtn1, saveBtn1.nextSibling);
                    } else {
                        controls1.appendChild(enhanceBtn1);
                    }
                    
                    // Adiciona o evento de clique
                    enhanceBtn1.addEventListener('click', function() {
                        console.log("Botão de IA da câmera 1 clicado");
                        if (window.WebcamFoto && typeof window.WebcamFoto.enhanceImage === 'function') {
                            window.WebcamFoto.enhanceImage(1);
                        } else {
                            console.error("WebcamFoto ou método enhanceImage não disponível");
                            alert("Função de otimização por IA não disponível. Verifique o console para detalhes.");
                        }
                    });
                    
                    console.log("Botão de IA da câmera 1 adicionado com sucesso");
                } else {
                    enhanceBtn1.style.display = 'inline-block';
                }
            }
        }
        
        // Segunda câmera
        const retakeBtn2 = document.getElementById('webcamfoto-retake-2');
        const saveBtn2 = document.getElementById('webcamfoto-save-2');
        
        if (retakeBtn2 && window.getComputedStyle(retakeBtn2).display !== 'none') {
            console.log("Foto da câmera 2 capturada, verificando botão de IA");
            
            // Procura os controles da câmera 2
            const controls2 = retakeBtn2.parentNode;
            
            if (controls2) {
                // Verifica se o botão já existe
                let enhanceBtn2 = document.getElementById('webcamfoto-enhance-2');
                
                if (!enhanceBtn2) {
                    console.log("Criando botão de IA para câmera 2");
                    enhanceBtn2 = document.createElement('button');
                    enhanceBtn2.id = 'webcamfoto-enhance-2';
                    enhanceBtn2.className = 'button butAction webcamfoto-button-purple';
                    enhanceBtn2.textContent = 'Otimizar com IA';
                    enhanceBtn2.style.display = 'inline-block';
                    
                    // Insere após o botão salvar
                    if (saveBtn2 && saveBtn2.nextSibling) {
                        controls2.insertBefore(enhanceBtn2, saveBtn2.nextSibling);
                    } else {
                        controls2.appendChild(enhanceBtn2);
                    }
                    
                    // Adiciona o evento de clique
                    enhanceBtn2.addEventListener('click', function() {
                        console.log("Botão de IA da câmera 2 clicado");
                        if (window.WebcamFoto && typeof window.WebcamFoto.enhanceImage === 'function') {
                            window.WebcamFoto.enhanceImage(2);
                        } else {
                            console.error("WebcamFoto ou método enhanceImage não disponível");
                            alert("Função de otimização por IA não disponível. Verifique o console para detalhes.");
                        }
                    });
                    
                    console.log("Botão de IA da câmera 2 adicionado com sucesso");
                } else {
                    enhanceBtn2.style.display = 'inline-block';
                }
            }
        }
    }

    // Adiciona botões após o clique no botão capturar
    function setupCaptureButtonListener() {
        console.log("Configurando listeners para botões de captura");
        
        document.addEventListener('click', function(event) {
            if (event.target && 
                (event.target.id === 'webcamfoto-capture-1' || 
                 event.target.id === 'webcamfoto-capture-2' || 
                 event.target.id === 'webcamfoto-capture-both')) {
                
                console.log("Botão de captura clicado: " + event.target.id);
                
                // Espera um pouco para ter certeza que o DOM foi atualizado
                setTimeout(function() {
                    injectButtons();
                }, 500);
            }
        }, true);
    }

    // Modifica diretamente a função de captura do WebcamFoto
    function patchWebcamFotoCapture() {
        // Verifica se o objeto WebcamFoto e seu método capture existem
        if (window.WebcamFoto && typeof window.WebcamFoto.capture === 'function') {
            console.log("Substituindo função capture do WebcamFoto para adicionar botões de IA");
            
            // Guarda a referência da função original
            const originalCapture = window.WebcamFoto.capture;
            
            // Substitui com nossa versão que adiciona o botão de IA
            window.WebcamFoto.capture = function(cameraIndex) {
                console.log("Função capture interceptada para câmera " + cameraIndex);
                
                // Chama a função original primeiro
                originalCapture.call(window.WebcamFoto, cameraIndex);
                
                // Adiciona os botões de IA após a captura
                setTimeout(function() {
                    injectButtons();
                }, 200);
            };
            
            console.log("Função capture substituída com sucesso");
        } else {
            console.warn("WebcamFoto ou método capture não encontrado para substituição");
        }
    }

    // Observa mutações no DOM para detectar quando as fotos são capturadas
    function observeDOM() {
        console.log("Configurando observer para mudanças no DOM");
        
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // Procura por mudanças nos elementos de controle da webcam
                if (mutation.target && 
                    (mutation.target.id === 'webcamfoto-retake-1' || 
                     mutation.target.id === 'webcamfoto-retake-2' || 
                     mutation.target.id === 'webcamfoto-save-1' || 
                     mutation.target.id === 'webcamfoto-save-2')) {
                    
                    if (mutation.attributeName === 'style' || mutation.attributeName === 'display') {
                        console.log("Mudança detectada no elemento " + mutation.target.id);
                        setTimeout(injectButtons, 100);
                    }
                }
            });
        });
        
        // Observa todo o documento para detectar mudanças
        observer.observe(document.body, { 
            childList: true, 
            subtree: true, 
            attributes: true, 
            attributeFilter: ['style', 'display'] 
        });
    }

    // Função de inicialização principal
    function initialize() {
        console.log("Inicializando módulo de botões de IA");
        
        // Adiciona os estilos CSS
        addStyles();
        
        // Configura os listeners para os botões de captura
        setupCaptureButtonListener();
        
        // Substitui a função capture para adicionar nossos botões
        patchWebcamFotoCapture();
        
        // Configura o observer para mudanças no DOM
        observeDOM();
        
        // Verifica se já há fotos capturadas
        setTimeout(injectButtons, 1000);
        setTimeout(injectButtons, 3000);
    }

    // Inicializa quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // Se o DOM já estiver carregado, inicializa imediatamente
        initialize();
    }

})();
