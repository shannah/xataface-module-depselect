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
     * Updates the values for a depselect widget.  This is usually called in
     * response to a change in one of the selects that this depselect
     * is dependent upon.
     *
     * @param {HTMLElement} input The depselect hidden input element.
     * @param {Object} filters The filters that should be applied to the options list.
     * @param {Function} callback Callback called after updating values.
     */
    function updateValuesFor(input, filters, callback) {
        callback = callback || function () {};
        var displayType = $(input).attr('data-xf-depselect-display-type') || 'select';
        var tablename = $(input).attr("data-xf-table");
        var fieldname = $(input).attr('data-xf-field');

        var url = DATAFACE_SITE_HREF;
        var q = {
            '-action': 'depselect_load',
            '--depselect-table': tablename,
            '-table': $(input).attr('data-xf-depselect-options-table'),
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
                var field = findField(input, fname);
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
                    if (displayType === 'checkbox') {
                        updateCheckboxValues(input, res.values);
                    } else {
                        updateSelectValues(input, res.values);
                    }
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
     * Updates select dropdown options with new values.
     */
    function updateSelectValues(input, values) {
        var selector = $(input).parent().find('select.xf-depselect-selector').get(0);
        var currVal = $(input).val();
        var currLabel = $('option[value="' + currVal + '"]', selector).text();
        if (currVal && !currLabel) {
            currLabel = currVal;
        }
        selector.options.length = 1;
        var currValInSet = false;
        $.each(values, function (key, val) {
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

        $(input).val(currVal);
        $(selector).val(currVal);
    }

    /**
     * Updates checkbox options with new values.
     */
    function updateCheckboxValues(input, values) {
        var container = $(input).parent().find('.xf-depselect-checkbox-container');
        // Parse currently selected values from the hidden input
        var currentValues = parseCheckboxValues($(input).val());

        container.empty();

        var fieldName = $(input).attr('name');

        $.each(values, function (idx, val) {
            $.each(val, function (k, v) {
                var checkboxId = fieldName + '_cb_' + k;
                var isChecked = currentValues.indexOf("" + k) !== -1;
                var wrapper = $('<label></label>')
                    .addClass('xf-depselect-checkbox-label')
                    .attr('for', checkboxId);
                var cb = $('<input type="checkbox"/>')
                    .addClass('xf-depselect-checkbox')
                    .attr('id', checkboxId)
                    .attr('value', k);
                if (isChecked) {
                    cb.prop('checked', true);
                }
                cb.on('change', function () {
                    syncCheckboxesToInput(input);
                });
                wrapper.append(cb).append($('<span></span>').text(' ' + v));
                container.append(wrapper);
            });
        });

        // If there are no options, show a message
        if (container.children().length === 0) {
            var nomatch = $(input).attr('data-xf-depselect-nomatch') || 'No options available';
            container.append($('<span class="xf-depselect-nomatch"></span>').text(nomatch));
        }
    }

    /**
     * Parse comma-separated checkbox values string into array.
     */
    function parseCheckboxValues(str) {
        if (!str) return [];
        return str.split(',').map(function(s) { return $.trim(s); }).filter(function(s) { return s !== ''; });
    }

    /**
     * Sync checked checkboxes back to the hidden input as comma-separated values.
     */
    function syncCheckboxesToInput(input) {
        var container = $(input).parent().find('.xf-depselect-checkbox-container');
        var vals = [];
        container.find('input.xf-depselect-checkbox:checked').each(function () {
            vals.push($(this).val());
        });
        $(input).val(vals.join(','));
        $(input).trigger('change');
    }


    /**
     * Adds an option to the given select list.  This uses the record
     * dialog to pop up with a "new record form" in an internal dialog.
     *
     * @param {HTMLElement} input The hidden input element.
     * @param {Object} filters The filters to apply.
     */
    function addOptionFor(input, filters) {
        var tableName = $(input).attr("data-xf-depselect-options-table");
        if (!tableName)
            return;

        var marginW = undefined;
        var marginH = undefined;
        var dialogWidth = undefined;
        var dialogHeight = undefined;

        if ($(input).attr('data-xf-depselect-dialogSize')) {
            var dialogSize = $(input).attr('data-xf-depselect-dialogSize');
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

        if ($(input).attr('data-xf-depselect-dialogMargin')) {
            var dialogMargin = $(input).attr('data-xf-depselect-dialogMargin');
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
                var field = findField(input, fname);
                if (field && $(field).val()) {
                    q[key] = $(field).val();
                }
            } else {
                q[key] = val;
            }
        });

        var RecordDialog = xataface.RecordDialog;
        try {
            if (xataface.RecordDialog.version === window.top.xataface.RecordDialog.version) {
                RecordDialog = window.top.xataface.RecordDialog;
            }
        } catch (e) {}

        var displayType = $(input).attr('data-xf-depselect-display-type') || 'select';

        var dlg = new RecordDialog({
            table: tableName,
            callback: function (data) {
                updateValuesFor(input, filters, function () {
                    if (displayType === 'checkbox') {
                        // For checkbox mode, the newly added record should be auto-checked
                        var container = $(input).parent().find('.xf-depselect-checkbox-container');
                        container.find('input.xf-depselect-checkbox').each(function () {
                            // Try to find the new record by matching title
                            // Since we can't easily match by title in checkbox labels,
                            // just leave all current selections as-is and the new option will appear
                        });
                        syncCheckboxesToInput(input);
                    } else {
                        var selector = $(input).parent().find('select.xf-depselect-selector').get(0);
                        var currVal = null;
                        $('option', selector).each(function () {
                            if (currVal) return;
                            if ($(this).text() === data.__title__) {
                                currVal = $(this).attr('value');
                            }
                        });
                        $(selector).val(currVal);
                        $(input).val(currVal);
                        $(selector).change();
                    }
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
        var displayType = $(node).attr('data-xf-depselect-display-type') || 'select';
        var tablename = $(node).attr("data-xf-table");
        var fieldname = $(node).attr('data-xf-field');

        var fragment = $('<span>').addClass('depselect-fragment');
        var url = DATAFACE_SITE_HREF;

        if (displayType === 'checkbox') {
            // For checkbox mode, display comma-separated labels for all selected values
            var selectedValues = parseCheckboxValues($(node).val());
            if (selectedValues.length === 0) {
                fragment.text('<No Selection>');
                fragment.insertAfter(node);
                $(node).hide();
                return;
            }
            var labels = [];
            var loaded = 0;
            $.each(selectedValues, function(idx, val) {
                var q = {
                    '-action': 'depselect_load',
                    '--depselect-table': tablename,
                    '-table': $(node).attr('data-xf-depselect-options-table'),
                    '-field': fieldname,
                    '-depselect-single-value' : '1',
                    '-depselect-id' : val
                };
                $.get(url, q, function(data){
                    labels.push(data.value || val);
                    loaded++;
                    if (loaded === selectedValues.length) {
                        fragment.text(labels.join(', '));
                    }
                });
            });
        } else {
            var q = {
                '-action': 'depselect_load',
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
        }

        fragment.insertAfter(node);
        $(node).hide();
    }

    /**
     * When defining the javascript for a widget, we always wrap it in
     * registerXatafaceDecorator so that it will be run whenever any new content is
     * loaded into the page.  This makes it compatible with the grid widget.
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
            var displayType = $(self).attr('data-xf-depselect-display-type') || 'select';

            $(self).hide();

            // Parse filters (shared by both modes)
            var filtersAttr = $(this).attr('data-xf-depselect-filters');
            var filters = {};
            filtersAttr = filtersAttr.split('&');
            $.each(filtersAttr, function () {
                var parts = this.split('=');
                if (parts.length < 2) return;
                filters[decodeURIComponent(parts[0].replace(/\+/g, " "))] = decodeURIComponent(parts[1].replace(/\+/g, " "));
            });

            if (displayType === 'checkbox') {
                // Checkbox mode
                var container = $('<div></div>')
                    .addClass('xf-depselect-checkbox-container')
                    .addClass('depselect-fragment')
                    .insertAfter(self);
            } else {
                // Select mode (default)
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
            }

            // Listen for changes on dependent fields
            $.each(filters, function (key, val) {
                if (val.indexOf('$') === 0) {
                    var depField = val.substr(1);
                    if (depField.indexOf('|') !== -1) {
                        var depFieldParts = depField.split('|');
                        depField = depFieldParts[0];
                    }
                    var field = findField(self, depField);
                    if (!field)
                        return;

                    var lastGoodVal = null;

                    $(field).change(function () {
                        if (displayType === 'checkbox') {
                            // For checkboxes, clear selections and reload options
                            $(self).val('');
                            updateValuesFor(self, filters, function() {
                                $(self).trigger('change');
                            });
                        } else {
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
                                var selectorEl = $(self).parent().find('select.xf-depselect-selector');
                                if ($('option[value="' + oldVal + '"]', selectorEl).length > 0) {
                                    selectorEl.val(oldVal);
                                    $(self).val(oldVal);
                                    if (triggerChange) $(self).trigger('change');
                                } else {
                                    $(self).trigger('change');
                                }
                            });
                        }
                    });
                }
            });

            // Add button for creating new records
            if ($(self).attr("data-xf-depselect-perms-new")) {
                var addBtn = $('<a class="depselect-fragment"><img src="' + DATAFACE_URL + '/images/add_icon.gif"/></a>')
                    .addClass('xf-depselect-add-btn')
                    .click(function () {
                        addOptionFor(self, filters);
                    });

                if (displayType === 'checkbox') {
                    addBtn.insertAfter($(self).parent().find('.xf-depselect-checkbox-container'));
                } else {
                    addBtn.insertAfter($(self).parent().find('select.xf-depselect-selector'));
                }
            }

            // Initialize values
            updateValuesFor(self, filters);
        });
    });
})();
