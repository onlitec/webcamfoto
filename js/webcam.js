/**
 * Módulo Webcamfoto para Dolibarr
 * JavaScript para manipulação da webcam e captura de fotos
 *
 * @author     Webcamfoto Module
 * @copyright  2025 Webcamfoto Module
 * @license    GNU GPLv3
 */

(function() {
    "use strict";

    /**
     * Classe para manipulação da webcam e captura de fotos
     */
    class WebcamFoto {
        /**
         * Construtor
         */
        constructor() {
            this.initialized = false;
            this.productId = null;
            this.modalElement = null;
            this.video = null;
            this.video2 = null; // Segunda webcam
            this.videoStreams = [null, null]; // Streams para ambas webcams
            this.selectedCameras = [null, null]; // Câmeras selecionadas
            this.cameraOptions = [[], []]; // Opções de câmeras disponíveis
            this.videoContainers = [null, null]; // Containers para os vídeos
            this.canvasContainers = [null, null]; // Containers para os canvas
            this.canvas = null;
            this.canvas2 = null; // Segundo canvas
            this.videoContainer = null;
            this.canvasContainer = null;
            this.capturedImage = null;
            this.capturedImage2 = null; // Segunda imagem capturada
            this.width = 640;
            this.height = 480;
            this.modulePath = null;
            this.needsReload = false;
            this.dualCameraMode = false; // Indica se estamos usando duas câmeras
        }

        /**
         * Inicializa o objeto
         * @param {number} productId - ID do produto
         */
        init(productId) {
            if (this.initialized && this.productId) return;
            
            this.productId = productId || this.getProductIdFromUrl();
            this.createModal();
            this.attachEvents();
            this.initialized = true;
            
            // Determina o caminho base do módulo com base na localização do script atual
            this.modulePath = this.getModulePath();
            
            console.log("WebcamFoto inicializado para o produto ID: " + this.productId);
        }
        
        /**
         * Determina o caminho base do módulo
         * @returns {string} Caminho base do módulo
         */
        getModulePath() {
            // Tenta obter o caminho base do módulo a partir da URL atual
            const currentPath = window.location.pathname;
            const dolibarrIndex = currentPath.indexOf('/dolibarr');
            
            // Se não encontrou 'dolibarr' na URL, tenta outro método
            if (dolibarrIndex === -1) {
                // Tenta usar a URL do script atual
                const scripts = document.getElementsByTagName('script');
                for (let i = 0; i < scripts.length; i++) {
                    const src = scripts[i].src;
                    if (src.includes('webcamfoto/js/webcam.js')) {
                        // Remove o nome do arquivo JS para obter o caminho base
                        return src.substring(0, src.lastIndexOf('/js/webcam.js'));
                    }
                }
                // Fallback para um caminho relativo se nenhum método funcionar
                return './custom/webcamfoto';
            }
            
            // Se encontrou 'dolibarr' na URL, usa como base
            const basePath = currentPath.substring(0, dolibarrIndex + 9); // +9 para incluir '/dolibarr'
            return basePath + '/htdocs/custom/webcamfoto';
        }

        /**
         * Cria o modal para exibir a webcam
         */
        createModal() {
            // Verifica se o modal já existe
            if (document.getElementById('webcamfoto-modal')) {
                this.modalElement = document.getElementById('webcamfoto-modal');
                return;
            }

            // Adiciona folha de estilo específica para os botões e modal
            if (!document.getElementById('webcamfoto-button-styles')) {
                const modalStyles = document.createElement('style');
                modalStyles.id = 'webcamfoto-button-styles';
                modalStyles.innerHTML = `
                    /* Estilos dos botões */
                    .webcamfoto-button-blue {
                        background-color: #2C7BE5 !important;
                        background-image: none !important;
                        color: white !important;
                        border: 1px solid #2C7BE5 !important;
                    }
                    .webcamfoto-button-blue:hover {
                        background-color: #1A56A0 !important;
                        background-image: none !important;
                    }
                    .webcamfoto-button-red {
                        background-color: #E63757 !important;
                        background-image: none !important;
                        color: white !important;
                        border: 1px solid #E63757 !important;
                    }
                    .webcamfoto-button-red:hover {
                        background-color: #C11F3B !important;
                        background-image: none !important;
                    }
                    .webcamfoto-button-yellow {
                        background-color: #F6C23E !important;
                        background-image: none !important;
                        color: white !important;
                        border: 1px solid #F6C23E !important;
                    }
                    .webcamfoto-button-yellow:hover {
                        background-color: #D4A012 !important;
                        background-image: none !important;
                    }
                    .webcamfoto-button-green {
                        background-color: #00AB55 !important;
                        background-image: none !important;
                        color: white !important;
                        border: 1px solid #00AB55 !important;
                    }
                    .webcamfoto-button-green:hover {
                        background-color: #007B3D !important;
                        background-image: none !important;
                    }
                    .webcamfoto-button-purple {
                        background-color: #6f42c1 !important;
                        background-image: none !important;
                        color: white !important;
                        border: 1px solid #6f42c1 !important;
                    }
                    .webcamfoto-button-purple:hover {
                        background-color: #5a32a3 !important;
                        background-image: none !important;
                    }
                    
                    /* Estilos do modal e controles */
                    .webcamfoto-modal {
                        display: none;
                        position: fixed;
                        z-index: 9999;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        overflow: auto;
                        background-color: rgba(0,0,0,0.5);
                    }
                    
                    .webcamfoto-modal-content {
                        position: absolute;
                        background-color: #fefefe;
                        margin: 50px auto;
                        padding: 0;
                        border: 1px solid #888;
                        width: 1000px;
                        max-width: 95%;
                        box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
                        resize: both;
                        overflow: auto;
                        min-width: 800px;
                        min-height: 500px;
                        left: 50%;
                        top: 50px;
                        transform: translateX(-50%);
                        border-radius: 5px;
                    }
                    
                    .webcamfoto-modal-header {
                        padding: 10px 16px;
                        background-color: #f8f9fa;
                        border-bottom: 1px solid #ddd;
                        cursor: move;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        user-select: none;
                    }
                    
                    .webcamfoto-modal-title {
                        margin: 0;
                        display: inline-block;
                    }
                    
                    .webcamfoto-modal-controls {
                        display: flex;
                        gap: 10px;
                    }
                    
                    .webcamfoto-control-btn {
                        background: none;
                        border: none;
                        font-size: 18px;
                        cursor: pointer;
                        width: 24px;
                        height: 24px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 4px;
                    }
                    
                    .webcamfoto-control-btn:hover {
                        background-color: rgba(0,0,0,0.1);
                    }
                    
                    .webcamfoto-minimize {
                        color: #555;
                    }
                    
                    .webcamfoto-maximize {
                        color: #555;
                    }
                    
                    .webcamfoto-close {
                        color: #E63757;
                    }
                    
                    .webcamfoto-modal-body {
                        padding: 10px;
                        overflow: hidden;
                        height: calc(100% - 110px);
                    }
                    
                    .webcamfoto-modal-footer {
                        padding: 10px;
                        background-color: #f8f9fa;
                        border-top: 1px solid #ddd;
                        text-align: right;
                    }

                    /* Novo estilo para a mensagem de sucesso */
                    .webcamfoto-success-message {
                        background-color: #00AB55;
                        color: white;
                        padding: 10px;
                        border-radius: 4px;
                        text-align: center;
                        margin-bottom: 10px;
                        display: none;
                        font-weight: bold;
                    }

                    /* Novo estilo para a mensagem de erro */
                    .webcamfoto-error {
                        background-color: #E63757;
                        color: white;
                        padding: 10px;
                        border-radius: 4px;
                        text-align: center;
                        margin-bottom: 10px;
                        display: none;
                        font-weight: bold;
                    }
                    
                    /* Layout para duas webcams lado a lado */
                    .webcam-container {
                        display: flex;
                        justify-content: space-between;
                        height: 100%;
                    }
                    
                    .webcam-column {
                        width: 49%;
                        display: flex;
                        flex-direction: column;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        padding: 5px;
                        position: relative;
                    }
                    
                    .webcam-title {
                        text-align: center;
                        font-weight: bold;
                        margin-bottom: 5px;
                        padding: 5px;
                        background-color: #f8f9fa;
                        border-radius: 4px;
                    }
                    
                    .webcam-controls {
                        display: flex;
                        justify-content: center;
                        margin-top: 5px;
                        gap: 5px;
                    }
                    
                    /* Para garantir que o vídeo e o canvas se ajustem ao tamanho do container */
                    .webcamfoto-video-container, .webcamfoto-canvas-container {
                        flex: 1;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                        background-color: #f0f0f0;
                        border-radius: 4px;
                    }
                    
                    .webcamfoto-video, .webcamfoto-canvas {
                        max-width: 100%;
                        max-height: 100%;
                        object-fit: contain;
                    }
                    
                    /* Select para seleção de câmeras */
                    .camera-select {
                        width: 100%;
                        margin-bottom: 5px;
                        padding: 5px;
                    }
                    
                    /* Botão principal para capturar ambas as câmeras */
                    .webcamfoto-capture-both {
                        margin-top: 10px;
                        width: 100%;
                        padding: 10px;
                    }
                    
                    /* Classe para modal minimizado */
                    .webcamfoto-modal-minimized .webcamfoto-modal-body,
                    .webcamfoto-modal-minimized .webcamfoto-modal-footer {
                        display: none;
                    }
                    
                    .webcamfoto-modal-minimized .webcamfoto-modal-content {
                        min-height: auto;
                        height: auto;
                        width: 250px;
                        resize: none;
                    }
                    
                    /* Classe para modal maximizado */
                    .webcamfoto-modal-maximized .webcamfoto-modal-content {
                        width: 100% !important;
                        height: 100% !important;
                        top: 0 !important;
                        left: 0 !important;
                        transform: none !important;
                        border-radius: 0;
                        resize: none;
                    }
                    
                    /* Cursor de redimensionamento */
                    .webcamfoto-modal-content {
                        resize: both;
                    }
                    
                    /* Esconder o resize handle quando maximizado */
                    .webcamfoto-modal-maximized .webcamfoto-modal-content {
                        resize: none;
                    }
                `;
                document.head.appendChild(modalStyles);
            }

            // Cria o elemento modal
            this.modalElement = document.createElement('div');
            this.modalElement.id = 'webcamfoto-modal';
            this.modalElement.className = 'webcamfoto-modal';
            
            // Conteúdo do modal
            this.modalElement.innerHTML = `
                <div class="webcamfoto-modal-content" id="webcamfoto-modal-content">
                    <div class="webcamfoto-modal-header" id="webcamfoto-modal-header">
                        <h2 class="webcamfoto-modal-title">Capturar Fotos - Modo Dupla Câmera</h2>
                        <div class="webcamfoto-modal-controls">
                            <button class="webcamfoto-control-btn webcamfoto-minimize" id="webcamfoto-minimize" title="Minimizar">&#8211;</button>
                            <button class="webcamfoto-control-btn webcamfoto-maximize" id="webcamfoto-maximize" title="Maximizar">&#9744;</button>
                            <button class="webcamfoto-control-btn webcamfoto-close" id="webcamfoto-close" title="Fechar">&times;</button>
                        </div>
                    </div>
                    <div class="webcamfoto-modal-body">
                        <div class="webcamfoto-success-message" id="webcamfoto-success-message"></div>
                        <div class="webcamfoto-error" id="webcamfoto-error"></div>
                        
                        <div class="webcam-container">
                            <div class="webcam-column" id="webcam-column-1">
                                <div class="webcam-title">Câmera 1</div>
                                <select class="camera-select" id="camera-select-1">
                                    <option value="">Selecione a câmera...</option>
                                </select>
                                
                                <div id="webcamfoto-video-container-1" class="webcamfoto-video-container">
                                    <video id="webcamfoto-video" class="webcamfoto-video" autoplay></video>
                                </div>
                                <div id="webcamfoto-canvas-container-1" class="webcamfoto-canvas-container" style="display:none;">
                                    <canvas id="webcamfoto-canvas" class="webcamfoto-canvas"></canvas>
                                </div>
                                
                                <div class="webcam-controls">
                                    <button id="webcamfoto-capture-1" class="button butAction webcamfoto-button-blue">Capturar</button>
                                    <button id="webcamfoto-retake-1" class="button butAction webcamfoto-button-yellow" style="display:none;">Nova Foto</button>
                                    <button id="webcamfoto-save-1" class="button butAction webcamfoto-button-green" style="display:none;">Salvar</button>
                                </div>
                            </div>
                            
                            <div class="webcam-column" id="webcam-column-2">
                                <div class="webcam-title">Câmera 2</div>
                                <select class="camera-select" id="camera-select-2">
                                    <option value="">Selecione a câmera...</option>
                                </select>
                                
                                <div id="webcamfoto-video-container-2" class="webcamfoto-video-container">
                                    <video id="webcamfoto-video-2" class="webcamfoto-video" autoplay></video>
                                </div>
                                <div id="webcamfoto-canvas-container-2" class="webcamfoto-canvas-container" style="display:none;">
                                    <canvas id="webcamfoto-canvas-2" class="webcamfoto-canvas"></canvas>
                                </div>
                                
                                <div class="webcam-controls">
                                    <button id="webcamfoto-capture-2" class="button butAction webcamfoto-button-blue">Capturar</button>
                                    <button id="webcamfoto-retake-2" class="button butAction webcamfoto-button-yellow" style="display:none;">Nova Foto</button>
                                    <button id="webcamfoto-save-2" class="button butAction webcamfoto-button-green" style="display:none;">Salvar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="webcamfoto-modal-footer">
                        <button id="webcamfoto-capture-both" class="button butAction webcamfoto-button-purple webcamfoto-capture-both">Capturar Ambas as Câmeras</button>
                        <button id="webcamfoto-cancel" class="button butActionDelete webcamfoto-button-red">Cancelar</button>
                        <button id="webcamfoto-save-both" class="button butAction webcamfoto-button-green" style="display:none;">Salvar Ambas as Fotos</button>
                    </div>
                </div>
            `;
            
            // Adiciona o modal ao body
            document.body.appendChild(this.modalElement);
            
            // Atualiza as referências aos elementos
            this.video = document.getElementById('webcamfoto-video');
            this.video2 = document.getElementById('webcamfoto-video-2');
            this.canvas = document.getElementById('webcamfoto-canvas');
            this.canvas2 = document.getElementById('webcamfoto-canvas-2');
            
            // Referências aos containers
            this.videoContainers[0] = document.getElementById('webcamfoto-video-container-1');
            this.videoContainers[1] = document.getElementById('webcamfoto-video-container-2');
            this.canvasContainers[0] = document.getElementById('webcamfoto-canvas-container-1');
            this.canvasContainers[1] = document.getElementById('webcamfoto-canvas-container-2');
            
            // Referências aos seletores de câmera
            this.cameraSelects = [
                document.getElementById('camera-select-1'),
                document.getElementById('camera-select-2')
            ];
            
            // Salva o estado do modal
            this.modalState = {
                isMinimized: false,
                isMaximized: false,
                originalWidth: null,
                originalHeight: null,
                originalTop: null,
                originalLeft: null
            };
        }

        /**
         * Anexa os eventos aos elementos do modal
         */
        attachEvents() {
            // Fechar o modal
            const closeBtn = document.getElementById('webcamfoto-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeModal());
            }
            
            // Minimizar o modal
            const minimizeBtn = document.getElementById('webcamfoto-minimize');
            if (minimizeBtn) {
                minimizeBtn.addEventListener('click', () => this.minimizeModal());
            }
            
            // Maximizar o modal
            const maximizeBtn = document.getElementById('webcamfoto-maximize');
            if (maximizeBtn) {
                maximizeBtn.addEventListener('click', () => this.toggleMaximizeModal());
            }
            
            // Tornar o modal arrastável
            this.makeModalDraggable();
            
            // Fechamento do modal ao clicar fora dele
            window.addEventListener('click', (event) => {
                if (event.target == this.modalElement) {
                    this.closeModal();
                }
            });
            
            // Botão de captura
            const captureBtn1 = document.getElementById('webcamfoto-capture-1');
            const captureBtn2 = document.getElementById('webcamfoto-capture-2');
            if (captureBtn1) {
                captureBtn1.addEventListener('click', () => this.capture(1));
            }
            if (captureBtn2) {
                captureBtn2.addEventListener('click', () => this.capture(2));
            }
            
            // Botão para cancelar
            const cancelBtn = document.getElementById('webcamfoto-cancel');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.closeModal());
            }
            
            // Botão para tirar nova foto
            const retakeBtn1 = document.getElementById('webcamfoto-retake-1');
            const retakeBtn2 = document.getElementById('webcamfoto-retake-2');
            if (retakeBtn1) {
                retakeBtn1.addEventListener('click', () => this.retake(1));
            }
            if (retakeBtn2) {
                retakeBtn2.addEventListener('click', () => this.retake(2));
            }
            
            // Botão para salvar a foto
            const saveBtn1 = document.getElementById('webcamfoto-save-1');
            const saveBtn2 = document.getElementById('webcamfoto-save-2');
            if (saveBtn1) {
                saveBtn1.addEventListener('click', () => this.save(1));
            }
            if (saveBtn2) {
                saveBtn2.addEventListener('click', () => this.save(2));
            }
            
            // Botão para capturar ambas as câmeras
            const captureBothBtn = document.getElementById('webcamfoto-capture-both');
            if (captureBothBtn) {
                captureBothBtn.addEventListener('click', () => this.captureBoth());
            }
            
            // Botão para salvar ambas as fotos
            const saveBothBtn = document.getElementById('webcamfoto-save-both');
            if (saveBothBtn) {
                saveBothBtn.addEventListener('click', () => this.saveBoth());
            }
        }
        
        /**
         * Torna o modal arrastável
         */
        makeModalDraggable() {
            const modalHeader = document.getElementById('webcamfoto-modal-header');
            const modalContent = document.getElementById('webcamfoto-modal-content');
            
            if (!modalHeader || !modalContent) return;
            
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            
            modalHeader.onmousedown = dragMouseDown;
            
            function dragMouseDown(e) {
                e = e || window.event;
                e.preventDefault();
                
                // Não permitir arrastar se estiver maximizado
                if (modalContent.parentElement.classList.contains('webcamfoto-modal-maximized')) {
                    return;
                }
                
                // Obter a posição do mouse no início
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = closeDragElement;
                // Chamar a função sempre que o mouse se mover
                document.onmousemove = elementDrag;
            }
            
            function elementDrag(e) {
                e = e || window.event;
                e.preventDefault();
                
                // Calcular a nova posição do cursor
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                
                // Definir a nova posição do elemento
                const newTop = (modalContent.offsetTop - pos2);
                const newLeft = (modalContent.offsetLeft - pos1);
                
                // Aplicar as novas posições
                modalContent.style.top = newTop + "px";
                modalContent.style.left = newLeft + "px";
                // Não remover a transformação para evitar que a janela desapareça
                // modalContent.style.transform = 'none';
            }
            
            function closeDragElement() {
                // Parar de mover quando o mouse for solto
                document.onmouseup = null;
                document.onmousemove = null;
            }
        }
        
        /**
         * Minimiza o modal
         */
        minimizeModal() {
            if (!this.modalElement) return;
            
            const modalContent = document.getElementById('webcamfoto-modal-content');
            
            if (this.modalState.isMinimized) {
                // Restaurar do estado minimizado
                this.modalElement.classList.remove('webcamfoto-modal-minimized');
                
                // Se estava maximizado antes de minimizar, restaurar para maximizado
                if (this.modalState.isMaximized) {
                    this.modalElement.classList.add('webcamfoto-modal-maximized');
                } else {
                    // Caso contrário, restaurar tamanho original
                    if (this.modalState.originalWidth && this.modalState.originalHeight) {
                        modalContent.style.width = this.modalState.originalWidth;
                        modalContent.style.height = this.modalState.originalHeight;
                    }
                }
                
                this.modalState.isMinimized = false;
                
                // Reinicia a webcam se necessário
                if (document.getElementById('webcamfoto-video-container-1').style.display === 'block') {
                    this.startWebcam(1);
                }
                if (document.getElementById('webcamfoto-video-container-2').style.display === 'block') {
                    this.startWebcam(2);
                }
            } else {
                // Minimizar o modal
                if (!this.modalState.isMinimized) {
                    // Salvar estado atual
                    this.modalState.originalWidth = modalContent.style.width;
                    this.modalState.originalHeight = modalContent.style.height;
                    this.modalState.originalTop = modalContent.style.top;
                    this.modalState.originalLeft = modalContent.style.left;
                }
                
                this.modalElement.classList.add('webcamfoto-modal-minimized');
                this.modalElement.classList.remove('webcamfoto-modal-maximized');
                this.modalState.isMinimized = true;
                
                // Parar a webcam para economizar recursos
                this.stopWebcam(1);
                this.stopWebcam(2);
            }
        }
        
        /**
         * Alterna entre estado maximizado e normal
         */
        toggleMaximizeModal() {
            if (!this.modalElement) return;
            
            const modalContent = document.getElementById('webcamfoto-modal-content');
            
            // Não fazer nada se estiver minimizado
            if (this.modalState.isMinimized) return;
            
            if (this.modalState.isMaximized) {
                // Restaurar do estado maximizado
                this.modalElement.classList.remove('webcamfoto-modal-maximized');
                
                // Restaurar tamanho original
                if (this.modalState.originalWidth && this.modalState.originalHeight) {
                    modalContent.style.width = this.modalState.originalWidth;
                    modalContent.style.height = this.modalState.originalHeight;
                }
                
                // Restaurar posição original
                if (this.modalState.originalTop && this.modalState.originalLeft) {
                    modalContent.style.top = this.modalState.originalTop;
                    modalContent.style.left = this.modalState.originalLeft;
                } else {
                    // Caso não tenhamos posição original salva, resetar para o centro
                    modalContent.style.top = '50px';
                    modalContent.style.left = '50%';
                    modalContent.style.transform = 'translateX(-50%)';
                }
                
                this.modalState.isMaximized = false;
            } else {
                // Maximizar o modal
                if (!this.modalState.isMaximized) {
                    // Salvar estado atual
                    this.modalState.originalWidth = modalContent.style.width;
                    this.modalState.originalHeight = modalContent.style.height;
                    this.modalState.originalTop = modalContent.style.top;
                    this.modalState.originalLeft = modalContent.style.left;
                }
                
                this.modalElement.classList.add('webcamfoto-modal-maximized');
                this.modalState.isMaximized = true;
            }
            
            // Ajusta o tamanho do vídeo/canvas se necessário
            if (this.video) {
                this.video.style.width = '100%';
            }
            
            if (this.canvas) {
                this.canvas.style.width = '100%';
            }
        }

        /**
         * Abre o modal e inicia a webcam
         */
        openModal() {
            if (!this.modalElement) {
                this.createModal();
                this.attachEvents();
            }
            
            this.modalElement.style.display = 'block';
            
            // Inicia a listagem de câmeras disponíveis
            this.enumerateDevices();
            
            // Inicia a webcam
            this.startWebcam(1);
            this.startWebcam(2);
        }

        /**
         * Fecha o modal e para a webcam
         */
        closeModal() {
            if (this.modalElement) {
                this.modalElement.style.display = 'none';
            }
            
            // Para a webcam
            this.stopWebcam(1);
            this.stopWebcam(2);
            
            // Limpa a captura
            this.clearCapture(1);
            this.clearCapture(2);
            
            // Se há fotos salvas, recarrega a página para mostrar 
            if (this.needsReload) {
                window.location.reload();
            }
        }

        /**
         * Lista as câmeras disponíveis
         */
        enumerateDevices() {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                console.error('Navegador não suporta a listagem de dispositivos de mídia');
                return;
            }
            
            navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                    // Filtra apenas as câmeras de vídeo
                    const videoDevices = devices.filter(device => device.kind === 'videoinput');
                    
                    // Se não houver câmeras, mostra erro
                    if (videoDevices.length === 0) {
                        const errorEl = document.getElementById('webcamfoto-error');
                        if (errorEl) {
                            errorEl.textContent = 'Nenhuma webcam encontrada';
                            errorEl.style.display = 'block';
                        }
                        return;
                    }
                    
                    // Limpa as opções atuais
                    this.cameraSelects.forEach(select => {
                        if (select) {
                            select.innerHTML = '<option value="">Selecione a câmera...</option>';
                        }
                    });
                    
                    // Adiciona as câmeras encontradas
                    videoDevices.forEach((device, index) => {
                        const option = document.createElement('option');
                        option.value = device.deviceId;
                        option.text = device.label || `Câmera ${index + 1}`;
                        
                        this.cameraSelects.forEach(select => {
                            if (select) {
                                select.appendChild(option.cloneNode(true));
                            }
                        });
                        
                        // Armazena as opções de câmera
                        this.cameraOptions[0].push(device);
                        this.cameraOptions[1].push(device);
                    });
                    
                    // Seleciona a primeira câmera por padrão para a primeira coluna
                    if (this.cameraSelects[0] && videoDevices.length > 0) {
                        this.cameraSelects[0].value = videoDevices[0].deviceId;
                        this.selectedCameras[0] = videoDevices[0];
                        
                        // Inicia a webcam com a câmera selecionada
                        this.startWebcam(1, videoDevices[0].deviceId);
                        
                        // Se houver mais de uma câmera, seleciona a segunda para a segunda coluna
                        if (this.cameraSelects[1] && videoDevices.length > 1) {
                            this.cameraSelects[1].value = videoDevices[1].deviceId;
                            this.selectedCameras[1] = videoDevices[1];
                            
                            // Inicia a webcam com a câmera selecionada
                            this.startWebcam(2, videoDevices[1].deviceId);
                        }
                    }
                    
                    // Adiciona eventos de mudança para os selects
                    this.cameraSelects.forEach((select, index) => {
                        if (select) {
                            select.addEventListener('change', (e) => {
                                const deviceId = e.target.value;
                                const device = this.cameraOptions[index].find(d => d.deviceId === deviceId);
                                if (device) {
                                    this.selectedCameras[index] = device;
                                    this.startWebcam(index + 1, deviceId);
                                }
                            });
                        }
                    });
                })
                .catch(error => {
                    console.error('Erro ao listar dispositivos:', error);
                });
        }

        /**
         * Inicia a webcam
         * @param {number} cameraIndex - Índice da câmera (1 ou 2)
         * @param {string} deviceId - ID do dispositivo de câmera específico (opcional)
         */
        startWebcam(cameraIndex, deviceId = null) {
            if (!this.video || !this.video2) return;
            
            // Verifica se o navegador suporta a API de mídia
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                // Configurações para captura de vídeo
                const constraints = {
                    video: deviceId ? { deviceId: { exact: deviceId } } : true,
                    audio: false
                };
                
                // Para qualquer stream anterior
                this.stopWebcam(cameraIndex);
                
                // Solicita acesso à webcam
                navigator.mediaDevices.getUserMedia(constraints)
                    .then((stream) => {
                        this.videoStreams[cameraIndex - 1] = stream;
                        if (cameraIndex === 1) {
                            this.video.srcObject = stream;
                        } else {
                            this.video2.srcObject = stream;
                        }
                        
                        // Ajusta canvas para o tamanho do vídeo
                        if (cameraIndex === 1) {
                            this.video.addEventListener('loadedmetadata', () => {
                                this.canvas.width = this.video.videoWidth;
                                this.canvas.height = this.video.videoHeight;
                            });
                        } else {
                            this.video2.addEventListener('loadedmetadata', () => {
                                this.canvas2.width = this.video2.videoWidth;
                                this.canvas2.height = this.video2.videoHeight;
                            });
                        }
                        
                        // Exibe o container de vídeo e esconde o de canvas
                        if (cameraIndex === 1) {
                            this.videoContainers[0].style.display = 'block';
                            this.canvasContainers[0].style.display = 'none';
                        } else {
                            this.videoContainers[1].style.display = 'block';
                            this.canvasContainers[1].style.display = 'none';
                        }
                        
                        // Exibe o botão de captura e cancelar, esconde os outros
                        if (cameraIndex === 1) {
                            document.getElementById('webcamfoto-capture-1').style.display = 'inline-block';
                            document.getElementById('webcamfoto-cancel').style.display = 'inline-block';
                            document.getElementById('webcamfoto-retake-1').style.display = 'none';
                            document.getElementById('webcamfoto-save-1').style.display = 'none';
                        } else {
                            document.getElementById('webcamfoto-capture-2').style.display = 'inline-block';
                            document.getElementById('webcamfoto-cancel').style.display = 'inline-block';
                            document.getElementById('webcamfoto-retake-2').style.display = 'none';
                            document.getElementById('webcamfoto-save-2').style.display = 'none';
                        }
                        
                        // Esconde mensagens de erro
                        document.getElementById('webcamfoto-error').style.display = 'none';
                    })
                    .catch((error) => {
                        console.error('Erro ao acessar a webcam:', error);
                        document.getElementById('webcamfoto-error').textContent = 'Erro ao acessar a webcam: ' + error.message;
                        document.getElementById('webcamfoto-error').style.display = 'block';
                    });
            } else {
                document.getElementById('webcamfoto-error').textContent = 'Este navegador não suporta acesso à webcam';
                document.getElementById('webcamfoto-error').style.display = 'block';
            }
        }

        /**
         * Para a webcam
         * @param {number} cameraIndex - Índice da câmera (1 ou 2)
         */
        stopWebcam(cameraIndex) {
            if (this.videoStreams[cameraIndex - 1]) {
                this.videoStreams[cameraIndex - 1].getTracks().forEach(track => track.stop());
                this.videoStreams[cameraIndex - 1] = null;
            }
        }

        /**
         * Captura a imagem da webcam
         * @param {number} cameraIndex - Índice da câmera (1 ou 2)
         */
        capture(cameraIndex) {
            if (!this.video || !this.canvas) return;
            
            const context = cameraIndex === 1 ? this.canvas.getContext('2d') : this.canvas2.getContext('2d');
            
            // Desenha o frame atual do vídeo no canvas
            if (cameraIndex === 1) {
                context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            } else {
                context.drawImage(this.video2, 0, 0, this.canvas2.width, this.canvas2.height);
            }
            
            // Salva a imagem capturada
            if (cameraIndex === 1) {
                this.capturedImage = this.canvas.toDataURL('image/jpeg');
            } else {
                this.capturedImage2 = this.canvas2.toDataURL('image/jpeg');
            }
            
            // Exibe o canvas e esconde o vídeo
            if (cameraIndex === 1) {
                this.videoContainers[0].style.display = 'none';
                this.canvasContainers[0].style.display = 'block';
            } else {
                this.videoContainers[1].style.display = 'none';
                this.canvasContainers[1].style.display = 'block';
            }
            
            // Atualiza os botões
            if (cameraIndex === 1) {
                document.getElementById('webcamfoto-capture-1').style.display = 'none';
                document.getElementById('webcamfoto-cancel').style.display = 'inline-block';
                document.getElementById('webcamfoto-retake-1').style.display = 'inline-block';
                document.getElementById('webcamfoto-save-1').style.display = 'inline-block';
            } else {
                document.getElementById('webcamfoto-capture-2').style.display = 'none';
                document.getElementById('webcamfoto-cancel').style.display = 'inline-block';
                document.getElementById('webcamfoto-retake-2').style.display = 'inline-block';
                document.getElementById('webcamfoto-save-2').style.display = 'inline-block';
            }
            
            // Para a webcam para economizar recursos
            this.stopWebcam(cameraIndex);
        }

        /**
         * Limpa a captura
         * @param {number} cameraIndex - Índice da câmera (1 ou 2)
         */
        clearCapture(cameraIndex) {
            if (cameraIndex === 1) {
                this.capturedImage = null;
            } else {
                this.capturedImage2 = null;
            }
            
            if (cameraIndex === 1) {
                const context = this.canvas.getContext('2d');
                context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            } else {
                const context = this.canvas2.getContext('2d');
                context.clearRect(0, 0, this.canvas2.width, this.canvas2.height);
            }
        }

        /**
         * Salva a imagem capturada
         * @param {number} cameraIndex - Índice da câmera (1 ou 2)
         */
        save(cameraIndex) {
            if (!this.capturedImage && !this.capturedImage2 || !this.productId) {
                console.error('Nenhuma imagem capturada ou ID do produto não definido');
                return;
            }
            
            // Desabilita o botão durante o salvamento
            if (cameraIndex === 1) {
                const saveBtn = document.getElementById('webcamfoto-save-1');
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Salvando...';
                    saveBtn.classList.add('loading');
                }
            } else {
                const saveBtn = document.getElementById('webcamfoto-save-2');
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Salvando...';
                    saveBtn.classList.add('loading');
                }
            }
            
            // Função para mostrar mensagem de sucesso
            const showSuccess = (message) => {
                const successEl = document.getElementById('webcamfoto-success-message');
                if (successEl) {
                    successEl.textContent = message;
                    successEl.style.display = 'block';
                    
                    // Esconde a mensagem de erro se estiver visível
                    const errorEl = document.getElementById('webcamfoto-error');
                    if (errorEl) {
                        errorEl.style.display = 'none';
                    }
                }
                console.log(message);
            };
            
            // Exibe mensagem de erro se houver
            const showError = (message) => {
                const errorEl = document.getElementById('webcamfoto-error');
                if (errorEl) {
                    errorEl.textContent = message;
                    errorEl.style.display = 'block';
                    
                    // Esconde a mensagem de sucesso se estiver visível
                    const successEl = document.getElementById('webcamfoto-success-message');
                    if (successEl) {
                        successEl.style.display = 'none';
                    }
                }
                console.error(message);
                
                // Reativa o botão
                if (cameraIndex === 1) {
                    const saveBtn = document.getElementById('webcamfoto-save-1');
                    if (saveBtn) {
                        saveBtn.disabled = false;
                        saveBtn.textContent = 'Salvar Foto';
                        saveBtn.classList.remove('loading');
                    }
                } else {
                    const saveBtn = document.getElementById('webcamfoto-save-2');
                    if (saveBtn) {
                        saveBtn.disabled = false;
                        saveBtn.textContent = 'Salvar Foto';
                        saveBtn.classList.remove('loading');
                    }
                }
            };
            
            // Envia a imagem para o servidor usando FormData
            const formData = new FormData();
            formData.append('product_id', this.productId);
            if (cameraIndex === 1) {
                formData.append('image_data', this.capturedImage);
            } else {
                formData.append('image_data', this.capturedImage2);
            }
            
            // Determina o URL do script de salvamento
            const saveUrl = this.getSavePhotoUrl();
            console.log('Usando URL para salvar foto:', saveUrl);
            
            // Realiza a requisição para salvar a foto
            fetch(saveUrl, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                // Verifica se a resposta é válida
                if (!response.ok) {
                    throw new Error('Erro na resposta do servidor: ' + response.status);
                }
                
                // Clona a resposta para poder usá-la várias vezes se necessário
                return response.text().then(text => {
                    // Tenta fazer o parse como JSON
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        console.error('Erro ao fazer parse da resposta como JSON:', e);
                        console.log('Resposta recebida:', text);
                        
                        // Tenta extrair qualquer JSON que possa estar na resposta
                        try {
                            const match = text.match(/{.*}/s);
                            if (match) {
                                return JSON.parse(match[0]);
                            }
                        } catch (err) {
                            // Ignora erros adicionais de parsing
                        }
                        
                        // Se não conseguir extrair JSON, lança um erro
                        throw new Error('Resposta não é JSON válido: ' + 
                                        (text.length > 100 ? text.substring(0, 100) + '...' : text));
                    }
                });
            })
            .then(data => {
                console.log('Resposta do servidor:', data);
                
                if (data.success) {
                    // Mostra mensagem de sucesso na janela
                    showSuccess('Foto salva com sucesso!');
                    
                    // Reativa botões para permitir tirar outra foto
                    if (cameraIndex === 1) {
                        const saveBtn = document.getElementById('webcamfoto-save-1');
                        if (saveBtn) {
                            saveBtn.disabled = false;
                            saveBtn.textContent = 'Salvar Foto';
                            saveBtn.classList.remove('loading');
                            saveBtn.style.display = 'none';
                        }
                    } else {
                        const saveBtn = document.getElementById('webcamfoto-save-2');
                        if (saveBtn) {
                            saveBtn.disabled = false;
                            saveBtn.textContent = 'Salvar Foto';
                            saveBtn.classList.remove('loading');
                            saveBtn.style.display = 'none';
                        }
                    }
                    
                    // Ativa o botão de nova foto
                    if (cameraIndex === 1) {
                        const retakeBtn = document.getElementById('webcamfoto-retake-1');
                        if (retakeBtn) {
                            retakeBtn.style.display = 'inline-block';
                        }
                    } else {
                        const retakeBtn = document.getElementById('webcamfoto-retake-2');
                        if (retakeBtn) {
                            retakeBtn.style.display = 'inline-block';
                        }
                    }
                    
                    // NÃO fecha o modal automaticamente nem recarrega a página
                    // Permite ao usuário tirar uma nova foto ou fechar manualmente
                    
                    // Adiciona uma variável para controlar o recarregamento da página
                    this.needsReload = true;
                } else {
                    showError('Erro ao salvar a imagem: ' + (data.error || 'Erro desconhecido'));
                    
                    // Se há informações de debug, mostra no console
                    if (data.debug && Array.isArray(data.debug)) {
                        console.log('Informações de debug do servidor:');
                        data.debug.forEach(item => console.log(' - ' + item));
                    }
                }
            })
            .catch(error => {
                showError('Erro ao enviar a imagem: ' + error.message);
            });
        }
        
        /**
         * Obtém a URL do script de salvamento de foto
         */
        getSavePhotoUrl() {
            // Primeiro tenta determinar o caminho base da instalação do Dolibarr
            const dolibarrBase = this.getDolibarrBasePath();
            
            // Constrói a URL para o script de salvamento
            return dolibarrBase + '/custom/webcamfoto/ajax/save_photo.php';
        }
        
        /**
         * Obtém o caminho base do Dolibarr
         */
        getDolibarrBasePath() {
            // Tenta obter o caminho base a partir da URL atual
            const currentPath = window.location.pathname;
            
            // Método 1: Extrai o caminho até '/dolibarr/htdocs'
            const htdocsMatch = currentPath.match(/^(.*?\/dolibarr\/htdocs)/);
            if (htdocsMatch && htdocsMatch[1]) {
                return htdocsMatch[1];
            }
            
            // Método 2: Extrai o caminho até '/dolibarr'
            const dolibarrMatch = currentPath.match(/^(.*?\/dolibarr)/);
            if (dolibarrMatch && dolibarrMatch[1]) {
                return dolibarrMatch[1] + '/htdocs';
            }
            
            // Método 3: Busca nos scripts carregados
            const scripts = document.getElementsByTagName('script');
            for (const script of scripts) {
                if (script.src && script.src.includes('/dolibarr/')) {
                    const srcMatch = script.src.match(/(.*?\/dolibarr\/htdocs)/);
                    if (srcMatch && srcMatch[1]) {
                        return srcMatch[1];
                    }
                }
            }
            
            // Método 4: Usa o documento base se disponível
            const baseTag = document.querySelector('base');
            if (baseTag && baseTag.href) {
                const baseHref = baseTag.href;
                if (baseHref.includes('/dolibarr/')) {
                    const baseMatch = baseHref.match(/(.*?\/dolibarr\/htdocs)/);
                    if (baseMatch && baseMatch[1]) {
                        return baseMatch[1];
                    }
                }
            }
            
            // Último recurso: Use o caminho relativo atual com prefixo absoluto
            // Por exemplo, se estamos em '/dolibarr/htdocs/product/card.php'
            // Precisamos voltar para '/dolibarr/htdocs'
            const pathSegments = currentPath.split('/').filter(Boolean);
            const dolibarrIndex = pathSegments.indexOf('dolibarr');
            
            if (dolibarrIndex !== -1) {
                // Constrói o caminho até htdocs
                const htdocsPath = '/' + pathSegments.slice(0, dolibarrIndex + 2).join('/');
                return htdocsPath;
            }
            
            // Fallback absoluto para quando tudo falhar
            console.warn('Não foi possível determinar o caminho base do Dolibarr. Usando caminho absoluto padrão.');
            return '/dolibarr/htdocs';
        }

        /**
         * Adiciona o botão de captura na página de produto
         */
        addCaptureButton() {
            // Verifica se estamos na página de produto
            const productId = this.getProductIdFromUrl();
            if (!productId) {
                return;
            }

            // Define o ID do produto
            this.productId = productId;

            // Verifica se o botão já existe
            if (document.getElementById('webcamfoto-button')) {
                return;
            }

            // Busca a barra de ações
            const actionBar = document.querySelector('.tabsAction');
            if (!actionBar) {
                console.error('Barra de ações não encontrada');
                return;
            }

            // Cria o botão
            const button = document.createElement('a');
            button.id = 'webcamfoto-button';
            button.className = 'butAction';
            button.href = 'javascript:void(0)';
            button.innerHTML = '<i class="fa fa-camera"></i> Capturar Foto';
            button.setAttribute('title', 'Capturar uma foto com a webcam');
            
            // Adiciona o evento de clique
            button.addEventListener('click', () => {
                this.init(productId);
                this.openModal();
            });
            
            // Insere o botão na barra de ações
            actionBar.appendChild(button);
            console.log('Botão de captura adicionado à barra de ações');
        }

        /**
         * Obtém o ID do produto da URL
         * @returns {number|null} - ID do produto ou null se não encontrado
         */
        getProductIdFromUrl() {
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');
            return id ? parseInt(id) : null;
        }

        /**
         * Captura ambas as câmeras
         */
        captureBoth() {
            // Captura da primeira câmera
            this.capture(1);
            
            // Pequeno atraso para garantir que a primeira captura seja concluída
            setTimeout(() => {
                // Captura da segunda câmera
                this.capture(2);
                
                // Exibe o botão para salvar ambas
                const saveBothBtn = document.getElementById('webcamfoto-save-both');
                if (saveBothBtn) {
                    saveBothBtn.style.display = 'inline-block';
                }
            }, 300);
        }

        /**
         * Salva ambas as fotos
         */
        saveBoth() {
            if (!this.capturedImage || !this.capturedImage2 || !this.productId) {
                console.error('Imagens não capturadas ou ID do produto não definido');
                return;
            }
            
            // Desabilita o botão durante o salvamento
            const saveBothBtn = document.getElementById('webcamfoto-save-both');
            if (saveBothBtn) {
                saveBothBtn.disabled = true;
                saveBothBtn.textContent = 'Salvando...';
                saveBothBtn.classList.add('loading');
            }
            
            // Conta de fotos salvas com sucesso
            let savedCount = 0;
            
            // Função para mostrar mensagem de sucesso
            const showSuccess = (message) => {
                const successEl = document.getElementById('webcamfoto-success-message');
                if (successEl) {
                    successEl.textContent = message;
                    successEl.style.display = 'block';
                    
                    // Esconde a mensagem de erro se estiver visível
                    const errorEl = document.getElementById('webcamfoto-error');
                    if (errorEl) {
                        errorEl.style.display = 'none';
                    }
                }
                console.log(message);
            };
            
            // Exibe mensagem de erro se houver
            const showError = (message) => {
                const errorEl = document.getElementById('webcamfoto-error');
                if (errorEl) {
                    errorEl.textContent = message;
                    errorEl.style.display = 'block';
                    
                    // Esconde a mensagem de sucesso se estiver visível
                    const successEl = document.getElementById('webcamfoto-success-message');
                    if (successEl) {
                        successEl.style.display = 'none';
                    }
                }
                console.error(message);
                
                // Reativa o botão
                if (saveBothBtn) {
                    saveBothBtn.disabled = false;
                    saveBothBtn.textContent = 'Salvar Ambas as Fotos';
                    saveBothBtn.classList.remove('loading');
                }
            };
            
            // Função para salvar uma imagem
            const saveImage = (imageData, suffix) => {
                // Envia a imagem para o servidor usando FormData
                const formData = new FormData();
                formData.append('product_id', this.productId);
                formData.append('image_data', imageData);
                formData.append('suffix', suffix);  // Adiciona um sufixo para identificar qual câmera
                
                // Determina o URL do script de salvamento
                const saveUrl = this.getSavePhotoUrl();
                
                // Realiza a requisição para salvar a foto
                return fetch(saveUrl, {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    // Verifica se a resposta é válida
                    if (!response.ok) {
                        throw new Error('Erro na resposta do servidor: ' + response.status);
                    }
                    
                    // Clona a resposta para poder usá-la várias vezes se necessário
                    return response.text().then(text => {
                        // Tenta fazer o parse como JSON
                        try {
                            return JSON.parse(text);
                        } catch (e) {
                            console.error('Erro ao fazer parse da resposta como JSON:', e);
                            console.log('Resposta recebida:', text);
                            
                            // Tenta extrair qualquer JSON que possa estar na resposta
                            try {
                                const match = text.match(/{.*}/s);
                                if (match) {
                                    return JSON.parse(match[0]);
                                }
                            } catch (err) {
                                // Ignora erros adicionais de parsing
                            }
                            
                            // Se não conseguir extrair JSON, lança um erro
                            throw new Error('Resposta não é JSON válido: ' + 
                                            (text.length > 100 ? text.substring(0, 100) + '...' : text));
                        }
                    });
                })
                .then(data => {
                    console.log('Resposta do servidor:', data);
                    
                    if (data.success) {
                        // Incrementa o contador de fotos salvas
                        savedCount++;
                        
                        // Se ambas as fotos foram salvas, mostra a mensagem final
                        if (savedCount === 2) {
                            showSuccess('Ambas as fotos foram salvas com sucesso!');
                            
                            // Desativa o botão
                            if (saveBothBtn) {
                                saveBothBtn.style.display = 'none';
                            }
                            
                            // Ativa o botão para nova captura
                            const captureBothBtn = document.getElementById('webcamfoto-capture-both');
                            if (captureBothBtn) {
                                captureBothBtn.style.display = 'inline-block';
                            }
                            
                            // Define que a página precisa ser recarregada
                            this.needsReload = true;
                        }
                        
                        return true;
                    } else {
                        throw new Error(data.error || 'Erro desconhecido ao salvar foto');
                    }
                });
            };
            
            // Salva ambas as imagens
            Promise.all([
                saveImage(this.capturedImage, '_cam1'),
                saveImage(this.capturedImage2, '_cam2')
            ])
            .catch(error => {
                showError('Erro ao salvar as fotos: ' + error.message);
            });
        }

        /**
         * Inicia uma nova captura (reutiliza a webcam)
         * @param {number} cameraIndex - Índice da câmera (1 ou 2)
         */
        retake(cameraIndex) {
            // Esconde a mensagem de sucesso se estiver visível
            const successEl = document.getElementById('webcamfoto-success-message');
            if (successEl) {
                successEl.style.display = 'none';
            }
            
            // Esconde a mensagem de erro se estiver visível
            const errorEl = document.getElementById('webcamfoto-error');
            if (errorEl) {
                errorEl.style.display = 'none';
            }
            
            // Volta para a visualização da webcam
            if (cameraIndex === 1) {
                this.videoContainers[0].style.display = 'block';
                this.canvasContainers[0].style.display = 'none';
                
                // Redefine a imagem capturada
                this.capturedImage = null;
                
                // Mostra/esconde os botões apropriados
                const captureBtn = document.getElementById('webcamfoto-capture-1');
                const retakeBtn = document.getElementById('webcamfoto-retake-1');
                const saveBtn = document.getElementById('webcamfoto-save-1');
                
                if (captureBtn) captureBtn.style.display = 'inline-block';
                if (retakeBtn) retakeBtn.style.display = 'none';
                if (saveBtn) saveBtn.style.display = 'none';
            } else {
                this.videoContainers[1].style.display = 'block';
                this.canvasContainers[1].style.display = 'none';
                
                // Redefine a imagem capturada
                this.capturedImage2 = null;
                
                // Mostra/esconde os botões apropriados
                const captureBtn = document.getElementById('webcamfoto-capture-2');
                const retakeBtn = document.getElementById('webcamfoto-retake-2');
                const saveBtn = document.getElementById('webcamfoto-save-2');
                
                if (captureBtn) captureBtn.style.display = 'inline-block';
                if (retakeBtn) retakeBtn.style.display = 'none';
                if (saveBtn) saveBtn.style.display = 'none';
            }
            
            // Limpa a área do canvas
            this.clearCapture(cameraIndex);
            
            // Reinicia a webcam
            const deviceId = this.selectedCameras[cameraIndex - 1] ? this.selectedCameras[cameraIndex - 1].deviceId : null;
            this.startWebcam(cameraIndex, deviceId);
        }
    }

    // Disponibiliza a classe globalmente
    window.WebcamFoto = new WebcamFoto();

    // Adiciona o botão na página de produto quando o DOM estiver pronto
    document.addEventListener('DOMContentLoaded', function() {
        if (window.WebcamFoto) {
            // Tenta adicionar o botão imediatamente
            window.WebcamFoto.addCaptureButton();
            
            // Tenta novamente após um curto atraso (para lidar com carregamento dinâmico do DOM)
            setTimeout(function() {
                window.WebcamFoto.addCaptureButton();
            }, 1000);
            
            // E uma última tentativa com um atraso maior
            setTimeout(function() {
                window.WebcamFoto.addCaptureButton();
            }, 2000);
        }
    });

})();
