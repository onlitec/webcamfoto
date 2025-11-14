<?php
/* Copyright (C) 2025 Webcamfoto Module
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * \file    webcamfoto/core/modules/modWebcamfoto.class.php
 * \ingroup webcamfoto
 * \brief   Descrição do módulo Webcamfoto
 *
 * Este é o arquivo descritor do módulo Webcamfoto
 */

include_once DOL_DOCUMENT_ROOT . '/core/modules/DolibarrModules.class.php';

/**
 * Descrição e ativação do módulo Webcamfoto
 */
class modWebcamfoto extends DolibarrModules
{
    /**
     * Constructor. Define names, constants, directories, boxes, permissions
     *
     * @param DoliDB $db Database handler
     */
    public function __construct($db)
    {
        global $langs, $conf;
        $this->db = $db;

        // ID for module (must be unique).
        // Use a free id here
        // (See https://wiki.dolibarr.org/index.php/List_of_modules_id)
        $this->numero = 500000; // TODO: Verificar um número livre para o módulo

        // Key text used to identify module (for permissions, menus, etc...)
        $this->rights_class = 'webcamfoto';

        // Family can be 'base' (core modules),'crm','financial','hr','projects','products','ecm','technic' (transverse modules),'interface' (link with external tools),'other','...'
        // It is used to group modules by family in module setup page
        $this->family = "products";

        // Module position in the family
        $this->module_position = 500;

        // Gives the possibility for the module, to provide his own family info and position of this family
        $this->familyinfo = array(
            'products' => array(
                'position' => '001',
                'label' => $langs->trans("Products")
            )
        );

        // Module label (no space allowed), used if translation string 'ModuleWebcamfotoName' not found
        $this->name = preg_replace('/^mod/i', '', get_class($this));

        // Module description, used if translation string 'ModuleWebcamfotoDesc' not found
        $this->description = "Capturar fotos dos produtos usando a webcam";
        // Used only if file README.md and README-LL.md not found.
        $this->descriptionlong = "Módulo para capturar fotos dos produtos usando a webcam conectada ao computador do usuário";

        // Mostrado no login
        $this->version = '2.0.0';

        // Key used in llx_const table to save module status enabled/disabled
        $this->const_name = 'MAIN_MODULE_' . strtoupper($this->name);

        // Name of image file used for this module.
        // If file is in theme/yourtheme/img directory under name object_pictovalue.png, use this->picto='pictovalue'
        // If file is in module/img directory under name object_pictovalue.png, use this->picto='pictovalue@module'
        $this->picto = 'webcamfoto@webcamfoto';

        // Define some features supported by module (triggers, login, substitutions, menus, css, etc...)
        $this->module_parts = array(
            // Set this to 1 if module has its own trigger directory (core/triggers)
            'triggers' => 0,
            // Set this to 1 if module has its own login method file (core/login)
            'login' => 0,
            // Set this to 1 if module has its own substitution function file (core/substitutions)
            'substitutions' => 0,
            // Set this to 1 if module has its own menus handler directory (core/menus)
            'menus' => 0,
            // Set this to 1 if module overwrite template dir (core/tpl)
            'tpl' => 0,
            // Set this to 1 if module has its own barcode directory (core/modules/barcode)
            'barcode' => 0,
            // Set this to 1 if module has its own models directory (core/modules/xxx)
            'models' => 0,
            // Set this to 1 if module has its own printing directory (core/modules/printing)
            'printing' => 0,
            // Set this to 1 if module has its own theme directory (theme)
            'theme' => 0,
            // Set this to relative path of css file if module has its own css file
            'css' => array('/custom/webcamfoto/css/webcamfoto.css'),
            // Set this to relative path of js file if module must load a js on all pages
            'js' => array(
                // '/custom/webcamfoto/js/webcam.js', // Removido para evitar conflito com webcam_page.js
                '/custom/webcamfoto/js/inject_button.js',
                '/custom/webcamfoto/js/webcamfoto.js'
            ),
            // Set here all hooks context managed by module. You can also set hook context 'all'
            'hooks' => array(
                'productcard', 
                'main',
                'formfile',
                'formobject',
                'globalcard'
            ),
            // Set this to 1 if features of module are opened to external users
            'moduleforexternal' => 0,
        );

        // Data directories to create when module is enabled.
        $this->dirs = array(
            "/webcamfoto/temp",
        );

        // Config pages. Put here list of php page, stored into webcamfoto/admin directory, to use to setup module.
        $this->config_page_url = array("setup.php@webcamfoto");

        // Dependencies
        // List of module class names as string that must be enabled if this module is enabled. Example: array('always1'=>'modModuleToEnable1','always2'=>'modModuleToEnable2', 'FR1'=>'modModuleToEnableFR'...)
        $this->depends = array('modProduct');
        $this->requiredby = array(); // List of module class names as string to disable if this one is disabled. Example: array('modModuleToDisable1', ...)
        $this->conflictwith = array(); // List of module class names as string this module is in conflict with. Example: array('modModuleToDisable1', ...)
        $this->langfiles = array("webcamfoto@webcamfoto");
        $this->phpmin = array(7, 1); // Minimum version of PHP required by module
        $this->need_dolibarr_version = array(12, 0); // Minimum version of Dolibarr required by module
        $this->warnings_activation = array(); // Warning to show when we activate module. array('always'='text') or array('FR'='textfr','ES'='textes'...)
        $this->warnings_activation_ext = array(); // Warning to show when we activate an external module. array('always'='text') or array('FR'='textfr','ES'='textes'...)
        //$this->automatic_activation = array('FR'=>'WebcamfotoWasAutomaticallyActivatedBecauseOfYourCountryChoice');
        //$this->always_enabled = true;                                // If true, can't be disabled

        // Constants
        // List of particular constants to add when module is enabled (key, 'chaine', value, desc, visible, 'current' or 'allentities', deleteonunactive)
        $this->const = array(
            // Configurações padrão para o módulo
            array('WEBCAMFOTO_QUALITY', 'chaine', '90', 'Qualidade da imagem (1-100)', 1, 'current', 1),
            array('WEBCAMFOTO_WIDTH', 'chaine', '800', 'Largura da imagem', 1, 'current', 1),
            array('WEBCAMFOTO_HEIGHT', 'chaine', '600', 'Altura da imagem', 1, 'current', 1),
            array('WEBCAMFOTO_SET_AS_MAIN', 'chaine', '0', 'Definir como imagem principal', 1, 'current', 1),
            // CONST TO ENABLE TO HAVE HOOK WORKING
            array('WEBCAMFOTO_ENABLE_HOOK_PRODUCTCARD', 'chaine', '1', 'Enable hook for product card', 1, 'current', 1),
            array('WEBCAMFOTO_ENABLE_HOOK_MAIN', 'chaine', '1', 'Enable hook for main', 1, 'current', 1),
            array('WEBCAMFOTO_ENABLE_HOOK_FORMFILE', 'chaine', '1', 'Enable hook for formfile', 1, 'current', 1),
            array('WEBCAMFOTO_ENABLE_HOOK_FORMOBJECT', 'chaine', '1', 'Enable hook for formobject', 1, 'current', 1),
        );

        // Array to add new pages in new tabs
        $this->tabs = array();

        // Dictionaries
        $this->dictionaries = array();

        // Boxes/Widgets
        $this->boxes = array();

        // Permissions provided by this module
        $this->rights = array();
        $r = 0;

        // Main menu entries to add
        $this->menu = array();
        $r = 0;

        // Add here entries to declare new menus
        $this->menu[$r++] = array(
            'fk_menu' => 'fk_mainmenu=products,fk_leftmenu=product',    // Use 'fk_mainmenu=xxx' or 'fk_mainmenu=xxx,fk_leftmenu=yyy'
            'type' => 'left',                                           // This is a Left menu entry
            'titre' => 'Webcamfoto',
            'prefix' => img_picto('', $this->picto, 'class="paddingright pictofixedwidth"'),
            'mainmenu' => 'products',
            'leftmenu' => 'webcamfoto',
            'url' => '/webcamfoto/admin/setup.php',
            'langs' => 'webcamfoto@webcamfoto',                         // Lang file to use (without .lang) by module. File must be in langs/code_CODE/ directory.
            'position' => 1000 + $r,
            'enabled' => '$conf->webcamfoto->enabled',                  // Define condition to show or hide menu entry. Use '$conf->webcamfoto->enabled' if entry must be visible if module is enabled.
            'perms' => '$user->rights->product->creer',                 // Use 'perms'=>'$user->rights->webcamfoto->level1->level2' if you want your menu with a permission rules
            'target' => '',
            'user' => 0,                                                // 0=Menu for internal users, 1=external users, 2=both
        );
        $r++;
    }

    /**
     * Function called when module is enabled.
     * The init function add constants, boxes, permissions and menus (defined in constructor) into Dolibarr database.
     * It also creates data directories
     *
     * @param string $options Options when enabling module ('', 'noboxes')
     * @return int 1 if OK, 0 if KO
     */
    public function init($options = '')
    {
        $result = $this->_load_tables('/webcamfoto/sql/');
        if ($result < 0) {
            return -1; // Do not activate module if error 'not allowed' returned when loading module SQL queries (the _load_table run sql with run_sql with the error allowed parameter set to 'default')
        }

        // Create extrafields during init
        //include_once DOL_DOCUMENT_ROOT.'/core/class/extrafields.class.php';
        //$extrafields = new ExtraFields($this->db);
        //$result1=$extrafields->addExtraField('webcamfoto_myattr1', "New Attr 1 label", 'boolean', 1,  3, 'thirdparty',   0, 0, '', '', 1, '', 0, 0, '', '', 'webcamfoto@webcamfoto', '$conf->webcamfoto->enabled');
        //$result2=$extrafields->addExtraField('webcamfoto_myattr2', "New Attr 2 label", 'varchar', 1, 10, 'project',      0, 0, '', '', 1, '', 0, 0, '', '', 'webcamfoto@webcamfoto', '$conf->webcamfoto->enabled');
        //$result3=$extrafields->addExtraField('webcamfoto_myattr3', "New Attr 3 label", 'varchar', 1, 10, 'bank_account', 0, 0, '', '', 1, '', 0, 0, '', '', 'webcamfoto@webcamfoto', '$conf->webcamfoto->enabled');
        //$result4=$extrafields->addExtraField('webcamfoto_myattr4', "New Attr 4 label", 'select',  1,  3, 'thirdparty',   0, 1, '', array('options'=>array('code1'=>'Val1','code2'=>'Val2','code3'=>'Val3')), 1,'', 0, 0, '', '', 'webcamfoto@webcamfoto', '$conf->webcamfoto->enabled');
        //$result5=$extrafields->addExtraField('webcamfoto_myattr5', "New Attr 5 label", 'text',    1, 10, 'user',         0, 0, '', '', 1, '', 0, 0, '', '', 'webcamfoto@webcamfoto', '$conf->webcamfoto->enabled');

        // Permissions
        $this->remove($options);

        $sql = array();

        // Document templates
        $moduledir = 'webcamfoto';
        $myTmpObjects = array();
        $myTmpObjects['MyObject'] = array('includerefgeneration' => 0, 'includedocgeneration' => 0);

        foreach ($myTmpObjects as $myTmpObjectKey => $myTmpObjectArray) {
            if ($myTmpObjectKey == 'MyObject') {
                continue;
            }
            if ($myTmpObjectArray['includerefgeneration']) {
                $src = DOL_DOCUMENT_ROOT . '/install/doctemplates/webcamfoto/template_myobjects.odt';
                $dirodt = DOL_DATA_ROOT . '/doctemplates/webcamfoto';
                $dest = $dirodt . '/template_myobjects.odt';

                if (file_exists($src) && !file_exists($dest)) {
                    require_once DOL_DOCUMENT_ROOT . '/core/lib/files.lib.php';
                    dol_mkdir($dirodt);
                    $result = dol_copy($src, $dest, 0, 0);
                    if ($result < 0) {
                        $langs->load("errors");
                        $this->error = $langs->trans('ErrorFailToCopyFile', $src, $dest);
                        return 0;
                    }
                }

                $sql = array_merge($sql, array(
                    "DELETE FROM " . MAIN_DB_PREFIX . "document_model WHERE nom = 'standard_" . strtolower($myTmpObjectKey) . "' AND type = '" . strtolower($myTmpObjectKey) . "' AND entity = " . $conf->entity,
                    "INSERT INTO " . MAIN_DB_PREFIX . "document_model (nom, type, entity) VALUES('standard_" . strtolower($myTmpObjectKey) . "','" . strtolower($myTmpObjectKey) . "'," . $conf->entity . ")",
                    "DELETE FROM " . MAIN_DB_PREFIX . "document_model WHERE nom = 'generic_" . strtolower($myTmpObjectKey) . "_odt' AND type = '" . strtolower($myTmpObjectKey) . "' AND entity = " . $conf->entity,
                    "INSERT INTO " . MAIN_DB_PREFIX . "document_model (nom, type, entity) VALUES('generic_" . strtolower($myTmpObjectKey) . "_odt', '" . strtolower($myTmpObjectKey) . "', " . $conf->entity . ")"
                ));
            }
        }

        return $this->_init($sql, $options);
    }

    /**
     * Function called when module is disabled.
     * Remove from database constants, boxes and permissions from Dolibarr database.
     * Data directories are not deleted
     *
     * @param string $options Options when enabling module ('', 'noboxes')
     * @return int 1 if OK, 0 if KO
     */
    public function remove($options = '')
    {
        $sql = array();
        return $this->_remove($sql, $options);
    }
}
