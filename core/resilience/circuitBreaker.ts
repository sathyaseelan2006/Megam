import { Result, Ok, Err, tryAsync } from '../types/result';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Number of failures to trigger OPEN state (default: 3)
  recoveryTimeoutMs?: number; // Time in ms before attempting HALF_OPEN (default: 30,000ms)
  successThreshold?: number; // Consecutive successes in HALF_OPEN to return to CLOSED (default: 2)
  name?: string;
  onStateChange?: (from: CircuitState, to: CircuitState, breakerName: string) => void;
}

export class CircuitBreakerError extends Error {
  constructor(public readonly breakerName: string, message: string) {
    super(`[CircuitBreaker:${breakerName}] ${message}`);
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly failureThreshold: number;
  private readonly recoveryTimeoutMs: number;
  private readonly successThreshold: number;
  public readonly name: string;
  private readonly onStateChange?: (from: CircuitState, to: CircuitState, name: string) => void;

  constructor(options: CircuitBreakerOptions = {}) {
    this.name = options.name || 'default';
    this.failureThreshold = options.failureThreshold ?? 3;
    this.recoveryTimeoutMs = options.recoveryTimeoutMs ?? 30000;
    this.successThreshold = options.successThreshold ?? 2;
    this.onStateChange = options.onStateChange;
  }

  public getState(): CircuitState {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.recoveryTimeoutMs) {
        this.transitionTo('HALF_OPEN');
      }
    }
    return this.state;
  }

  public async execute<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
    const currentState = this.getState();

    if (currentState === 'OPEN') {
      const remainingCooldown = Math.max(0, this.recoveryTimeoutMs - (Date.now() - this.lastFailureTime));
      return Err(
        new CircuitBreakerError(
          this.name,
          `Circuit is OPEN. Fast failing request. Retry available in ${Math.round(remainingCooldown / 1000)}s`
        )
      );
    }

    const result = await tryAsync(fn);

    if (result.ok) {
      this.handleSuccess();
      return result;
    } else {
      this.handleFailure();
      return result;
    }
  }

  private handleSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.failureCount = 0;
        this.successCount = 0;
        this.transitionTo('CLOSED');
      }
    } else if (this.state === 'CLOSED') {
      this.failureCount = 0;
    }
  }

  private handleFailure(): void {
    this.lastFailureTime = Date.now();
    if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN');
    } else if (this.state === 'CLOSED') {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.transitionTo('OPEN');
      }
    }
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      if (newState === 'HALF_OPEN') {
        this.successCount = 0;
      }
      this.onStateChange?.(oldState, newState, this.name);
    }
  }

  public reset(): void {
    this.transitionTo('CLOSED');
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}
