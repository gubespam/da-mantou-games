# Math Menu
When an operation is toggled, save the entire activeOperations to local storage at key "dmg.math.activeOperations". When initializing the state, pull the value from local storage first. If there is nothing in local storage for that key, then default to the "false" for all the operations.

If the user tries to start a game but there are no active operations selected, instead of starting the game, show a message above the operation buttons (centered horizontally on the page) saying "Please select at least one operation (add, substract, etc.)." Hide this message after the user selects at least one operation.

# Statistics
When initializing the statistics for substraction, if the first number is smaller than the first, omit this combination from the list of problems. When initializing division problems, only choose problems where opa is at least opa and where opa is a multiple of opb.

# Practice Game
Sometimes the same problem is shown twice in a row. This should not be allowed, based on the rules in PracticeGame.md. Why or how is this happening?

The answers should always be shown in order.

Show "x" instead of "*" for multiplication but keep the internal representation as "*". Show "÷" instead of "/" for division but keep the internal representation as "/".

When the user answers a question correctly, replace the _ with the correct answer.

Allow the answer to be typed on the keyboard. If all of the answers shown are one digit, accept the answer typed after a single digit is typed. If the digit typed matches one of the answers shown, accept it the same way clicking on it would. If all answers shown are two digits, accept the typed answer in this way after two digits. If there is a combination of one and two digit answers shown, then ...

# Speed Drill Racing Game
* Add comments to SpeedDrillRacer.jsx to explain what's happening. Every function should have a brief explanation. More complex code should have more detailed explanation.
* Examine the code and assess whether it matches the design given by the following state transitions. Provide a list of concrete ways the code should be changed so that it matches these.
    * > Copy and paste those parts into the prompt box
* No explosion is shown when the car crashes
* Move the logic for choosing a set of possible answers (generateAnswerSet in PracticeGame.jsx) into a separate utility file. Then use that function in both the practice game and the speed racer game.