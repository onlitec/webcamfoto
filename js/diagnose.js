/**
 * Script de diagnóstico para identificar problemas com os botões de IA
 */
(function() {
    "use strict";
    
    console.log("Script de diagnóstico carregado");
    
    // Função que examina o DOM e adiciona botões de IA
    function injetarBotoesIA() {
        console.log("Injetando botões de IA diretamente...");
        
        // Adiciona estilo para o botão roxo
        const style = document.createElement('style');
        style.textContent = `
            .button.butAction.ia-button {
                background-color: #8a2be2 !important;
                color: white !important;
                margin: 2px !important;
            }
            .button.butAction.ia-button:hover {
                background-color: #7a1dd2 !important;
            }
        `;
        document.head.appendChild(style);
        
        // Encontra todos os botões SALVAR no modal da webcam
        const botoesGravar = document.querySelectorAll('.webcamfoto-modal button');
        console.log("Botões encontrados na modal:", botoesGravar.length);
        
        // Adiciona botões após cada botão SALVAR
        botoesGravar.forEach((botao, index) => {
            console.log(`Botão ${index}:`, botao.textContent, botao.id, botao.className);
            
            // Se for um botão SALVAR
            if (botao.textContent.trim().toUpperCase() === "SALVAR") {
                console.log("Botão SALVAR encontrado, adicionando botão IA após ele");
                
                // Verifica se já existe um botão de IA
                const proximoElemento = botao.nextElementSibling;
                if (proximoElemento && proximoElemento.textContent.includes("IA")) {
                    console.log("Botão de IA já existe, não é necessário adicionar");
                    return;
                }
                
                // Cria o botão IA
                const botaoIA = document.createElement('button');
                botaoIA.textContent = "OTIMIZAR IA";
                botaoIA.className = "button butAction ia-button";
                botaoIA.style.marginLeft = "5px";
                
                // Adiciona evento de clique
                botaoIA.addEventListener('click', function() {
                    console.log("Botão de IA da câmera 1 clicado");
                    
                    // Feedback visual imediato - altera o texto e cor do botão
                    const textoOriginal = botaoIA.textContent;
                    const corOriginal = botaoIA.style.backgroundColor;
                    botaoIA.textContent = "PROCESSANDO...";
                    botaoIA.style.backgroundColor = "#ff9900";
                    botaoIA.disabled = true;
                    
                    // Exibe um alerta visual na interface
                    const mensagemDiv = document.createElement('div');
                    mensagemDiv.className = 'alert-message';
                    mensagemDiv.style.position = 'fixed';
                    mensagemDiv.style.top = '20%';
                    mensagemDiv.style.left = '50%';
                    mensagemDiv.style.transform = 'translate(-50%, -50%)';
                    mensagemDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                    mensagemDiv.style.color = 'white';
                    mensagemDiv.style.padding = '20px';
                    mensagemDiv.style.borderRadius = '8px';
                    mensagemDiv.style.zIndex = '9999';
                    mensagemDiv.textContent = 'Otimizando imagem com IA... Por favor aguarde.';
                    document.body.appendChild(mensagemDiv);
                    
                    setTimeout(function() {
                        // Remove a mensagem após alguns segundos
                        document.body.removeChild(mensagemDiv);
                    }, 5000);
                    
                    if (window.WebcamFoto && typeof window.WebcamFoto.enhanceImage === 'function') {
                        // Determina o índice da câmera
                        let cameraIndex = 1;
                        const parentDiv = botao.closest('.webcam-column');
                        if (parentDiv && parentDiv.id === 'webcam-column-2') {
                            cameraIndex = 2;
                        } else if (botao.id.includes('2')) {
                            cameraIndex = 2;
                        }
                        
                        console.log("Chamando enhanceImage para câmera", cameraIndex);
                        
                        // Restaura o botão após um tempo, mesmo se houver erro
                        setTimeout(function() {
                            botaoIA.textContent = textoOriginal;
                            botaoIA.style.backgroundColor = corOriginal || '#8a2be2';
                            botaoIA.disabled = false;
                        }, 10000);
                        
                        window.WebcamFoto.enhanceImage(cameraIndex);
                    } else {
                        console.error("Método enhanceImage não disponível");
                        alert("Função de otimização por IA não disponível");
                        
                        // Restaura o botão imediatamente se houver erro
                        botaoIA.textContent = textoOriginal;
                        botaoIA.style.backgroundColor = corOriginal || '#8a2be2';
                        botaoIA.disabled = false;
                    }
                });
                
                // Insere após o botão SALVAR
                botao.parentNode.insertBefore(botaoIA, botao.nextSibling);
                console.log("Botão de IA adicionado com sucesso após o botão SALVAR");
            }
        });
    }
    
    // Função para observar mudanças no DOM
    function observarDOM() {
        console.log("Configurando observador do DOM");
        
        const observer = new MutationObserver(function(mutations) {
            let precisaInjetar = false;
            
            mutations.forEach(function(mutation) {
                // Se novos nós foram adicionados
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    for (let i = 0; i < mutation.addedNodes.length; i++) {
                        const node = mutation.addedNodes[i];
                        
                        // Se for um elemento e for parte do modal da webcam
                        if (node.nodeType === 1 && 
                            (node.classList && 
                             (node.classList.contains('webcamfoto-modal') || 
                              node.classList.contains('webcam-controls') ||
                              node.classList.contains('webcamfoto-modal-body')))) {
                            precisaInjetar = true;
                            break;
                        }
                    }
                }
                
                // Se atributos mudaram e são relevantes
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'style' && 
                    mutation.target.id && 
                    (mutation.target.id.includes('save') || 
                     mutation.target.id.includes('retake'))) {
                    precisaInjetar = true;
                }
            });
            
            if (precisaInjetar) {
                console.log("Mudança relevante detectada no DOM");
                setTimeout(injetarBotoesIA, 200);
            }
        });
        
        // Observa o documento inteiro para mudanças
        observer.observe(document.body, { 
            childList: true, 
            subtree: true, 
            attributes: true,
            attributeFilter: ['style', 'class', 'id']
        });
        
        console.log("Observador do DOM configurado com sucesso");
    }
    
    // Função para inicialização
    function inicializar() {
        console.log("Inicializando script de diagnóstico");
        
        // Observa mudanças no DOM
        observarDOM();
        
        // Também configura um timer para verificar periodicamente
        setInterval(injetarBotoesIA, 2000);
        
        // E tenta injetar imediatamente
        setTimeout(injetarBotoesIA, 1000);
        setTimeout(injetarBotoesIA, 3000);
        
        // Adiciona listener de clique para captura
        document.addEventListener('click', function(event) {
            if (event.target && 
                (event.target.id.includes('capture') || 
                 event.target.textContent.includes('CAPTURAR'))) {
                console.log("Botão de captura clicado:", event.target);
                setTimeout(injetarBotoesIA, 500);
            }
        }, true);
        
        console.log("Script de diagnóstico inicializado com sucesso");
    }
    
    // Inicializa quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        inicializar();
    }
    
})();
