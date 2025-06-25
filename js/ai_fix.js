/**
 * Script de correção para o botão de IA do WebcamFoto
 * 
 * Este script corrige problemas de funcionamento do botão OTIMIZAR COM IA
 * e garante que as imagens permaneçam visíveis após o salvamento
 * 
 * @author     Webcamfoto Module
 * @copyright  2025 Webcamfoto Module
 * @license    GNU GPLv3
 */

(function() {
    "use strict";
    
    console.log("Script AI_FIX carregado - corrigindo problemas de IA");
    
    // Função para iniciar a otimização de imagem usando IA
    function iniciarOtimizacaoIA(cameraIndex) {
        console.log("Iniciando otimização por IA para câmera", cameraIndex);
        
        // Mostra mensagem de processamento
        exibirMensagemProcessamento('Processando imagem com IA... Por favor aguarde.');
        
        // Verifica se o objeto WebcamFoto existe
        if (!window.WebcamFoto) {
            console.error("WebcamFoto não disponível");
            exibirMensagemErro("Erro: Módulo WebcamFoto não disponível");
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
            console.error("Nenhuma imagem capturada para otimizar");
            exibirMensagemErro("Erro: Capture uma foto antes de otimizá-la com IA");
            return;
        }
        
        // Verifica se o ImageEnhancer está disponível
        if (!window.ImageEnhancer) {
            console.error("ImageEnhancer não disponível");
            exibirMensagemErro("Erro: Módulo de IA não disponível");
            return;
        }
        
        // Configura o ImageEnhancer se não estiver inicializado
        if (!window.WebcamFoto.imageEnhancer) {
            window.WebcamFoto.imageEnhancer = window.ImageEnhancer;
            window.WebcamFoto.imageEnhancer.init();
        }
        
        // Verifica se as configurações da IA estão disponíveis
        if (!window.WebcamFoto.imageEnhancer.hasSettings || 
            !window.WebcamFoto.imageEnhancer.hasSettings()) {
            console.error("Configurações de IA não disponíveis");
            exibirMensagemErro("Erro: Configure o módulo de IA no menu Administração > Módulos > IA");
            return;
        }
        
        // Define callbacks para o progresso e sucesso da otimização
        const options = {
            onProgress: function(progressData) {
                const mensagem = progressData.message || 'Processando...';
                const progresso = progressData.progress || 0;
                atualizarProgressoProcessamento(mensagem, progresso);
            },
            onSuccess: function(imagemOtimizada) {
                console.log("Imagem otimizada com sucesso");
                aplicarImagemOtimizada(cameraIndex, imagemOtimizada);
                esconderMensagemProcessamento();
            },
            onError: function(erro) {
                console.error("Erro ao otimizar imagem:", erro);
                exibirMensagemErro("Erro ao otimizar imagem: " + erro);
                esconderMensagemProcessamento();
            }
        };
        
        // Chama o método enhance do ImageEnhancer
        window.WebcamFoto.imageEnhancer.enhance(imagemCapturada, options);
    }
    
    // Aplica a imagem otimizada ao canvas
    function aplicarImagemOtimizada(cameraIndex, imagemOtimizada) {
        // Substitui a imagem original pela otimizada
        if (cameraIndex === 1) {
            window.WebcamFoto.capturedImage = imagemOtimizada;
            window.WebcamFoto.enhancedImage = imagemOtimizada;
        } else {
            window.WebcamFoto.capturedImage2 = imagemOtimizada;
            window.WebcamFoto.enhancedImage2 = imagemOtimizada;
        }
        
        // Exibe a imagem otimizada no canvas
        const canvasId = cameraIndex === 1 ? 'webcamfoto-canvas' : 'webcamfoto-canvas-2';
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error("Canvas não encontrado:", canvasId);
            return;
        }
        
        const context = canvas.getContext('2d');
        
        // Carrega a nova imagem no canvas
        const img = new Image();
        img.onload = function() {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
            exibirMensagemSucesso('Imagem otimizada com sucesso!');
        };
        img.onerror = function() {
            console.error("Erro ao carregar imagem otimizada");
            exibirMensagemErro("Erro ao carregar imagem otimizada");
        };
        img.src = imagemOtimizada;
    }
    
    // Funções para mensagens de feedback
    function exibirMensagemProcessamento(mensagem) {
        // Verifica se já existe uma mensagem de processamento
        let divProcessamento = document.getElementById('ai-processing-message');
        if (!divProcessamento) {
            divProcessamento = document.createElement('div');
            divProcessamento.id = 'ai-processing-message';
            divProcessamento.style.position = 'fixed';
            divProcessamento.style.top = '20%';
            divProcessamento.style.left = '50%';
            divProcessamento.style.transform = 'translate(-50%, -50%)';
            divProcessamento.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            divProcessamento.style.color = 'white';
            divProcessamento.style.padding = '20px';
            divProcessamento.style.borderRadius = '8px';
            divProcessamento.style.zIndex = '9999';
            divProcessamento.style.textAlign = 'center';
            divProcessamento.style.minWidth = '300px';
            
            // Adiciona o spinner
            const spinner = document.createElement('div');
            spinner.className = 'ai-spinner';
            spinner.style.border = '5px solid rgba(255, 255, 255, 0.3)';
            spinner.style.borderRadius = '50%';
            spinner.style.borderTop = '5px solid #fff';
            spinner.style.width = '40px';
            spinner.style.height = '40px';
            spinner.style.margin = '0 auto 15px auto';
            spinner.style.animation = 'ai-spin 1s linear infinite';
            divProcessamento.appendChild(spinner);
            
            // Adiciona a mensagem
            const mensagemEl = document.createElement('div');
            mensagemEl.className = 'ai-message';
            mensagemEl.textContent = mensagem;
            divProcessamento.appendChild(mensagemEl);
            
            // Adiciona barra de progresso
            const progressoContainer = document.createElement('div');
            progressoContainer.className = 'ai-progress-container';
            progressoContainer.style.width = '100%';
            progressoContainer.style.backgroundColor = '#444';
            progressoContainer.style.borderRadius = '5px';
            progressoContainer.style.marginTop = '10px';
            progressoContainer.style.height = '10px';
            
            const progressoBar = document.createElement('div');
            progressoBar.className = 'ai-progress-bar';
            progressoBar.style.width = '0%';
            progressoBar.style.height = '100%';
            progressoBar.style.backgroundColor = '#4CAF50';
            progressoBar.style.borderRadius = '5px';
            progressoBar.style.transition = 'width 0.3s ease';
            
            progressoContainer.appendChild(progressoBar);
            divProcessamento.appendChild(progressoContainer);
            
            // Adiciona a animação de spin
            const style = document.createElement('style');
            style.textContent = `
                @keyframes ai-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
            
            document.body.appendChild(divProcessamento);
        } else {
            // Atualiza a mensagem existente
            const mensagemEl = divProcessamento.querySelector('.ai-message');
            if (mensagemEl) {
                mensagemEl.textContent = mensagem;
            }
        }
    }
    
    function atualizarProgressoProcessamento(mensagem, progresso) {
        const divProcessamento = document.getElementById('ai-processing-message');
        if (divProcessamento) {
            // Atualiza a mensagem
            const mensagemEl = divProcessamento.querySelector('.ai-message');
            if (mensagemEl) {
                mensagemEl.textContent = mensagem;
            }
            
            // Atualiza a barra de progresso
            const progressoBar = divProcessamento.querySelector('.ai-progress-bar');
            if (progressoBar) {
                progressoBar.style.width = progresso + '%';
            }
        }
    }
    
    function esconderMensagemProcessamento() {
        const divProcessamento = document.getElementById('ai-processing-message');
        if (divProcessamento) {
            document.body.removeChild(divProcessamento);
        }
    }
    
    function exibirMensagemSucesso(mensagem) {
        // Exibe mensagem de sucesso na interface do WebcamFoto
        const successEl = document.getElementById('webcamfoto-success-message');
        if (successEl) {
            successEl.textContent = mensagem;
            successEl.style.display = 'block';
            
            // Esconde a mensagem de erro se estiver visível
            const errorEl = document.getElementById('webcamfoto-error');
            if (errorEl) {
                errorEl.style.display = 'none';
            }
        } else {
            // Fallback para alert se o elemento não for encontrado
            alert(mensagem);
        }
    }
    
    function exibirMensagemErro(mensagem) {
        // Exibe mensagem de erro na interface do WebcamFoto
        const errorEl = document.getElementById('webcamfoto-error');
        if (errorEl) {
            errorEl.textContent = mensagem;
            errorEl.style.display = 'block';
            
            // Esconde a mensagem de sucesso se estiver visível
            const successEl = document.getElementById('webcamfoto-success-message');
            if (successEl) {
                successEl.style.display = 'none';
            }
        } else {
            // Fallback para alert se o elemento não for encontrado
            alert("Erro: " + mensagem);
        }
    }
    
    // Função para corrigir o problema dos botões que não funcionam
    function corrigirBotoesIA() {
        console.log("Corrigindo botões de IA...");
        
        // Procura por todos os botões de otimização com IA
        const botoes = document.querySelectorAll('button');
        
        botoes.forEach(function(botao) {
            // Se o texto do botão contém "OTIMIZAR" e "IA"
            if (botao.textContent.includes('OTIMIZAR') && botao.textContent.includes('IA')) {
                console.log("Encontrado botão de IA:", botao.textContent, botao.id);
                
                // Evita adicionar múltiplos listeners
                botao.removeEventListener('click', botao._aiFixer);
                
                // Adiciona um novo evento de clique
                botao._aiFixer = function() {
                    console.log("Botão de IA clicado:", botao.textContent);
                    
                    // Determina o índice da câmera
                    let cameraIndex = 1;
                    const parentDiv = botao.closest('.webcam-column, [id^="webcam-column"]');
                    
                    if (parentDiv) {
                        if (parentDiv.id === 'webcam-column-2') {
                            cameraIndex = 2;
                        }
                    } else if (botao.id && botao.id.includes('2')) {
                        cameraIndex = 2;
                    }
                    
                    // Inicia a otimização
                    iniciarOtimizacaoIA(cameraIndex);
                };
                
                botao.addEventListener('click', botao._aiFixer);
                console.log("Listener adicionado ao botão de IA");
            }
        });
    }
    
    // Observer para monitorar mudanças no DOM e corrigir os botões quando necessário
    function configurarObserver() {
        console.log("Configurando observer para mudanças no DOM");
        
        const observer = new MutationObserver(function(mutations) {
            let precisaCorrigir = false;
            
            mutations.forEach(function(mutation) {
                // Se novos nós foram adicionados
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    for (let i = 0; i < mutation.addedNodes.length; i++) {
                        const node = mutation.addedNodes[i];
                        
                        // Se for um elemento
                        if (node.nodeType === 1) {
                            // Se for um botão ou contém botões
                            if (node.tagName === 'BUTTON' || node.querySelector('button')) {
                                precisaCorrigir = true;
                            }
                        }
                    }
                }
            });
            
            if (precisaCorrigir) {
                setTimeout(corrigirBotoesIA, 100);
            }
        });
        
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
        
        console.log("Observer configurado com sucesso");
    }
    
    // Corrige os botões inicialmente e configura o observer
    function inicializar() {
        console.log("Inicializando AI_FIX...");
        
        // Corrige os botões existentes
        setTimeout(corrigirBotoesIA, 1000);
        setTimeout(corrigirBotoesIA, 3000);
        
        // Configura o observer para mudanças futuras
        configurarObserver();
        
        // Detecta cliques em qualquer lugar do documento
        document.addEventListener('click', function(event) {
            // Após qualquer clique, verifica se os botões precisam ser corrigidos
            setTimeout(corrigirBotoesIA, 500);
        });
        
        console.log("AI_FIX inicializado com sucesso");
    }
    
    // Inicia o script
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        inicializar();
    }
    
})();
