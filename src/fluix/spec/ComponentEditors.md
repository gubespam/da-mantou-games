# Component Editors
When a component is selected in the main view in either Design or Solve mode, the Editor panel shows the corresponding editor type for that component. When no object is selected, the editor panel is empty.

## Modes
In Design mode, each attribute has a checkbox next to it labeled "Locked".

In Solve mode, the lock checkbox is not shown. Instead, the attributes that are locked are non-editable. When not locked, the attributes are editable.

## Sections

## Editors
These are the component editors. Each of these is a separate React component, named according to the section header. All of them are styled the same way and composed of form fields.

The form fields are populated based on the model for the component selected in the main view.

### VatEditor
- two number fields, side by side: x and y
- two number fields, side by side: "w" (width), "h" (height)
- volume - always read-only (even in Design mode) - reflects the Vat model's "volume"

While in Design mode, also show a `FluidEditor`

### FluidEditor
Three number fields, one for each fluid color. These are the labels:
* Red
* Green
* Blue

### DrainEditor
- activated - checkbox
- trigger - checkbox - when false, all the controls below are greyed out/disabled
- operator - radio button group
    - at least one - OR
    - all - AND
- sensors - list of sensors

### SensorEditor
TODO