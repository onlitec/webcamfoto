/**
 * Módulo de barra de progresso para Webcamfoto
 */
(function() {
    "use strict";
    
    // Cria o objeto ProgressBar se não existir
    if (!window.ProgressBar) {
        window.ProgressBar = {
            container: null,
            bar: null,
            status: null,
            interval: null,
            timeout: null,
            
            /**
             * Cria e exibe uma barra de progresso no elemento especificado
             * @param {string} containerId - ID do elemento onde a barra será exibida
             * @param {string} message - Mensagem a ser exibida
             */
            show: function(containerId, message) {
                console.log('Criando barra de progresso em:', containerId);
                
                // Limpa barra anterior se existir
                this.clear();
                
                // Encontra o container
                const container = document.getElementById(containerId);
                if (!container) {
                    console.error('Container não encontrado:', containerId);
                    return;
                }
                
                // Cria elementos da barra
                this.container = document.createElement('div');
                this.container.className = 'wf-progress-container';
                this.container.style.display = 'block';
                
                this.status = document.createElement('div');
                this.status.className = 'wf-progress-status';
                this.status.textContent = message || 'Processando...';
                
                this.bar = document.createElement('div');
                this.bar.className = 'wf-progress-bar';
                this.bar.style.width = '10%';
                
                // Monta estrutura
                this.container.appendChild(this.status);
                this.container.appendChild(this.bar);
                
                // Adiciona ao DOM
                container.appendChild(this.container);
                
                // Inicia animação
                let percent = 10;
                this.interval = setInterval(() => {
                    percent += 5;
                    if (percent >= 90) percent = 90;
                    this.bar.style.width = percent + '%';
                    this.status.textContent = `${message || 'Processando...'} (${percent}%)`;
                }, 1000);
                
                // Timeout de segurança (2 minutos)
                this.timeout = setTimeout(() => {
                    this.finish(true);
                    if (window.WebcamFoto && typeof window.WebcamFoto.showError === 'function') {
                        window.WebcamFoto.showError('Tempo limite excedido. A operação demorou muito. Tente novamente.');
                    }
                }, 120000);
            },
            
            /**
             * Atualiza o progresso da barra
             * @param {number} percent - Percentual de conclusão (0-100)
             * @param {string} message - Nova mensagem (opcional)
             */
            update: function(percent, message) {
                if (!this.bar || !this.status) return;
                
                this.bar.style.width = percent + '%';
                if (message) {
                    this.status.textContent = message;
                }
            },
            
            /**
             * Finaliza a barra de progresso
             * @param {boolean} error - Se true, indica erro
             */
            finish: function(error) {
                console.log('Finalizando barra de progresso, erro:', error);
                
                // Limpa timers
                if (this.interval) {
                    clearInterval(this.interval);
                    this.interval = null;
                }
                
                if (this.timeout) {
                    clearTimeout(this.timeout);
                    this.timeout = null;
                }
                
                // Atualiza barra
                if (this.bar) {
                    this.bar.style.width = error ? '0%' : '100%';
                }
                
                // Atualiza texto
                if (this.status) {
                    this.status.textContent = error ? 
                        'Falha na operação' : 
                        'Operação concluída com sucesso (100%)';
                }
                
                // Esconde após delay
                setTimeout(() => this.clear(), 1500);
            },
            
            /**
             * Remove a barra de progresso do DOM
             */
            clear: function() {
                // Limpa timers
                if (this.interval) {
                    clearInterval(this.interval);
                    this.interval = null;
                }
                
                if (this.timeout) {
                    clearTimeout(this.timeout);
                    this.timeout = null;
                }
                
                // Remove do DOM
                if (this.container && this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                }
                
                this.container = null;
                this.bar = null;
                this.status = null;
            }
        };
    }
})();
