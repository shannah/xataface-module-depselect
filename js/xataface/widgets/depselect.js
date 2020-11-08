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
//require <xatajax.form.core.js>
//require-css <xataface/widgets/depselect.css>  
(function () {
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
    function findField(startNode, fieldName) {
        return XataJax.form.findField(startNode, fieldName);
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
     * @param {Function} callback Callback called after updating values.
     */
    function updateValuesFor(select, filters, callback) {
        callback = callback || function () {
        };
        var selector = $(select).parent().find('select.xf-depselect-selector').get(0);
        var tablename = $(select).attr("data-xf-table");
        var fieldname = $(select).attr('data-xf-field');

        var url = DATAFACE_SITE_HREF;
        var q = {
            '-action': 'depselect_load',
            //'-table': tablename,
            '--depselect-table': tablename,
            '-table': $(select).attr('data-xf-depselect-options-table'),
            '-field': fieldname
        };

        $.each(filters, function (key, val) {
            var defaultFilter = '=';
            if (!key)
                return;
            if (val.indexOf('$') === 0) {
                var fname = val.substr(1);
                if (fname.indexOf('|') !== -1) {
                    var fnameParts = fname.split(/\|/);
                    fname = fnameParts[0];

                    defaultFilter = fnameParts[1];


                }
                var field = findField(select, fname);
                if (field && $(field).val()) {
                    q[key] = '='+$(field).val();
                } else {
                    q[key] = defaultFilter;
                }
            } else {

                q[key] = val;
            }
        });
        $.get(url, q, function (res) {
            try {
                if (typeof (res) === 'string') {
                    eval('res=' + res + ';');
                }
                if (res.code === 200) {

                    var currVal = $(select).val();
                    var currLabel = $('option[value="' + currVal + '"]', selector).text();
                    if (currVal && !currLabel) {
                        currLabel = currVal;
                    }
                    //alert(selector);
                    selector.options.length = 1;
                    var currValInSet = false;
                    $.each(res.values, function (key, val) {
                        $.each(val, function (k, v) {
                            if (("" + currVal) === ("" + k)) {
                                currValInSet = true;
                            }
                            $(selector).append(
                                    $('<option></option>')
                                    .attr('value', k)
                                    .text(v)
                                    );
                        });

                    });

                    if (("" + currVal) && currLabel && !currValInSet) {
                        $(selector).append(
                                $('<option></option>')
                                .attr('value', currVal)
                                .text(currLabel)
                                );
                    }

                    $(select).val(currVal);
                    $(selector).val(currVal);
                    callback();

                } else {
                    if (res.message)
                        throw res.message;
                    else
                        throw 'Failed to load values for field ' + fieldname + ' because of an unspecified server error.';
                }


            } catch (e) {
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
    function addOptionFor(select, filters) {
        var tableName = $(select).attr("data-xf-depselect-options-table");
        if (!tableName)
            return;

        var marginW = undefined;
        var marginH = undefined;
        var dialogWidth = undefined;
        var dialogHeight = undefined;



        if ($(select).attr('data-xf-depselect-dialogSize')) {
            var dialogSize = $(select).attr('data-xf-depselect-dialogSize');
            var parts = dialogSize.split(',');
            if (parts[0].indexOf('%') === parts[0].length - 1) {
                dialogWidth = jQuery(window).width() * parseInt(parts[0].substring(0, parts[0].length - 1)) / 100.0;
            } else {
                dialogWidth = parseInt(parts[0]);
            }

            if (parts[1].indexOf('%') === parts[1].length - 1) {
                dialogHeight = jQuery(window).width() * parseInt(parts[1].substring(0, parts[1].length - 1)) / 100.0;
            } else {
                dialogHeight = parseInt(parts[1]);
            }

        }

        if ($(select).attr('data-xf-depselect-dialogMargin')) {
            var dialogMargin = $(select).attr('data-xf-depselect-dialogMargin');
            var parts = dialogMargin.split(',');
            if (parts[0].indexOf('%') === parts[0].length - 1) {
                marginW = jQuery(window).height() * parseInt(parts[0].substring(0, parts[0].length - 1)) / 100.0;
            } else {
                marginW = parseInt(parts[0]);
            }

            if (parts[1].indexOf('%') === parts[1].length - 1) {
                marginH = jQuery(window).height() * parseInt(parts[1].substring(0, parts[1].length - 1)) / 100.0;
            } else {
                marginH = parseInt(parts[1]);
            }

        }


        var q = {};

        $.each(filters, function (key, val) {
            if (!key)
                return;
            if (val.indexOf('$') === 0) {
                var fname = val.substr(1);
                var defaultFilter = '';
                if (fname.indexOf('|') !== -1) {
                    var fnameParts = fname.split('|');
                    fname = fnameParts[0];
                    defaultFilter = fnameParts[1];

                }
                var field = findField(select, fname);
                if (field && $(field).val()) {
                    q[key] = $(field).val();
                } else {
                    //q[key] = '=';
                }
            } else {

                q[key] = val;
            }
        });

        var RecordDialog = xataface.RecordDialog;
        try {
            // If we are inside a parent iframe already due to another record dialog
            // we will use the Record dialog from the parent window (risky??)
            if (xataface.RecordDialog.version === window.top.xataface.RecordDialog.version) {
                RecordDialog = window.top.xataface.RecordDialog;
            }

        } catch (e) {

        }

        var dlg = new RecordDialog({
            table: tableName,
            callback: function (data) {

                updateValuesFor(select, filters, function () {
                    var selector = $(select).parent().find('select.xf-depselect-selector').get(0);
                    var currVal = null;
                    $('option', selector).each(function () {
                        if (currVal) {
                            return;
                        }
                        if ($(this).text() === data.__title__) {
                            currVal = $(this).attr('value');
                        }
                    });
                    $(selector).val(currVal);
                    $(select).val(currVal);
                    $(selector).change();
                });

            },
            params: q,
            width: dialogWidth,
            height: dialogHeight,
            marginW: marginW,
            marginH: marginH

        });

        dlg.display();

    }

    function installFrozen(node){
        if ($(node).attr('data-depselect-isdecorated')) {
            $(node).parent().find('.depselect-fragment').remove();
        }
        var tablename = $(node).attr("data-xf-table");
        var fieldname = $(node).attr('data-xf-field');
        
        var fragment = $('<span>').addClass('depselect-fragment');
        var url = DATAFACE_SITE_HREF;
        var q = {
            '-action': 'depselect_load',
            //'-table': tablename,
            '--depselect-table': tablename,
            '-table': $(node).attr('data-xf-depselect-options-table'),
            '-field': fieldname,
            '-depselect-single-value' : '1',
            '-depselect-id' : $(node).val()
        };
        
        if ( $(node).val() ){
            $.get(url, q, function(data){
               fragment.text(data.value);
            });
        } else {
            fragment.text('<No Selection>');
        }
        
        fragment.insertAfter(node);
        $(node).hide();
        
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
    registerXatafaceDecorator(function (node) {
        $('input.xf-depselect', node).each(function () {
            if ( $(this).attr('data-depselect-frozen')){
                installFrozen(this);
                return;
            }
            if ($(this).attr('data-depselect-isdecorated')) {
                $(this).parent().find('.depselect-fragment').remove();
            }
            $(this).attr('data-depselect-isdecorated', 1);
            var self = this;

            $(self).hide();
            var select = $('<select></select>')
                    .addClass('xf-depselect-selector')
                    .addClass('depselect-fragment')
                    .attr('data-xf-depselect-dialogMargin', $(self).attr('data-xf-depselect-dialogMargin'))
                    .attr('data-xf-depselect-dialogSize', $(self).attr('data-xf-depselect-dialogSize'))
                    .change(function () {
                        $(self).val($(this).val());
                        $(self).trigger('change');
                    })
                    .append(
                            $('<option></option>')
                            .text('Please select...')
                            .attr('value', '')
                            )
                    .insertAfter(self);


            var filtersAttr = $(this).attr('data-xf-depselect-filters');
            var filters = {};
            filtersAttr = filtersAttr.split('&');
            $.each(filtersAttr, function () {
                var parts = this.split('=');
				if (parts.length < 2) return;
                filters[decodeURIComponent(parts[0].replace(/\+/g, " "))] = decodeURIComponent(parts[1].replace(/\+/g, " "));
            });


            // Now that we have our filters we should start listening for changes
            // on each of the filters.

            $.each(filters, function (key, val) {

                if (val.indexOf('$') === 0) {
                    // It is a variable
                    var depField = val.substr(1);
                    if (depField.indexOf('|') !== -1) {
                        var depFieldParts = depField.split('|');
                        depField = depFieldParts[0];
                    }
                    var field = findField(self, depField);
                    //alert(depField);
                    if (!field)
                        return;

                    // We want to listen or changes to this field
                    // so that we can update our values whenever the field
                    // changes.
                    var lastGoodVal = null;
                    
                    $(field).change(function () {
                        //alert('value changed');
                        var oldVal = $(self).val();
                        var triggerChange = false;
                        if (oldVal) {
                            lastGoodVal = oldVal;
                        } else {
                            oldVal = lastGoodVal;
                            triggerChange = true;
                        }
                        $(self).val('');
                        updateValuesFor(self, filters, function() {
                            if ($('option[value="' + oldVal + '"]', select).length > 0) {
                                $(select).val(oldVal);
                                $(self).val(oldVal);
                                if (triggerChange) $(self).trigger('change');
                            } else {
                                $(self).trigger('change');
                            }
                        });
                        
                    });
                }

            });


            if ($(self).attr("data-xf-depselect-perms-new")) {
                // We only add this button if the user has permission 
                // to add new records to the target table.
                $('<a class="depselect-fragment"><img src="' + DATAFACE_URL + '/images/add_icon.gif"/></a>')
                        .addClass('xf-depselect-add-btn')
                        .click(function () {
                            addOptionFor(self, filters);
                        })
                        .insertAfter(select);
            }
            // Initialize the values to begin with.
            updateValuesFor(self, filters);


        });



    });
})();
