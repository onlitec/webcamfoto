<?php
/**
 * Página de configuração do módulo Webcamfoto
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
$setuppage = "setup";

/*
 * Ações
 */

if ($action == 'update') {
    $webcamfoto_quality = GETPOST('WEBCAMFOTO_QUALITY', 'int');
    $webcamfoto_width = GETPOST('WEBCAMFOTO_WIDTH', 'int');
    $webcamfoto_height = GETPOST('WEBCAMFOTO_HEIGHT', 'int');
    $webcamfoto_set_as_main = GETPOST('WEBCAMFOTO_SET_AS_MAIN', 'int');
    
    // Validações
    $error = 0;
    
    // Qualidade deve estar entre 1 e 100
    if ($webcamfoto_quality < 1 || $webcamfoto_quality > 100) {
        setEventMessages($langs->trans('ErrorValueMustBeBetween', 1, 100), null, 'errors');
        $error++;
    }
    
    // Largura e altura devem ser números positivos
    if ($webcamfoto_width < 1) {
        setEventMessages($langs->trans('ErrorValueMustBePositive'), null, 'errors');
        $error++;
    }
    
    if ($webcamfoto_height < 1) {
        setEventMessages($langs->trans('ErrorValueMustBePositive'), null, 'errors');
        $error++;
    }
    
    if (!$error) {
        // Salva as configurações
        dolibarr_set_const($db, 'WEBCAMFOTO_QUALITY', $webcamfoto_quality, 'chaine', 0, '', $conf->entity);
        dolibarr_set_const($db, 'WEBCAMFOTO_WIDTH', $webcamfoto_width, 'chaine', 0, '', $conf->entity);
        dolibarr_set_const($db, 'WEBCAMFOTO_HEIGHT', $webcamfoto_height, 'chaine', 0, '', $conf->entity);
        dolibarr_set_const($db, 'WEBCAMFOTO_SET_AS_MAIN', $webcamfoto_set_as_main, 'chaine', 0, '', $conf->entity);
        
        setEventMessages($langs->trans('SetupSaved'), null);
        header('Location: '.$_SERVER['PHP_SELF']);
        exit;
    }
}

/*
 * Exibição
 */

$form = new Form($db);

llxHeader('', $langs->trans('WebcamfotoSetup'));

// Título do módulo
$linkback = '<a href="'.DOL_URL_ROOT.'/admin/modules.php?restore_lastsearch_values=1">'.$langs->trans('BackToModuleList').'</a>';
print load_fiche_titre($langs->trans('WebcamfotoSetup'), $linkback, 'title_setup');

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

// Qualidade da imagem
print '<tr class="oddeven">';
print '<td>'.$langs->trans('WEBCAMFOTO_QUALITY').'</td>';
print '<td><input type="number" class="flat" name="WEBCAMFOTO_QUALITY" value="'.(!empty($conf->global->WEBCAMFOTO_QUALITY) ? $conf->global->WEBCAMFOTO_QUALITY : '90').'" min="1" max="100"></td>';
print '<td>'.$langs->trans('WEBCAMFOTO_QUALITY_DESC').'</td>';
print '</tr>';

// Largura da imagem
print '<tr class="oddeven">';
print '<td>'.$langs->trans('WEBCAMFOTO_WIDTH').'</td>';
print '<td><input type="number" class="flat" name="WEBCAMFOTO_WIDTH" value="'.(!empty($conf->global->WEBCAMFOTO_WIDTH) ? $conf->global->WEBCAMFOTO_WIDTH : '800').'" min="1"></td>';
print '<td>'.$langs->trans('WEBCAMFOTO_WIDTH_DESC').'</td>';
print '</tr>';

// Altura da imagem
print '<tr class="oddeven">';
print '<td>'.$langs->trans('WEBCAMFOTO_HEIGHT').'</td>';
print '<td><input type="number" class="flat" name="WEBCAMFOTO_HEIGHT" value="'.(!empty($conf->global->WEBCAMFOTO_HEIGHT) ? $conf->global->WEBCAMFOTO_HEIGHT : '600').'" min="1"></td>';
print '<td>'.$langs->trans('WEBCAMFOTO_HEIGHT_DESC').'</td>';
print '</tr>';

// Definir como imagem principal
print '<tr class="oddeven">';
print '<td>'.$langs->trans('WEBCAMFOTO_SET_AS_MAIN').'</td>';
print '<td>';
print $form->selectyesno('WEBCAMFOTO_SET_AS_MAIN', (!empty($conf->global->WEBCAMFOTO_SET_AS_MAIN) ? $conf->global->WEBCAMFOTO_SET_AS_MAIN : '0'), 1);
print '</td>';
print '<td>'.$langs->trans('WEBCAMFOTO_SET_AS_MAIN_DESC').'</td>';
print '</tr>';

print '</table>';

print '<br>';

print '<div class="center">';
print '<input type="submit" class="button" value="'.$langs->trans('Save').'">';
print '</div>';

print '</form>';

// Página sobre o módulo (informações e documentação)
print load_fiche_titre($langs->trans('About'), '', '');

print '<div class="fichecenter">';
print '<div class="underbanner clearboth"></div>';

print '<br>';

print '<div class="div-table-responsive-no-min">';
print '<table class="noborder centpercent">';

print '<tr class="liste_titre">';
print '<td>'.$langs->trans('WebcamfotoInformation').'</td>';
print '<td></td>';
print '</tr>';

print '<tr class="oddeven">';
print '<td>'.$langs->trans('Version').'</td>';
print '<td>'.$myModWebcamfoto->version.'</td>';
print '</tr>';

print '<tr class="oddeven">';
print '<td>'.$langs->trans('Description').'</td>';
print '<td>'.$langs->trans('ModuleWebcamfotoDesc').'</td>';
print '</tr>';

print '</table>';
print '</div>';

print '</div>';

// Rodapé
llxFooter();
$db->close();
