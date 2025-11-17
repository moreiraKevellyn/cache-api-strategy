import { MemoryCache } from './strategies/MemoryCache';
import { LRUCache } from './strategies/LRUCache';
import { RedisCache } from './strategies/RedisCache';
import { HTTPCache } from './strategies/HTTPCache';
import { Request } from 'express';

export type CacheStrategy = 'memory' | 'lru' | 'redis' | 'http';

export class CacheManager {
  private memoryCache: MemoryCache;
  private lruCache: LRUCache;
  private redisCache: RedisCache;
  private httpCache: HTTPCache;
  private currentStrategy: CacheStrategy = 'memory';

  constructor() {
    this.memoryCache = new MemoryCache(300);
    this.lruCache = new LRUCache(1000, 300000);
    this.redisCache = new RedisCache(process.env.REDIS_URL, 300);
    this.httpCache = new HTTPCache(300);
  }

  setStrategy(strategy: CacheStrategy) {
    this.currentStrategy = strategy;
  }

  getStrategy(): CacheStrategy {
    return this.currentStrategy;
  }

  async get(key: string, req?: Request): Promise<any> {
    switch (this.currentStrategy) {
      case 'memory':
        return await this.memoryCache.get(key);
      case 'lru':
        return await this.lruCache.get(key);
      case 'redis':
        return await this.redisCache.get(key);
      case 'http':
        const mockReq = req || ({ headers: {} } as Request);
        return await this.httpCache.get(key, mockReq);
      default:
        return await this.memoryCache.get(key);
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<any> {
    switch (this.currentStrategy) {
      case 'memory':
        return await this.memoryCache.set(key, value, ttl);
      case 'lru':
        return await this.lruCache.set(key, value);
      case 'redis':
        return await this.redisCache.set(key, value, ttl);
      case 'http':
        return await this.httpCache.set(key, value);
      default:
        return await this.memoryCache.set(key, value, ttl);
    }
  }

  async delete(key: string): Promise<void> {
    switch (this.currentStrategy) {
      case 'memory':
        await this.memoryCache.delete(key);
        break;
      case 'lru':
        await this.lruCache.delete(key);
        break;
      case 'redis':
        await this.redisCache.delete(key);
        break;
      case 'http':
        await this.httpCache.delete(key);
        break;
    }
  }

  async clear(): Promise<void> {
    switch (this.currentStrategy) {
      case 'memory':
        await this.memoryCache.clear();
        break;
      case 'lru':
        await this.lruCache.clear();
        break;
      case 'redis':
        await this.redisCache.clear();
        break;
      case 'http':
        await this.httpCache.clear();
        break;
    }
  }

  async getStats() {
    switch (this.currentStrategy) {
      case 'memory':
        return this.memoryCache.getStats();
      case 'lru':
        return this.lruCache.getStats();
      case 'redis':
        return await this.redisCache.getStats();
      case 'http':
        return this.httpCache.getStats();
      default:
        return this.memoryCache.getStats();
    }
  }

  async getAllStats() {
    return {
      memory: this.memoryCache.getStats(),
      lru: this.lruCache.getStats(),
      redis: await this.redisCache.getStats(),
      http: this.httpCache.getStats(),
      currentStrategy: this.currentStrategy
    };
  }

  async clearAll() {
    await this.memoryCache.clear();
    await this.lruCache.clear();
    await this.redisCache.clear();
    await this.httpCache.clear();
  }

  async disconnect() {
    await this.redisCache.disconnect();
  }
}