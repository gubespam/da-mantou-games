import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProblemScore,
  getProblemAccuracy,
  addLog,
  getLowestPercentile,
  trimLogs,
} from './statistics.js';
import './PracticeGame.css';

const ROUNDS_PER_SESSION = 15;
const FOCUS_SET_SIZE = 4;
const FOCUS_SET_IMPROVEMENT_PERCENT = 5;
const CORRECT_ANSWERS_TO_ROTATE = 4;
const FOCUS_SET_PERCENTAGE = 40;

// State enum
const SCREEN_START = 'start';
const SCREEN_PLAYING = 'playing';
const SCREEN_SUMMARY = 'summary';

export default function PracticeGame({ activeOperations }) {
  const navigate = useNavigate();
  const [screen, setScreen] = useState(SCREEN_START);
  const [currentRound, setCurrentRound] = useState(0);
  const [focusSet, setFocusSet] = useState([]);
  const [currentProblem, setProblem] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [sessionProblems, setSessionProblems] = useState([]); // track all problems shown and their original stats
  const [lastTwoProblems, setLastTwoProblems] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [disabledAnswers, setDisabledAnswers] = useState(new Set());
  const [sessionSummary, setSessionSummary] = useState(null);
  const [problemCorrectCount, setProblemCorrectCount] = useState({}); // track consecutive correct answers per problem

  // Handle back button
  const handleBack = () => {
    navigate('/da-mantou-games/math');
  };

  // Initialize focus set
  const initializeFocusSet = () => {
    const operArray = Object.keys(activeOperations).filter(op => activeOperations[op]);
    
    // If no operations selected, default to addition
    if (operArray.length === 0) {
      operArray.push('add');
    }
    
    const operSymbols = {
      add: '+',
      subtract: '-',
      multiply: '*',
      divide: '/',
    };
    const ops = operArray.map(op => operSymbols[op]);
    
    const lowestPercentile = getLowestPercentile(FOCUS_SET_PERCENTAGE, ops);
    const newFocusSet = lowestPercentile.slice(0, FOCUS_SET_SIZE);
    setFocusSet(newFocusSet);
    setProblemCorrectCount({});
    return newFocusSet;
  };

  // Start game session
  const startGame = () => {
    const newFocusSet = initializeFocusSet();
    setCurrentRound(1);
    setSessionProblems([]);
    setLastTwoProblems([]);
    setScreen(SCREEN_PLAYING);
    showNextProblem(newFocusSet, []);
  };

  // Generate a set of answers to show the user
  // Includes the correct answer and 2 wrong answers that are close to the correct answer
  const generateAnswerSet = (correct, focusSet, allProblems) => {
    // Start with correct answer - put into the candidate pool
    // Randomly pick a direction (up or down) and a variance (1 or 2)
    // If direction is down, then generate a new candidate answer by applying the variance
    //   in the chosen direction to the minimum of all the answers in the pool
    // If the generated candidate is negative, discard it
    // Loop back to "Randomly..." step above until we have 3 candidates
    //   in the pool (correct answer + 2 wrong answers)

    const candidates = new Set();
    candidates.add(correct);
    while(candidates.size < 3) {
      const variance = Math.random() < 0.5 ? 1 : 2;
      const direction = Math.random() < 0.5 ? -1 : 1;
      if (direction === -1) {
        const minCandidate = Math.min(...candidates);
        const newCandidate = minCandidate - variance;
        if (newCandidate >= 0) {
          candidates.add(newCandidate);
        }
      } else {
        const maxCandidate = Math.max(...candidates);
        const newCandidate = maxCandidate + variance;
        candidates.add(newCandidate);
      }
    }
    return Array.from(candidates).sort((a, b) => a - b);
  };

  // Show next problem
  const showNextProblem = (currentFocusSet, currentLastTwo) => {
    const operArray = Object.keys(activeOperations).filter(op => activeOperations[op]);
    
    // If no operations selected, default to addition
    if (operArray.length === 0) {
      operArray.push('add');
    }
    
    const operSymbols = {
      add: '+',
      subtract: '-',
      multiply: '*',
      divide: '/',
    };
    const ops = operArray.map(op => operSymbols[op]);

    // Decide: 80% from focus set, 20% from all
    let problem;
    if (Math.random() < 0.8 && currentFocusSet.length > 0) {
      problem = currentFocusSet[Math.floor(Math.random() * currentFocusSet.length)];
    } else {
      // Get all problems matching active operations
      const lowestPercentile = getLowestPercentile(100, ops);
      const candidates = lowestPercentile.filter(p => !currentLastTwo.find(lp => 
        lp.p.opa === p.p.opa && lp.p.opb === p.p.opb && lp.p.oper === p.p.oper
      ));
      problem = candidates.length > 0 
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : (currentFocusSet.length > 0 ? currentFocusSet[Math.floor(Math.random() * currentFocusSet.length)] : null);
    }

    // Fallback if no problem found
    if (!problem) {
      problem = {
        p: { opa: 1, opb: 1, oper: '+' },
        score: 30000,
        logs: [],
        oper: '+'
      };
    }

    // Record original stats for this problem if first time shown
    const sessionKey = `${problem.p.opa},${problem.p.opb},${problem.p.oper}`;
    const isFirstTime = !sessionProblems.some(sp => sp.key === sessionKey);
    
    let originalStats = { score: problem.score, accuracy: getProblemAccuracy(problem.p.opa, problem.p.opb, problem.p.oper) };
    
    const newSessionProblems = [...sessionProblems];
    if (isFirstTime) {
      newSessionProblems.push({
        key: sessionKey,
        problem: problem.p,
        originalScore: originalStats.score,
        originalAccuracy: originalStats.accuracy,
        newScore: null,
        newAccuracy: null,
      });
    }
    setSessionProblems(newSessionProblems);

    // Calculate correct answer
    let answer;
    const { opa, opb, oper } = problem.p;
    if (oper === '+') answer = opa + opb;
    else if (oper === '-'){
      answer = opa - opb;
    }
    else if (oper === '*') answer = opa * opb;
    else if (oper === '/') answer = Math.round(opa / opb); // simplified for now

    const allAnswers = generateAnswerSet(answer, currentFocusSet, []);

    setProblem(problem.p);
    setCorrectAnswer(answer);
    setAnswers(allAnswers);
    setSelectedAnswer(null);
    setDisabledAnswers(new Set());
    setStartTime(Date.now());

    // Update last two problems
    const newLastTwo = [problem, ...currentLastTwo].slice(0, 2);
    setLastTwoProblems(newLastTwo);
  };

  // Handle answer selection
  const handleAnswerClick = (answer) => {
    if (disabledAnswers.has(answer)) {
      return;
    }

    if (answer === correctAnswer) {
      // Only set selectedAnswer for correct answer
      setSelectedAnswer(answer);

      // Correct answer
      const timeToCorrect = Date.now() - startTime;
      const endTime = setTimeout(() => {
        // Log the result
        addLog(currentProblem, timeToCorrect, 1);

        // Update correct count
        const problemKey = `${currentProblem.opa},${currentProblem.opb},${currentProblem.oper}`;
        setProblemCorrectCount(prev => ({
          ...prev,
          [problemKey]: (prev[problemKey] || 0) + 1,
        }));

        // Check if problem should be rotated out
        const isFirstTime = sessionProblems.some(sp => 
          sp.problem.opa === currentProblem.opa &&
          sp.problem.opb === currentProblem.opb &&
          sp.problem.oper === currentProblem.oper &&
          sp.newScore === null // hasn't been checked yet
        );
        
        if (isFirstTime) {
          const originalScore = sessionProblems.find(sp =>
            sp.problem.opa === currentProblem.opa &&
            sp.problem.opb === currentProblem.opb &&
            sp.problem.oper === currentProblem.oper
          )?.originalScore || 0;
          
          const shouldRotate = (timeToCorrect < originalScore * (1 - FOCUS_SET_IMPROVEMENT_PERCENT / 100)) ||
            (problemCorrectCount[problemKey] + 1 >= CORRECT_ANSWERS_TO_ROTATE);
          
          if (shouldRotate && focusSet.length > 0) {
            // Rotate out this problem
            const newFocusSet = focusSet.filter(p =>
              !(p.p.opa === currentProblem.opa && p.p.opb === currentProblem.opb && p.p.oper === currentProblem.oper)
            );
            
            // Add a new problem
            const operArray = Object.keys(activeOperations).filter(op => activeOperations[op]);
            const operSymbols = {
              add: '+',
              subtract: '-',
              multiply: '*',
              divide: '/',
            };
            const ops = operArray.map(op => operSymbols[op]);
            const lowestPercentile = getLowestPercentile(FOCUS_SET_PERCENTAGE, ops);
            const availableNewProblems = lowestPercentile.filter(p =>
              !newFocusSet.find(fs => fs.p.opa === p.p.opa && fs.p.opb === p.p.opb && fs.p.oper === p.p.oper) &&
              !focusSet.find(fs => fs.p.opa === p.p.opa && fs.p.opb === p.p.opb && fs.p.oper === p.p.oper)
            );
            
            if (availableNewProblems.length > 0) {
              const newProblem = availableNewProblems[Math.floor(Math.random() * availableNewProblems.length)];
              newFocusSet.push(newProblem);
            }
            
            setFocusSet(newFocusSet);
          }
        }

        // Move to next round
        if (currentRound < ROUNDS_PER_SESSION) {
          setCurrentRound(currentRound + 1);
          showNextProblem(focusSet, lastTwoProblems);
        } else {
          // Session complete
          endSession();
        }
      }, 1000);

      return () => clearTimeout(endTime);
    } else {
      // Incorrect answer - just disable it, allow user to try other answers
      const newDisabled = new Set(disabledAnswers);
      newDisabled.add(answer);
      setDisabledAnswers(newDisabled);
    }
  };

  // End session and calculate summary
  const endSession = () => {
    // Fetch updated scores for all problems in the session
    const operArray = Object.keys(activeOperations).filter(op => activeOperations[op]);
    const operSymbols = {
      add: '+',
      subtract: '-',
      multiply: '*',
      divide: '/',
    };
    const ops = operArray.map(op => operSymbols[op]);

    const updatedProblems = sessionProblems.map(sp => ({
      ...sp,
      newScore: getProblemScore(sp.problem.opa, sp.problem.opb, sp.problem.oper),
      newAccuracy: getProblemAccuracy(sp.problem.opa, sp.problem.opb, sp.problem.oper),
    }));

    // Calculate improvement
    let oldScoreSum = 0;
    let newScoreSum = 0;
    let oldAccuracySum = 0;
    let newAccuracySum = 0;

    updatedProblems.forEach(p => {
      oldScoreSum += p.originalScore || 0;
      newScoreSum += p.newScore || 0;
      oldAccuracySum += p.originalAccuracy || 0;
      newAccuracySum += p.newAccuracy || 0;
    });

    const scoreDiff = oldScoreSum > 0 ? 100.0 * (oldScoreSum - newScoreSum) / oldScoreSum : 0;
    const accuracyDiff = oldAccuracySum > 0 ? 100.0 * (newAccuracySum - oldAccuracySum) / oldAccuracySum : 0;

    // Trim logs
    trimLogs(ops);

    setSessionSummary({
      scoreDiff: Math.round(scoreDiff * 10) / 10,
      accuracyDiff: Math.round(accuracyDiff * 10) / 10,
    });

    setScreen(SCREEN_SUMMARY);
  };

  // Start screen
  if (screen === SCREEN_START) {
    return (
      <div className="practice-container">
        <button className="back-button" onClick={handleBack}>← Back</button>
        <h1 className="practice-title">Practice Game</h1>
        <button className="start-button" onClick={startGame}>Start</button>
      </div>
    );
  }

  // Playing screen
  if (screen === SCREEN_PLAYING && currentProblem) {
    const problemText = `${currentProblem.opa} ${currentProblem.oper} ${currentProblem.opb} = _`;
    
    return (
      <div className="game-container">
        <div className="game-header">
          <button className="back-button-small" onClick={handleBack}>← Back</button>
          <div className="round-indicator">Round {currentRound}/{ROUNDS_PER_SESSION}</div>
        </div>
        <div className="problem-section">
          <div className="problem-text">{problemText}</div>
        </div>
        <div className="answers-section">
          {answers.map((answer, index) => (
            <button
              key={index}
              className={`answer-button ${
                selectedAnswer === answer ? (answer === correctAnswer ? 'correct' : 'incorrect') : ''
              } ${disabledAnswers.has(answer) ? 'disabled' : ''}`}
              onClick={() => handleAnswerClick(answer)}
              disabled={disabledAnswers.has(answer) || (selectedAnswer !== null && selectedAnswer !== answer)}
            >
              {answer}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Summary screen
  if (screen === SCREEN_SUMMARY && sessionSummary) {
    return (
      <div className="summary-container">
        <h1 className="summary-title">Session Complete!</h1>
        <div className="summary-message">
          Great job! You improved your accuracy by <span className="highlight">{sessionSummary.accuracyDiff.toFixed(1)}%</span> and your speed by <span className="highlight">{sessionSummary.scoreDiff.toFixed(1)}%</span>
        </div>
        <button className="menu-button" onClick={() => navigate('/da-mantou-games/math')}>
          Main Menu
        </button>
      </div>
    );
  }

  return null;
}
