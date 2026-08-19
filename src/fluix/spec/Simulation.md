# Simulation Mechanics
Recompute the dependency graph of the vats, fluids, drains and sensors, and compute the topological sort of these components.

At each clock tick
* Starting at the leaf nodes (those not dependent on anything else), calculate the amount of fluid flow output
* Continue along the topological sort order to use upstream fluid output as fluid input
* Along the way, handle Vat overflow and the activation of sensors and drains

When fluid completely fills a vat, it overflows over both sides.

Vats dynamically calculate the mixture inside them according to the sum of inflows and outflows.

When sensors are activated, they activate the drains they are connected to.

