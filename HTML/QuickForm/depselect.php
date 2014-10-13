<?php
require_once 'HTML/QuickForm/text.php';

class HTML_QuickForm_depselect extends HTML_QuickForm_text {
    
    function HTML_QuickForm_depselect(
            $elementName=null, 
            $elementLabel=null, 
            $attributes=null, 
            $properties=null){
        parent::HTML_QuickForm_input($elementName, $elementLabel, $attributes);
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

