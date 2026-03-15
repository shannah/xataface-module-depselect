# Xataface Depselect Module

A dependent select widget for [Xataface](https://github.com/shannah/xataface) forms. A dependent select is one whose options are determined by the state of other widgets in the form. It listens for changes to other selects and updates its own options accordingly.

A common example is a form with select lists for Country, Province, and City. The Province options depend on the selected Country, and the City options depend on the selected Province. The depselect widget handles this by live-updating options whenever a dependency field changes.

## Features

- **Live updating** of options when dependency fields change.
- **Checkbox display mode** for multi-select scenarios (e.g. selecting multiple rooms in a building).
- **"Add" button** to create new options inline via a dialog with a new record form.
- **Permissions integration** with Xataface's permissions system — options are only loaded if the user has `view` permission on the target table (can be overridden).
- **No valuelist required** — options are loaded on demand, which can be more efficient for large tables since valuelists are loaded in their entirety on every request.

## Requirements

- Xataface 1.4 or higher

## Installation

1. Copy the module into your `modules` directory:

   ```
   modules/depselect/
   ```

2. Add the following to the `[_modules]` section of your app's `conf.ini`:

   ```ini
   modules_depselect=modules/depselect/depselect.php
   ```

## Usage

To use the depselect widget, set `widget:type=depselect` in the appropriate `fields.ini` file for your table. The following directives are available:

### Directives

| Directive | Required | Description |
|---|---|---|
| `widget:type` | Yes | Must be set to `depselect`. |
| `widget:table` | Yes | The table from which options are loaded. |
| `widget:filters:xyz` | No | Filters applied when loading options. Can be any valid Xataface GET parameter. Use `$field_name` syntax to reference other form fields as dynamic filter values. |
| `widget:keycol` | No | The column to use as the option value/key. Defaults to the table's primary key. |
| `widget:labelcol` | No | The column to use as the option display label. |
| `widget:displayType` | No | Set to `checkbox` to render options as checkboxes for multi-select. Default is `select` (dropdown). |
| `widget:ignore_permissions` | No | Set to bypass the default requirement that the user has `view` permission on the options table. |

### Display Types

#### `select` (default)

Renders a standard dropdown select list. The user can choose a single value. This is the default behavior when `widget:displayType` is not specified.

#### `checkbox`

Renders options as a group of checkboxes, allowing the user to select multiple values. Selected values are stored as a comma-separated string (e.g. `"1,3,5"`).

This mode is useful when a record needs to be associated with multiple options from a dependent table — for example, selecting multiple rooms within a building.

**Note:** When using `checkbox` mode, the database column should be a `VARCHAR` or `TEXT` field large enough to hold comma-separated IDs rather than a single foreign key integer.

## Examples

### Basic chained dropdowns

A city field dependent on a province field, which is dependent on a country field:

```ini
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
```

### Checkbox multi-select

A work order form where the user selects a branch, then a building, then checks off one or more rooms. The `rooms` field uses `widget:displayType=checkbox` so that multiple rooms can be selected:

```ini
[branch_id]
    widget:type=depselect
    widget:table=branches
    widget:keycol=branch_id
    widget:labelcol=branch_name

[building_component_id]
    widget:type=depselect
    widget:table=building_components
    widget:keycol=building_component_id
    widget:labelcol=code
    widget:filters:branch_id="$branch_id"

[rooms]
    widget:type=depselect
    widget:table=rooms
    widget:keycol=room_id
    widget:labelcol=room_number
    widget:displayType=checkbox
    widget:filters:building_component_id="$building_component_id"
```

When the user selects a building, the available rooms for that building are displayed as checkboxes. The selected room IDs are saved as a comma-separated string (e.g. `"101,103"`) in the `rooms` column.

## Support

- [Xataface Forum](http://xataface.com/forum)

## Credits

- Developed by Steve Hannah (steve@weblite.ca)
- Built with [jQuery](https://jquery.com) and [jQuery UI](https://jqueryui.com)

## License

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Library General Public License as published by the Free Software Foundation; either version 2 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the [GNU Library General Public License](https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html) for more details.
