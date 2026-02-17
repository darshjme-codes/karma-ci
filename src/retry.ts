/**
 * retry.ts — Smart retry with exponential backoff + jitter
 */

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs?: number;
  jitterFactor?: number;
  onRetry?: (attempt: number, delayMs: number, error: Error) => void;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  attempts: number;
  errors: Error[];
  totalDelayMs: number;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> & { onRetry?: RetryOptions['onRetry'] } = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30_000,
  jitterFactor: 0.5,
};

export class RetryEngine {
  private options: Required<Omit<RetryOptions, 'onRetry'>> & { onRetry?: RetryOptions['onRetry'] };

  constructor(options?: Partial<RetryOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /** Execute a function with smart retry logic */
  async execute<T>(fn: () => Promise<T>): Promise<RetryResult<T>> {
    const errors: Error[] = [];
    let totalDelay = 0;

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        const result = await fn();
        return { success: true, result, attempts: attempt + 1, errors, totalDelayMs: totalDelay };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        errors.push(error);

        if (attempt < this.options.maxRetries) {
          const delay = this.calculateDelay(attempt);
          totalDelay += delay;
          this.options.onRetry?.(attempt + 1, delay, error);
          await this.sleep(delay);
        }
      }
    }

    return { success: false, attempts: this.options.maxRetries + 1, errors, totalDelayMs: totalDelay };
  }

  /** Calculate delay with exponential backoff + jitter */
  calculateDelay(attempt: number): number {
    const exponential = this.options.baseDelayMs * Math.pow(2, attempt);
    const capped = Math.min(exponential, this.options.maxDelayMs);
    const jitter = capped * this.options.jitterFactor * (Math.random() * 2 - 1);
    return Math.max(0, Math.round(capped + jitter));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
