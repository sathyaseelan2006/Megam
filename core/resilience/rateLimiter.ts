/**
 * Token Bucket Rate Limiter for client-side API throttling.
 */
export interface RateLimiterOptions {
  capacity: number; // Maximum burst tokens available
  refillRatePerSecond: number; // Tokens added per second
}

export class RateLimiter {
  private capacity: number;
  private refillRatePerSecond: number;
  private tokens: number;
  private lastRefillTimestamp: number;

  constructor(options: RateLimiterOptions) {
    this.capacity = options.capacity;
    this.refillRatePerSecond = options.refillRatePerSecond;
    this.tokens = options.capacity;
    this.lastRefillTimestamp = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsedTimeInSeconds = (now - this.lastRefillTimestamp) / 1000;
    const tokensToAdd = elapsedTimeInSeconds * this.refillRatePerSecond;

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefillTimestamp = now;
    }
  }

  public tryAcquire(cost: number = 1): boolean {
    this.refill();
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }
    return false;
  }

  public async acquireOrWait(cost: number = 1, maxWaitMs: number = 10000): Promise<boolean> {
    this.refill();
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }

    const deficit = cost - this.tokens;
    const waitTimeMs = (deficit / this.refillRatePerSecond) * 1000;

    if (waitTimeMs > maxWaitMs) {
      return false;
    }

    await new Promise((resolve) => setTimeout(resolve, waitTimeMs));
    this.refill();

    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }
    return false;
  }

  public getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}
