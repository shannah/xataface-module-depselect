<?php
/*
 * Xataface DepSelect Module
 * Copyright (C) 2011  Steve Hannah <steve@weblite.ca>
 * 
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 * 
 * You should have received a copy of the GNU Library General Public
 * License along with this library; if not, write to the
 * Free Software Foundation, Inc., 51 Franklin St, Fifth Floor,
 * Boston, MA  02110-1301, USA.
 *
 */
/**
 * @brief A Dataface_FormTool wrapper for building depselect widgets in Dataface_QuickForm forms.
 *
 * All widget types require a wrapper of this kind to implement the glue between the field and the 
 * database records.  This particular wrapper only implements the buildWidget() method but
 * it could also implement pushValue() and pullValue() methods to define how data should be treated
 * when passing between Dataface_RecordObjects and the HTML_QuickForm widget.
 *
 * Note that the modules_depselect class actually registers this class with Dataface_FormTool so that
 * it knows of its existence.
 *
 */
class Dataface_FormTool_depselect  {

	/**
	 * Defines how a depselect widget should be built.
	 *
	 * @param Dataface_Record $record The Dataface_Record that is being edited.
	 * @param array &$field The field configuration data structure that the widget is being generated for.
	 * @param HTML_QuickForm The form to which the field is to be added.
	 * @param string $formFieldName The name of the field in the form.
	 * @param boolean $new Whether this widget is being built for a new record form.
	 * @return HTML_QuickForm_element The element that can be added to a form.
	 *
	 */
	function &buildWidget(&$record, &$field, &$form, $formFieldName, $new=false){
		$factory = Dataface_FormTool::factory();
		$mt = Dataface_ModuleTool::getInstance();
		$mod = $mt->loadModule('modules_depselect');
		//$atts = $el->getAttributes();
		$widget =& $field['widget'];
		$atts = array();
		if ( !@$atts['class'] ) $atts['class'] = '';
		$atts['class'] .= ' xf-depselect';
		if ( !@$atts['data-xf-table'] ){
			$atts['data-xf-table'] = $field['tablename'];
		}
		$targetTable = Dataface_Table::loadTable($field['widget']['table']);
		if ( PEAR::isError($targetTable) ){
			error_log("Your field $formFieldName is missing the widget:table directive or the table does not exist.");
			throw new Exception("Your field $formFieldName is missing the widget:table directive or the table does not exist.");
		}
		$targetPerms = $targetTable->getPermissions();
		$atts['data-xf-depselect-options-table'] = $field['widget']['table'];
		if ( @$targetPerms['new'] ){
			$atts['data-xf-depselect-perms-new'] = 1;
		}
		$atts['df:cloneable'] = 1;
		
                
		$jt = Dataface_JavascriptTool::getInstance();
		$jt->addPath(dirname(__FILE__).'/js', $mod->getBaseURL().'/js');
		
		$ct = Dataface_CSSTool::getInstance();
		$ct->addPath(dirname(__FILE__).'/css', $mod->getBaseURL().'/css');
		
		// Add our javascript
		$jt->import('xataface/widgets/depselect.js');
		
		$filters = array();
		if ( @$field['widget']['filters']  and is_array($field['widget']['filters'])){
			foreach ($field['widget']['filters'] as $key=>$val){
				$filters[] = urlencode($key).'='.urlencode($val);
			}
		}
		
		$atts['data-xf-depselect-filters'] = implode('&', $filters);
	
	
		
		if ( @$field['widget']['nomatch'] ){
			$atts['data-xf-depselect-nomatch'] = $field['widget']['nomatch'];
		}
		
		//$el->setAttributes($atts);
		$el = $factory->addElement('text', $formFieldName, $widget['label'], $atts);
		if ( PEAR::isError($el) ) throw new Exception($el->getMessage(), $el->getCode());
		
	
		return $el;
	}
	

}