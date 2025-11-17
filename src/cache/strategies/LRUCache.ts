import { LRUCache as LRU } from 'lru-cache';
import { CacheMetrics } from '../metrics';

export class LRUCache {
  private cache: LRU<string, any>;
  private metrics: CacheMetrics;

  constructor(max: number = 1000, ttl: number = 300000) {
    this.cache = new LRU({
      max,
      ttl,
      updateAgeOnGet: true,
      updateAgeOnHas: true
    });
    this.metrics = new CacheMetrics('lru');
  }

  async get(key: string): Promise<any> {
    const start = performance.now();
    const value = this.cache.get(key);
    const duration = (performance.now() - start) / 1000;
    
    this.metrics.recordLatency('get', duration);
    
    if (value !== undefined) {
      this.metrics.recordHit();
      return value;
    }
    
    this.metrics.recordMiss();
    return null;
  }

  async set(key: string, value: any): Promise<void> {
    const start = performance.now();
    this.cache.set(key, value);
    const duration = (performance.now() - start) / 1000;
    
    this.metrics.recordLatency('set', duration);
    this.updateMemoryUsage();
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    this.updateMemoryUsage();
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.metrics.reset();
  }

  getStats() {
    return {
      ...this.metrics.getStats(),
      keys: this.cache.size,
      max: this.cache.max
    };
  }

  private updateMemoryUsage() {
    const estimatedBytes = this.cache.size * 2048;
    this.metrics.recordMemoryUsage(estimatedBytes);
  }
}