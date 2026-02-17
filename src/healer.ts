/**
 * healer.ts — Generate fix suggestions for common CI failure patterns
 */

import { AnalysisResult } from './analyzer';
import { FailurePattern } from './patterns';

export interface HealingSuggestion {
  pattern: FailurePattern;
  suggestion: string;
  commands?: string[];
  configChanges?: string[];
  autoFixable: boolean;
}

export class Healer {
  /** Generate healing suggestions based on analysis results */
  suggest(analysis: AnalysisResult): HealingSuggestion[] {
    return analysis.patterns.map(p => ({
      pattern: p,
      suggestion: p.suggestion,
      commands: this.getCommands(p),
      configChanges: this.getConfigChanges(p),
      autoFixable: p.autoFixable,
    }));
  }

  private getCommands(pattern: FailurePattern): string[] {
    const commandMap: Record<string, string[]> = {
      'dep-conflict': ['npm install --legacy-peer-deps', 'npm ls --all'],
      'dep-lockfile': ['rm -rf node_modules', 'npm install'],
      'dep-install-fail': ['npm cache clean --force', 'rm -rf node_modules', 'npm install'],
      'dep-audit': ['npm audit fix'],
      'build-eslint': ['npx eslint --fix .'],
      'test-snapshot': ['npx jest --updateSnapshot'],
      'test-memory': ['NODE_OPTIONS="--max-old-space-size=4096" npm test'],
      'infra-disk': ['docker system prune -af', 'npm cache clean --force'],
      'gh-checkout': ['git fetch --unshallow || true'],
      'res-file-limit': ['ulimit -n 65536'],
    };
    return commandMap[pattern.id] ?? [];
  }

  private getConfigChanges(pattern: FailurePattern): string[] {
    const configMap: Record<string, string[]> = {
      'test-timeout': ['jest.config: testTimeout: 30000'],
      'timeout-global': ['workflow: timeout-minutes: 60'],
      'timeout-docker': ['Add docker layer caching step'],
      'build-oom': ['env: NODE_OPTIONS: --max-old-space-size=4096'],
      'infra-disk': ['Add cleanup step before build'],
      'res-memory': ['container: options: --memory=4g'],
      'gh-checkout': ['actions/checkout: fetch-depth: 0'],
      'perm-rate-limit': ['Add concurrency group to limit parallel runs'],
    };
    return configMap[pattern.id] ?? [];
  }
}
