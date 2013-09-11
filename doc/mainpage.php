<?php
/**
@mainpage Xataface depselect Module

<img src="http://media.weblite.ca/files/photos/Screen%20shot%202011-06-09%20at%2011.11.34%20AM.png?max_width=640"/>

@section synopsis Synopsis

The Xataface depselect module adds a "dependent select" widget for use in forms.  A dependent select is one whose options are dependent on the state of other widgets in the form.  It listens for changes to other selects and updates its own options accordingly.

A common example is a form with select lists for country, province, and city.  The options in the "province" select list will depend on which option is selected in the "country" select list.  Similarly the options in the "city" widget depend on the "province" selection.   The depselect widget is ideal of this scenario as it will live update the options according to the selections in the dependency fields.

@section features Features

	- Live updating of menu options when other widgets are updated.
	- "Add" button to add options to a menu (opens internal dialog with new record form).
	- Integrated with Xataface's permissions system (options will only be loaded if user is granted view permission on target table).
	- Option to override permissions.
	- Doesn't require a valuelist.  (May be more efficient for providing options on subsets of very large tables as valuelists are loaded in their entirety every request).
	

@section requirements Requirements

	- Xataface 1.4 or higher
	
	
@section license License

@code
Xataface Depselect Module

Copyright (C) 2011  Steve Hannah <shannah@sfu.ca>

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Library General Public
License as published by the Free Software Foundation; either
version 2 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Library General Public License for more details.

You should have received a copy of the GNU Library General Public
License along with this library; if not, write to the
Free Software Foundation, Inc., 51 Franklin St, Fifth Floor,
Boston, MA  02110-1301, USA.
@endcode


@section download Download

@subsection packages Packages

Not available.

@subsection svn SVN

<a href="http://weblite.ca/svn/dataface/modules/depselect/trunk">http://weblite.ca/svn/dataface/modules/depselect/trunk</a>


@section installation Installation

	-# Copy the summary directory into your modules directory. i.e.: @code
	modules/depselect
	@endcode
	-# Add the following to the [_modules] section of your app's conf.ini file: @code
	modules_depselect=modules/depselect/depselect.php
	@endcode
	
@see http://xataface.com/wiki/modules For more information about Xataface module development and installation.


@section usage Usage

To configure a field to use the depselect widget, just set its fields.ini file widget:type directive to "depselect".  You should also set the following directives:

<table>
	<tr>
		<th>Directive</th>
		<th>Description</th>
	</tr>
	<tr>
		<td>widget:table</td><td>The name of the table from which the options should be pulled</td>
	</tr>
	<tr>
		<td>widget:filters:xyz</td><td>Filters to apply to queries to load the options.  This can be any valid Xataface GET parameter in accordance with the Xataface URL conventions.</td>
	</tr>
        <tr>
		<td>widget:keycol</td><td>(Optional)  The name of the column to treat as the id or key column.</td>
	</tr>
	<tr>
		<td>widget:labelcol</td><td>(Optional) The name of the column to pull labels from.</td>
	</tr>
	<tr>
		<td>widget:ignore_permissions</td><td>(Optional)  The user needs 'view' permissions for the records from which the options are populated, unless this directive is set.</td>
	</tr>
</table>


@section examples Examples:

In the following example we have a city field that is dependent on the province field that is dependent on the country field:
@code
[country_id]
	widget:type=depselect
	widget:table=countries
	
[province_id]
	widget:type=depselect
	widget:table=provinces
	widget:filters:country_id="$country_id"
	
[city_id]	
	widget:type=depselect
	widget:table=cities
	widget:filters:province_id="$province_id"
@endcode

@see http://xataface.com/wiki/fields.ini_file For more information about fields.ini file directives.
 
@section filters Filters:
 
The key to the depselect widget lies in the widget:filters directive which specifies either a static or a dynamic filter that can be used to filter the options in the depselect widget.  A static filter is just
any string that will be used to filter the particular field of the table specified by the widget:table directive.  With a static filter (or no filter), the depselect will behave essentially the same
as a standard select widget.  You can make the widget dependent upon the selected value of another field in the form by using a dynamic filter.  A dynamic filter specifies the name of another field
in the form whose value should be used to filter the options in this depselect widget.  It is signified by a "$" prefix followed by the name of the field whose value we wish to filter on.

In the previous examples, the province_id field uses a dynamic filter on the country_id field.  It indicates that it will only include options from the provinces table whose country_id field matches the selection of the
country_id field on this form.

@section default_filters Default Filters:

In cases where you have specified a dynamic filter on the depselect, you may want to specify an alternate filter to use in the case where the field upon which the depselect depends has not been selected or is left blank.  
You can signify this default filter by piping it to the dynamic filter.  I.e. Using the "|" notation.  E.g.

@code
[country_id]
	widget:type=depselect
	widget:table=countries
	
[province_id]
	widget:type=depselect
	widget:table=provinces
	widget:filters:country_id="$country_id|0"
@endcode

In this example the province field will be filtered on the value of the country_id field if it has a value selected.  Otherwise it will just show the provinces
with country_id=0.

You can also use Xataface URL conventions for this default filter.  E.g.
@code
widget:filters:country_id="$country_id|"
@endcode

This says that the default search is an "empty" search.  Which will return all of the provinces.  You could also search for all provinces with nonempty country_id values:

@code
widget:filters:country_id="$country_id|>"
@endcode

Note: Default filters were added version 0.2

@section more More Reading


TBA


@section support Support:

<a href="http://xataface.com/forum">http://xataface.com/forum</a>


@section credits Credits:

- This module was developed by Steve Hannah (steve@weblite.ca).
- This widget makes heavy use of jQuery to help with DOM interaction.  (<a href="http://www.jquery.com">http://jquery.com</a>).
- jQuery UI is used to provide a more user-friendly experience.  In particular it's internal dialog module is used for adding records to the depselects.  (<a href="http://jqueryui.com/">http://jqueryui.com</a>)

*/
?>