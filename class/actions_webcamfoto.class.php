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
                print '<script type="text/javascript" src="'.DOL_URL_ROOT.'/custom/webcamfoto/js/webcam.js"></script>'."\n";
                print '<script type="text/javascript">
                    function openWebcamModal() {
                        if (typeof WebcamFoto !== "undefined") {
                            WebcamFoto.init(' . (int) $object->id . ');
                            WebcamFoto.openModal();
                        } else {
                            console.error("WebcamFoto not defined");
                        }
                    }
                    
                    // Adiciona o modal quando a página terminar de carregar
                    document.addEventListener("DOMContentLoaded", function() {
                        // Criação do modal
                        var modalHtml = `
                        <div id="webcamfoto-modal" class="webcamfoto-modal">
                          <div class="webcamfoto-modal-content">
                            <div class="webcamfoto-modal-header">
                              <span class="webcamfoto-close">&times;</span>
                              <h2>' . $langs->trans('WebcamfotoCapture') . '</h2>
                            </div>
                            <div class="webcamfoto-modal-body">
                              <div id="webcamfoto-video-container">
                                <video id="webcamfoto-video" autoplay></video>
                              </div>
                              <div id="webcamfoto-canvas-container" style="display:none;">
                                <canvas id="webcamfoto-canvas"></canvas>
                              </div>
                              <div id="webcamfoto-error" style="display:none;"></div>
                            </div>
                            <div class="webcamfoto-modal-footer">
                              <button id="webcamfoto-capture" class="button">' . $langs->trans('WebcamfotoTakePhoto') . '</button>
                              <button id="webcamfoto-retake" class="button" style="display:none;">' . $langs->trans('WebcamfotoRetakePhoto') . '</button>
                              <button id="webcamfoto-save" class="button buttonload" style="display:none;">' . $langs->trans('WebcamfotoSavePhoto') . '</button>
                            </div>
                          </div>
                        </div>`;
                        
                        // Adiciona o modal ao final do body
                        document.body.insertAdjacentHTML("beforeend", modalHtml);
                    });
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
}
