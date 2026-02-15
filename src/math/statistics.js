// Statistics model for dmg.math
// Manages problem stats stored under localStorage key "dmg.math".
// Exports a small API used by games to read/update statistics.

const STORAGE_KEY = 'dmg.math.problems';
const DEFAULT_SCORE_MS = 30000; // 30 seconds default
const MAX_LOGS = 20; // keep up to 20 most-recent logs per problem
const SCORE_LOOKBACK = 8; // average over last 8 attempts

let _stats = null;

function _getKey(opa, opb) {
  return `${Number(opa)},${Number(opb)}`;
}

function _ensureLoaded() {
  if (_stats) return;
  const raw = (typeof localStorage !== 'undefined') && localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      _stats = JSON.parse(raw);
      // sanity: ensure ops exist
      ['+','-','*','/'].forEach(op => { if (!_stats[op]) _stats[op] = {}; });
      return;
    } catch (e) {
      // fallthrough to create default
    }
  }
  _stats = _createDefaultStats();
  _save();
}

function _createDefaultStats() {
  const ops = ['+','-','*','/'];
  const out = {};
  ops.forEach(op => {
    out[op] = {};
    for (let a = 1; a <= 10; a++) {
      for (let b = 1; b <= 10; b++) {
        const key = _getKey(a,b);
        switch (op) {
          case '+':
            // all pairs valid for addition
            break;
          case '-':
            // only include pairs where a >= b to avoid negative results
            if (a < b) continue;
            break;
          case '*':
            // all pairs valid for multiplication
            break;
          case '/':
            // only include pairs where a is divisible by b to avoid fractions
            if (a % b !== 0) continue;
            break;
          default:
            continue; // skip unknown ops
        }
        out[op][key] = {
          p: { opa: a, opb: b, oper: op },
          score: DEFAULT_SCORE_MS,
          logs: []
        };
      }
    }
  });
  return out;
}

function _save() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_stats));
  } catch (e) {
    // ignore storage errors
  }
}

function _recalcScoreFor(problemStats) {
  const logs = problemStats.logs || [];
  if (!logs.length) {
    problemStats.score = DEFAULT_SCORE_MS;
    return;
  }
  // assume logs array ordered oldest -> newest; take last SCORE_LOOKBACK entries
  const slice = logs.slice(-SCORE_LOOKBACK);
  const sum = slice.reduce((s, l) => s + (Number(l.t) || 0), 0);
  problemStats.score = slice.length ? Math.round(sum / slice.length) : DEFAULT_SCORE_MS;
}

/**
 * Get the score (milliseconds) for a problem.
 * @param {number} opa
 * @param {number} opb
 * @param {string} oper one of '+','-','*','/'
 * @returns {number} score in milliseconds
 */
export function getProblemScore(opa, opb, oper) {
  _ensureLoaded();
  const opMap = _stats[oper];
  if (!opMap) return DEFAULT_SCORE_MS;
  const key = _getKey(opa, opb);
  const ps = opMap[key];
  return ps ? ps.score : DEFAULT_SCORE_MS;
}

/**
 * Get the current accuracy for a problem.
 * Calculated as: number of successful logs / total attempts across those logs.
 * Returns 0 when there are no logs.
 * @param {number} opa
 * @param {number} opb
 * @param {string} oper
 * @returns {number} accuracy in range [0,1]
 */
export function getProblemAccuracy(opa, opb, oper) {
  _ensureLoaded();
  const opMap = _stats[oper];
  if (!opMap) return 0;
  const key = _getKey(opa, opb);
  const ps = opMap[key];
  if (!ps || !ps.logs || !ps.logs.length) return 0;
  const totalLogs = ps.logs.length;
  const totalAttempts = ps.logs.reduce((s, l) => s + (Number(l.att) || 0), 0);
  if (!totalAttempts) return 0;
  return totalLogs / totalAttempts;
}

/**
 * Add a log entry for a problem and update its score.
 * problem may be a ProblemDef object: {opa, opb, oper}
 * @param {object} problem ProblemDef object OR opa (number)
 * @param {number} timeToCorrect time in milliseconds
 * @param {number} attempts number of attempts until correct (includes incorrect attempts)
 */
export function addLog(problem, timeToCorrect, attempts) {
  _ensureLoaded();
  let opa, opb, oper;
  if (problem && typeof problem === 'object' && 'opa' in problem && 'opb' in problem && 'oper' in problem) {
    opa = problem.opa; opb = problem.opb; oper = problem.oper;
  } else {
    // support calling signature addLog(opa, timeToCorrect, attempts) is not standard,
    // so attempt to guard: if problem is a number and next args provided, treat as opa.
    // But primary expected use is (problemDef, t, att).
    throw new Error('addLog expects a ProblemDef object as first argument');
  }
  const key = _getKey(opa, opb);
  if (!_stats[oper]) _stats[oper] = {};
  const opMap = _stats[oper];
  if (!opMap[key]) {
    opMap[key] = { p: { opa: Number(opa), opb: Number(opb), oper }, score: DEFAULT_SCORE_MS, logs: [] };
  }
  const ps = opMap[key];
  if (!ps.logs) ps.logs = [];
  const newLog = { dt: new Date().toISOString(), t: Number(timeToCorrect) || 0, att: Number(attempts) || 1 };
  ps.logs.push(newLog);
  // keep most recent MAX_LOGS entries (assumes logs oldest->newest)
  if (ps.logs.length > MAX_LOGS) ps.logs = ps.logs.slice(-MAX_LOGS);
  _recalcScoreFor(ps);
  _save();
}

/**
 * Get problems in the lowest percentile (worst performing) for given operations.
 * "Lowest percentile" is interpreted as the bottom X% by performance (highest average time).
 * @param {number} percentile value in range [0,100]
 * @param {Array<string>} activeOperations array of operations, e.g. ['+','-']
 * @returns {Array<Object>} array of ProblemStats objects (each includes `p`, `score`, `logs`, and `oper`)
 */
export function getLowestPercentile(percentile, activeOperations) {
  _ensureLoaded();
  if (!Array.isArray(activeOperations) || activeOperations.length === 0) return [];
  const items = [];
  activeOperations.forEach(op => {
    const map = _stats[op] || {};
    Object.keys(map).forEach(k => {
      const ps = map[k];
      items.push(Object.assign({}, ps, { oper: op }));
    });
  });
  if (!items.length) return [];
  // worst performers = highest score -> sort descending
  items.sort((a,b) => (b.score || 0) - (a.score || 0));
  const take = Math.max(0, Math.floor((percentile / 100) * items.length));
  if (take === 0) return [];
  return items.slice(0, take);
}

/**
 * Trim logs for all problems whose operation is in activeOperations.
 * Ensures at most MAX_LOGS per problem and updates scores.
 * @param {Array<string>} activeOperations
 */
export function trimLogs(activeOperations) {
  _ensureLoaded();
  if (!Array.isArray(activeOperations)) return;
  activeOperations.forEach(op => {
    const map = _stats[op] || {};
    Object.keys(map).forEach(k => {
      const ps = map[k];
      if (!ps.logs) ps.logs = [];
      if (ps.logs.length > MAX_LOGS) ps.logs = ps.logs.slice(-MAX_LOGS);
      _recalcScoreFor(ps);
    });
  });
  _save();
}

/**
 * Expose the raw stats object (read-only copy) for debug or UI usage.
 * Use sparingly; prefer the API functions above.
 */
export function getAllStats() {
  _ensureLoaded();
  return JSON.parse(JSON.stringify(_stats));
}

// initialize eagerly if running in browser
try { _ensureLoaded(); } catch (e) {}
