# Visual Layout
## Layout
+--------------+----------+
|              | Mode Bar |
|  Main Area   +----------+
|              |          |
|              | Palette  |
|              |          |
+--------------+----------+

## Main Area
Component name: `WorkArea`.

The main area of the screen shows scrollbars when any components within it are past its edges.

The main area has scrollbars appear when components within it are outside its boundaries but hidden otherwise.

The vertical bar between the sidebar 

## Mode Bar
Component name: `ModeBar`.

The top of the sidebar is the menu bar is just above the Palette. It has radio buttons to select the current mode (design, solve, run).

## Component Palette
Component name: `Palette`.

The component palette is a sidebar on the right that takes up one fourth (horizontally) of the screen by default. The width is adjustable by dragging the left edge of the sidebar.

Users may drag components from the palette onto the main area. This creates a new instance of the component at the location to which it was dragged and decrements the inventory count of that component. 
