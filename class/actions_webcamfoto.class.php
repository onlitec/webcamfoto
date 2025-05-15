<?php
/**
 * Classe de ações para o módulo Webcamfoto
 * Implementa os hooks para adicionar o botão de captura na página de produtos
 *
 * @author     Webcamfoto Module
 * @copyright  2025 Webcamfoto Module
 * @license    GNU GPLv3
 */

require_once DOL_DOCUMENT_ROOT . '/core/class/commonhookactions.class.php';

/**
 * Classe de ações para o módulo Webcamfoto
 */
class ActionsWebcamfoto extends CommonHookActions
{
    /**
     * Constructor
     *
     * @param DoliDB $db Database handler
     */
    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * Adiciona o botão na ficha do produto - hook principal
     *
     * @param array $parameters Hook parameters
     * @param object $object Current object
     * @param string $action Current action
     * @param HookManager $hookmanager Hook manager
     * @return int Status code
     */
    public function addMoreActionsButtons($parameters, &$object, &$action, $hookmanager)
    {
        global $conf, $user, $langs;

        $error = 0;

        // Verifica se estamos na página do produto
        if (is_object($object) && get_class($object) == 'Product') {
            if ($user->rights->product->creer) {
                // Carrega as traduções
                $langs->load('webcamfoto@webcamfoto');

                // Adiciona o botão diretamente
                print '<a class="butAction" href="javascript:void(0);" onclick="openWebcamModal();">
                    <i class="fa fa-camera"></i> ' . $langs->trans('WebcamfotoCapture') . '
                </a>';

                // Adiciona o script necessário
                print "\n<!-- Webcamfoto Module -->\n";
                print '<link rel="stylesheet" type="text/css" href="'.DOL_URL_ROOT.'/custom/webcamfoto/css/webcamfoto.css">'."\n";
                print '<link rel="stylesheet" type="text/css" href="'.DOL_URL_ROOT.'/custom/webcamfoto/css/progress.css">'."\n";
                print '<link rel="stylesheet" type="text/css" href="'.DOL_URL_ROOT.'/custom/webcamfoto/css/ai_buttons.css">'."\n";
                
                // Carrega os scripts na ordem correta
                print '<script type="text/javascript" src="'.DOL_URL_ROOT.'/custom/webcamfoto/js/force_ai_button.js"></script>'."\n";
                print '<script type="text/javascript" src="'.DOL_URL_ROOT.'/custom/webcamfoto/js/inject_button.js"></script>'."\n";
                print '<script type="text/javascript" src="'.DOL_URL_ROOT.'/custom/webcamfoto/js/progress.js"></script>'."\n";
                print '<script type="text/javascript" src="'.DOL_URL_ROOT.'/custom/webcamfoto/js/webcam.js"></script>'."\n";
                print '<script type="text/javascript" src="'.DOL_URL_ROOT.'/custom/webcamfoto/js/ai_enhance.js"></script>'."\n";
                print '<script type="text/javascript" src="'.DOL_URL_ROOT.'/custom/webcamfoto/js/ai_button.js"></script>'."\n";
                print '<script type="text/javascript" src="'.DOL_URL_ROOT.'/custom/webcamfoto/js/fix_ia.js"></script>'."\n";
                print '<script type="text/javascript" src="'.DOL_URL_ROOT.'/custom/webcamfoto/js/show_ai_button.js"></script>'."\n";
                
                // Prepara o HTML do modal
                $modalHtml = '<div id="webcamfoto-modal" class="webcamfoto-modal">';
                $modalHtml .= '<div class="webcamfoto-modal-content">';
                $modalHtml .= '<div class="webcamfoto-modal-header">';
                $modalHtml .= '<span class="webcamfoto-close">&times;</span>';
                $modalHtml .= '<h2>' . $langs->trans('WebcamfotoCapture') . ' - Produto #' . addslashes($object->ref) . '</h2>';
                $modalHtml .= '</div>';
                $modalHtml .= '<div class="webcamfoto-modal-body">';
                $modalHtml .= '<!-- Painel de informações do produto -->';
                $modalHtml .= '<div id="webcamfoto-product-info" class="webcamfoto-product-info">';
                $modalHtml .= '<strong>ID:</strong> <span id="webcamfoto-product-id">' . (int) $object->id . '</span> | ';
                $modalHtml .= '<strong>Referência:</strong> <span id="webcamfoto-product-ref">' . addslashes($object->ref) . '</span>';
                $modalHtml .= '<div id="webcamfoto-product-name">' . addslashes($object->label) . '</div>';
                $modalHtml .= '</div>';
                $modalHtml .= '<div id="webcamfoto-video-container">';
                $modalHtml .= '<video id="webcamfoto-video" autoplay></video>';
                $modalHtml .= '</div>';
                $modalHtml .= '<div id="webcamfoto-canvas-container" style="display:none;">';
                $modalHtml .= '<canvas id="webcamfoto-canvas"></canvas>';
                $modalHtml .= '</div>';
                $modalHtml .= '<div id="webcamfoto-error" style="display:none;"></div>';
                $modalHtml .= '</div>';
                $modalHtml .= '<div class="webcamfoto-modal-footer">';
                $modalHtml .= '<button id="webcamfoto-capture" class="button">' . $langs->trans('WebcamfotoTakePhoto') . '</button>';
                $modalHtml .= '<button id="webcamfoto-retake" class="button" style="display:none;">' . $langs->trans('WebcamfotoRetakePhoto') . '</button>';
                $modalHtml .= '<button id="webcamfoto-save" class="button buttonload" style="display:none;">' . $langs->trans('WebcamfotoSavePhoto') . '</button>';
                $modalHtml .= '<button id="webcamfoto-enhance" class="button butAction webcamfoto-button-purple" style="display:none;">' . $langs->trans('OptimizeWithAI') . '</button>';
                $modalHtml .= '</div>';
                $modalHtml .= '</div>';
                $modalHtml .= '</div>';
                
                // Escapa aspas simples para o JavaScript
                $modalHtmlEscaped = str_replace("'", "\\'", $modalHtml);
                
                // Script para inicializar a webcam
                print '<script type="text/javascript">
                    function openWebcamModal() {
                        if (typeof WebcamFoto !== "undefined") {
                            WebcamFoto.init({
                                productId: ' . (int) $object->id . ',
                                productRef: "' . addslashes($object->ref) . '",
                                productName: "' . addslashes($object->label) . '"
                            });
                            WebcamFoto.openModal();
                        } else {
                            console.error("WebcamFoto not defined");
                        }
                    }
                    
                    // Adiciona o modal quando a página terminar de carregar
                    document.addEventListener("DOMContentLoaded", function() {
                        console.log("DOM carregado, inicializando webcamfoto");
                        console.log("ID do produto:", "' . (int) $object->id . '");
                        console.log("Referência do produto:", "' . addslashes($object->ref) . '");
                        
                        // Adiciona o modal ao final do body
                        document.body.insertAdjacentHTML("beforeend", \'' . $modalHtmlEscaped . '\');
                        
                        // Adiciona script para mostrar o botão de IA após a captura
                        document.getElementById("webcamfoto-capture").addEventListener("click", function() {
                            setTimeout(function() {
                                var enhanceBtn = document.getElementById("webcamfoto-enhance");
                                if (enhanceBtn) {
                                    enhanceBtn.style.display = "inline-block";
                                }
                            }, 500);
                        });
                    });
                </script>';
                
                // Script adicional para forçar a exibição do botão de IA
                print '<script type="text/javascript">
                    // Script para garantir que o botão de IA seja exibido
                    (function() {
                        console.log("Script de injeção direta do botão de IA carregado");
                        
                        // Função para mostrar o botão de IA
                        function forceShowAIButton() {
                            console.log("Forçando exibição do botão de IA via injeção direta");
                            
                            // Procura pelo botão de IA
                            var enhanceBtn = document.getElementById("webcamfoto-enhance");
                            if (enhanceBtn) {
                                // Força a exibição do botão
                                enhanceBtn.style.display = "inline-block";
                                enhanceBtn.style.visibility = "visible";
                                enhanceBtn.style.opacity = "1";
                                console.log("Botão de IA encontrado e forçado a ser exibido");
                            } else {
                                console.log("Botão de IA não encontrado, tentando criar");
                                
                                // Procura pelo footer do modal
                                var footer = document.querySelector(".webcamfoto-modal-footer");
                                if (footer) {
                                    // Cria o botão de IA
                                    var newBtn = document.createElement("button");
                                    newBtn.id = "webcamfoto-enhance";
                                    newBtn.className = "button butAction webcamfoto-button-purple";
                                    newBtn.textContent = "Otimizar com IA";
                                    newBtn.style.display = "inline-block";
                                    
                                    // Adiciona evento de clique
                                    newBtn.addEventListener("click", function() {
                                        console.log("Botão de IA clicado");
                                        if (window.WebcamFoto && typeof window.WebcamFoto.enhanceImage === "function") {
                                            window.WebcamFoto.enhanceImage(1);
                                        }
                                    });
                                    
                                    // Adiciona ao footer
                                    footer.appendChild(newBtn);
                                    console.log("Botão de IA criado e adicionado ao footer");
                                }
                            }
                        }
                        
                        // Executa após um tempo para garantir que o DOM esteja carregado
                        setTimeout(forceShowAIButton, 1000);
                        setTimeout(forceShowAIButton, 2000);
                        setTimeout(forceShowAIButton, 3000);
                        
                        // Observa mudanças no DOM para detectar quando o botão de captura é clicado
                        document.addEventListener("click", function(event) {
                            if (event.target && event.target.id === "webcamfoto-capture") {
                                console.log("Botão de captura clicado, forçando exibição do botão de IA");
                                setTimeout(forceShowAIButton, 500);
                                setTimeout(forceShowAIButton, 1000);
                            }
                        }, true);
                    })();
                </script>';
                
                print "<!-- Fim do Webcamfoto Module -->\n";
            }
        }

        if (!$error) {
            return 0;
        } else {
            $this->errors[] = 'Error in hook';
            return -1;
        }
    }

    /**
     * Execute actions
     *
     * @param array $parameters Hook parameters
     * @param object $object Current object
     * @param string $action Current action
     * @param HookManager $hookmanager Hook manager
     * @return int Status code
     */
    public function doActions($parameters, &$object, &$action, $hookmanager)
    {
        // Não fazemos nada aqui, pois agora estamos usando addMoreActionsButtons
        return 0;
    }

    /**
     * Adiciona links adicionais no menu de administração do módulo
     *
     * @param array $parameters Hook parameters
     * @param object $object Current object
     * @param string $action Current action
     * @param HookManager $hookmanager Hook manager
     * @return int Status code
     */
    public function addMoreAdminLink($parameters, &$object, &$action, $hookmanager)
    {
        global $langs, $user;
        
        // Verifica permissões de administrador
        if ($user->admin) {
            $langs->load('webcamfoto@webcamfoto');
            
            // Adiciona link para configuração de IA
            $linktext = '<span class="fa fa-cog"></span> ' . $langs->trans('WebcamfotoAISettings');
            $linkurl = dol_buildpath('/custom/webcamfoto/admin/setup_ai.php', 1);
            
            // Adiciona o link ao menu
            $hookmanager->resPrint .= '<li><a href="' . $linkurl . '">' . $linktext . '</a></li>';
        }
        
        return 0;
    }
}
