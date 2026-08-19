# View Components

## VatView
Vats are rectangles whose top border is invisible and walls and bottom are thick black lines.

The Position, width and height attributes control the position and size of the rectangle.

Create a single VatView component for both the Vat and the Fluid within it. It should take the Vat model as input.

VatViews are div tags whose position is absolute. CSS class is `vat`. The background color is grey. Border is 2px and solid black. Top border is none. Margin and padding are zero.

Inline styles
- x,y position based on model
- width, height based on model

## Fluid
Inside the walls of Vat is a rectangle for the fluid in the vat. The fluid rectangle fills the bottom portion of the vat (flush with bottom). Its height is min(vat.height, vat.contents.amount / vat.volume).

The fluid rectangle is a solid color according to the weighted average of the colors of the fluids that make up the Vat's contents.
* (over: iter = vat.contents.mixture.components) with (value = iter.fluid.color) and (weight = iter.ratio). Each color component (red, green, blue) should be separately weight-averaged and the results combined into a new color result that defines the fluid's color in the vat.

Fluid is a div tag that is a direct child of the Vat's div. Its

CSS class is `fluid`. Margin and padding are zero. Position is relative. Border is none. 

Use this CSS structure:
```css
.vat > .fluid {
    ...
}
```

Inline styles:
- Background color, based on color of fluid in model. 
- Fluid height, calculated based on model
    - fluid height = vat.amount * vat.height / vat.volume; capped at max vat.height, min 0
- Top: vat container height (from model) - fluid height