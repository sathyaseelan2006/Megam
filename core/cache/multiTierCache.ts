import { LRUCache } from './lruCache';
import { encodeGeohash } from './geohash';

interface CacheRecord<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const DB_NAME = 'megam_cache_db';
const STORE_NAME = 'spatial_telemetry_cache';
const DB_VERSION = 1;

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported in this environment'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  public async get<T>(key: string): Promise<CacheRecord<T> | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  public async set<T>(key: string, record: CacheRecord<T>): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(record, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // Gracefully ignore write failures in private/incognito contexts
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // Ignore
    }
  }
}

export class MultiTierCache {
  private l1MemoryCache: LRUCache<string, CacheRecord<any>>;
  private l2IndexedDb: IndexedDBStorage;
  private inFlightRequests: Map<string, Promise<any>>;

  constructor(memoryCapacity: number = 200) {
    this.l1MemoryCache = new LRUCache(memoryCapacity, 15 * 60 * 1000);
    this.l2IndexedDb = new IndexedDBStorage();
    this.inFlightRequests = new Map();
  }

  public generateSpatialKey(lat: number, lng: number, namespace: string, precision: number = 5): string {
    const geohash = encodeGeohash(lat, lng, precision);
    return `${namespace}:${geohash}`;
  }

  /**
   * Fetch with Stale-While-Revalidate (SWR) mechanics & Request Coalescing
   */
  public async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 20 * 60 * 1000 // 20 minutes default
  ): Promise<{ data: T; isStale: boolean; fromCache: boolean }> {
    const now = Date.now();

    // 1. Check L1 Memory Cache
    const l1Record = this.l1MemoryCache.get(key) as CacheRecord<T> | undefined;
    if (l1Record) {
      const isExpired = now - l1Record.timestamp > l1Record.ttlMs;
      if (!isExpired) {
        return { data: l1Record.data, isStale: false, fromCache: true };
      }
      // Stale L1 hit: Return immediately and trigger background revalidation
      this.revalidateInBackground(key, fetcher, ttlMs);
      return { data: l1Record.data, isStale: true, fromCache: true };
    }

    // 2. Check L2 IndexedDB Cache
    const l2Record = await this.l2IndexedDb.get<T>(key);
    if (l2Record) {
      // Populate back to L1
      this.l1MemoryCache.set(key, l2Record, ttlMs);
      const isExpired = now - l2Record.timestamp > l2Record.ttlMs;
      if (!isExpired) {
        return { data: l2Record.data, isStale: false, fromCache: true };
      }
      // Stale L2 hit: Return immediately and trigger background revalidation
      this.revalidateInBackground(key, fetcher, ttlMs);
      return { data: l2Record.data, isStale: true, fromCache: true };
    }

    // 3. Cache Miss: Execute fetcher with Request Coalescing (prevent duplicate simultaneous inflight fetches)
    const data = await this.coalesceFetch(key, fetcher);
    await this.set(key, data, ttlMs);
    return { data, isStale: false, fromCache: false };
  }

  public async set<T>(key: string, data: T, ttlMs: number = 20 * 60 * 1000): Promise<void> {
    const record: CacheRecord<T> = {
      data,
      timestamp: Date.now(),
      ttlMs,
    };
    this.l1MemoryCache.set(key, record, ttlMs);
    await this.l2IndexedDb.set(key, record);
  }

  private async coalesceFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key)!;
    }

    const fetchPromise = (async () => {
      try {
        return await fetcher();
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, fetchPromise);
    return fetchPromise;
  }

  private revalidateInBackground<T>(key: string, fetcher: () => Promise<T>, ttlMs: number): void {
    if (this.inFlightRequests.has(key)) return;

    this.coalesceFetch(key, fetcher)
      .then((freshData) => {
        this.set(key, freshData, ttlMs);
      })
      .catch((err) => {
        console.warn(`[MultiTierCache] Background revalidation failed for ${key}:`, err);
      });
  }
}

export const globalCache = new MultiTierCache();
