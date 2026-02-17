/**
 * analyzer.ts — Parse CI logs, detect failure patterns
 */

import { FailurePattern, matchPatterns, getBestMatch } from './patterns';

export interface AnalysisResult {
  matched: boolean;
  patterns: FailurePattern[];
  primaryPattern: FailurePattern | null;
  retryable: boolean;
  summary: string;
  logSnippets: string[];
}

export class Analyzer {
  /** Analyze a CI log string for known failure patterns */
  analyze(log: string): AnalysisResult {
    const patterns = matchPatterns(log);
    const primary = getBestMatch(log);
    const retryable = primary?.retryable ?? false;
    const snippets = this.extractSnippets(log, patterns);

    return {
      matched: patterns.length > 0,
      patterns,
      primaryPattern: primary,
      retryable,
      summary: primary
        ? `[${primary.severity.toUpperCase()}] ${primary.name}: ${primary.suggestion}`
        : 'No known failure pattern detected.',
      logSnippets: snippets,
    };
  }

  /** Extract relevant log lines around matched patterns */
  private extractSnippets(log: string, patterns: FailurePattern[], context = 3): string[] {
    const lines = log.split('\n');
    const snippets: string[] = [];
    const seen = new Set<number>();

    for (const pattern of patterns) {
      for (let i = 0; i < lines.length; i++) {
        if (pattern.regex.test(lines[i]) && !seen.has(i)) {
          seen.add(i);
          const start = Math.max(0, i - context);
          const end = Math.min(lines.length, i + context + 1);
          snippets.push(lines.slice(start, end).join('\n'));
        }
      }
    }

    return snippets.slice(0, 5); // max 5 snippets
  }
}
