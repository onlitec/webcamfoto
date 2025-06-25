(function() {
    'use strict';
    
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
            this.productRef = null;
        }
        
        /**
         * Inicializa o objeto
         * @param {object} productInfo - Informações do produto
         */
        init(productInfo) {
            if (productInfo) {
                this.productId = productInfo.productId || null;
                this.productRef = productInfo.productRef || null;
            }
            
            if (!this.initialized) {
                this.initialized = true;
                console.log('WebcamFoto inicializado com ID:', this.productId, 'Ref:', this.productRef);
            }
        }
        
        /**
         * Adiciona o botão de captura na interface
         */
        addCaptureButton() {
            console.log('Adicionando botão de captura para produto:', this.productId);
            // Implementação simplificada
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
