# 🔱 Karma CI

**Self-healing CI/CD toolkit. What goes around comes around.**

*By [Darshj.me](https://darshj.me)*

---

> *In Hindu philosophy, **Karma** (कर्म) is the universal law of cause and effect. Every action has consequences that return to the actor. Karma CI embodies this principle: when your CI breaks, the system analyzes, learns, and heals — returning balance to the cycle.*

## How It Works

```
CI Failure → Analyzer → Pattern Match → Healer → Retry → Report
                │              │            │        │        │
           Parse logs    50+ patterns   Suggest   Backoff   Notify
                              │          fixes    + jitter  Slack/
                         Categorize                        Discord
```

1. **Analyze** — Parse CI logs against 50+ known failure patterns
2. **Categorize** — Test, build, dependency, timeout, infra, permission, network, resource
3. **Heal** — Generate fix suggestions with commands and config changes
4. **Retry** — Smart retry with exponential backoff + jitter for transient failures
5. **Report** — Generate detailed healing reports
6. **Notify** — Send results to Slack/Discord

## GitHub Action Usage

```yaml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build & Test
        id: build
        run: npm ci && npm test
        continue-on-error: true

      - name: Karma CI — Self-Healing
        if: steps.build.outcome == 'failure'
        uses: darshjme-codes/karma-ci@v1
        with:
          max-retries: 3
          base-delay-ms: 2000
          slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
          discord-webhook: ${{ secrets.DISCORD_WEBHOOK }}
          analyze-logs: true
          auto-heal: true
```

## Supported Failure Patterns (50+)

### Test Failures
- Assertion failures, test timeouts, snapshot mismatches
- Import errors, out of memory, flaky test detection

### Build Errors
- TypeScript, Webpack, ESLint, Docker
- Rust, Go compilation errors, OOM during build

### Dependency Issues
- Package not found, peer dependency conflicts
- Lockfile mismatch, native module build failures
- Security vulnerabilities, registry unavailability

### Infrastructure
- Disk full, runner unavailable, container crashes
- Service health failures, cache/artifact issues
- Git checkout failures, concurrency cancellation

### Network & Permissions
- DNS failures, SSL errors, connection resets
- Token expiry, permission denied, rate limiting

### Resource Limits
- CPU/memory limits, file descriptor exhaustion

## Programmatic Usage

```typescript
import { Analyzer, Healer, RetryEngine, Reporter } from 'karma-ci';

const analyzer = new Analyzer();
const healer = new Healer();

// Analyze a CI log
const analysis = analyzer.analyze(ciLogString);

if (analysis.matched) {
  console.log(`Pattern: ${analysis.primaryPattern.name}`);
  console.log(`Retryable: ${analysis.retryable}`);

  const suggestions = healer.suggest(analysis);
  for (const s of suggestions) {
    console.log(`Fix: ${s.suggestion}`);
    console.log(`Commands: ${s.commands?.join(', ')}`);
  }
}

// Smart retry
const retry = new RetryEngine({ maxRetries: 3, baseDelayMs: 1000 });
const result = await retry.execute(() => runBuild());
```

## License

MIT © [Darshj.me](https://darshj.me)
