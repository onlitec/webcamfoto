<?php
/**
 * Página de configuração de IA para o módulo Webcamfoto
 *
 * @author     Webcamfoto Module
 * @copyright  2025 Webcamfoto Module
 * @license    GNU GPLv3
 */

// Load Dolibarr environment
require '../../../main.inc.php';
require_once DOL_DOCUMENT_ROOT . '/core/lib/admin.lib.php';
require_once '../core/modules/modWebcamfoto.class.php';

// Traduções
$langs->loadLangs(array('admin', 'webcamfoto@webcamfoto'));

// Acesso restrito aos administradores
if (!$user->admin) {
    accessforbidden();
}

// Parâmetros
$action = GETPOST('action', 'alpha');

// Define object
$myModWebcamfoto = new modWebcamfoto($db);

// Configuração
$setuppage = "setup_ai";

// Verificar se a tabela de configurações existe
function ensureIAConfigTableExists($db) {
    $tableName = MAIN_DB_PREFIX . 'webcamfoto_ia_config';
    $sqlCheck = "SHOW TABLES LIKE '" . $db->escape($tableName) . "'";
    $resql = $db->query($sqlCheck);
    if ($resql && $db->num_rows($resql) == 0) {
        $sqlCreate = "CREATE TABLE " . $tableName . " (
            id INT AUTO_INCREMENT PRIMARY KEY,
            model_name VARCHAR(50) DEFAULT 'default',
            settings TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )";
        if (!$db->query($sqlCreate)) {
            dol_syslog("Erro ao criar tabela: " . $db->lasterror(), LOG_ERR);
            return false;
        }
        dol_syslog("Tabela de configurações criada com sucesso", LOG_INFO);
    }
    return true;
}

// Carregar configurações
function loadIAConfig($db) {
    $sql = "SELECT model_name, settings FROM " . MAIN_DB_PREFIX . "webcamfoto_ia_config ORDER BY id DESC LIMIT 1";
    $resql = $db->query($sql);
    if ($resql) {
        if ($obj = $db->fetch_object($resql)) {
            return array('model_name' => $obj->model_name, 'settings' => json_decode($obj->settings, true));
        }
    }
    return array('model_name' => 'default', 'settings' => array()); // Configuração padrão se não encontrada
}

// Salvar configurações
function saveIAConfig($db, $model_name, $settings) {
    $settings_json = $db->escape(json_encode($settings));
    $sql = "INSERT INTO " . MAIN_DB_PREFIX . "webcamfoto_ia_config (model_name, settings) VALUES ('" . $db->escape($model_name) . "', '" . $settings_json . "')";
    if (!$db->query($sql)) {
        dol_syslog("Erro ao salvar configurações: " . $db->lasterror(), LOG_ERR);
        return false;
    }
    return true;
}

/*
 * Ações
 */

// Garantir que a tabela existe
ensureIAConfigTableExists($db);

// Carregar configurações atuais
$config = loadIAConfig($db);
$current_model = $config['model_name'] ?? 'default';
$current_settings = $config['settings'] ?? array();

if ($action == 'update') {
    $model_name = GETPOST('WEBCAMFOTO_AI_MODEL', 'alpha');
    $api_key = GETPOST('WEBCAMFOTO_AI_API_KEY', 'restricthtml');
    $scale = GETPOST('WEBCAMFOTO_AI_SCALE', 'int');
    $quality = GETPOST('WEBCAMFOTO_AI_QUALITY', 'int');
    $prompt = GETPOST('WEBCAMFOTO_AI_PROMPT', 'restricthtml');
    
    // Validações
    $error = 0;
    
    // Escala deve estar entre 1 e 4
    if ($scale < 1 || $scale > 4) {
        setEventMessages($langs->trans('ErrorValueMustBeBetween', 1, 4), null, 'errors');
        $error++;
    }
    
    // Qualidade deve estar entre 1 e 100
    if ($quality < 1 || $quality > 100) {
        setEventMessages($langs->trans('ErrorValueMustBeBetween', 1, 100), null, 'errors');
        $error++;
    }
    
    if (!$error) {
        // Preparar configurações para salvar
        $settings = array(
            'api_key' => $api_key,
            'scale' => $scale,
            'quality' => $quality,
            'prompt' => $prompt
        );
        
        // Salvar no banco de dados
        if (saveIAConfig($db, $model_name, $settings)) {
            // Também salvar nas constantes do Dolibarr para compatibilidade
            dolibarr_set_const($db, 'WEBCAMFOTO_AI_PROVIDER', $model_name, 'chaine', 0, '', $conf->entity);
            dolibarr_set_const($db, 'WEBCAMFOTO_AI_API_KEY', $api_key, 'chaine', 0, '', $conf->entity);
            dolibarr_set_const($db, 'WEBCAMFOTO_AI_SCALE', $scale, 'chaine', 0, '', $conf->entity);
            dolibarr_set_const($db, 'WEBCAMFOTO_AI_QUALITY', $quality, 'chaine', 0, '', $conf->entity);
            
            setEventMessages($langs->trans('SetupSaved'), null);
        } else {
            setEventMessages($langs->trans('ErrorSavingSettings'), null, 'errors');
        }
        
        header('Location: '.$_SERVER['PHP_SELF']);
        exit;
    }
}

/*
 * Exibição
 */

$form = new Form($db);

llxHeader('', $langs->trans('WebcamfotoAISettings'));

// Título do módulo
$linkback = '<a href="'.DOL_URL_ROOT.'/admin/modules.php?restore_lastsearch_values=1">'.$langs->trans('BackToModuleList').'</a>';
print load_fiche_titre($langs->trans('WebcamfotoAISettings'), $linkback, 'title_setup');

// Abas de configuração
$head = array();
$head[0][0] = 'setup.php';
$head[0][1] = $langs->trans('Settings');
$head[1][0] = 'setup_ai.php';
$head[1][1] = $langs->trans('WebcamfotoAISettings');
$head[1][2] = 'ai';

print dol_get_fiche_head($head, 1, $langs->trans('WebcamfotoModule'), -1, 'webcamfoto@webcamfoto');

// Setup page
print '<form method="POST" action="'.$_SERVER['PHP_SELF'].'">';
print '<input type="hidden" name="token" value="'.newToken().'">';
print '<input type="hidden" name="action" value="update">';

print '<table class="noborder centpercent">';
print '<tr class="liste_titre">';
print '<td>'.$langs->trans('Parameter').'</td>';
print '<td>'.$langs->trans('Value').'</td>';
print '<td>'.$langs->trans('Description').'</td>';
print '</tr>';

// Modelo de IA
print '<tr class="oddeven">';
print '<td>'.$langs->trans('WEBCAMFOTO_AI_MODEL').'</td>';
print '<td>';
$models = array(
    'pixelcut' => 'Pixelcut (Recomendado)',
    'openai/dalle3' => 'OpenAI DALL-E 3',
    'stability-ai/sdxl' => 'Stability AI SDXL',
    'anthropic/claude' => 'Anthropic Claude'
);
print $form->selectarray('WEBCAMFOTO_AI_MODEL', $models, $current_model, 0, 0, 0, '', 0, 0, 0, '', 'minwidth200');
print '</td>';
print '<td>'.$langs->trans('WEBCAMFOTO_AI_MODEL_DESC').'</td>';
print '</tr>';

// Chave API
print '<tr class="oddeven">';
print '<td>'.$langs->trans('WEBCAMFOTO_AI_API_KEY').'</td>';
print '<td>';
print '<input type="password" name="WEBCAMFOTO_AI_API_KEY" value="'.$current_settings['api_key'].'" class="flat minwidth200">';
print '</td>';
print '<td>'.$langs->trans('WEBCAMFOTO_AI_API_KEY_DESC').'</td>';
print '</tr>';

// Escala
print '<tr class="oddeven">';
print '<td>'.$langs->trans('WEBCAMFOTO_AI_SCALE').'</td>';
print '<td>';
print '<input type="number" name="WEBCAMFOTO_AI_SCALE" value="'.($current_settings['scale'] ?? 2).'" class="flat" min="1" max="4">';
print '</td>';
print '<td>'.$langs->trans('WEBCAMFOTO_AI_SCALE_DESC').'</td>';
print '</tr>';

// Qualidade
print '<tr class="oddeven">';
print '<td>'.$langs->trans('WEBCAMFOTO_AI_QUALITY').'</td>';
print '<td>';
print '<input type="number" name="WEBCAMFOTO_AI_QUALITY" value="'.($current_settings['quality'] ?? 90).'" class="flat" min="1" max="100">';
print '</td>';
print '<td>'.$langs->trans('WEBCAMFOTO_AI_QUALITY_DESC').'</td>';
print '</tr>';

// Prompt personalizado
print '<tr class="oddeven">';
print '<td>'.$langs->trans('WEBCAMFOTO_AI_PROMPT').'</td>';
print '<td>';
print '<textarea name="WEBCAMFOTO_AI_PROMPT" class="flat minwidth400" rows="3">'.($current_settings['prompt'] ?? 'Aprimorar esta imagem de produto para e-commerce: melhorar qualidade, iluminação e nitidez.').'</textarea>';
print '</td>';
print '<td>'.$langs->trans('WEBCAMFOTO_AI_PROMPT_DESC').'</td>';
print '</tr>';

print '</table>';

print '<br>';

// Botões
print '<div class="center">';
print '<input type="submit" class="button" value="'.$langs->trans('Save').'">';
print '</div>';

print '</form>';

// Métricas de performance
print '<br>';
print '<div class="div-table-responsive-no-min">';
print '<table class="noborder centpercent">';
print '<tr class="liste_titre">';
print '<td colspan="2">'.$langs->trans('PerformanceMetrics').'</td>';
print '</tr>';

// Buscar estatísticas de uso
$sql = "SELECT COUNT(*) as total, AVG(TIMESTAMPDIFF(SECOND, created_at, updated_at)) as avg_time FROM " . MAIN_DB_PREFIX . "webcamfoto_ia_config";
$resql = $db->query($sql);
if ($resql && ($obj = $db->fetch_object($resql))) {
    print '<tr class="oddeven">';
    print '<td>'.$langs->trans('TotalConfigurations').'</td>';
    print '<td>'.$obj->total.'</td>';
    print '</tr>';
    
    print '<tr class="oddeven">';
    print '<td>'.$langs->trans('AverageConfigTime').'</td>';
    print '<td>'.round($obj->avg_time, 2).' '.$langs->trans('seconds').'</td>';
    print '</tr>';
}

print '</table>';
print '</div>';

// Fim da página
print dol_get_fiche_foot();
llxFooter();
$db->close();
