/**
 * Script para forçar a exibição do botão de IA no WebcamFoto
 */
(function() {
    "use strict";
    
    console.log("Script force_ai_button.js carregado");
    
    // Função para mostrar o botão de IA
    function forceShowAIButton() {
        console.log("Forçando exibição do botão de IA");
        
        // Procura pelo botão de captura
        const captureBtn = document.getElementById("webcamfoto-capture");
        if (captureBtn) {
            console.log("Botão de captura encontrado");
            
            // Adiciona evento de clique
            captureBtn.addEventListener("click", function() {
                console.log("Botão de captura clicado, forçando exibição do botão de IA");
                
                // Espera um pouco para a captura ser processada
                setTimeout(function() {
                    // Procura pelo botão de IA
                    const enhanceBtn = document.getElementById("webcamfoto-enhance");
                    if (enhanceBtn) {
                        // Força a exibição do botão
                        enhanceBtn.style.display = "inline-block";
                        console.log("Botão de IA forçado a ser exibido");
                        
                        // Adiciona evento de clique se ainda não tiver
                        if (!enhanceBtn.hasAttribute("data-event-attached")) {
                            enhanceBtn.setAttribute("data-event-attached", "true");
                            enhanceBtn.addEventListener("click", function() {
                                console.log("Botão de IA clicado");
                                if (window.WebcamFoto && typeof window.WebcamFoto.enhanceImage === "function") {
                                    window.WebcamFoto.enhanceImage(1);
                                } else {
                                    console.error("Função WebcamFoto.enhanceImage não encontrada");
                                }
                            });
                        }
                    } else {
                        console.log("Botão de IA não encontrado, tentando criar");
                        
                        // Procura pelo footer do modal
                        const footer = document.querySelector(".webcamfoto-modal-footer");
                        if (footer) {
                            // Cria o botão de IA
                            const newBtn = document.createElement("button");
                            newBtn.id = "webcamfoto-enhance";
                            newBtn.className = "button butAction webcamfoto-button-purple";
                            newBtn.textContent = "Otimizar com IA";
                            newBtn.style.display = "inline-block";
                            
                            // Adiciona evento de clique
                            newBtn.addEventListener("click", function() {
                                console.log("Botão de IA criado e clicado");
                                if (window.WebcamFoto && typeof window.WebcamFoto.enhanceImage === "function") {
                                    window.WebcamFoto.enhanceImage(1);
                                } else {
                                    console.error("Função WebcamFoto.enhanceImage não encontrada");
                                }
                            });
                            
                            // Adiciona ao footer
                            footer.appendChild(newBtn);
                            console.log("Botão de IA criado e adicionado ao footer");
                        }
                    }
                }, 500);
            });
        }
    }
    
    // Função para observar mudanças no DOM
    function setupObserver() {
        console.log("Configurando observador para o modal");
        
        // Cria um observador de mutações
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    // Verifica se o modal foi adicionado
                    if (document.getElementById("webcamfoto-modal")) {
                        console.log("Modal detectado, configurando botões");
                        forceShowAIButton();
                    }
                }
            });
        });
        
        // Configura o observador
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Inicializa o script
    function init() {
        // Espera o DOM estar completamente carregado
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", function() {
                forceShowAIButton();
                setupObserver();
            });
        } else {
            forceShowAIButton();
            setupObserver();
        }
        
        // Tenta novamente após um tempo para garantir
        setTimeout(forceShowAIButton, 2000);
        setTimeout(forceShowAIButton, 5000);
    }
    
    // Inicia o script
    init();
})();
