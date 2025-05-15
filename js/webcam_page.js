/**
 * JavaScript para a página dedicada de captura de fotos via webcam
 *
 * @author     Webcamfoto Module
 * @copyright  2025 Webcamfoto Module
 * @license    GNU GPLv3
 */

class WebcamPageController {
    constructor() {
        this.productRef = this.getProductRefFromUrl();
        if (this.productRef) {
            // Aguardar o DOM estar pronto para preencher o campo
            document.addEventListener('DOMContentLoaded', () => {
                const productRefInput = document.getElementById('product-ref-input');
                if (productRefInput) {
                    productRefInput.value = this.productRef;
                    productRefInput.readOnly = true; // Opcional: torna o campo somente leitura
                }
            });
        }
        this.productIdFromUrl = this.getProductIdFromUrl(); // Mantém para possível uso futuro ou log
        this.videoElements = [
            document.getElementById('webcam-video-1'),
            document.getElementById('webcam-video-2')
        ];
        this.canvasElements = [
            document.getElementById('webcam-canvas-1'),
            document.getElementById('webcam-canvas-2')
        ];
        this.videoContainers = [
            document.getElementById('webcam-video-container-1'),
            document.getElementById('webcam-video-container-2')
        ];
        this.canvasContainers = [
            document.getElementById('webcam-canvas-container-1'),
            document.getElementById('webcam-canvas-container-2')
        ];
        this.cameraSelects = [
            document.getElementById('camera-select-1'),
            document.getElementById('camera-select-2')
        ];
        this.captureButtons = [
            document.getElementById('capture-1'),
            document.getElementById('capture-2')
        ];
        this.retakeButtons = [
            document.getElementById('retake-1'),
            document.getElementById('retake-2')
        ];
        this.saveButtons = [
            document.getElementById('save-1'),
            document.getElementById('save-2')
        ];
        this.captureBothButton = document.getElementById('capture-both');
        this.saveBothButton = document.getElementById('save-both');
        this.closeButton = document.getElementById('close-window');
        this.successMessage = document.getElementById('success-message');
        this.errorMessage = document.getElementById('error-message');
        
        this.videoStreams = [null, null];
        this.selectedCameras = [null, null];
        this.cameraOptions = [[], []];
        this.capturedImages = [null, null];
        this.needsReload = false;
    }
    
    /**
     * Inicializa o controlador
     */
    init() {
        // Tenta pré-preencher o campo com o ID da URL, se existir
        const refInput = document.getElementById('product-ref-input');
        if (refInput && this.productIdFromUrl) {
            // Poderia buscar a ref completa aqui via AJAX, mas por ora só coloca o ID numérico
            // refInput.value = this.productIdFromUrl; 
            // Vamos deixar em branco por enquanto para forçar a digitação da ref completa
            console.log('ID numérico da URL (não usado diretamente para salvar):', this.productIdFromUrl);
        }

        this.attachEvents();
        this.enumerateDevices();
    }
    
    /**
     * Obtém o ID do produto da URL (agora usado apenas para informação)
     */
    getProductRefFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const productRef = urlParams.get('ref');
        return productRef;
    }
    
    getProductIdFromUrl() { 
        // Primeiro tenta obter do campo oculto (mais confiavel)
        const idInput = document.getElementById('product-id-input');
        if (idInput && idInput.value) {
            console.log('ID do produto obtido do campo oculto:', idInput.value);
            return idInput.value;
        }
        // Fallback: tenta obter da URL
        const urlParams = new URLSearchParams(window.location.search);
        const urlId = urlParams.get('id');
        console.log('ID do produto obtido da URL:', urlId);
        return urlId;
    }

    /**
     * Liga os eventos aos elementos da página
     */
    attachEvents() {
        // Botões de captura
        this.captureButtons[0].addEventListener('click', () => this.capture(0));
        this.captureButtons[1].addEventListener('click', () => this.capture(1));
        
        // Botões para tirar nova foto
        this.retakeButtons[0].addEventListener('click', () => this.retake(0));
        this.retakeButtons[1].addEventListener('click', () => this.retake(1));
        
        // Botões para salvar foto
        this.saveButtons[0].addEventListener('click', () => this.save(0));
        this.saveButtons[1].addEventListener('click', () => this.save(1));
        
        // Botão para capturar ambas
        this.captureBothButton.addEventListener('click', () => this.captureBoth());
        
        // Botão para salvar ambas
        this.saveBothButton.addEventListener('click', () => this.saveBoth());
        
        // Botão para fechar janela
        this.closeButton.addEventListener('click', () => this.closeWindow());
        
        // Selects de câmeras
        this.cameraSelects.forEach((select, index) => {
            select.addEventListener('change', (e) => {
                const deviceId = e.target.value;
                if (deviceId) {
                    this.startWebcam(index, deviceId);
                }
            });
        });
    }
    
    /**
     * Lista as câmeras disponíveis
     */
    enumerateDevices() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            this.showError('Navegador não suporta a listagem de dispositivos de mídia');
            return;
        }
        
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                // Filtra apenas as câmeras de vídeo
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                
                // Se não houver câmeras, mostra erro
                if (videoDevices.length === 0) {
                    this.showError('Nenhuma webcam encontrada');
                    return;
                }
                
                // Limpa as opções atuais
                this.cameraSelects.forEach(select => {
                    select.innerHTML = '<option value="">Selecione a câmera...</option>';
                });
                
                // Adiciona as câmeras encontradas
                videoDevices.forEach((device, index) => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    option.text = device.label || `Câmera ${index + 1}`;
                    
                    this.cameraSelects.forEach(select => {
                        select.appendChild(option.cloneNode(true));
                    });
                    
                    // Armazena as opções de câmera
                    this.cameraOptions[0].push(device);
                    this.cameraOptions[1].push(device);
                });
                
                // Seleciona a primeira câmera por padrão para a primeira coluna
                if (videoDevices.length > 0) {
                    this.cameraSelects[0].value = videoDevices[0].deviceId;
                    this.selectedCameras[0] = videoDevices[0];
                    
                    // Inicia a webcam com a câmera selecionada
                    this.startWebcam(0, videoDevices[0].deviceId);
                    
                    // Se houver mais de uma câmera, seleciona a segunda para a segunda coluna
                    if (videoDevices.length > 1) {
                        this.cameraSelects[1].value = videoDevices[1].deviceId;
                        this.selectedCameras[1] = videoDevices[1];
                        
                        // Inicia a webcam com a câmera selecionada
                        this.startWebcam(1, videoDevices[1].deviceId);
                    }
                }
            })
            .catch(error => {
                this.showError('Erro ao listar dispositivos: ' + error.message);
            });
    }
    
    /**
     * Inicia a webcam
     * @param {number} cameraIndex - Índice da câmera (0 ou 1)
     * @param {string} deviceId - ID do dispositivo de câmera específico (opcional)
     */
    startWebcam(cameraIndex, deviceId = null) {
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
                    this.videoStreams[cameraIndex] = stream;
                    this.videoElements[cameraIndex].srcObject = stream;
                    
                    // Ajusta canvas para o tamanho do vídeo
                    this.videoElements[cameraIndex].addEventListener('loadedmetadata', () => {
                        this.canvasElements[cameraIndex].width = this.videoElements[cameraIndex].videoWidth;
                        this.canvasElements[cameraIndex].height = this.videoElements[cameraIndex].videoHeight;
                    });
                    
                    // Exibe o container de vídeo e esconde o de canvas
                    this.videoContainers[cameraIndex].style.display = 'flex';
                    this.canvasContainers[cameraIndex].style.display = 'none';
                    
                    // Mostra/esconde os botões apropriados
                    this.captureButtons[cameraIndex].style.display = 'inline-block';
                    this.retakeButtons[cameraIndex].style.display = 'none';
                    this.saveButtons[cameraIndex].style.display = 'none';
                    
                    // Esconde mensagens
                    this.successMessage.style.display = 'none';
                    this.errorMessage.style.display = 'none';
                })
                .catch((error) => {
                    this.showError('Erro ao acessar a webcam: ' + error.message);
                });
        } else {
            this.showError('Este navegador não suporta acesso à webcam');
        }
    }
    
    /**
     * Para a webcam
     * @param {number} cameraIndex - Índice da câmera (0 ou 1)
     */
    stopWebcam(cameraIndex) {
        if (this.videoStreams[cameraIndex]) {
            this.videoStreams[cameraIndex].getTracks().forEach(track => track.stop());
            this.videoStreams[cameraIndex] = null;
        }
    }
    
    /**
     * Captura a imagem da webcam
     * @param {number} cameraIndex - Índice da câmera (0 ou 1)
     */
    capture(cameraIndex) {
        const video = this.videoElements[cameraIndex];
        const canvas = this.canvasElements[cameraIndex];
        
        if (!video || !canvas) return;
        
        const context = canvas.getContext('2d');
        
        // Desenha o frame atual do vídeo no canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Salva a imagem capturada
        this.capturedImages[cameraIndex] = canvas.toDataURL('image/jpeg');
        
        // Exibe o canvas e esconde o vídeo
        this.videoContainers[cameraIndex].style.display = 'none';
        this.canvasContainers[cameraIndex].style.display = 'flex';
        
        // Mostra/esconde os botões apropriados
        this.captureButtons[cameraIndex].style.display = 'none';
        this.retakeButtons[cameraIndex].style.display = 'inline-block';
        this.saveButtons[cameraIndex].style.display = 'inline-block';
        
        // Para a webcam para economizar recursos
        this.stopWebcam(cameraIndex);
    }
    
    /**
     * Captura imagens de ambas as câmeras
     */
    captureBoth() {
        this.capture(0);
        this.capture(1);
        
        // Mostra o botão para salvar ambas e esconde o de capturar ambas
        this.captureBothButton.style.display = 'none';
        this.saveBothButton.style.display = 'inline-block';
    }
    
    /**
     * Limpa a captura
     * @param {number} cameraIndex - Índice da câmera (0 ou 1)
     */
    clearCapture(cameraIndex) {
        this.capturedImages[cameraIndex] = null;
        
        const context = this.canvasElements[cameraIndex].getContext('2d');
        context.clearRect(0, 0, this.canvasElements[cameraIndex].width, this.canvasElements[cameraIndex].height);
    }
    
    /**
     * Inicia uma nova captura (reutiliza a webcam)
     * @param {number} cameraIndex - Índice da câmera (0 ou 1)
     */
    retake(cameraIndex) {
        // Esconde mensagens
        this.successMessage.style.display = 'none';
        this.errorMessage.style.display = 'none';
        
        // Volta para a visualização da webcam
        this.videoContainers[cameraIndex].style.display = 'flex';
        this.canvasContainers[cameraIndex].style.display = 'none';
        
        // Redefine a imagem capturada
        this.capturedImages[cameraIndex] = null;
        
        // Mostra/esconde os botões apropriados
        this.captureButtons[cameraIndex].style.display = 'inline-block';
        this.retakeButtons[cameraIndex].style.display = 'none';
        this.saveButtons[cameraIndex].style.display = 'none';
        
        // Se ambas as capturas foram limpas, mostra o botão de capturar ambas
        if (!this.capturedImages[0] && !this.capturedImages[1]) {
            this.captureBothButton.style.display = 'inline-block';
            this.saveBothButton.style.display = 'none';
        }
        
        // Limpa a área do canvas
        this.clearCapture(cameraIndex);
        
        // Reinicia a webcam
        const deviceId = this.selectedCameras[cameraIndex] ? this.selectedCameras[cameraIndex].deviceId : null;
        this.startWebcam(cameraIndex, deviceId);
    }
    
    /**
     * Salva a imagem capturada
     * @param {number} cameraIndex - Índice da câmera (0 ou 1)
     */
    save(cameraIndex) {
        const saveBtn = this.saveButtons[cameraIndex];
        const imageData = this.capturedImages[cameraIndex];
        
        // Obtém a referência do produto do campo de input
        const productRef = document.getElementById('product-ref-input')?.value?.trim();
        const productId = this.productIdFromUrl;

        if (!imageData || (!productRef && !productId)) {
            this.showError('Capture uma imagem e informe a Referência ou ID do Produto antes de salvar');
            return;
        }
        
        // Desabilita o botão durante o salvamento
        saveBtn.disabled = true;
        saveBtn.textContent = 'Salvando...';
        
        // Envia a imagem para o servidor usando FormData
        const formData = new FormData();
        formData.append('product_ref', productRef || ''); // Alterado para aceitar vazio
        formData.append('product_id', productId || ''); // novo campo
        formData.append('image_data', imageData);
        formData.append('image_suffix', '_' + (cameraIndex + 1)); // Alterado para image_suffix
        
        // Determina o URL do script de salvamento
        const saveUrl = this.getSavePhotoUrl();
        
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
            
            return response.text().then(text => {
                // Tenta fazer o parse como JSON
                try {
                    return JSON.parse(text);
                } catch (e) {
                    // Tenta extrair qualquer JSON que possa estar na resposta
                    try {
                        const match = text.match(/{.*}/s);
                        if (match) {
                            return JSON.parse(match[0]);
                        }
                    } catch (err) {
                        // Ignora erros adicionais de parsing
                    }
                    
                    throw new Error('Resposta não é JSON válido: ' + 
                                   (text.length > 100 ? text.substring(0, 100) + '...' : text));
                }
            });
        })
        .then(data => {
            if (data.success) {
                this.showSuccess(`Foto ${cameraIndex + 1} salva com sucesso!`);
                
                // Desativa o botão de salvar
                saveBtn.style.display = 'none';
                
                // Define que a página precisa ser recarregada
                this.needsReload = true;
                
                return true;
            } else {
                throw new Error(data.error || 'Erro desconhecido ao salvar foto');
            }
        })
        .catch(error => {
            this.showError('Erro ao salvar foto: ' + error.message);
            
            // Reativa o botão
            saveBtn.disabled = false;
            saveBtn.textContent = 'Salvar';
        });
    }
    
    /**
     * Salva ambas as imagens capturadas
     */
    saveBoth() {
        // Obtém a referência do produto do campo de input
        const productRef = document.getElementById('product-ref-input')?.value?.trim();
        const productId = this.productIdFromUrl;

        if ((!this.capturedImages[0] && !this.capturedImages[1]) || (!productRef && !productId)) {
            this.showError('Capture ao menos uma imagem e informe a Referência ou ID do Produto antes de salvar');
            return;
        }
        
        // Desabilita o botão durante o salvamento
        this.saveBothButton.disabled = true;
        this.saveBothButton.textContent = 'Salvando...';
        
        let savedCount = 0;
        let errorOccurred = false;
        
        // Função para salvar uma imagem
        const saveImage = (imageData, suffix) => {
            if (!imageData) return Promise.resolve();
            
            const formData = new FormData();
            formData.append('product_ref', productRef || ''); // pode estar vazio
            formData.append('product_id', productId || '');
            formData.append('image_data', imageData);
            formData.append('image_suffix', suffix);
            
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
                
                return response.text().then(text => {
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        try {
                            const match = text.match(/{.*}/s);
                            if (match) {
                                return JSON.parse(match[0]);
                            }
                        } catch (err) {}
                        
                        throw new Error('Resposta não é JSON válido');
                    }
                });
            })
            .then(data => {
                if (data.success) {
                    // Incrementa o contador de fotos salvas
                    savedCount++;
                    
                    // Se ambas as fotos foram salvas, mostra a mensagem final
                    if (savedCount === 2) {
                        this.showSuccess('Ambas as fotos foram salvas com sucesso!');
                        
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
            saveImage(this.capturedImages[0], '_cam1'),
            saveImage(this.capturedImages[1], '_cam2')
        ])
        .then(() => {
            // Desativa o botão de salvar ambas
            this.saveBothButton.style.display = 'none';
            
            // Ativa o botão para nova captura
            this.captureBothButton.style.display = 'inline-block';
        })
        .catch(error => {
            this.showError('Erro ao salvar as fotos: ' + error.message);
            
            // Reativa o botão
            this.saveBothButton.disabled = false;
            this.saveBothButton.textContent = 'Salvar Ambas';
        });
    }
    
    /**
     * Determina o URL do script para salvar a foto
     */
    getSavePhotoUrl() {
        // Obtém o caminho base da URL atual
        const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
        return basePath + '/ajax/save_photo.php';
    }
    
    /**
     * Mostra mensagem de sucesso
     * @param {string} message - Mensagem a ser exibida
     */
    showSuccess(message) {
        this.successMessage.textContent = message;
        this.successMessage.style.display = 'block';
        this.errorMessage.style.display = 'none';
    }
    
    /**
     * Mostra mensagem de erro
     * @param {string} message - Mensagem a ser exibida
     */
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.successMessage.style.display = 'none';
    }
    
    /**
     * Fecha a janela
     */
    closeWindow() {
        // Se há fotos salvas, precisa recarregar a página principal
        if (this.needsReload) {
            if (window.opener) {
                window.opener.location.reload();
            }
        }
        
        // Para as webcams
        this.stopWebcam(0);
        this.stopWebcam(1);
        
        // Fecha a janela
        window.close();
    }
}

// Inicializa o controlador quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    const controller = new WebcamPageController();
    controller.init();
});
