/**
 * reporter.ts — Generate healing reports with stats
 */

import { AnalysisResult } from './analyzer';
import { HealingSuggestion } from './healer';
import { RetryResult } from './retry';

export interface HealingReport {
  timestamp: string;
  duration: string;
  analysis: AnalysisResult;
  suggestions: HealingSuggestion[];
  retryResult?: RetryResult<unknown>;
  healed: boolean;
  summary: string;
  markdown: string;
}

export class Reporter {
  /** Generate a comprehensive healing report */
  generate(opts: {
    analysis: AnalysisResult;
    suggestions: HealingSuggestion[];
    retryResult?: RetryResult<unknown>;
    startTime: number;
  }): HealingReport {
    const endTime = Date.now();
    const durationMs = endTime - opts.startTime;
    const healed = opts.retryResult?.success ?? false;

    const report: HealingReport = {
      timestamp: new Date().toISOString(),
      duration: this.formatDuration(durationMs),
      analysis: opts.analysis,
      suggestions: opts.suggestions,
      retryResult: opts.retryResult,
      healed,
      summary: this.buildSummary(opts.analysis, healed, opts.retryResult),
      markdown: '',
    };

    report.markdown = this.toMarkdown(report);
    return report;
  }

  private buildSummary(analysis: AnalysisResult, healed: boolean, retry?: RetryResult<unknown>): string {
    const parts: string[] = [];

    if (analysis.primaryPattern) {
      parts.push(`Detected: ${analysis.primaryPattern.name} (${analysis.primaryPattern.severity})`);
    } else {
      parts.push('No known failure pattern detected');
    }

    if (retry) {
      parts.push(`Attempts: ${retry.attempts}`);
      if (healed) parts.push('Status: HEALED ✅');
      else parts.push('Status: UNRESOLVED ❌');
    }

    return parts.join(' | ');
  }

  private toMarkdown(report: HealingReport): string {
    const lines: string[] = [
      '# 🔱 Karma CI — Healing Report',
      '',
      `**Time:** ${report.timestamp}`,
      `**Duration:** ${report.duration}`,
      `**Status:** ${report.healed ? '✅ Healed' : '❌ Unresolved'}`,
      '',
      '## Analysis',
      '',
      `**Patterns detected:** ${report.analysis.patterns.length}`,
    ];

    if (report.analysis.primaryPattern) {
      const p = report.analysis.primaryPattern;
      lines.push(`**Primary:** ${p.name} (${p.category}, ${p.severity})`, `**Suggestion:** ${p.suggestion}`);
    }

    if (report.suggestions.length > 0) {
      lines.push('', '## Suggestions', '');
      for (const s of report.suggestions) {
        lines.push(`### ${s.pattern.name}`);
        lines.push(s.suggestion);
        if (s.commands?.length) {
          lines.push('```bash', ...s.commands, '```');
        }
        if (s.configChanges?.length) {
          lines.push('**Config changes:**', ...s.configChanges.map(c => `- ${c}`));
        }
        lines.push('');
      }
    }

    if (report.retryResult) {
      lines.push('## Retry Results', '', `**Attempts:** ${report.retryResult.attempts}`, `**Total delay:** ${report.retryResult.totalDelayMs}ms`, `**Success:** ${report.retryResult.success}`);
    }

    return lines.join('\n');
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60_000).toFixed(1)}m`;
  }
}
