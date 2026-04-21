<?php
require_once 'HTML/QuickForm/text.php';

class HTML_QuickForm_depselect extends HTML_QuickForm_text {

    function __construct(
            $elementName=null,
            $elementLabel=null,
            $attributes=null,
            $properties=null){
        // PHP 4-style parent constructors are fatal in PHP 8. Prefer
        // parent::__construct(), but fall back to the PHP 4 ctor name
        // for installations running against pre-modernized PEAR
        // HTML_QuickForm bundles shipped with older xataface versions.
        if (is_callable(array('HTML_QuickForm_input', '__construct'))) {
            parent::__construct($elementName, $elementLabel, $attributes);
        } else {
            parent::HTML_QuickForm_input($elementName, $elementLabel, $attributes);
        }
    }

    function toHtml(){
        $oldFrozen = $this->_flagFrozen;
        $this->_flagFrozen = 0;
        if ( intval($oldFrozen) !== 0 ){
            $this->updateAttributes(array('data-depselect-frozen'=> '1'));
            
        }
        $out = parent::toHtml();
        $this->_flagFrozen = $oldFrozen;
        return $out;
    }
}
