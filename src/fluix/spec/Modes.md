# Modes
## Overview
There are three modes:
* Design - game creator designs the puzzle
* Solve - player makes changes to the puzzle, constrained by any locking and the list of available components
* Run - game creator or player runs the simulation according to the current state of the puzzle

## Design Mode
In this mode, the user may move all components, even those that are locked, by dragging them to new locations.

The user may add an unlimited number of components from the palette.

## Solve Mode
The palette is empty except for a copy of each of the components that were not locked in the design mode.

User may drag components from the palette into the main area. Doing so adds the component to the main area and removes it from the palette.

## Run Mode
Runs the simulation.

## Switching Modes
Each model has its own separate copy of the data model. A "version" sequence is kept at the top level of the Design and Solve models. Any time a change is made to the model within the Design mode, the version is incremented. This allows us to determine whether there are changes since the last time the Solve model was replaced with the Design model, by comparing the Solve version number to the Design one. If the Design version is greater, it has changes compared to the Solve model.

When the mode is switched to Solve, if there have been any changes to the model in Design mode since the last time the user switched to Solve mode, then the Solve mode data model is replaced based on the Design mode model. The Solve mode model is also populated with the Design model when the Solve mode is used for the first time.

When the mode is switched to Run, the Run mode model is replaced with the Solve mode model.

When each mode is active, the model for that mode is used for the main area view.