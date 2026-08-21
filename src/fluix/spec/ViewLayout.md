# Visual Layout
## Layout
This layout always takes up the entire viewport.

+--------------------+----------+
|                    | Mode Bar |
| Main Area          +----------+
|                    |          |
|                    | Palette  |
|                    |          |
|                    +----------+
|                    |          |
|                    | Editor   |
|                    |          |
+--------------------+----------+

## Main Area
Component name: `MainArea`.

The main area of the screen shows scrollbars when any components within it are past its edges.

The main area has scrollbars appear when components within it are outside its boundaries but hidden otherwise.

## Sidebar
The sidebar is a vertical stack of Mode Bar, Palette and (when shown) the Component Editor.

The vertical boundary between the sidebar and the main area is draggable to change the width of the side bar.

## Mode Bar
Component name: `ModeBar`.

The top of the sidebar is the menu bar is just above the Palette. It has radio buttons to select the current mode (design, solve, run).

See [modes spec](Modes.md).

## Component Palette
Component name: `Palette`.

The component palette is a sidebar on the right that takes up one fourth (horizontally) of the screen by default. The width is adjustable by dragging the left edge of the sidebar.

Users may drag components from the palette onto the main area. This creates a new instance of the component at the location to which it was dragged and decrements the inventory count of that component.

## Component Editor
Only shown when in Design mode (in other modes, it is hidden and the palette takes up this space).

See [component editors spec](ComponentEditors.md).