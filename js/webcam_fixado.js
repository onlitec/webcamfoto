/**
 * Módulo Webcamfoto para Dolibarr - Versão corrigida
 * JavaScript para manipulação da webcam e captura de fotos
 *
 * @author     Webcamfoto Module
 * @copyright  2025 Webcamfoto Module
 * @license    GNU GPLv3
 */

(function() {
    "use strict";
    console.log('WebcamFoto IIFE executing...'); // Linha de teste

    // Objeto WebcamFoto 
    const WebcamFoto = {
        initialized: false,
        productId: null,
        modalElement: null,
        video: null,
        video2: null, 
        videoStreams: [null, null],
        selectedCameras: [null, null], 
        cameraOptions: [[], []],
        videoContainers: [null, null],
        canvasContainers: [null, null],
        canvas: null,
        canvas2: null,
        videoContainer: null,
        canvasContainer: null,
        capturedImage: null,
        capturedImage2: null,
        width: 640,
        height: 480,
        modulePath: null,
        needsReload: false,
        dualCameraMode: false,
        enhancementActive: false,
        enhancedImage: null,
        enhancedImage2: null,
        imageEnhancer: null,

        init(productId) {
            if (this.initialized && this.productId) return;
            
            this.productId = productId || this.getProductIdFromUrl();
            this.createModal();
            this.attachEvents();
            this.initialized = true;
            
            this.modulePath = this.getModulePath();
            
            if (window.ImageEnhancer) {
                this.imageEnhancer = window.ImageEnhancer;
                this.imageEnhancer.init();
            }
            
            console.log("WebcamFoto inicializado para o produto ID: " + this.productId);
        },
        
        getModulePath() {
            const currentPath = window.location.pathname;
            const dolibarrIndex = currentPath.indexOf('/dolibarr');
            
            if (dolibarrIndex === -1) {
                const scripts = document.getElementsByTagName('script');
                for (let i = 0; i < scripts.length; i++) {
                    const src = scripts[i].src;
                    if (src.includes('webcamfoto/js/webcam')) {
                        return src.substring(0, src.lastIndexOf('/js/webcam'));
                    }
                }
                return './custom/webcamfoto';
            }
            
            const basePath = currentPath.substring(0, dolibarrIndex + 9);
            return basePath + '/htdocs/custom/webcamfoto';
        },
        
        createModal() {
            if (document.getElementById('webcamfoto-modal')) {
                this.modalElement = document.getElementById('webcamfoto-modal');
                return;
            }
            
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
                        background-color: #00894A !important;
                        background-image: none !important;
                    }
                    .webcamfoto-button-purple {
                        background-color: #8a2be2 !important;
                        background-image: none !important;
                        color: white !important;
                        border: 1px solid #8a2be2 !important;
                    }
                    .webcamfoto-button-purple:hover {
                        background-color: #7a1dd2 !important;
                        background-image: none !important;
                    }
                `;
                document.head.appendChild(modalStyles);
            }
            
            this.modalElement = document.createElement('div');
            this.modalElement.id = 'webcamfoto-modal';
            this.modalElement.className = 'webcamfoto-modal';
            
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
                                    <button id="webcamfoto-enhance-1" class="button butAction webcamfoto-button-purple" style="display:none;">Otimizar com IA</button>
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
                                    <button id="webcamfoto-enhance-2" class="button butAction webcamfoto-button-purple" style="display:none;">Otimizar com IA</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="webcamfoto-footer-buttons">
                            <button id="webcamfoto-capture-both" class="button butAction webcamfoto-button-blue">Capturar Ambas</button>
                            <button id="webcamfoto-save-both" class="button butAction webcamfoto-button-green" style="display:none;">Salvar Ambas</button>
                            <button id="webcamfoto-cancel" class="button butAction webcamfoto-button-red" style="display:none;">Cancelar</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(this.modalElement);
            
            this.video = document.getElementById('webcamfoto-video');
            this.video2 = document.getElementById('webcamfoto-video-2');
            this.canvas = document.getElementById('webcamfoto-canvas');
            this.canvas2 = document.getElementById('webcamfoto-canvas-2');
            
            this.videoContainers[0] = document.getElementById('webcamfoto-video-container-1');
            this.videoContainers[1] = document.getElementById('webcamfoto-video-container-2');
            
            this.canvasContainers[0] = document.getElementById('webcamfoto-canvas-container-1');
            this.canvasContainers[1] = document.getElementById('webcamfoto-canvas-container-2');
            
            if (this.canvas) {
                this.canvas.width = this.width;
                this.canvas.height = this.height;
            }
            
            if (this.canvas2) {
                this.canvas2.width = this.width;
                this.canvas2.height = this.height;
            }
            
            this.makeModalDraggable();
        },
        
        attachEvents() {
            document.getElementById('webcamfoto-close').addEventListener('click', () => this.closeModal());
            document.getElementById('webcamfoto-minimize').addEventListener('click', () => this.minimizeModal());
            document.getElementById('webcamfoto-maximize').addEventListener('click', () => this.toggleMaximizeModal());
            
            // Eventos para câmera 1
            document.getElementById('webcamfoto-capture-1').addEventListener('click', () => this.capture(1));
            document.getElementById('webcamfoto-retake-1').addEventListener('click', () => this.retake(1));
            document.getElementById('webcamfoto-save-1').addEventListener('click', () => this.save(1));
            document.getElementById('webcamfoto-enhance-1').addEventListener('click', () => this.enhanceImage(1));
            
            // Eventos para câmera 2
            document.getElementById('webcamfoto-capture-2').addEventListener('click', () => this.capture(2));
            document.getElementById('webcamfoto-retake-2').addEventListener('click', () => this.retake(2));
            document.getElementById('webcamfoto-save-2').addEventListener('click', () => this.save(2));
            document.getElementById('webcamfoto-enhance-2').addEventListener('click', () => this.enhanceImage(2));
            
            // Eventos para botões de operação em ambas câmeras
            document.getElementById('webcamfoto-capture-both').addEventListener('click', () => this.captureBoth());
            document.getElementById('webcamfoto-save-both').addEventListener('click', () => this.saveBoth());
            document.getElementById('webcamfoto-cancel').addEventListener('click', () => this.closeModal());
            
            // Eventos para seleção de câmera
            document.getElementById('camera-select-1').addEventListener('change', (e) => {
                const deviceId = e.target.value;
                this.startWebcam(1, deviceId);
            });
            
            document.getElementById('camera-select-2').addEventListener('change', (e) => {
                const deviceId = e.target.value;
                this.startWebcam(2, deviceId);
            });
        },
        
        makeModalDraggable() {
            const modalHeader = document.getElementById('webcamfoto-modal-header');
            const modalContent = document.getElementById('webcamfoto-modal-content');
            
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            
            if (modalHeader) {
                modalHeader.onmousedown = dragMouseDown;
            }
            
            function dragMouseDown(e) {
                e = e || window.event;
                e.preventDefault();
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = closeDragElement;
                document.onmousemove = elementDrag;
            }
            
            function elementDrag(e) {
                e = e || window.event;
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                modalContent.style.top = (modalContent.offsetTop - pos2) + 'px';
                modalContent.style.left = (modalContent.offsetLeft - pos1) + 'px';
            }
            
            function closeDragElement() {
                document.onmouseup = null;
                document.onmousemove = null;
            }
        },
        
        minimizeModal() {
            const modalContent = document.getElementById('webcamfoto-modal-content');
            const minimizeBtn = document.getElementById('webcamfoto-minimize');
            
            modalContent.classList.add('webcamfoto-modal-minimized');
            minimizeBtn.innerHTML = '&#9650;'; // Seta para cima
            minimizeBtn.onclick = () => this.restoreModal();
        },
        
        restoreModal() {
            const modalContent = document.getElementById('webcamfoto-modal-content');
            const minimizeBtn = document.getElementById('webcamfoto-minimize');
            
            modalContent.classList.remove('webcamfoto-modal-minimized');
            minimizeBtn.innerHTML = '&#8211;'; // Traço horizontal
            minimizeBtn.onclick = () => this.minimizeModal();
        },
        
        toggleMaximizeModal() {
            const modalContent = document.getElementById('webcamfoto-modal-content');
            const maximizeBtn = document.getElementById('webcamfoto-maximize');
            
            if (modalContent.classList.contains('webcamfoto-modal-maximized')) {
                modalContent.classList.remove('webcamfoto-modal-maximized');
                maximizeBtn.innerHTML = '&#9744;'; // Quadrado maximizar
                
                // Restaura a posição original
                modalContent.style.top = '';
                modalContent.style.left = '';
            } else {
                modalContent.classList.add('webcamfoto-modal-maximized');
                maximizeBtn.innerHTML = '&#9552;'; // Restaurar
            }
        },
        
        openModal() {
            this.modalElement.style.display = 'block';
            this.enumerateDevices();
            
            // Inicia ambas as câmeras por padrão
            this.dualCameraMode = true;
        },
        
        closeModal() {
            this.modalElement.style.display = 'none';
            
            // Para ambas as webcams
            this.stopWebcam(1);
            this.stopWebcam(2);
            
            // Se houver alterações não salvas, pergunta se realmente deseja fechar
            if (this.needsReload) {
                location.reload();
            }
        },
        
        enumerateDevices() {
            navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                    // Limpa as opções de câmeras
                    this.cameraOptions = [[], []];
                    
                    // Filtra apenas as câmeras (videoinput)
                    const cameras = devices.filter(device => device.kind === 'videoinput');
                    
                    // Preenche os selects com as opções de câmeras
                    const select1 = document.getElementById('camera-select-1');
                    const select2 = document.getElementById('camera-select-2');
                    
                    // Limpa os selects
                    select1.innerHTML = '<option value="">Selecione a câmera...</option>';
                    select2.innerHTML = '<option value="">Selecione a câmera...</option>';
                    
                    // Adiciona as câmeras aos selects
                    cameras.forEach((camera, index) => {
                        const option1 = document.createElement('option');
                        option1.value = camera.deviceId;
                        option1.text = camera.label || `Câmera ${index + 1}`;
                        
                        const option2 = document.createElement('option');
                        option2.value = camera.deviceId;
                        option2.text = camera.label || `Câmera ${index + 1}`;
                        
                        select1.appendChild(option1);
                        select2.appendChild(option2);
                        
                        this.cameraOptions[0].push(camera);
                        this.cameraOptions[1].push(camera);
                    });
                    
                    // Inicia as webcams com a primeira câmera disponível
                    if (cameras.length > 0) {
                        this.startWebcam(1, cameras[0].deviceId);
                        
                        if (cameras.length > 1) {
                            this.startWebcam(2, cameras[1].deviceId);
                        } else if (cameras.length === 1) {
                            this.startWebcam(2, cameras[0].deviceId);
                        }
                    }
                })
                .catch(error => {
                    console.error('Erro ao enumerar dispositivos:', error);
                    // Tenta iniciar a webcam mesmo assim, sem especificar um deviceId
                    this.startWebcam(1);
                    this.startWebcam(2);
                });
        },
        
        startWebcam(cameraIndex, deviceId = null) {
            // Para a webcam se já estiver rodando
            this.stopWebcam(cameraIndex);
            
            // Define as constraints (restrições) para a mídia
            const constraints = {
                video: {
                    width: this.width,
                    height: this.height
                }
            };
            
            // Se um deviceId foi especificado, inclui nas constraints
            if (deviceId) {
                constraints.video.deviceId = { exact: deviceId };
                
                // Salva a câmera selecionada
                this.selectedCameras[cameraIndex - 1] = this.cameraOptions[cameraIndex - 1].find(
                    camera => camera.deviceId === deviceId
                );
            }
            
            // Solicita acesso à webcam
            navigator.mediaDevices.getUserMedia(constraints)
                .then(stream => {
                    // Salva a referência ao stream
                    this.videoStreams[cameraIndex - 1] = stream;
                    
                    // Conecta o stream ao elemento de vídeo
                    if (cameraIndex === 1) {
                        this.video.srcObject = stream;
                        this.videoContainers[0].style.display = 'block';
                        this.canvasContainers[0].style.display = 'none';
                    } else {
                        this.video2.srcObject = stream;
                        this.videoContainers[1].style.display = 'block';
                        this.canvasContainers[1].style.display = 'none';
                    }
                })
                .catch(error => {
                    console.error('Erro ao acessar a webcam:', error);
                    this.showError('Não foi possível acessar a webcam. Verifique as permissões.');
                });
        },
        
        stopWebcam(cameraIndex) {
            if (this.videoStreams[cameraIndex - 1]) {
                this.videoStreams[cameraIndex - 1].getTracks().forEach(track => track.stop());
                this.videoStreams[cameraIndex - 1] = null;
            }
        },
        
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
                document.getElementById('webcamfoto-enhance-1').style.display = 'inline-block';
            } else {
                document.getElementById('webcamfoto-capture-2').style.display = 'none';
                document.getElementById('webcamfoto-cancel').style.display = 'inline-block';
                document.getElementById('webcamfoto-retake-2').style.display = 'inline-block';
                document.getElementById('webcamfoto-save-2').style.display = 'inline-block';
                document.getElementById('webcamfoto-enhance-2').style.display = 'inline-block';
            }
            
            // Mantém a webcam ligada após a captura
            // Comentado para manter a webcam ligada: this.stopWebcam(cameraIndex);
        },
        
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
        },
        
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
            
            // Função para mostrar mensagem de erro
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
            
            // Obtém a URL para salvar a foto
            const url = this.getSavePhotoUrl();
            console.log('Usando URL para salvar foto:', url);
            
            // Prepara os dados para enviar
            const formData = new FormData();
            formData.append('product_id', this.productId);
            formData.append('camera_index', cameraIndex);
            
            // Dependendo da câmera, adiciona a imagem correspondente
            let imageData;
            if (cameraIndex === 1) {
                imageData = this.enhancedImage || this.capturedImage;
                formData.append('image_data', imageData);
            } else {
                imageData = this.enhancedImage2 || this.capturedImage2;
                formData.append('image_data', imageData);
            }
            
            // Envia a requisição
            fetch(url, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                console.log('Resposta do servidor:', data);
                
                if (data.success) {
                    showSuccess('Foto salva com sucesso!');
                    
                    // Reativa o botão e o esconde
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
                    
                    // Adiciona uma variável para controlar o recarregamento da página
                    this.needsReload = true;
                } else {
                    showError('Erro ao salvar a imagem: ' + (data.error || 'Erro desconhecido'));
                    
                    // Se há informações de debug, mostra no console
                    if (data.debug) {
                        console.error('Debug:', data.debug);
                    }
                }
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
                showError('Erro ao enviar a imagem: ' + error.message);
            });
        },
        
        getSavePhotoUrl() {
            return this.getDolibarrBasePath() + '/custom/webcamfoto/ajax/save_photo.php';
        },
        
        getDolibarrBasePath() {
            const currentPath = window.location.pathname;
            const dolibarrIndex = currentPath.indexOf('/dolibarr');
            
            if (dolibarrIndex === -1) {
                // Tenta inferir o caminho base a partir da URL atual
                const pathSegments = currentPath.split('/');
                
                // Procura por htdocs na URL
                const htdocsIndex = pathSegments.indexOf('htdocs');
                if (htdocsIndex !== -1) {
                    // Caminho até htdocs
                    return pathSegments.slice(0, htdocsIndex + 1).join('/');
                }
                
                // Se não encontrou htdocs, pode estar usando caminho relativo
                return '';
            }
            
            return currentPath.substring(0, dolibarrIndex + 9); // +9 para incluir '/dolibarr'
        },
        
        getProductIdFromUrl() {
            const params = new URLSearchParams(window.location.search);
            return params.get('id');
        },
        
        captureBoth() {
            this.capture(1);
            this.capture(2);
            
            // Exibe o botão para salvar ambas
            document.getElementById('webcamfoto-capture-both').style.display = 'none';
            document.getElementById('webcamfoto-save-both').style.display = 'inline-block';
        },
        
        retake(cameraIndex) {
            // Mostra o vídeo e esconde o canvas
            if (cameraIndex === 1) {
                this.videoContainers[0].style.display = 'block';
                this.canvasContainers[0].style.display = 'none';
                
                // Ajusta os botões
                const captureBtn = document.getElementById('webcamfoto-capture-1');
                const retakeBtn = document.getElementById('webcamfoto-retake-1');
                const saveBtn = document.getElementById('webcamfoto-save-1');
                const enhanceBtn = document.getElementById('webcamfoto-enhance-1');
                
                if (captureBtn) captureBtn.style.display = 'inline-block';
                if (retakeBtn) retakeBtn.style.display = 'none';
                if (saveBtn) saveBtn.style.display = 'none';
                if (enhanceBtn) enhanceBtn.style.display = 'none';
            } else {
                this.videoContainers[1].style.display = 'block';
                this.canvasContainers[1].style.display = 'none';
                
                // Ajusta os botões
                const captureBtn = document.getElementById('webcamfoto-capture-2');
                const retakeBtn = document.getElementById('webcamfoto-retake-2');
                const saveBtn = document.getElementById('webcamfoto-save-2');
                const enhanceBtn = document.getElementById('webcamfoto-enhance-2');
                
                if (captureBtn) captureBtn.style.display = 'inline-block';
                if (retakeBtn) retakeBtn.style.display = 'none';
                if (saveBtn) saveBtn.style.display = 'none';
                if (enhanceBtn) enhanceBtn.style.display = 'none';
            }
            
            // Limpa a área do canvas
            this.clearCapture(cameraIndex);
            
            // Reinicia a webcam
            const deviceId = this.selectedCameras[cameraIndex - 1] ? this.selectedCameras[cameraIndex - 1].deviceId : null;
            this.startWebcam(cameraIndex, deviceId);
        },
        
        enhanceImage(cameraIndex) {
            // Delega para o script fix_ia.js que implementa a função otimizarImagemIA
            if (window.otimizarImagemIA) {
                window.otimizarImagemIA(cameraIndex);
            } else {
                this.showError('Função de otimização não disponível');
            }
        },
        
        showError(message) {
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
        },
        
        showSuccess(message) {
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
        },
        
        showProcessingMessage(message) {
            // Delega para o script fix_ia.js que implementa essa funcionalidade
            if (window.mostrarMensagemProcessamento) {
                window.mostrarMensagemProcessamento(message);
            }
        },
        
        updateProcessingMessage(message, progress) {
            // Delega para o script fix_ia.js que implementa essa funcionalidade
            if (window.atualizarMensagemProcessamento) {
                window.atualizarMensagemProcessamento(message, progress);
            }
        },
        
        hideProcessingMessage() {
            // Delega para o script fix_ia.js que implementa essa funcionalidade
            if (window.esconderMensagemProcessamento) {
                window.esconderMensagemProcessamento();
            }
        },
        
        addCaptureButton() {
            console.log('Botão de captura adicionado à barra de ações');
            // Esta função não faz nada aqui, pois o botão é adicionado diretamente
            // pelo arquivo actions_webcamfoto.class.php
        }
    };

    // Disponibiliza o objeto globalmente
    window.WebcamFoto = WebcamFoto;
})();
