# Speed Drill Game - Racing

Route: /da-montou-games/math/speed-racer

This is a top-down racing car game where the user drives their car around obstacles.

## Demo Screen

Before the session begins, show the user a screen demonstrating how to play the game. A summary of what to tell the user: 

> Problems will appear at the top of the screen and you must give the correct answer to position your car between the barriers. But be careful: wrong answers will make you crash and being too slow will also. Tap “Start” to begin.

When the user taps “Start”, begin the session, hiding the demo screen and showing the racing screen.

## Racing Screen

A session consists of 20 rounds, one problem per round. When the session starts, choose a set of 20 problems as follows:
* Only choose problems whose operation matches one of those in the set of active operations.
* Choose problems that are in the bottom 50% (use statistics getLowestPercentile API).
* From this set, choose 20 problems at random, ensuring no duplicates.
* The problems should already be sorted in descending order from getLowestPercentile, so that the highest scores are shown first.

Calculate the session minimum as min(0, lowest correct answers of all problems minus 5%)

Calculate the session maximum as highest correct answers of all problems plus 5%.

Show the problem for the current round centered horizontally, 25% from the top of the screen. The font size is 15% of the vertical height of the window. Font color is #f0f0f0. Dark background. The problem is shown as “opa oper opa” Example: 2 + 4

The position of the car is fixed on a horizontal line (it does not move vertically), which is 25% up from the bottom of the screen. The car is facing toward the top of the screen. When the car is moving to the right or left, it turns 45 degrees in that direction, rotating around its center point. Use smooth transitions lasting 0.5 sec when the angle changes. When the car reaches its target horizontal position, the car returns to facing upward, using the same kind of smooth transition. 

The bounding box of the car is 80 px high and 50 px wide.

The obstacle consists of two barriers, one that extends from the gap to the left side of the screen. The other barrier is on the right, extending to the right side of the screen. The gap between them is 80 px wide. See the mockup in `design/math/Math Racing Game Mockup.png`.

One barrier pair is shown for each round. The barriers start above the top of the screen and move downward. At each round, the speed of descent of the barriers is calculated so that the barriers will reach the front of the car (car vertical position minus half the car’s height) after X seconds, where X is the score of the current problem plus one second.

When the barriers reach the vertical position of the front of the car, if the car’s position matches the target position of the correct answer to the current problem, the car passes between the barriers and the next round begins.

If the position does not match, the animation stops (barriers stop moving down, car stops moving horizontally), a small explosion animation is shown (lasting 2 seconds) centered on the front of the car. See mockup in `design/math/Car crash with explosion.png` Then the session ends.

When the user chooses an answer, begin moving the car’s center point horizontally toward the target position corresponding to the answer. This position is calculated as:
* Left anchor: An answer equal to the session minimum means the car’s target position is 50 px from the left side of the screen
* Right anchor: An answer matching the session maximum means the car’s target position is 50 px from the right side of the screen
* Interpolate the target position between the min and max based on the anchor points above.

Move the car horizontally toward its target position at the same speed that the barriers move downward. The overall effect is that the car appears to move at a 45 degree angle (horizontally and vertically at the same speed). 

# End of session

After the final round:
* The session ends
* Present the user with their session score:
    * Calculate the session score as follows:
        * For all of the problems shown in this session, add up the problems':
            * original scores (recall from earlier). This is the oldScore.
            * original accuracy. This is the oldAccuracy.
            * current scores (call statistics API). This is the newScore.
            * current accuracy. This is the newAccuracy.
        * accuracyDiff = 100.0 * (newAccuracy - oldAccuracy) / oldAccuracy
        * scoreDiff = 100.0 * (newScore - oldScore) / oldScore
    * Show a message to user:
        * Great job! You improved your accuracy by &lt;accuracyDiff>% and your speed by &lt;scoreDiff>%
        * You cleared a total of N barriers
* Call trimLogs on the statistics after calculating the user’s improvement
* Present the user with a “Main menu” button to return to the main menu.

# Design
See SpeedRacingGameDesign.md
