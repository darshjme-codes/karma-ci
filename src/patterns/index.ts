/**
 * patterns/ — 50+ common CI failure patterns database
 */

export interface FailurePattern {
  id: string;
  name: string;
  category: 'test' | 'build' | 'dependency' | 'timeout' | 'infrastructure' | 'permission' | 'network' | 'resource';
  regex: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  suggestion: string;
  autoFixable: boolean;
}

export const PATTERNS: FailurePattern[] = [
  // === TEST FAILURES ===
  { id: 'test-assertion', name: 'Test Assertion Failure', category: 'test', regex: /(?:AssertionError|expect\(.*\)\.to|assert\.|FAIL\s+src\/)/i, severity: 'medium', retryable: false, suggestion: 'Fix the failing test assertion. Check expected vs actual values.', autoFixable: false },
  { id: 'test-timeout', name: 'Test Timeout', category: 'test', regex: /(?:Timeout|exceeded\s+\d+\s*ms|jest\.setTimeout)/i, severity: 'medium', retryable: true, suggestion: 'Increase test timeout or optimize slow test. Consider async issues.', autoFixable: true },
  { id: 'test-snapshot', name: 'Snapshot Mismatch', category: 'test', regex: /(?:Snapshot.*mismatch|›\s*1 snapshot.*failed|toMatchSnapshot)/i, severity: 'low', retryable: false, suggestion: 'Update snapshots with --updateSnapshot if changes are intentional.', autoFixable: true },
  { id: 'test-import', name: 'Test Import Error', category: 'test', regex: /(?:Cannot find module|Module not found.*in test|SyntaxError.*import)/i, severity: 'high', retryable: false, suggestion: 'Check import paths and ensure dependencies are installed.', autoFixable: false },
  { id: 'test-memory', name: 'Test Out of Memory', category: 'test', regex: /(?:JavaScript heap out of memory|ENOMEM|allocation failed)/i, severity: 'high', retryable: true, suggestion: 'Increase Node memory limit: --max-old-space-size=4096', autoFixable: true },
  { id: 'test-flaky', name: 'Flaky Test Detection', category: 'test', regex: /(?:RETRY|flaky|intermittent|race condition)/i, severity: 'low', retryable: true, suggestion: 'Quarantine flaky test and investigate race conditions.', autoFixable: false },

  // === BUILD ERRORS ===
  { id: 'build-ts-error', name: 'TypeScript Compilation Error', category: 'build', regex: /(?:error TS\d+|tsc.*error|Type.*is not assignable)/i, severity: 'high', retryable: false, suggestion: 'Fix TypeScript type errors before building.', autoFixable: false },
  { id: 'build-syntax', name: 'Syntax Error', category: 'build', regex: /(?:SyntaxError|Unexpected token|Parse error)/i, severity: 'high', retryable: false, suggestion: 'Fix syntax errors in source code.', autoFixable: false },
  { id: 'build-webpack', name: 'Webpack Build Error', category: 'build', regex: /(?:Module build failed|webpack.*error|ERROR in \.\/src)/i, severity: 'high', retryable: false, suggestion: 'Check webpack configuration and loaders.', autoFixable: false },
  { id: 'build-eslint', name: 'ESLint Error', category: 'build', regex: /(?:eslint.*error|✖\s+\d+\s+problems?|Lint errors)/i, severity: 'medium', retryable: false, suggestion: 'Fix lint errors or adjust ESLint rules.', autoFixable: true },
  { id: 'build-oom', name: 'Build Out of Memory', category: 'build', regex: /(?:FATAL ERROR.*heap|Killed.*signal 9|OOMKilled)/i, severity: 'critical', retryable: true, suggestion: 'Increase build memory or split into smaller chunks.', autoFixable: true },
  { id: 'build-docker', name: 'Docker Build Error', category: 'build', regex: /(?:docker.*build.*failed|COPY failed|RUN.*returned a non-zero)/i, severity: 'high', retryable: true, suggestion: 'Check Dockerfile, base image availability, and build context.', autoFixable: false },
  { id: 'build-rust', name: 'Rust Compilation Error', category: 'build', regex: /(?:error\[E\d+\]|cannot find.*in this scope|cargo build.*failed)/i, severity: 'high', retryable: false, suggestion: 'Fix Rust compilation errors.', autoFixable: false },
  { id: 'build-go', name: 'Go Build Error', category: 'build', regex: /(?:go build.*:.*undefined|cannot.*import|go:.*module)/i, severity: 'high', retryable: false, suggestion: 'Fix Go compilation errors. Run go mod tidy.', autoFixable: false },

  // === DEPENDENCY ISSUES ===
  { id: 'dep-not-found', name: 'Package Not Found', category: 'dependency', regex: /(?:404 Not Found.*npm|ERR! 404|package.*not found)/i, severity: 'high', retryable: true, suggestion: 'Check package name and registry availability. May be a temporary registry issue.', autoFixable: false },
  { id: 'dep-conflict', name: 'Dependency Conflict', category: 'dependency', regex: /(?:ERESOLVE|peer dep|conflicting peer|Could not resolve)/i, severity: 'medium', retryable: false, suggestion: 'Resolve peer dependency conflicts. Try --legacy-peer-deps.', autoFixable: true },
  { id: 'dep-lockfile', name: 'Lockfile Mismatch', category: 'dependency', regex: /(?:lockfile.*out of date|npm ci.*can only|frozen lockfile)/i, severity: 'medium', retryable: false, suggestion: 'Regenerate lockfile: npm install or yarn install.', autoFixable: true },
  { id: 'dep-install-fail', name: 'Install Failure', category: 'dependency', regex: /(?:npm ERR!|yarn error|pnpm ERR|install.*failed)/i, severity: 'high', retryable: true, suggestion: 'Clear cache and retry: npm cache clean --force', autoFixable: true },
  { id: 'dep-native', name: 'Native Module Build Failed', category: 'dependency', regex: /(?:node-gyp|node-pre-gyp|prebuild|gyp ERR)/i, severity: 'high', retryable: true, suggestion: 'Install build tools: build-essential, python3, make.', autoFixable: false },
  { id: 'dep-audit', name: 'Security Vulnerability', category: 'dependency', regex: /(?:found \d+ vulnerabilities|npm audit|high severity)/i, severity: 'medium', retryable: false, suggestion: 'Run npm audit fix or update vulnerable packages.', autoFixable: true },
  { id: 'dep-registry', name: 'Registry Unavailable', category: 'dependency', regex: /(?:ETIMEDOUT.*registry|registry\.npmjs|EAI_AGAIN.*npm)/i, severity: 'medium', retryable: true, suggestion: 'npm registry is temporarily down. Retry in a few minutes.', autoFixable: false },

  // === TIMEOUT ISSUES ===
  { id: 'timeout-global', name: 'Job Timeout', category: 'timeout', regex: /(?:Job.*timed out|exceeded.*time limit|cancel.*timeout)/i, severity: 'high', retryable: true, suggestion: 'Increase job timeout or optimize slow steps.', autoFixable: true },
  { id: 'timeout-network', name: 'Network Timeout', category: 'timeout', regex: /(?:ETIMEDOUT|ESOCKETTIMEDOUT|connect ETIMEDOUT|request timeout)/i, severity: 'medium', retryable: true, suggestion: 'Network timeout — retry or check connectivity.', autoFixable: false },
  { id: 'timeout-docker', name: 'Docker Pull Timeout', category: 'timeout', regex: /(?:docker.*pull.*timeout|context deadline exceeded|TLS handshake timeout)/i, severity: 'medium', retryable: true, suggestion: 'Docker registry slow. Retry or use cached images.', autoFixable: true },

  // === INFRASTRUCTURE ===
  { id: 'infra-disk', name: 'Disk Space Full', category: 'infrastructure', regex: /(?:No space left on device|ENOSPC|disk.*full|out of disk)/i, severity: 'critical', retryable: true, suggestion: 'Free disk space. Add cleanup step or increase runner disk.', autoFixable: true },
  { id: 'infra-runner', name: 'Runner Unavailable', category: 'infrastructure', regex: /(?:no matching runner|runner.*offline|queued.*waiting)/i, severity: 'high', retryable: true, suggestion: 'No runners available. Check self-hosted runner status.', autoFixable: false },
  { id: 'infra-container', name: 'Container Crash', category: 'infrastructure', regex: /(?:container.*exited|exit code 137|exit code 139|segfault|SIGSEGV)/i, severity: 'critical', retryable: true, suggestion: 'Container crashed (possibly OOM killed). Increase memory limits.', autoFixable: true },
  { id: 'infra-service', name: 'Service Container Failed', category: 'infrastructure', regex: /(?:service.*unhealthy|health check.*failed|service.*not ready)/i, severity: 'high', retryable: true, suggestion: 'Service container failed health check. Check service configuration.', autoFixable: false },
  { id: 'infra-cache', name: 'Cache Restore Failed', category: 'infrastructure', regex: /(?:cache.*not found|cache.*restore.*failed|Unable to.*cache)/i, severity: 'low', retryable: true, suggestion: 'Cache miss — build will be slower but should succeed.', autoFixable: false },
  { id: 'infra-artifact', name: 'Artifact Upload Failed', category: 'infrastructure', regex: /(?:artifact.*upload.*failed|Unable to.*artifact|artifact.*error)/i, severity: 'medium', retryable: true, suggestion: 'Artifact upload failed. Check size limits and retry.', autoFixable: false },

  // === PERMISSION ISSUES ===
  { id: 'perm-token', name: 'Token Expired/Invalid', category: 'permission', regex: /(?:Bad credentials|401 Unauthorized|token.*expired|GITHUB_TOKEN)/i, severity: 'critical', retryable: false, suggestion: 'Authentication failed. Refresh or rotate tokens.', autoFixable: false },
  { id: 'perm-access', name: 'Permission Denied', category: 'permission', regex: /(?:Permission denied|403 Forbidden|EACCES|insufficient permissions)/i, severity: 'high', retryable: false, suggestion: 'Check repository permissions and token scopes.', autoFixable: false },
  { id: 'perm-rate-limit', name: 'API Rate Limited', category: 'permission', regex: /(?:rate limit|429 Too Many|API rate.*exceeded|secondary rate)/i, severity: 'medium', retryable: true, suggestion: 'Rate limited. Wait and retry with backoff.', autoFixable: true },
  { id: 'perm-ssh', name: 'SSH Key Issue', category: 'permission', regex: /(?:Host key verification|Permission denied.*publickey|git@.*Permission denied)/i, severity: 'high', retryable: false, suggestion: 'SSH key not configured. Add deploy key or use HTTPS.', autoFixable: false },

  // === NETWORK ISSUES ===
  { id: 'net-dns', name: 'DNS Resolution Failed', category: 'network', regex: /(?:ENOTFOUND|getaddrinfo.*failed|DNS.*resolution|EAI_AGAIN)/i, severity: 'medium', retryable: true, suggestion: 'DNS resolution failed. Transient network issue — retry.', autoFixable: false },
  { id: 'net-ssl', name: 'SSL/TLS Error', category: 'network', regex: /(?:SSL.*error|certificate.*expired|UNABLE_TO_VERIFY|self.signed)/i, severity: 'high', retryable: false, suggestion: 'SSL certificate issue. Check certificates or set NODE_TLS_REJECT_UNAUTHORIZED.', autoFixable: false },
  { id: 'net-proxy', name: 'Proxy Error', category: 'network', regex: /(?:proxy.*error|ECONNREFUSED.*proxy|HTTP_PROXY|tunnel.*failed)/i, severity: 'medium', retryable: true, suggestion: 'Proxy connection failed. Check proxy configuration.', autoFixable: false },
  { id: 'net-connection-reset', name: 'Connection Reset', category: 'network', regex: /(?:ECONNRESET|connection.*reset|socket hang up|EPIPE)/i, severity: 'medium', retryable: true, suggestion: 'Connection was reset. Transient issue — retry.', autoFixable: false },
  { id: 'net-download', name: 'Download Failed', category: 'network', regex: /(?:curl.*failed|wget.*error|download.*failed|fetch.*failed)/i, severity: 'medium', retryable: true, suggestion: 'Download failed. Check URL and retry.', autoFixable: false },

  // === RESOURCE ISSUES ===
  { id: 'res-cpu', name: 'CPU Limit Exceeded', category: 'resource', regex: /(?:CPU.*limit|throttled|cpu.*quota)/i, severity: 'high', retryable: true, suggestion: 'CPU throttled. Optimize build or increase runner resources.', autoFixable: false },
  { id: 'res-memory', name: 'Memory Limit Exceeded', category: 'resource', regex: /(?:memory.*limit|OOMKilled|cgroup.*memory|oom-kill)/i, severity: 'critical', retryable: true, suggestion: 'Memory limit exceeded. Increase memory or optimize usage.', autoFixable: true },
  { id: 'res-file-limit', name: 'File Descriptor Limit', category: 'resource', regex: /(?:EMFILE|Too many open files|ulimit|file.*descriptor)/i, severity: 'medium', retryable: true, suggestion: 'Too many open files. Increase ulimit or close unused handles.', autoFixable: true },
  { id: 'res-inode', name: 'Inode Exhaustion', category: 'resource', regex: /(?:no space.*inode|inode.*full|ENOSPC.*inode)/i, severity: 'high', retryable: true, suggestion: 'Inodes exhausted. Clean up small files or increase inode count.', autoFixable: false },

  // === PLATFORM SPECIFIC ===
  { id: 'gh-checkout', name: 'Git Checkout Failed', category: 'infrastructure', regex: /(?:fatal:.*fetch|checkout.*failed|reference.*not.*tree|shallow.*update)/i, severity: 'high', retryable: true, suggestion: 'Git checkout failed. Try with fetch-depth: 0 for full clone.', autoFixable: true },
  { id: 'gh-action-version', name: 'Action Version Not Found', category: 'dependency', regex: /(?:Unable to resolve action|action.*version.*not found|uses:.*not found)/i, severity: 'high', retryable: false, suggestion: 'Action version not found. Pin to a valid tag or SHA.', autoFixable: false },
  { id: 'gh-concurrency', name: 'Concurrency Cancellation', category: 'infrastructure', regex: /(?:cancelled.*concurrency|superseded|canceled by.*workflow)/i, severity: 'low', retryable: false, suggestion: 'Workflow cancelled by newer run. This is expected with concurrency groups.', autoFixable: false },
  { id: 'gh-matrix', name: 'Matrix Job Failed', category: 'build', regex: /(?:matrix.*fail|fail-fast|job.*matrix.*failed)/i, severity: 'medium', retryable: true, suggestion: 'Matrix job failed. Check individual matrix combination logs.', autoFixable: false },
  { id: 'deploy-health', name: 'Deployment Health Check Failed', category: 'infrastructure', regex: /(?:health.*check.*fail|deploy.*unhealthy|readiness.*probe|liveness.*probe)/i, severity: 'critical', retryable: true, suggestion: 'Deployment health check failed. Check application logs and health endpoint.', autoFixable: false },
  { id: 'deploy-rollback', name: 'Deployment Rollback', category: 'infrastructure', regex: /(?:rolling back|rollback.*triggered|deployment.*failed.*rolling)/i, severity: 'critical', retryable: false, suggestion: 'Deployment rolled back. Check logs and fix before redeploying.', autoFixable: false },
];

export function matchPatterns(log: string): FailurePattern[] {
  return PATTERNS.filter(p => p.regex.test(log));
}

export function getBestMatch(log: string): FailurePattern | null {
  const matches = matchPatterns(log);
  if (matches.length === 0) return null;
  // Return highest severity match
  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  return matches.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity])[0];
}
