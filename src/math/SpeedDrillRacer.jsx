import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getLowestPercentile,
  getProblemScore,
  getProblemAccuracy,
  addLog,
  trimLogs,
} from './statistics.js';
import './SpeedDrillRacer.css';

const ROUNDS_PER_SESSION = 20;
const CAR_WIDTH = 50;
const CAR_HEIGHT = 80;
const BARRIER_HEIGHT = 50;
const GAP_WIDTH = 80;
const LEFT_ANCHOR = 50; // px

export default function SpeedDrillRacer({ activeOperations }) {
  const navigate = useNavigate();
  const [screen, setScreen] = useState('demo');
  const [sessionProblems, setSessionProblems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [problem, setProblem] = useState(null);
  const [startTime, setStartTime] = useState(0);

  // dynamic positions
  const [carX, setCarX] = useState(window.innerWidth / 2);
  const [carTargetX, setCarTargetX] = useState(window.innerWidth / 2);
  const [barrierY, setBarrierY] = useState(-BARRIER_HEIGHT);
  const [roundState, setRoundState] = useState('idle'); // idle | running | passed | crashed | finished

  const ref = useRef({ raf: null, lastTime: 0, barrierSpeed: 0, carVx: 0 });
  const [sessionMin, setSessionMin] = useState(0);
  const [sessionMax, setSessionMax] = useState(1);
  const [showResults, setShowResults] = useState(null);

  useEffect(() => {
    return () => cancelAnimationFrame(ref.current.raf);
  }, []);

  const getActiveOps = () => {
    const operSymbols = { add: '+', subtract: '-', multiply: '*', divide: '/' };
    const ops = Object.keys(activeOperations || {}).filter(k => activeOperations[k]).map(k => operSymbols[k]);
    return ops.length ? ops : ['+'];
  };

  const prepareSession = () => {
    const ops = getActiveOps();
    const candidates = getLowestPercentile(50, ops) || [];
    // ensure we have at least some candidates
    let pool = candidates.slice();
    if (pool.length < ROUNDS_PER_SESSION) {
      const extra = getLowestPercentile(100, ops) || [];
      extra.forEach(e => { if (!pool.find(p => p.p.opa === e.p.opa && p.p.opb === e.p.opb && p.p.oper === e.p.oper)) pool.push(e); });
    }
    // unique random pick 20
    const chosen = [];
    const used = new Set();
    let attempts = 0;
    while (chosen.length < ROUNDS_PER_SESSION && attempts < pool.length * 3) {
      const idx = Math.floor(Math.random() * pool.length);
      const item = pool[idx];
      const key = `${item.p.opa},${item.p.opb},${item.p.oper}`;
      if (!used.has(key)) {
        used.add(key);
        chosen.push({ ...item, oldScore: item.score, oldAccuracy: getProblemAccuracy(item.p.opa, item.p.opb, item.p.oper) });
      }
      attempts++;
    }
    // pad if needed
    for (let j = 0; j < pool.length && chosen.length < ROUNDS_PER_SESSION; j++) {
      const item = pool[j];
      const key = `${item.p.opa},${item.p.opb},${item.p.oper}`;
      if (!used.has(key)) {
        used.add(key);
        chosen.push({ ...item, oldScore: item.score, oldAccuracy: getProblemAccuracy(item.p.opa, item.p.opb, item.p.oper) });
      }
    }

    const ansVals = chosen.map(c => c.p.ans);
    const minAns = Math.min(...ansVals);
    const maxAns = Math.max(...ansVals);
    const sMin = Math.min(0, minAns * 0.95);
    const sMax = maxAns * 1.05 || sMin + 1;

    setSessionProblems(chosen);
    setSessionMin(sMin);
    setSessionMax(sMax);
    setCurrentIndex(0);
    setScreen('playing');
    setTimeout(() => startRound(0, chosen, sMin, sMax), 50);
  };

  const startRound = (index, chosen = sessionProblems, sMin = sessionMin, sMax = sessionMax) => {
    const p = chosen[index];
    if (!p) return endSession();
    setProblem(p.p);
    setStartTime(Date.now());
    setBarrierY(-BARRIER_HEIGHT);
    setCarX(window.innerWidth / 2);
    setCarTargetX(window.innerWidth / 2);
    setRoundState('idle');
    const scoreMs = getProblemScore(p.p.opa, p.p.opb, p.p.oper) || 30000;
    const T = scoreMs / 1000 + 1;
    const barrierStartY = -BARRIER_HEIGHT;
    const carCenterY = window.innerHeight * 0.75;
    const carFrontY = carCenterY - CAR_HEIGHT / 2;
    const Dy = carFrontY - barrierStartY;
    const vy = Dy / T; // px/s
    ref.current.barrierSpeed = vy;
    ref.current.carVx = 0;
    ref.current.lastTime = performance.now();
    if (ref.current.raf) cancelAnimationFrame(ref.current.raf);
    ref.current.raf = requestAnimationFrame(loop);
  };

  const mapAnswerToX = (ans) => {
    const W = window.innerWidth;
    const L = LEFT_ANCHOR;
    const R = W - LEFT_ANCHOR;
    const denom = sessionMax - sessionMin;
    const frac = denom === 0 ? 0.5 : (ans - sessionMin) / denom;
    const clamped = Math.max(0, Math.min(1, frac));
    return L + clamped * (R - L);
  };

  const handleChooseAnswer = (ans) => {
    if (!problem || roundState === 'running') return;
    const target = mapAnswerToX(ans);
    setCarTargetX(target);
    const vy = ref.current.barrierSpeed || 0;
    const vx = Math.sign(target - carX) * Math.abs(vy);
    ref.current.carVx = vx;
    setRoundState('running');
    setStartTime(Date.now());
  };

  const loop = (t) => {
    const now = t;
    const dt = Math.min(0.1, (now - ref.current.lastTime) / 1000);
    ref.current.lastTime = now;
    const vy = ref.current.barrierSpeed || 0;
    setBarrierY(prev => {
      const ny = prev + vy * dt;
      return ny;
    });
    if (roundState === 'running') {
      setCarX(prev => {
        const vx = ref.current.carVx || 0;
        let nx = prev + vx * dt;
        if ((vx > 0 && nx >= carTargetX) || (vx < 0 && nx <= carTargetX)) {
          nx = carTargetX;
          ref.current.carVx = 0;
        }
        return nx;
      });
    }

    const carCenterY = window.innerHeight * 0.75;
    const carFrontY = carCenterY - CAR_HEIGHT / 2;
    if (barrierY >= carFrontY) {
      cancelAnimationFrame(ref.current.raf);
      ref.current.raf = null;
      const correctAns = problem.ans;
      const correctX = mapAnswerToX(correctAns);
      const tolerance = CAR_WIDTH / 2;
      const passed = Math.abs(carX - correctX) <= tolerance;
      if (passed) {
        const timeToCorrect = Date.now() - startTime;
        const attempts = 1;
        addLog(problem, timeToCorrect, attempts);
        const next = currentIndex + 1;
        setCurrentIndex(next);
        if (next < ROUNDS_PER_SESSION) {
          setTimeout(() => startRound(next), 400);
        } else {
          endSession();
        }
      } else {
        setRoundState('crashed');
        setTimeout(() => endSession(), 2000);
      }
      return;
    }

    ref.current.raf = requestAnimationFrame(loop);
  };

  const endSession = () => {
    setScreen('results');
    const updated = sessionProblems.map(sp => ({
      ...sp,
      newScore: getProblemScore(sp.p.opa, sp.p.opb, sp.p.oper),
      newAccuracy: getProblemAccuracy(sp.p.opa, sp.p.opb, sp.p.oper),
    }));
    let oldScoreSum = 0, newScoreSum = 0, oldAccSum = 0, newAccSum = 0;
    updated.forEach(u => {
      oldScoreSum += u.oldScore || 0;
      newScoreSum += u.newScore || 0;
      oldAccSum += u.oldAccuracy || 0;
      newAccSum += u.newAccuracy || 0;
    });
    const accuracyDiff = oldAccSum > 0 ? 100.0 * (newAccSum - oldAccSum) / oldAccSum : 0;
    const scoreDiff = oldScoreSum > 0 ? 100.0 * (oldScoreSum - newScoreSum) / oldScoreSum : 0;
    trimLogs(getActiveOps());
    setShowResults({ accuracyDiff: Math.round(accuracyDiff * 10) / 10, scoreDiff: Math.round(scoreDiff * 10) / 10, cleared: currentIndex });
    setRoundState('finished');
  };

  if (screen === 'demo') {
    return (
      <div className="speed-demo">
        <h1>Speed Drill Racer</h1>
        <p className="demo-copy">Problems will appear at top. Answer to place your car between barriers. Tap Start to begin.</p>
        <div className="demo-controls">
          <button onClick={() => navigate('/da-mantou-games/math')}>Back</button>
          <button onClick={prepareSession}>Start</button>
        </div>
      </div>
    );
  }

  if (screen === 'playing' && problem) {
    const problemText = `${problem.opa} ${problem.oper} ${problem.opb}`;
    const carStyle = {
      width: `${CAR_WIDTH}px`,
      height: `${CAR_HEIGHT}px`,
      transform: `translate(-50%, -50%) translate(${carX}px, ${window.innerHeight * 0.75}px)`,
    };
    const barrierTopStyle = {
      transform: `translateY(${barrierY}px)`,
    };
    const correctX = mapAnswerToX(problem.ans);
    const gapLeft = Math.max(0, correctX - GAP_WIDTH / 2);
    const leftBarrierStyle = {
      left: '0px',
      width: `${gapLeft}px`,
      height: `${BARRIER_HEIGHT}px`,
    };
    const rightBarrierStyle = {
      left: `${gapLeft + GAP_WIDTH}px`,
      right: '0px',
      height: `${BARRIER_HEIGHT}px`,
    };

    return (
      <div className="speed-container">
        <div className="top-problem" style={{ top: `25%`, fontSize: `${Math.round(window.innerHeight * 0.06)}px` }}>{problemText}</div>

        <div className="race-area">
          <div className="barrier-pair" style={barrierTopStyle}>
            <div className="barrier left" style={leftBarrierStyle}></div>
            <div className="barrier right" style={rightBarrierStyle}></div>
          </div>

          <div className={`car ${roundState === 'crashed' ? 'crash' : ''}`} style={carStyle}></div>
        </div>

        <div className="answers-row">
          <button onClick={() => handleChooseAnswer(sessionMin)}>{Math.round(sessionMin)}</button>
          <button onClick={() => handleChooseAnswer(problem.ans)}>{problem.ans}</button>
          <button onClick={() => handleChooseAnswer(sessionMax)}>{Math.round(sessionMax)}</button>
        </div>
      </div>
    );
  }

  if (screen === 'results' && showResults) {
    return (
      <div className="speed-results">
        <h2>Session Complete</h2>
        <p>Great job! You improved your accuracy by {showResults.accuracyDiff}% and your speed by {showResults.scoreDiff}%</p>
        <p>You cleared a total of {showResults.cleared} barriers</p>
        <div className="results-controls">
          <button onClick={() => navigate('/da-mantou-games/math')}>Main menu</button>
        </div>
      </div>
    );
  }

  return null;
}
