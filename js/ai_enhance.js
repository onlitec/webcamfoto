/**
 * AI Image Enhancement Module for Dolibarr WebcamFoto
 * 
 * Provides functionality to enhance product images using AI services
 * and manual image editing controls.
 * 
 * @author     Webcamfoto Module
 * @copyright  2025 Webcamfoto Module
 * @license    GNU GPLv3
 */

(function() {
    "use strict";

    /**
     * Classe para aprimoramento de imagens com IA
     */
    class ImageEnhancer {
        /**
         * Construtor
         */
        constructor() {
            this.apiKey = '';
            this.apiModel = 'stability-ai/sdxl';
            this.enhancementActive = false;
            this.originalImage = null;
            this.enhancedImage = null;
            this.progressCallback = null;
            this.successCallback = null;
            this.errorCallback = null;
            this.editorControls = {
                brightness: 0,
                contrast: 0,
                saturation: 0,
                removeBg: false
            };
        }

        /**
     * Inicializa o aprimorador de imagens
     * @param {Object} options - Opções de configuração
     */
    init(options = {}) {
        // Buscar configurações do módulo IA nativo do Dolibarr
        this.fetchDolibarrAIConfig()
            .then(success => {
                if (!success) {
                    // Fallback para configurações locais se não conseguir carregar do Dolibarr
                    this.loadLocalSettings(options);
                }
                
                // Log das configurações
                console.log('ImageEnhancer inicializado com modelo: ' + this.apiModel);
                
                // Se não tiver configurações válidas, exibir log
                if (!this.hasSettings()) {
                    console.warn('Nenhuma configuração de IA encontrada. Configure o módulo IA do Dolibarr.');
                }
            });

        // Callbacks
        if (options.onProgress) this.progressCallback = options.onProgress;
        if (options.onSuccess) this.successCallback = options.onSuccess;
        if (options.onError) this.errorCallback = options.onError;
    }
    
    /**
     * Busca as configurações do módulo nativo de IA do Dolibarr
     * @returns {Promise<boolean>} - Promise que será resolvida com true se as configurações foram carregadas com sucesso
     */
    fetchDolibarrAIConfig() {
        return fetch(this.getBaseUrl() + '/htdocs/custom/webcamfoto/ajax/get_ai_config.php')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.config) {
                    // Mapear configurações do módulo nativo para o nosso módulo
                    if (data.config.DOLIAI_API_KEY) {
                        this.apiKey = data.config.DOLIAI_API_KEY;
                    }
                    
                    // Determinar o modelo com base no provedor configurado
                    if (data.config.DOLIAI_MODEL) {
                        this.apiModel = data.config.DOLIAI_MODEL;
                    } else if (data.config.DOLIAI_PROVIDER) {
                        this.apiModel = this.getModelFromProvider(data.config.DOLIAI_PROVIDER);
                    }
                    
                    console.log('Configurações de IA carregadas do módulo nativo Dolibarr');
                    return true;
                }
                return false;
            })
            .catch(error => {
                console.error('Erro ao carregar configurações do módulo IA:', error);
                return false;
            });
    }
    
    /**
     * Carrega configurações locais salvas
     * @param {Object} options - Opções de configuração passadas para init()
     */
    loadLocalSettings(options = {}) {
        if (options.apiKey) {
            this.apiKey = options.apiKey;
        } else {
            // Tenta obter a chave da API do localStorage
            const savedApiKey = localStorage.getItem('webcamfoto_ai_api_key');
            if (savedApiKey) {
                this.apiKey = savedApiKey;
            }
        }

        if (options.apiModel) {
            this.apiModel = options.apiModel;
        } else {
            // Tenta obter o modelo da API do localStorage
            const savedModel = localStorage.getItem('webcamfoto_ai_model');
            if (savedModel) {
                this.apiModel = savedModel;
            }
        }
    }
    
    /**
     * Determina o modelo baseado no provedor de IA
     * @param {string} provider - Provedor de IA configurado no Dolibarr
     * @returns {string} - Nome do modelo correspondente
     */
    getModelFromProvider(provider) {
        switch (provider.toLowerCase()) {
            case 'openai':
                return 'openai/dalle3';
            case 'stability':
                return 'stability-ai/sdxl';
            case 'anthropic':
                return 'anthropic/claude';
            case 'pixelcut':
                return 'pixelcut'; // Adicionado suporte para Pixelcut
            default:
                return 'stability-ai/sdxl'; // Modelo padrão
        }
    }
    
    /**
     * Obtém a URL base do Dolibarr
     * @returns {string} - URL base
     */
    getBaseUrl() {
        const currentPath = window.location.pathname;
        const dolibarrIndex = currentPath.indexOf('/dolibarr');
        
        if (dolibarrIndex === -1) {
            return '.';
        }
        
        return currentPath.substring(0, dolibarrIndex);
    }

        /**
         * Salva as configurações da IA
         * @param {string} apiKey - Chave da API
         * @param {string} apiModel - Modelo da API
         */
        saveSettings(apiKey, apiModel) {
            this.apiKey = apiKey;
            this.apiModel = apiModel;

            // Salva no localStorage para persistência
            localStorage.setItem('webcamfoto_ai_api_key', apiKey);
            localStorage.setItem('webcamfoto_ai_model', apiModel);

            console.log('Configurações da IA salvas');
            return true;
        }

        /**
     * Verifica se existem configurações salvas
     * @returns {Boolean} - True se existem configurações
     */
    hasSettings() {
        // Verifica se tem as configurações mínimas necessárias (chave API)
        return !!(this.apiKey && this.apiKey.trim() !== '');
    }

        /**
         * Aprimora a imagem usando IA
         * @param {string} imageDataUrl - URL de dados da imagem (data:image/jpeg;base64,...)
         * @returns {Promise} - Promise que será resolvida com a URL de dados da imagem aprimorada
         */
        enhanceImage(imageDataUrl) {
            // Salva a imagem original
            this.originalImage = imageDataUrl;
            this.enhancementActive = true;

            // Converte a imagem para um Blob/File para envio
            const blob = this.dataURLtoBlob(imageDataUrl);
            const file = new File([blob], "product_image.jpg", { type: "image/jpeg" });

            // Prepara os dados para o endpoint da IA
            const formData = new FormData();
            formData.append('api_key', this.apiKey);
            formData.append('model', this.apiModel);
            formData.append('image', file);
            formData.append('action', 'enhance'); // Ação principal: melhorar a imagem

            // Executa o callback de progresso se existir
            if (this.progressCallback) {
                this.progressCallback({stage: 'start', progress: 0, message: 'Iniciando o aprimoramento com IA...'});
            }

            // Envia a imagem para o endpoint de IA
            return fetch(this.getEnhancePhotoUrl(), {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro na resposta do servidor: ' + response.status);
                }
                
                if (this.progressCallback) {
                    this.progressCallback({stage: 'processing', progress: 50, message: 'Processando imagem...'});
                }
                
                return response.json();
            })
            .then(data => {
                this.enhancementActive = false;
                
                if (data.success) {
                    this.enhancedImage = data.enhancedImageData;
                    
                    if (this.progressCallback) {
                        this.progressCallback({stage: 'complete', progress: 100, message: 'Imagem aprimorada com sucesso!'});
                    }
                    
                    if (this.successCallback) {
                        this.successCallback(this.enhancedImage);
                    }
                    
                    return this.enhancedImage;
                } else {
                    const errorMsg = data.error || 'Erro desconhecido ao aprimorar imagem';
                    if (this.errorCallback) {
                        this.errorCallback(errorMsg);
                    }
                    throw new Error(errorMsg);
                }
            })
            .catch(error => {
                this.enhancementActive = false;
                if (this.errorCallback) {
                    this.errorCallback(error.message);
                }
                throw error;
            });
        }

        /**
         * Aplica ajustes manuais à imagem
         * @param {Object} adjustments - Ajustes a serem aplicados
         * @returns {Promise} - Promise que será resolvida com a URL de dados da imagem ajustada
         */
        applyAdjustments(adjustments) {
            // Mescla os ajustes fornecidos com os valores atuais
            this.editorControls = {
                ...this.editorControls,
                ...adjustments
            };

            // Se não tivermos uma imagem para ajustar, retorna erro
            if (!this.originalImage && !this.enhancedImage) {
                return Promise.reject(new Error('Nenhuma imagem para ajustar'));
            }

            // Imagem base será a aprimorada se disponível, ou a original
            const baseImage = this.enhancedImage || this.originalImage;

            // Prepara os dados para o endpoint de ajustes
            const formData = new FormData();
            formData.append('image_data', baseImage);
            formData.append('adjustments', JSON.stringify(this.editorControls));

            // Executa o callback de progresso se existir
            if (this.progressCallback) {
                this.progressCallback({stage: 'adjusting', progress: 0, message: 'Aplicando ajustes...'});
            }

            // Envia a imagem para o endpoint de ajustes
            return fetch(this.getEnhancePhotoUrl(), {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro na resposta do servidor: ' + response.status);
                }
                
                if (this.progressCallback) {
                    this.progressCallback({stage: 'processing', progress: 50, message: 'Processando ajustes...'});
                }
                
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Atualiza a imagem aprimorada com os ajustes
                    this.enhancedImage = data.adjustedImageData;
                    
                    if (this.progressCallback) {
                        this.progressCallback({stage: 'complete', progress: 100, message: 'Ajustes aplicados com sucesso!'});
                    }
                    
                    if (this.successCallback) {
                        this.successCallback(this.enhancedImage);
                    }
                    
                    return this.enhancedImage;
                } else {
                    const errorMsg = data.error || 'Erro desconhecido ao aplicar ajustes';
                    if (this.errorCallback) {
                        this.errorCallback(errorMsg);
                    }
                    throw new Error(errorMsg);
                }
            })
            .catch(error => {
                if (this.errorCallback) {
                    this.errorCallback(error.message);
                }
                throw error;
            });
        }

        /**
         * Remove o fundo da imagem
         * @returns {Promise} - Promise que será resolvida com a URL de dados da imagem sem fundo
         */
        removeBackground() {
            return this.applyAdjustments({removeBg: true});
        }

        /**
         * Restaura a imagem original
         * @returns {string} - URL de dados da imagem original
         */
        restoreOriginal() {
            if (!this.originalImage) {
                throw new Error('Imagem original não disponível');
            }
            
            this.enhancedImage = null;
            return this.originalImage;
        }

        /**
         * Obtém a imagem atual (aprimorada ou original)
         * @returns {string} - URL de dados da imagem atual
         */
        getCurrentImage() {
            return this.enhancedImage || this.originalImage;
        }

        /**
         * Converte uma URL de dados para um Blob
         * @param {string} dataURL - URL de dados (data:image/jpeg;base64,...)
         * @returns {Blob} - Objeto Blob
         */
        dataURLtoBlob(dataURL) {
            // Separa o tipo MIME da string base64
            const arr = dataURL.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            
            return new Blob([u8arr], {type: mime});
        }

        /**
     * Obtém a URL do endpoint para aprimoramento de fotos
     */
    getEnhancePhotoUrl() {
        return this.getBaseUrl() + '/dolibarr/htdocs/custom/webcamfoto/ajax/enhance_photo.php';
    }
    }

    // Disponibiliza a classe globalmente
    window.ImageEnhancer = new ImageEnhancer();

})();
