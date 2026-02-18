import { describe, it, expect, vi } from 'vitest';
import { RetryEngine } from '../retry';

describe('RetryEngine', () => {
  it('succeeds on first attempt', async () => {
    const engine = new RetryEngine({ maxRetries: 3, baseDelayMs: 10 });
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await engine.execute(fn);
    expect(result.success).toBe(true);
    expect(result.result).toBe('ok');
    expect(result.attempts).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('retries and succeeds on 2nd attempt', async () => {
    const engine = new RetryEngine({ maxRetries: 3, baseDelayMs: 1 });
    let calls = 0;
    const fn = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls < 2) throw new Error('transient');
      return 'recovered';
    });
    const result = await engine.execute(fn);
    expect(result.success).toBe(true);
    expect(result.result).toBe('recovered');
    expect(result.attempts).toBe(2);
    expect(result.errors).toHaveLength(1);
  });

  it('fails after exhausting all retries', async () => {
    const engine = new RetryEngine({ maxRetries: 2, baseDelayMs: 1 });
    const fn = vi.fn().mockRejectedValue(new Error('permanent failure'));
    const result = await engine.execute(fn);
    expect(result.success).toBe(false);
    expect(result.attempts).toBe(3); // initial + 2 retries
    expect(result.errors).toHaveLength(3);
  });

  it('calls onRetry callback on each retry', async () => {
    const retrySpy = vi.fn();
    const engine = new RetryEngine({ maxRetries: 2, baseDelayMs: 1, onRetry: retrySpy });
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    await engine.execute(fn);
    expect(retrySpy).toHaveBeenCalledTimes(2);
    expect(retrySpy.mock.calls[0][0]).toBe(1); // first retry attempt number
  });

  it('tracks total delay time', async () => {
    const engine = new RetryEngine({ maxRetries: 2, baseDelayMs: 1 });
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    const result = await engine.execute(fn);
    expect(result.totalDelayMs).toBeGreaterThanOrEqual(0);
  });

  it('wraps non-Error throws into Error objects', async () => {
    const engine = new RetryEngine({ maxRetries: 1, baseDelayMs: 1 });
    const fn = vi.fn().mockRejectedValue('string error');
    const result = await engine.execute(fn);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toBeInstanceOf(Error);
    expect(result.errors[0].message).toBe('string error');
  });

  it('respects maxDelayMs cap', async () => {
    const onRetry = vi.fn();
    const engine = new RetryEngine({ maxRetries: 3, baseDelayMs: 1, maxDelayMs: 5, onRetry });
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    await engine.execute(fn);
    // All retry delays should be ≤ maxDelayMs
    for (const call of onRetry.mock.calls) {
      expect(call[1]).toBeLessThanOrEqual(5);
    }
  });
});
