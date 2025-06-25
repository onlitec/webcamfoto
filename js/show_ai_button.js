/**
 * Script específico para garantir que o botão de IA seja exibido
 * após a captura da foto no módulo WebcamFoto
 */
(function() {
    "use strict";
    
    console.log("Script show_ai_button.js carregado");
    
    // Função para mostrar o botão de IA
    function showAIButton() {
        console.log("Tentando mostrar o botão de IA");
        
        // Espera o DOM estar completamente carregado
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", setupButtonHandlers);
        } else {
            setupButtonHandlers();
        }
    }
    
    // Configura os manipuladores de eventos para os botões
    function setupButtonHandlers() {
        console.log("Configurando manipuladores de eventos para os botões");
        
        // Espera um pouco para garantir que todos os elementos estejam disponíveis
        setTimeout(function() {
            // Botão de captura
            const captureBtn = document.getElementById("webcamfoto-capture");
            if (captureBtn) {
                console.log("Botão de captura encontrado, adicionando evento");
                
                // Adiciona evento de clique
                captureBtn.addEventListener("click", function() {
                    console.log("Botão de captura clicado");
                    
                    // Espera um pouco para a captura ser processada
                    setTimeout(function() {
                        // Mostra o botão de IA
                        const enhanceBtn = document.getElementById("webcamfoto-enhance");
                        if (enhanceBtn) {
                            console.log("Botão de IA encontrado, exibindo");
                            enhanceBtn.style.display = "inline-block";
                            
                            // Adiciona evento de clique se ainda não tiver
                            if (!enhanceBtn.hasAttribute("data-event-attached")) {
                                enhanceBtn.setAttribute("data-event-attached", "true");
                                enhanceBtn.addEventListener("click", function() {
                                    console.log("Botão de IA clicado");
                                    
                                    // Chama a função de otimização
                                    if (window.WebcamFoto && typeof window.WebcamFoto.enhanceImage === "function") {
                                        window.WebcamFoto.enhanceImage(1);
                                    } else {
                                        console.error("Função enhanceImage não encontrada");
                                        alert("Função de otimização por IA não disponível");
                                    }
                                });
                            }
                        } else {
                            console.error("Botão de IA não encontrado");
                        }
                    }, 500);
                });
            } else {
                console.error("Botão de captura não encontrado");
            }
            
            // Verifica se o botão de IA já existe
            const enhanceBtn = document.getElementById("webcamfoto-enhance");
            if (enhanceBtn) {
                console.log("Botão de IA já existe, configurando evento");
                
                // Adiciona evento de clique se ainda não tiver
                if (!enhanceBtn.hasAttribute("data-event-attached")) {
                    enhanceBtn.setAttribute("data-event-attached", "true");
                    enhanceBtn.addEventListener("click", function() {
                        console.log("Botão de IA clicado");
                        
                        // Chama a função de otimização
                        if (window.WebcamFoto && typeof window.WebcamFoto.enhanceImage === "function") {
                            window.WebcamFoto.enhanceImage(1);
                        } else {
                            console.error("Função enhanceImage não encontrada");
                            alert("Função de otimização por IA não disponível");
                        }
                    });
                }
            }
        }, 1000);
    }
    
    // Observa mudanças no DOM para detectar quando o modal é criado
    function setupObserver() {
        console.log("Configurando observador de DOM");
        
        // Cria um observador de mutações
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // Verifica se novos nós foram adicionados
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    // Verifica se o modal foi adicionado
                    if (document.getElementById("webcamfoto-modal")) {
                        console.log("Modal detectado, configurando botões");
                        setupButtonHandlers();
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
    
    // Inicia o script
    showAIButton();
    setupObserver();
    
    // Tenta novamente após um tempo para garantir
    setTimeout(showAIButton, 2000);
    setTimeout(showAIButton, 5000);
})();
