/**
 * action.ts — GitHub Action entry point
 */

import { Analyzer } from './analyzer';
import { Healer } from './healer';
import { RetryEngine } from './retry';
import { Notifier } from './notifier';
import { Reporter } from './reporter';

interface ActionInputs {
  maxRetries: number;
  baseDelayMs: number;
  slackWebhook?: string;
  discordWebhook?: string;
  analyzeLogs: boolean;
  autoHeal: boolean;
}

function getInputs(): ActionInputs {
  const env = process.env;
  return {
    maxRetries: parseInt(env.INPUT_MAX_RETRIES ?? env['INPUT_MAX-RETRIES'] ?? '3', 10),
    baseDelayMs: parseInt(env.INPUT_BASE_DELAY_MS ?? env['INPUT_BASE-DELAY-MS'] ?? '1000', 10),
    slackWebhook: env.INPUT_SLACK_WEBHOOK ?? env['INPUT_SLACK-WEBHOOK'],
    discordWebhook: env.INPUT_DISCORD_WEBHOOK ?? env['INPUT_DISCORD-WEBHOOK'],
    analyzeLogs: (env.INPUT_ANALYZE_LOGS ?? env['INPUT_ANALYZE-LOGS'] ?? 'true') === 'true',
    autoHeal: (env.INPUT_AUTO_HEAL ?? env['INPUT_AUTO-HEAL'] ?? 'true') === 'true',
  };
}

function setOutput(name: string, value: string): void {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    const fs = require('fs');
    fs.appendFileSync(outputFile, `${name}=${value}\n`);
  }
}

async function run(): Promise<void> {
  const startTime = Date.now();
  const inputs = getInputs();

  const analyzer = new Analyzer();
  const healer = new Healer();
  const reporter = new Reporter();
  const notifier = new Notifier({
    slackWebhook: inputs.slackWebhook,
    discordWebhook: inputs.discordWebhook,
  });

  // Read log from stdin or environment
  const log = process.env.KARMA_CI_LOG ?? '';

  console.log('🔱 Karma CI — Analyzing build...');

  const analysis = analyzer.analyze(log);
  const suggestions = inputs.autoHeal ? healer.suggest(analysis) : [];

  if (analysis.matched) {
    console.log(`\n⚡ Detected: ${analysis.primaryPattern?.name ?? 'Unknown'}`);
    console.log(`   Severity: ${analysis.primaryPattern?.severity}`);
    console.log(`   Retryable: ${analysis.retryable}`);
    console.log(`   Suggestion: ${analysis.primaryPattern?.suggestion}`);
  }

  setOutput('failure-pattern', analysis.primaryPattern?.id ?? '');
  setOutput('suggestion', analysis.primaryPattern?.suggestion ?? '');

  let retryResult;
  if (analysis.retryable && inputs.maxRetries > 0) {
    console.log(`\n🔄 Retrying (max ${inputs.maxRetries} attempts)...`);
    const retry = new RetryEngine({
      maxRetries: inputs.maxRetries,
      baseDelayMs: inputs.baseDelayMs,
      onRetry: (attempt, delay) => console.log(`   Attempt ${attempt}, waiting ${delay}ms...`),
    });

    retryResult = await retry.execute(async () => {
      // In a real action, this would re-run the failed step
      throw new Error('Retry placeholder — integrate with your build step');
    });

    setOutput('healed', String(retryResult.success));
    setOutput('attempts', String(retryResult.attempts));
  }

  const report = reporter.generate({ analysis, suggestions, retryResult, startTime });
  console.log('\n' + report.markdown);

  await notifier.notify({
    title: 'Karma CI Report',
    status: report.healed ? 'healed' : 'failure',
    message: report.summary,
    details: analysis.logSnippets[0],
    url: process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : undefined,
  });
}

run().catch(err => {
  console.error('🔱 Karma CI failed:', err);
  process.exit(1);
});
