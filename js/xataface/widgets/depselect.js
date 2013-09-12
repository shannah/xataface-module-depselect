/*
 * Xataface Depselect Module
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
 
 
//require <jquery.packed.js>
//require <jquery-ui.min.js>
//require-css <jquery-ui/jquery-ui.css>
//require <RecordDialog/RecordDialog.js>
//require-css <xataface/widgets/depselect.css>  
(function(){
	var $ = jQuery;
	
	
	/**
	 * Finds a field by name relative to a starting point.  It will search only within
	 * the startNode's form group (i.e. class xf-form-group).
	 *
	 * @param {HTMLElement} startNode The starting point of our search (we search for siblings).
	 * @param {String} fieldName The name of the field we are searching for.
	 *
	 * @return {HTMLElement} The found field or null if it cannot find it.
	 */
	function findField(startNode, fieldName){
		
		var parentGroup = $(startNode).parents('.xf-form-group').get(0);
		if ( !parentGroup ) parentGroup = $(startNode).parents('form').get(0);
		if ( !parentGroup ) return null;
		//alert('here');
		var fld = $('[data-xf-field="'+fieldName+'"]', parentGroup).get(0);
		return fld;
	}
	
	
	/**
	 * Updates the values for a depselect list.  This is usually called in 
	 * response to a change in one of the selects that this depselect
	 * is dependent upon.
	 *
	 * @param {HTMLElement} select The depselect <select> element that is to be updated.
	 * @param {Object} filters The filters that should be applied to the options list.
	 * 		These filters may be as yet unprocessed.  If a value begins with a $, that 
	 * 		means that it should be substituted with the value of that field.
	 *
	 */
	function updateValuesFor(select, filters){
		var selector = $(select).parent().find('select.xf-depselect-selector').get(0);
		var tablename = $(select).attr("data-xf-table");
		var fieldname = $(select).attr('data-xf-field');
		
		var url = DATAFACE_SITE_HREF;
		var q = {
			'-action': 'depselect_load',
			//'-table': tablename,
			'--depselect-table' : tablename,
			'-table' : $(select).attr('data-xf-depselect-options-table'),
			'-field': fieldname
		};
		
		$.each(filters, function(key,val){
                        var defaultFilter = '=';
			if ( !key ) return;
			if ( val.indexOf('$') === 0 ){
				var fname = val.substr(1);
                                if ( fname.indexOf('|') !== -1  ){
                                    var fnameParts = fname.split(/\|/);
                                    fname = fnameParts[0];
                                    
                                    defaultFilter = fnameParts[1];
                                    
                                    
                                }
				var field = findField(select, fname);
				if ( field && $(field).val() ){
					q[key] = $(field).val();
				} else {
					q[key] = defaultFilter;
				}
			} else {
				
				q[key] = val;
			}
		});
		
		$.get(url, q, function(res){
			try {
				if ( typeof(res) == 'string' ){
					eval('res='+res+';');
				}
				if ( res.code == 200 ){
				
					var currVal = $(select).val();
                                        var currLabel = $('option[value="'+currVal+'"]', selector).text();
                                        if ( currVal && !currLabel ){
                                            currLabel = currVal;
                                        }
                                        //alert(selector);
					selector.options.length=1;
                                        var currValInSet = false;
					$.each(res.values, function(key,val){
						$.each(val, function(k,v){
                                                        if ( (""+currVal) === (""+k)){
                                                            currValInSet = true;
                                                        }
							$(selector).append(
								$('<option></option>')
								.attr('value', k)
								.text(v)
							);
						});
						
					});
					
                                        if ( (""+currVal) && currLabel  && !currValInSet){
                                            $(selector).append(
                                                $('<option></option>')
                                                .attr('value', currVal)
                                                .text(currLabel)
                                            );
                                        }
					
					$(select).val(currVal);
					$(selector).val(currVal);

				} else {
					if ( res.message ) throw res.message;
					else throw 'Failed to load values for field '+fieldname+' because of an unspecified server error.';
				}
				
			
			} catch (e){
				alert(e);
			}
		
		});
	}
	
	
	/**
	 * Adds an option to the given select list.  This uses the record 
	 * dialog to pop up with a "new record form" in an internal dialog.
	 *
	 * @param {HTMLElement} select The select list to add an option to.
	 * @param {Object} filters The filters to apply.
	 */
	function addOptionFor(select, filters){
		var tableName = $(select).attr("data-xf-depselect-options-table");
		if ( !tableName ) return;
		
		var q = {};
		
		$.each(filters, function(key,val){
			if ( !key ) return;
			if ( val.indexOf('$') == 0 ){
				var fname = val.substr(1);
                                var defaultFilter = '';
                                 if ( fname.indexOf('|') !== -1  ){
                                    var fnameParts = fname.split('|');
                                    fname = fnameParts[0];
                                    defaultFilter = fnameParts[1];
                                    
                                }
				var field = findField(select, fname);
				if ( field && $(field).val() ){
					q[key] = $(field).val();
				} else {
					//q[key] = '=';
				}
			} else {
				
				q[key] = val;
			}
		});
		
		var dlg = new xataface.RecordDialog({
			table: tableName,
			callback: function(data){
			
				updateValuesFor(select, filters);
				
			},
			params: q
		
		});
		
		dlg.display();
		
	}
	
	
	/**
	 * When defining the javascript for a widget, we always wrap it in
	 * registerXatafaceDecorator so that it will be run whenever any new content is
	 * loaded ino the page.  This makes it compatible with the grid widget.
	 *
	 * If you don't do this, the widget will only be installed on widgets at page load time
	 * so when new rows are added via the grid widget, the necessary javascript won't be installed
	 * on those widgets.
	 */
	registerXatafaceDecorator(function(node){
		
		$('input.xf-depselect', node).each(function(){
			
			var self = this;
			
			$(self).hide();
			var select = $('<select></select>')
				.addClass('xf-depselect-selector')
				.change(function(){
					$(self).val($(this).val());
					$(self).trigger('change');
				})
				.append(
					$('<option></option>')
						.attr('text','Please select...')
						.attr('value', '')
				)
				.insertAfter(self);
			
			
			var filtersAttr = $(this).attr('data-xf-depselect-filters');
			var filters = {};
			filtersAttr = filtersAttr.split('&');
			$.each(filtersAttr, function(){
				var parts = this.split('=');
				filters[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
			});
			
			
			// Now that we have our filters we should start listening for changes
			// on each of the filters.
			
			$.each(filters, function(key,val){
			
				if ( val.indexOf('$') == 0 ){
					// It is a variable
					var depField = val.substr(1);
                                        if ( depField.indexOf('|') !== -1 ){
                                            var depFieldParts = depField.split('|');
                                            depField = depFieldParts[0];
                                        }
					var field = findField(self, depField);
					//alert(depField);
					if ( !field ) return;
					
					// We want to listen or changes to this field
					// so that we can update our values whenever the field
					// changes.
					$(field).change(function(){
						//alert('value changed');
						updateValuesFor(self, filters);
					});
				}
			
			});
			
			
			if ( $(self).attr("data-xf-depselect-perms-new") ){
				// We only add this button if the user has permission 
				// to add new records to the target table.
				$('<a><img src="'+DATAFACE_URL+'/images/add_icon.gif"/></a>')
					.addClass('xf-depselect-add-btn')
					.click(function(){
						addOptionFor(self, filters);
					})
					.insertAfter(select);
			}
			
			
			
			
			
			// Initialize the values to begin with.
			updateValuesFor(self, filters);
			
			
		});
		
		
	
	});
})();