import NodeCache from 'node-cache';
import { CacheMetrics } from '../metrics';

export class MemoryCache {
  private cache: NodeCache;
  private metrics: CacheMetrics;

  constructor(ttl: number = 300) {
    this.cache = new NodeCache({ 
      stdTTL: ttl,
      checkperiod: 60,
      useClones: false
    });
    this.metrics = new CacheMetrics('memory');
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

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const start = performance.now();
    this.cache.set(key, value, ttl || 0);
    const duration = (performance.now() - start) / 1000;
    
    this.metrics.recordLatency('set', duration);
    this.updateMemoryUsage();
  }

  async delete(key: string): Promise<void> {
    this.cache.del(key);
    this.updateMemoryUsage();
  }

  async clear(): Promise<void> {
    this.cache.flushAll();
    this.metrics.reset();
  }

  getStats() {
    return {
      ...this.metrics.getStats(),
      keys: this.cache.keys().length
    };
  }

  private updateMemoryUsage() {
    const stats = this.cache.getStats();
    const estimatedBytes = stats.keys * 2048;
    this.metrics.recordMemoryUsage(estimatedBytes);
  }
}