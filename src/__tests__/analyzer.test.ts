import { describe, it, expect } from 'vitest';
import { Analyzer } from '../analyzer';

describe('Analyzer', () => {
  const analyzer = new Analyzer();

  it('returns unmatched result for empty log', () => {
    const result = analyzer.analyze('');
    expect(result.matched).toBe(false);
    expect(result.patterns).toHaveLength(0);
    expect(result.primaryPattern).toBeNull();
    expect(result.retryable).toBe(false);
  });

  it('detects TypeScript compilation errors', () => {
    const log = "error TS2304: Cannot find name 'foo'.";
    const result = analyzer.analyze(log);
    expect(result.matched).toBe(true);
    expect(result.primaryPattern?.id).toBe('build-ts-error');
    expect(result.retryable).toBe(false);
  });

  it('detects test assertion failures', () => {
    const log = "AssertionError: expected 1 to equal 2\n  at test.ts:10";
    const result = analyzer.analyze(log);
    expect(result.matched).toBe(true);
    const ids = result.patterns.map(p => p.id);
    expect(ids).toContain('test-assertion');
  });

  it('detects dependency install failures (retryable)', () => {
    const log = "npm ERR! code ENETUNREACH\nnpm ERR! install failed";
    const result = analyzer.analyze(log);
    expect(result.matched).toBe(true);
    const retryablePatterns = result.patterns.filter(p => p.retryable);
    expect(retryablePatterns.length).toBeGreaterThan(0);
  });

  it('detects disk space issues as critical', () => {
    const log = "FATAL: No space left on device";
    const result = analyzer.analyze(log);
    expect(result.matched).toBe(true);
    const diskPattern = result.patterns.find(p => p.id === 'infra-disk');
    expect(diskPattern).toBeDefined();
    expect(diskPattern?.severity).toBe('critical');
    expect(diskPattern?.retryable).toBe(true);
  });

  it('detects rate limiting', () => {
    const log = "Error: API rate limit exceeded. Try again in 60 seconds.";
    const result = analyzer.analyze(log);
    expect(result.matched).toBe(true);
    const ratePattern = result.patterns.find(p => p.id === 'perm-rate-limit');
    expect(ratePattern).toBeDefined();
    expect(ratePattern?.retryable).toBe(true);
  });

  it('detects network timeout errors (retryable)', () => {
    const log = "ETIMEDOUT: connect ETIMEDOUT 10.0.0.1:443";
    const result = analyzer.analyze(log);
    expect(result.matched).toBe(true);
    expect(result.retryable).toBe(true);
  });

  it('summary contains primary pattern info', () => {
    const log = "error TS2339: Property 'x' does not exist on type 'Y'.";
    const result = analyzer.analyze(log);
    expect(result.matched).toBe(true);
    expect(result.summary).toContain('HIGH');
  });

  it('extracts log snippets around matched lines', () => {
    const lines = [
      'Step 1: install',
      'Step 2: test',
      'AssertionError: expected true to equal false',
      'Step 3: done',
    ].join('\n');
    const result = analyzer.analyze(lines);
    expect(result.matched).toBe(true);
    expect(result.logSnippets.length).toBeGreaterThan(0);
    expect(result.logSnippets[0]).toContain('AssertionError');
  });

  it('returns no-match summary when no patterns found', () => {
    const result = analyzer.analyze('Build succeeded. All tests passed.');
    expect(result.summary).toBe('No known failure pattern detected.');
  });
});
