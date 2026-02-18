import { describe, it, expect } from 'vitest';
import { Analyzer } from '../analyzer';
import { Healer } from '../healer';

describe('Healer', () => {
  const analyzer = new Analyzer();
  const healer = new Healer();

  it('returns empty suggestions for no-match analysis', () => {
    const analysis = analyzer.analyze('All good, nothing failed.');
    const suggestions = healer.suggest(analysis);
    expect(suggestions).toHaveLength(0);
  });

  it('provides commands for dep-conflict pattern', () => {
    const log = "ERESOLVE unable to resolve dependency tree — peer dep conflict";
    const analysis = analyzer.analyze(log);
    const suggestions = healer.suggest(analysis);
    const depConflict = suggestions.find(s => s.pattern.id === 'dep-conflict');
    expect(depConflict).toBeDefined();
    expect(depConflict?.commands).toContain('npm install --legacy-peer-deps');
  });

  it('provides commands for dep-lockfile pattern', () => {
    const log = "npm ci can only install packages when your package.json and lockfile are in sync";
    const analysis = analyzer.analyze(log);
    const suggestions = healer.suggest(analysis);
    const lockSugg = suggestions.find(s => s.pattern.id === 'dep-lockfile');
    expect(lockSugg).toBeDefined();
    expect(lockSugg?.commands).toContain('npm install');
  });

  it('provides config changes for test-timeout pattern', () => {
    const log = "Timeout: exceeded 5000ms calling async function in test";
    const analysis = analyzer.analyze(log);
    const suggestions = healer.suggest(analysis);
    const timeoutSugg = suggestions.find(s => s.pattern.id === 'test-timeout');
    expect(timeoutSugg?.configChanges?.length).toBeGreaterThan(0);
    expect(timeoutSugg?.configChanges?.[0]).toContain('testTimeout');
  });

  it('provides memory fix commands for test-memory pattern', () => {
    const log = "FATAL ERROR: JavaScript heap out of memory — Allocation failed";
    const analysis = analyzer.analyze(log);
    const suggestions = healer.suggest(analysis);
    const memSugg = suggestions.find(s => s.pattern.id === 'test-memory');
    expect(memSugg).toBeDefined();
    expect(memSugg?.commands?.some(c => c.includes('max-old-space-size'))).toBe(true);
  });

  it('marks autoFixable patterns correctly', () => {
    const log = "✖ 3 problems found by eslint — Lint errors detected";
    const analysis = analyzer.analyze(log);
    const suggestions = healer.suggest(analysis);
    const eslintSugg = suggestions.find(s => s.pattern.id === 'build-eslint');
    expect(eslintSugg?.autoFixable).toBe(true);
    expect(eslintSugg?.commands).toContain('npx eslint --fix .');
  });

  it('suggestion text is non-empty for all matched patterns', () => {
    const log = "Permission denied (publickey). fatal: Could not read from remote repository.";
    const analysis = analyzer.analyze(log);
    const suggestions = healer.suggest(analysis);
    expect(suggestions.length).toBeGreaterThan(0);
    for (const s of suggestions) {
      expect(s.suggestion).toBeTruthy();
    }
  });
});
