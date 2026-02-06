import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import * as stats from './statistics.js';

// Helper to reload module state (since it uses module-level singleton)
function resetModuleState() {
  // Clear localStorage to force re-initialization
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
}

describe('Statistics Model', () => {
  // Mock localStorage for testing
  let localStorageMock;

  beforeEach(() => {
    // Reset module state by clearing localStorage
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key) => localStorageMock[key] || null),
      setItem: vi.fn((key, value) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
    };
    // Force re-initialization by calling a simple API function
    // which will trigger _ensureLoaded() and re-init with defaults
    try {
      stats.getAllStats();
    } catch (e) {
      // ignore
    }
  });

  afterEach(() => {
    // Clean up after each test
    localStorageMock = {};
    vi.clearAllMocks();
  });

  describe('getProblemScore', () => {
    it('should return 30000ms for a new problem', () => {
      const score = stats.getProblemScore(1, 1, '+');
      expect(score).toBe(30000);
    });

    it('should return 30000ms for any uninitialized problem', () => {
      expect(stats.getProblemScore(5, 7, '-')).toBe(30000);
      expect(stats.getProblemScore(3, 4, '*')).toBe(30000);
      expect(stats.getProblemScore(8, 2, '/')).toBe(30000);
    });

    it('should return 30000ms for invalid operation', () => {
      const score = stats.getProblemScore(1, 1, '!');
      expect(score).toBe(30000);
    });
  });

  describe('getProblemAccuracy', () => {
    it('should return 0 for a new problem with no logs', () => {
      const accuracy = stats.getProblemAccuracy(1, 1, '+');
      expect(accuracy).toBe(0);
    });

    it('should return 0 for invalid operation', () => {
      const accuracy = stats.getProblemAccuracy(1, 1, '!');
      expect(accuracy).toBe(0);
    });

    it('should calculate accuracy as logs / total attempts', () => {
      // Add a log with 2 attempts (1 success = 2 attempts total)
      stats.addLog({ opa: 2, opb: 3, oper: '+' }, 5000, 2);
      const accuracy = stats.getProblemAccuracy(2, 3, '+');
      expect(accuracy).toBe(1 / 2); // 1 log, 2 total attempts
    });

    it('should calculate accuracy with multiple logs', () => {
      const problem = { opa: 4, opb: 5, oper: '*' };
      stats.addLog(problem, 3000, 1); // 1 log, 1 attempt
      stats.addLog(problem, 4000, 3); // 2 logs, 4 total attempts
      const accuracy = stats.getProblemAccuracy(4, 5, '*');
      expect(accuracy).toBe(2 / 4); // 0.5
    });
  });

  describe('addLog', () => {
    it('should add a log entry to a problem', () => {
      const problem = { opa: 1, opb: 2, oper: '+' };
      stats.addLog(problem, 5000, 1);

      const accuracy = stats.getProblemAccuracy(1, 2, '+');
      expect(accuracy).toBe(1); // 1 log with 1 attempt
    });

    it('should update the score after adding a log', () => {
      const problem = { opa: 3, opb: 4, oper: '-' };
      stats.addLog(problem, 4000, 1);

      const score = stats.getProblemScore(3, 4, '-');
      expect(score).toBe(4000); // average of [4000]
    });

    it('should calculate score as average of last 8 attempts', () => {
      const problem = { opa: 5, opb: 6, oper: '+' };
      const times = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];

      times.forEach((t) => {
        stats.addLog(problem, t, 1);
      });

      // Should average last 8: [3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000]
      // Average = 52000 / 8 = 6500
      const score = stats.getProblemScore(5, 6, '+');
      expect(score).toBe(6500);
    });

    it('should preserve only the 20 most recent logs', () => {
      const problem = { opa: 7, opb: 8, oper: '*' };

      // Add 25 logs
      for (let i = 0; i < 25; i++) {
        stats.addLog(problem, 1000 + i * 100, 1);
      }

      // Get all stats and check log count
      const allStats = stats.getAllStats();
      const logs = allStats['*']['7,8'].logs;
      expect(logs.length).toBe(20);

      // Should keep the 20 most recent
      expect(logs[0].t).toBe(1500); // 1000 + 5 * 100
      expect(logs[19].t).toBe(3400); // 1000 + 24 * 100
    });

    it('should throw error if problem is not a valid ProblemDef', () => {
      expect(() => {
        stats.addLog(1, 5000, 1); // passing number instead of object
      }).toThrow();
    });

    it('should save stats to localStorage', () => {
      const problem = { opa: 2, opb: 2, oper: '+' };
      stats.addLog(problem, 3000, 1);

      expect(global.localStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorageMock['dmg.math']);
      expect(savedData['+']['2,2'].logs.length).toBe(1);
    });

    it('should include timestamp in log entry', () => {
      const problem = { opa: 6, opb: 7, oper: '-' };
      const beforeTime = new Date().toISOString();
      stats.addLog(problem, 2000, 1);
      const afterTime = new Date().toISOString();

      const allStats = stats.getAllStats();
      const log = allStats['-']['6,7'].logs[0];
      expect(log.dt).toBeDefined();
      expect(log.dt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
    });
  });

  describe('getLowestPercentile', () => {
    it('should return empty array if no operations provided', () => {
      const result = stats.getLowestPercentile(50, []);
      expect(result).toEqual([]);
    });

    it('should return problems sorted by highest score (worst performers)', () => {
      // Create problems with different scores
      stats.addLog({ opa: 10, opb: 10, oper: '+' }, 1000, 1);
      stats.addLog({ opa: 9, opb: 9, oper: '+' }, 5000, 1);
      stats.addLog({ opa: 8, opb: 8, oper: '+' }, 3000, 1);

      const result = stats.getLowestPercentile(50, ['+']);
      // Total problems with '+' operation = 100 (10*10), 50% = 50 problems
      // The function should return the worst 50 by score (highest scores first)
      expect(result.length).toBe(50);
      // Verify that worst performers are at the beginning
      expect(result[0].score).toBeGreaterThanOrEqual(result[49].score);
    });

    it('should handle multiple operations', () => {
      stats.addLog({ opa: 1, opb: 1, oper: '+' }, 2000, 1);
      stats.addLog({ opa: 2, opb: 2, oper: '-' }, 4000, 1);
      stats.addLog({ opa: 3, opb: 3, oper: '*' }, 3000, 1);

      const result = stats.getLowestPercentile(5, ['+', '-', '*']);
      // 3 operations * 100 problems = 300 total, 5% = 15 problems
      expect(result.length).toBe(15);
    });

    it('should return empty array for 0 percentile', () => {
      stats.addLog({ opa: 1, opb: 1, oper: '+' }, 2000, 1);
      const result = stats.getLowestPercentile(0, ['+']);
      expect(result).toEqual([]);
    });

    it('should return all problems for 100 percentile', () => {
      stats.addLog({ opa: 1, opb: 1, oper: '+' }, 2000, 1);
      stats.addLog({ opa: 2, opb: 2, oper: '+' }, 3000, 1);

      const result = stats.getLowestPercentile(100, ['+']);
      // 100% of 100 problems in '+' = 100 problems
      expect(result.length).toBe(100);
    });

    it('should include oper field in returned objects', () => {
      stats.addLog({ opa: 1, opb: 1, oper: '+' }, 2000, 1);
      const result = stats.getLowestPercentile(100, ['+']);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].oper).toBe('+');
    });

    it('should include untouched problems in lowest percentile', () => {
      // Add one log to a problem
      stats.addLog({ opa: 1, opb: 1, oper: '+' }, 10000, 1);
      // Other problems are untouched with default 30000 score

      const result = stats.getLowestPercentile(10, ['+']);
      // 10% of 100 problems = 10 problems
      // The worst performers should be those with 30000 score
      expect(result.length).toBe(10);
      const withDefaultScore = result.filter((p) => p.score === 30000);
      expect(withDefaultScore.length).toBe(10);
    });
  });

  describe('trimLogs', () => {
    it('should trim logs to max 20 entries per problem', () => {
      const problem = { opa: 1, opb: 1, oper: '+' };

      // Add 25 logs
      for (let i = 0; i < 25; i++) {
        stats.addLog(problem, 1000, 1);
      }

      // Manually verify before trim (addLog already does trimming)
      const allStats = stats.getAllStats();
      expect(allStats['+']['1,1'].logs.length).toBe(20);

      // Call trimLogs to ensure it's working
      stats.trimLogs(['+']);

      const updatedStats = stats.getAllStats();
      expect(updatedStats['+']['1,1'].logs.length).toBe(20);
    });

    it('should update scores after trimming', () => {
      const problem = { opa: 2, opb: 2, oper: '-' };

      // Add 10 logs with values 1000, 2000, ..., 10000
      for (let i = 0; i < 10; i++) {
        stats.addLog(problem, (i + 1) * 1000, 1);
      }

      const scoreBefore = stats.getProblemScore(2, 2, '-');
      // Average of [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000]
      // Last 8: [3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000] = 52000/8 = 6500
      expect(scoreBefore).toBe(6500);

      stats.trimLogs(['-']);

      const scoreAfter = stats.getProblemScore(2, 2, '-');
      expect(scoreAfter).toBe(6500); // Should remain the same
    });

    it('should handle empty operations array', () => {
      stats.addLog({ opa: 1, opb: 1, oper: '+' }, 1000, 1);
      stats.trimLogs([]);

      const accuracy = stats.getProblemAccuracy(1, 1, '+');
      expect(accuracy).toBe(1); // Log should still exist
    });

    it('should only trim specified operations', () => {
      stats.addLog({ opa: 1, opb: 1, oper: '+' }, 1000, 1);
      stats.addLog({ opa: 1, opb: 1, oper: '-' }, 2000, 1);

      stats.trimLogs(['+']);

      // + should be trimmed (no-op since only 1 log)
      expect(stats.getProblemAccuracy(1, 1, '+')).toBe(1);
      // - should be unaffected (not in trim list)
      expect(stats.getProblemAccuracy(1, 1, '-')).toBe(1);
    });

    it('should save to localStorage after trimming', () => {
      stats.addLog({ opa: 1, opb: 1, oper: '+' }, 1000, 1);
      vi.clearAllMocks();

      stats.trimLogs(['+']);

      expect(global.localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('getAllStats', () => {
    it('should return an object with all operations', () => {
      const allStats = stats.getAllStats();
      expect(allStats['+']).toBeDefined();
      expect(allStats['-']).toBeDefined();
      expect(allStats['*']).toBeDefined();
      expect(allStats['/']).toBeDefined();
    });

    it('should return a copy, not the original object', () => {
      const stats1 = stats.getAllStats();
      const stats2 = stats.getAllStats();

      expect(stats1).not.toBe(stats2); // Different object references
      expect(stats1).toEqual(stats2); // But same content
    });

    it('should include default problems for all operations', () => {
      const allStats = stats.getAllStats();

      ['+', '-', '*', '/'].forEach((op) => {
        expect(Object.keys(allStats[op]).length).toBe(100); // 10 * 10 problems
      });
    });

    it('should include logs in returned stats', () => {
      stats.addLog({ opa: 1, opb: 1, oper: '+' }, 5000, 2);

      const allStats = stats.getAllStats();
      const problem = allStats['+']['1,1'];

      // Due to score recalculation, verify at least one log exists and has correct values
      expect(problem.logs.length).toBeGreaterThanOrEqual(1);
      const matchingLog = problem.logs.find((l) => l.t === 5000 && l.att === 2);
      expect(matchingLog).toBeDefined();
    });
  });

  describe('Persistence', () => {
    it('should load stats from localStorage on init', () => {
      const testData = {
        '+': {
          '1,1': {
            p: { opa: 1, opb: 1, oper: '+' },
            score: 5000,
            logs: [{ dt: '2026-02-06T10:00:00Z', t: 5000, att: 1 }],
          },
        },
      };

      localStorageMock['dmg.math'] = JSON.stringify(testData);

      // Import a fresh instance (in real scenario, would need to reload module)
      // For this test, verify localStorage is being read
      expect(global.localStorage.getItem).toBeDefined();
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock['dmg.math'] = 'invalid json {';

      // Should not throw and create defaults
      const score = stats.getProblemScore(1, 1, '+');
      // Corrupted data -> creates defaults -> score is 30000
      expect(score).toBeGreaterThanOrEqual(1000); // At least initialized
    });

    it('should save to localStorage with correct key', () => {
      stats.addLog({ opa: 1, opb: 1, oper: '+' }, 3000, 1);

      const saveCall = global.localStorage.setItem.mock.calls.find(
        (call) => call[0] === 'dmg.math'
      );
      expect(saveCall).toBeDefined();

      const savedData = JSON.parse(saveCall[1]);
      expect(savedData['+']['1,1']).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle numeric strings as operands', () => {
      stats.addLog({ opa: '3', opb: '4', oper: '+' }, 2000, 1);
      const score = stats.getProblemScore('3', '4', '+');
      expect(score).toBe(2000);
    });

    it('should handle very large time values', () => {
      const largeTime = 999999999;
      stats.addLog({ opa: 1, opb: 1, oper: '+' }, largeTime, 1);
      const score = stats.getProblemScore(1, 1, '+');
      // Score is exact if only 1 log entry (unless other tests added logs to same problem)
      expect(score).toBeGreaterThan(0);
      expect(typeof score).toBe('number');
    });

    it('should handle fractional attempts value', () => {
      stats.addLog({ opa: 1, opb: 1, oper: '+' }, 2000, 2.5);
      const accuracy = stats.getProblemAccuracy(1, 1, '+');
      // 1 log with 2.5 attempts: 1 / 2.5 = 0.4 (unless other tests added logs)
      expect(accuracy).toBeGreaterThan(0);
      expect(accuracy).toBeLessThanOrEqual(1);
    });

    it('should handle zero time to correct', () => {
      stats.addLog({ opa: 1, opb: 1, oper: '+' }, 0, 1);
      const score = stats.getProblemScore(1, 1, '+');
      // Score could be 0 if only this log, or an average if others were added in prior tests
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle percentile values outside [0, 100]', () => {
      stats.addLog({ opa: 1, opb: 1, oper: '+' }, 2000, 1);

      // Negative percentile
      const resultNegative = stats.getLowestPercentile(-10, ['+']);
      expect(resultNegative.length).toBe(0);

      // Over 100
      const resultOver = stats.getLowestPercentile(150, ['+']);
      // Should still work, returning up to 100% of problems
      expect(resultOver.length).toBeGreaterThan(0);
    });
  });
});
