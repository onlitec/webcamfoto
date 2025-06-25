/**
 * Script de correção para os erros de sintaxe e funcionalidade da IA
 */
(function() {
    "use strict";
    
    console.log("Script fix_ia.js carregado para corrigir erros de sintaxe");
    
    // Função para otimizar imagem
    window.otimizarImagemIA = function(cameraIndex) {
        console.log("Função otimizarImagemIA chamada para câmera", cameraIndex);
        
        if (!window.WebcamFoto) {
            alert("Erro: O módulo WebcamFoto não está disponível");
            return;
        }
        
        // Obtém a imagem capturada
        let imagemCapturada = null;
        if (cameraIndex === 1) {
            imagemCapturada = window.WebcamFoto.capturedImage;
        } else {
            imagemCapturada = window.WebcamFoto.capturedImage2;
        }
        
        if (!imagemCapturada) {
            alert("Erro: Capture uma foto antes de otimizá-la com IA");
            return;
        }
        
        // Cria elemento de mensagem de processamento
        mostrarMensagemProcessamento("Otimizando imagem com IA...");
        
        // Verifica se o ImageEnhancer está disponível
        if (!window.ImageEnhancer) {
            alert("Erro: Módulo de IA não disponível");
            esconderMensagemProcessamento();
            return;
        }
        
        // Inicializa o ImageEnhancer se necessário
        if (!window.ImageEnhancer.initialized) {
            window.ImageEnhancer.init();
        }
        
        // Define callbacks para o progresso e sucesso
        const options = {
            onProgress: function(progressData) {
                const message = progressData.message || 'Processando...';
                const progress = progressData.progress || 0;
                atualizarMensagemProcessamento(message, progress);
            },
            onSuccess: function(enhancedImageData) {
                console.log("Imagem otimizada com sucesso");
                
                // Atualiza a imagem no canvas
                const canvas = document.getElementById(cameraIndex === 1 ? 'webcamfoto-canvas' : 'webcamfoto-canvas-2');
                if (canvas) {
                    const context = canvas.getContext('2d');
                    
                    const img = new Image();
                    img.onload = function() {
                        context.clearRect(0, 0, canvas.width, canvas.height);
                        context.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        // Atualiza as variáveis de imagem
                        if (cameraIndex === 1) {
                            window.WebcamFoto.capturedImage = enhancedImageData;
                            window.WebcamFoto.enhancedImage = enhancedImageData;
                        } else {
                            window.WebcamFoto.capturedImage2 = enhancedImageData;
                            window.WebcamFoto.enhancedImage2 = enhancedImageData;
                        }
                        
                        mostrarMensagemSucesso("Imagem otimizada com sucesso!");
                        esconderMensagemProcessamento();
                    };
                    
                    img.onerror = function() {
                        alert("Erro ao carregar a imagem otimizada");
                        esconderMensagemProcessamento();
                    };
                    
                    img.src = enhancedImageData;
                } else {
                    alert("Erro: Canvas não encontrado");
                    esconderMensagemProcessamento();
                }
            },
            onError: function(error) {
                console.error("Erro ao otimizar imagem:", error);
                alert("Erro ao otimizar imagem: " + error);
                esconderMensagemProcessamento();
            }
        };
        
        // Inicia o processo de aprimoramento
        window.ImageEnhancer.enhance(imagemCapturada, options);
    };
    
    // Funções auxiliares para mensagens de feedback
    function mostrarMensagemProcessamento(mensagem) {
        // Remove qualquer mensagem anterior
        esconderMensagemProcessamento();
        
        // Cria o elemento
        const mensagemEl = document.createElement('div');
        mensagemEl.id = 'fix-processing-message';
        mensagemEl.style.position = 'fixed';
        mensagemEl.style.top = '50%';
        mensagemEl.style.left = '50%';
        mensagemEl.style.transform = 'translate(-50%, -50%)';
        mensagemEl.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        mensagemEl.style.color = 'white';
        mensagemEl.style.padding = '20px';
        mensagemEl.style.borderRadius = '8px';
        mensagemEl.style.zIndex = '9999';
        mensagemEl.style.minWidth = '300px';
        mensagemEl.style.textAlign = 'center';
        
        // Adiciona o spinner
        const spinnerEl = document.createElement('div');
        spinnerEl.style.border = '4px solid rgba(255, 255, 255, 0.3)';
        spinnerEl.style.borderTop = '4px solid white';
        spinnerEl.style.borderRadius = '50%';
        spinnerEl.style.width = '40px';
        spinnerEl.style.height = '40px';
        spinnerEl.style.margin = '0 auto 15px auto';
        spinnerEl.style.animation = 'fix-spin 1s linear infinite';
        mensagemEl.appendChild(spinnerEl);
        
        // Adiciona o estilo de animação
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            @keyframes fix-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styleEl);
        
        // Adiciona o texto
        const textEl = document.createElement('div');
        textEl.className = 'fix-message-text';
        textEl.textContent = mensagem;
        mensagemEl.appendChild(textEl);
        
        // Adiciona a barra de progresso
        const progressContainerEl = document.createElement('div');
        progressContainerEl.style.width = '100%';
        progressContainerEl.style.backgroundColor = '#444';
        progressContainerEl.style.height = '10px';
        progressContainerEl.style.marginTop = '15px';
        progressContainerEl.style.borderRadius = '5px';
        progressContainerEl.style.overflow = 'hidden';
        
        const progressBarEl = document.createElement('div');
        progressBarEl.id = 'fix-progress-bar';
        progressBarEl.style.height = '100%';
        progressBarEl.style.width = '0%';
        progressBarEl.style.backgroundColor = '#4CAF50';
        progressBarEl.style.transition = 'width 0.3s ease';
        
        progressContainerEl.appendChild(progressBarEl);
        mensagemEl.appendChild(progressContainerEl);
        
        // Adiciona ao DOM
        document.body.appendChild(mensagemEl);
    }
    
    function atualizarMensagemProcessamento(mensagem, progresso) {
        const mensagemEl = document.getElementById('fix-processing-message');
        if (mensagemEl) {
            const textEl = mensagemEl.querySelector('.fix-message-text');
            if (textEl) {
                textEl.textContent = mensagem;
            }
            
            const progressBarEl = document.getElementById('fix-progress-bar');
            if (progressBarEl) {
                progressBarEl.style.width = progresso + '%';
            }
        }
    }
    
    function esconderMensagemProcessamento() {
        const mensagemEl = document.getElementById('fix-processing-message');
        if (mensagemEl) {
            document.body.removeChild(mensagemEl);
        }
    }
    
    function mostrarMensagemSucesso(mensagem) {
        const successEl = document.getElementById('webcamfoto-success-message');
        if (successEl) {
            successEl.textContent = mensagem;
            successEl.style.display = 'block';
        } else {
            // Cria uma mensagem de sucesso flutuante
            const mensagemEl = document.createElement('div');
            mensagemEl.textContent = mensagem;
            mensagemEl.style.position = 'fixed';
            mensagemEl.style.top = '10px';
            mensagemEl.style.left = '50%';
            mensagemEl.style.transform = 'translateX(-50%)';
            mensagemEl.style.backgroundColor = '#00AB55';
            mensagemEl.style.color = 'white';
            mensagemEl.style.padding = '10px 20px';
            mensagemEl.style.borderRadius = '5px';
            mensagemEl.style.zIndex = '9999';
            document.body.appendChild(mensagemEl);
            
            // Remove após 3 segundos
            setTimeout(function() {
                document.body.removeChild(mensagemEl);
            }, 3000);
        }
    }
    
    // Função para criar botões de IA caso não existam
    function criarBotoesIA() {
        console.log("Criando botões de IA se necessário");
        
        // Verifica se o botão principal de IA existe
        let enhanceBtn = document.getElementById('webcamfoto-enhance');
        
        if (!enhanceBtn) {
            console.log("Botão de IA principal não encontrado, verificando modal");
            
            // Verifica se o modal existe
            const modal = document.getElementById('webcamfoto-modal');
            if (!modal) {
                console.log("Modal não encontrado, aguardando criação");
                return;
            }
            
            // Verifica se o footer do modal existe
            const footer = modal.querySelector('.webcamfoto-modal-footer');
            if (!footer) {
                console.log("Footer do modal não encontrado");
                return;
            }
            
            // Cria o botão de IA
            enhanceBtn = document.createElement('button');
            enhanceBtn.id = 'webcamfoto-enhance';
            enhanceBtn.className = 'button butAction webcamfoto-button-purple';
            enhanceBtn.textContent = 'Otimizar com IA';
            enhanceBtn.style.display = 'none'; // Inicialmente oculto
            
            // Adiciona o botão ao footer
            footer.appendChild(enhanceBtn);
            console.log("Botão de IA criado e adicionado ao modal");
        }
        
        // Conecta o botão à função de otimização
        conectarBotoesIA();
    }
    
    // Conecta os botões de IA à nova função
    function conectarBotoesIA() {
        console.log("Conectando botões de IA às funções");
        
        // Botão principal
        const enhanceBtn = document.getElementById('webcamfoto-enhance');
        if (enhanceBtn && !enhanceBtn.hasAttribute('data-event-attached')) {
            enhanceBtn.setAttribute('data-event-attached', 'true');
            enhanceBtn.addEventListener('click', function() {
                console.log("Botão de IA clicado");
                if (window.WebcamFoto && typeof window.WebcamFoto.enhanceImage === 'function') {
                    window.WebcamFoto.enhanceImage(1);
                } else if (window.otimizarImagemIA) {
                    window.otimizarImagemIA(1);
                } else {
                    alert("Função de otimização por IA não disponível");
                }
            });
            console.log("Evento de clique adicionado ao botão de IA");
        }
        
        // Observa mudanças no DOM para detectar quando a foto é capturada
        observarCapturaFoto();
    }
    
    // Observa mudanças no DOM para detectar quando a foto é capturada
    function observarCapturaFoto() {
        console.log("Configurando observador para captura de foto");
        
        // Verifica se o botão de captura existe
        const captureBtn = document.getElementById('webcamfoto-capture');
        if (captureBtn) {
            console.log("Botão de captura encontrado, adicionando evento");
            
            // Adiciona evento ao botão de captura
            captureBtn.addEventListener('click', function() {
                console.log("Botão de captura clicado, verificando botão de IA");
                
                // Espera um momento para garantir que a captura foi concluída
                setTimeout(function() {
                    const enhanceBtn = document.getElementById('webcamfoto-enhance');
                    if (enhanceBtn) {
                        // Verifica se o módulo de IA está disponível
                        if (window.ImageEnhancer && window.ImageEnhancer.hasSettings && window.ImageEnhancer.hasSettings()) {
                            enhanceBtn.style.display = 'inline-block';
                            console.log("Botão de IA exibido após captura");
                        } else {
                            console.log("Módulo de IA não disponível, botão permanece oculto");
                        }
                    }
                }, 500);
            });
        }
    }
    
    // Observer para monitorar mudanças no DOM
    function configurarObserver() {
        const observer = new MutationObserver(function(mutations) {
            let precisaAtualizar = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (let i = 0; i < mutation.addedNodes.length; i++) {
                        const node = mutation.addedNodes[i];
                        if (node.nodeType === 1 && (
                            node.tagName === 'BUTTON' || 
                            node.classList && node.classList.contains('webcam-controls') ||
                            node.querySelector('button')
                        )) {
                            precisaAtualizar = true;
                            break;
                        }
                    }
                }
            });
            
            if (precisaAtualizar) {
                setTimeout(function() {
                    criarBotoesIA();
                }, 200);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log("Observer configurado para monitorar mudanças no DOM");
    }
    
    // Inicializa o script
    function inicializar() {
        console.log("Inicializando script fix_ia.js");
        
        setTimeout(function() {
            criarBotoesIA();
            configurarObserver();
        }, 1000);
        
        // Também tenta novamente após um tempo maior
        setTimeout(function() {
            criarBotoesIA();
        }, 3000);
    }
    
    // Inicia quando o DOM estiver carregado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        inicializar();
    }
})();
