# Data Model
Write a separate class for each of these subsections. The name of the class is the section heading.
Put all model classes into `src/fluix/model`.

Include a documentation comment to explain the purpose of each class.
Write a documentation comment for each field that has additional description below; don't comment other fields.

## Color
A color for a Fluid
* red - int (0..255)
* green - int (0..255)
* blue - int (0..255)

## Vat
A rectangular container for holding liquid
* position - Position (x,y)
* width - int
* height - int
* locked
    * geometry - (true/false) - whether the player can move or resize it
    * sensors - (true/false) - whether the player can add/remove sensors
    * drains - (true/false) - whether the player can add/remove drains
* drain - optional Drain
* sensors - list of Sensor
* contents
    * mixture - Mixture - which fluid this contains
    * amount - int - total quantity of fluid in the vat
* volume - read-only, calculated = width * height

## Fluid
A raw, pure fluid
* color - Color

## Mixture
* components - list of Fluids
    * fluid - Fluid
    * ratio - floating-point (0..1) - relative amount of this fluid in the mixture


## Side
Enum for which side of a Vat an object is attached
* LEFT
* RIGHT
* BOTTOM

## Position
* side - Side - which side of the Vat the object is on
* offset - position along the Vat's side where the object is located
    * left and right sides - offset up from the bottom of the Vat
    * bottom - offset from the left side of the Vat

## LevelSensor
Senses the level of fluid in a vat
* vat - refefence to Vat to which this is attached
* position - Position - where the sensor is attached to the Vat
* downward - true/false - if true, the sensor activates when fluid is below this level; otherwise, activates when fluid is at or above this level
* activated - true/false

## Drain
A point where Fluid may flow out of a Vat
* vat - refefence to Vat to which this is attached
* position - Position - where the sensor is attached to the Vat
* activated - true/false
    * Whether fluid is allowed to flow through the drain; true any of the onSensors is activated unless one of the offSensors is activated
* onSensors - list of LevelSensors
* offSensors - list of LevelSensors