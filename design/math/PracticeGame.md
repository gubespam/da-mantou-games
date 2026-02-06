## Practice Game

Route: /da-montou-games/#math/practice

This is a game for practicing arithmetic problems between two numbers.

When the user enters this game, the user is shown the name of the game and a green button that says “Start”. A “&lt; Back” arrow returns the user to the main menu.

When the user chooses “Start”, the session begins.

At the start of each session, a “focus set” of 4 problems is chosen at random from problems matching the active operations, within the lowest 40% of scores in the statistics.

Use the same focus set until one of the problems in the set meets this criteria:
* the problem's time-to-correct improves by 5% compared to the problem’s score when the set was chosen
* The problem was answered correctly 4 times in the current session (with no incorrect answers)

When a problem meets this criteria, it is removed from the focus set and another is chosen to replace it (from the lowest 40% as mentioned earlier).

When a problem is removed, it cannot be included again again in the focus set for the current session

When a specific problem is shown for the first time each session, get the score and accuracy of that problem. This is the problem’s “original” score and accuracy. You’ll use this at the end of the round to show the user their progress.

Each session consists of 15 rounds.

At each round, randomly choose one of these options:
* 80% of the time, choose a problem randomly from the focus set.
* Otherwise (20% of the time) choose a problem randomly from all problems matching the active operations.

Each round, the chosen problem is shown to the user and the start time is tracked.

When the user chooses the correct answer, round ends and the end time is tracked.

The “time-to-correct” for the problem in the current round is calculated as the end time minus the start time, in milliseconds.

The time-to-correct for the current round is logged to the statistics for the problem shown in that round.

Keep track of the last 2 problems shown. After a problem is shown, it is not presented again until at least 2 other problems have been presented.

Each round, the correct answer is shown with two other, incorrect answers. The incorrect answers are randomly chosen such that all of the answers (in sorted order) are exactly 1 or 2 increments apart from each other. The position of the answer within the set of answers is random (it might be the lowest of the three, the middle or the highest). All three answers are always unique from one another. For example, if the correct answer is 4, then the incorrect answers might be 2 and 5; the answers sorted are 2, 4, 5, with increments of only 1 of 2 between them. Or the answers might be 4, 5, 7 (correct answer is first). Or the answers might be 1, 3, 4 (correct answer is last).

**Interface during each round:**

* The problem is shown at the center of the screen, with the baseline (bottom) of problem text at the vertical center of screen. The font size is 25% of the vertical height of the window. Font color is #f0f0f0. Dark background.
* The problem is shown as “opa oper opa = _” Example: 2 + 4 = _
* Below the question text are the answer options. They are horizontally centered and vertically centered within the bottom half of the window.
* Three possible answers are presented, each inside a rounded corner button of color (pastel purplish blue). The answers are shown in numerical order, from left to right, with spaces between them that are 2 em wide.
* Clicking or tapping on an answer bubble chooses it.
* If the chosen answer is correct, the bubble for that answer enlarges by 80% and the background color transitions to green.
* If the chosen answer is incorrect, the background color of the bubble for that answer fades to 50% grey and becomes disabled (user clicking on it after that does nothing).
* If the user chooses two wrong answers, the remaining (correct) answer does not change and the game waits until the user chooses that answer.
* After the correct answer is chosen, the game waits for 1 second before continuing to the next round.

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
* Call trimLogs on the statistics after calculating the user’s improvement
* Present the user with a “Main menu” button to return to the main menu.