# Data Model
Write a separate class for each of these subsections. The name of the class is the section heading.
Put all model classes into `src/fluix/model`.

Include a documentation comment to explain the purpose of each class.
Write a documentation comment for each field that has additional description below; don't comment other fields.

Use TypeScript for the models.

## Position
* x - int - horizontal position
* y - int - vertical position

## Vat
A rectangular container for holding liquid
* position - Position
* width - int
* height - int
* locked - boolean - can the player can edit the position/size of this component while in Solve mode
* drains - list of Drain
* sensors - list of LevelSensor
* contents - Mixture - which fluids this Vat contains
* volume - read-only, calculated = width * height

## Mixture
* fluids - amounts of each fluid type
    * red - int
    * green - int
    * blue - int
* amount - read-only; calculated total of all fluid amounts

## Side
Enum for which side of a Vat an object is attached
* LEFT
* RIGHT
* BOTTOM

## AttachPosition
* side - Side - which side of the Vat the object is on
* offset - int - position along the Vat's side where the object is located
    * LEFT, RIGHT - offset is measured down from the top of the Vat
    * BOTTOM - offset measured from the left side of the Vat

## LevelSensor
Senses the level of fluid in a vat
* vat - refefence to Vat to which this is attached
* position - AttachPosition - where the sensor is attached to the Vat
* downward - boolean - if true, the sensor activates when fluid is below this level; otherwise, activates when fluid is at or above this level
* activated - boolean - true when sensor is activated

## Drain
A point where Fluid may flow out of a Vat
* vat - refefence to Vat to which this is attached
* position - AttachPosition - where the sensor is attached to the Vat
* trigger - Trigger or undefined
* activated - boolean - whether fluid flows through this drain; when there is a trigger, true when trigger is activated; if no trigger is set, can be true or false

## Operator
Enum
* AND
* OR

## Trigger
An abstract way of combining multiple sensors into a single signal that can be used to control drains
* operator - Operator
* sensors - list of LevelSensors
* activated - boolean
    - simulation will set this
    - when operator is OR: true when any of the sensors is activated
    - when operator is AND: true when all of the sensors is activated