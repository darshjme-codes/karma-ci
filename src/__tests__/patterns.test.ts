import { describe, it, expect } from 'vitest';
import { PATTERNS, matchPatterns, getBestMatch } from '../patterns';

describe('PATTERNS database', () => {
  it('contains at least 40 patterns', () => {
    expect(PATTERNS.length).toBeGreaterThanOrEqual(40);
  });

  it('every pattern has required fields', () => {
    for (const p of PATTERNS) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.category).toMatch(/^(test|build|dependency|timeout|infrastructure|permission|network|resource)$/);
      expect(p.regex).toBeInstanceOf(RegExp);
      expect(p.severity).toMatch(/^(low|medium|high|critical)$/);
      expect(typeof p.retryable).toBe('boolean');
      expect(p.suggestion).toBeTruthy();
      expect(typeof p.autoFixable).toBe('boolean');
    }
  });

  it('all pattern ids are unique', () => {
    const ids = PATTERNS.map(p => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe('matchPatterns', () => {
  it('returns empty array for clean log', () => {
    const matches = matchPatterns('Everything passed successfully.');
    expect(matches).toHaveLength(0);
  });

  it('matches TypeScript errors', () => {
    const matches = matchPatterns("error TS2304: Cannot find name 'bar'.");
    expect(matches.some(p => p.id === 'build-ts-error')).toBe(true);
  });

  it('matches multiple patterns in same log', () => {
    const log = [
      "error TS2304: Cannot find name 'x'.",
      "npm ERR! ERESOLVE unable to resolve dependency tree",
    ].join('\n');
    const matches = matchPatterns(log);
    const ids = matches.map(p => p.id);
    expect(ids).toContain('build-ts-error');
    expect(ids).toContain('dep-conflict');
  });

  it('no duplicate patterns returned', () => {
    const log = "ETIMEDOUT connect ETIMEDOUT 1.2.3.4 ETIMEDOUT again";
    const matches = matchPatterns(log);
    const ids = matches.map(p => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe('getBestMatch', () => {
  it('returns null for no matches', () => {
    expect(getBestMatch('Everything is fine.')).toBeNull();
  });

  it('returns a FailurePattern for a known error', () => {
    const best = getBestMatch("error TS2552: Cannot find name 'fetch'.");
    expect(best).not.toBeNull();
    expect(best?.id).toBe('build-ts-error');
  });

  it('prioritizes critical severity over lower', () => {
    const log = [
      "No space left on device",  // critical
      "eslint errors found",       // medium
    ].join('\n');
    const best = getBestMatch(log);
    expect(best?.severity).toBe('critical');
  });
});
