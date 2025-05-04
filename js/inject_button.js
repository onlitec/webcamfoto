/**
 * Script para injetar diretamente o botão de Webcam na página de produto
 * Este arquivo é independente do sistema de hooks do Dolibarr
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Webcamfoto: Script de injeção de botão iniciado');
    
    // Verifica se estamos na página de produto
    if (window.location.href.indexOf('/product/card.php') === -1) {
        console.log('Webcamfoto: Não estamos na página de produto');
        return;
    }
    
    // Tenta adicionar o botão imediatamente e também após atrasos
    injectButton();
    setTimeout(injectButton, 500);
    setTimeout(injectButton, 1000);
    setTimeout(injectButton, 2000);
    
    /**
     * Injeta o botão na página
     */
    function injectButton() {
        console.log('Webcamfoto: Tentando injetar botão...');
        
        // Verifica se o botão já existe
        if (document.getElementById('webcamfoto-button')) {
            console.log('Webcamfoto: Botão já existe');
            return;
        }
        
        // Busca a barra de ações
        const tabsAction = document.querySelector('.tabsAction');
        if (!tabsAction) {
            console.log('Webcamfoto: Barra de ações não encontrada');
            return;
        }
        
        // Obtém o ID do produto da URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (!productId) {
            console.log('Webcamfoto: ID do produto não encontrado');
            return;
        }
        
        // Adiciona um div para instruções
        if (!document.getElementById('webcamfoto-instructions')) {
            const instructions = document.createElement('div');
            instructions.id = 'webcamfoto-instructions';
            instructions.style.margin = '10px 0';
            instructions.style.padding = '10px';
            instructions.style.backgroundColor = '#f8f9fa';
            instructions.style.border = '1px solid #ddd';
            instructions.style.borderRadius = '4px';
            instructions.style.display = 'none';
            instructions.innerHTML = `
                <p><strong>Instruções para usar a captura em outro monitor:</strong></p>
                <ol>
                    <li>Clique no botão "Capturar Foto (Janela Separada)"</li>
                    <li>Uma nova janela do navegador será aberta</li>
                    <li>Você pode arrastar essa janela para qualquer monitor</li>
                    <li>Informe o ID do produto (${productId}) na página que abrir</li>
                </ol>
                <p><em>Esta versão foi criada especialmente para permitir o uso em monitores separados.</em></p>
            `;
            
            const container = document.querySelector('.fiche');
            if (container) {
                container.insertBefore(instructions, container.firstChild);
            }
        }
        
        // Cria o botão como um link normal
        const button = document.createElement('a');
        button.id = 'webcamfoto-button';
        button.className = 'butAction';
        
        // Para a versão standalone, abrimos a página HTML diretamente
        const basePath = window.location.pathname.substring(0, window.location.pathname.indexOf('/product/'));
        const webcamPageUrl = basePath + '/custom/webcamfoto/capture_standalone.html?id=' + productId;
        
        button.href = webcamPageUrl;
        button.target = '_blank'; // Abre em nova aba
        button.innerHTML = '<i class="fa fa-camera"></i> Capturar Foto (Janela Separada)';
        button.style.marginLeft = '5px';
        
        // Adiciona dica explicativa
        button.title = 'Abre a página de captura de fotos em uma nova janela que pode ser movida para outro monitor';
        
        // Adiciona evento de mouseover para mostrar instruções
        button.addEventListener('mouseover', function() {
            const instructions = document.getElementById('webcamfoto-instructions');
            if (instructions) {
                instructions.style.display = 'block';
            }
        });
        
        // Adiciona evento de clique para garantir que a janela abra corretamente
        button.addEventListener('click', function(e) {
            // Não previne o comportamento padrão para permitir abrir o link
            
            // Cria a janela manualmente para garantir que é uma nova janela
            const newWindow = window.open(webcamPageUrl, '_blank', 'width=1200,height=700,left=100,top=100');
            
            // Se conseguiu abrir a janela, cancela o clique no link
            if (newWindow) {
                e.preventDefault();
                
                // Tenta forçar o foco na nova janela
                newWindow.focus();
            }
        });
        
        // Adiciona o botão à barra de ações
        tabsAction.appendChild(button);
        console.log('Webcamfoto: Botão injetado com sucesso');
    }
});
