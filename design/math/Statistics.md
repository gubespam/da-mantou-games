# Statistics Data Model

Partial Example:
```
{
  "+": {
    "1,2": {
      "p": {
        "opa": 1,
        "opb": 2,
        "oper": "+"
      },
      "score": 5000,
      "logs": [
        { dt: "...", t: 5000, att: 2 },
        ...
      ]
    }
  }
}
```

The overall statistics is an object whose keys are one of (+, -, *, /)
These keys group the problems into sets, based on operation.
Each operation set is an object whose keys are compound keys like "opa,opb", representing the operands of each problem. The values are objects of type ProblemStats, as defined below.

The ProblemDef class contains these fields:
- opa - number; first operand
- opb - number; second operand
- oper - string; operation; one of  (+, -, *, /)

The ProblemStats class contains these fields:
- p - ProblemDef object; the problem
- score - number; the score; see below
- logs: array of Log elements, one for each attempt to answer this problem

The Log class contains these fields:
- dt: timestamp; date and time when the problem was presented
- t: number; time-to-correct answer, in milliseconds, for this attempt
- att: number; number of attempts it took before the user answered correctly

A new log entry is added each time a problem is presented and answered correctly, in either of the games. The logs are kept to a maximum of the 20 most-recent entries per problem. The score is updated after a log has been added and max entries adjusted.

A problem’s current "score" is the average time-to-correct for that problem over the last 8 attempts to answer it. The score for a problem is updated whenever a log is added.

Structure the statistics management logic in a central place, apart the games that read and update the statistics. The games should only call a simple API like the following:
- getProblemScore(opa, opb, oper) - get the current score of a problem
- getProblemAccuracy(opa, opb, oper) - get the current accuracy of a problem; calculated this based on the number of logs for this problem divided by the total attempts in all logs for this problem
- addLog(problem, timeToCorrect, attempts) - add a log entry; recalculate score for this problem. attempts is the number of attempts until the user chooses the correct answer (includes both incorrect and correct attempts).
- getLowestPercentile(percentile, activeOperations) - get the list of problems that are in the lowest percentile of all problems whose operation matches one of those in the activeOperations param
- trimLogs(activeOperations) - trim the logs for all problems whose operation is one of the activeOperations, to the max allowed (20 most recent logs per problem) and update the score of all problems

Add appropriate comments to the API to document how to use it.

When the application loads, the statistics object is loaded from local storage at the key "dmg.math".

If the statistics does not yet exist, it is pre-populated with one key for each of the problems below:
- For each of the operations (+, -, *, /)
    - For each of the numbers 1 to 10, as opa
        - For each of the numbers 1 to 10, as opb
            - One problem; no logs; set score to 30 seconds
