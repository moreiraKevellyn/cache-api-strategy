import { createClient, RedisClientType } from 'redis';
import { CacheMetrics } from '../metrics';

export class RedisCache {
  private client: RedisClientType;
  private metrics: CacheMetrics;
  private ttl: number;
  private connected: boolean = false;

  constructor(url: string = 'redis://localhost:6379', ttl: number = 300) {
    this.client = createClient({ url });
    this.metrics = new CacheMetrics('redis');
    this.ttl = ttl;
    this.connect();
  }

  private async connect() {
    try {
      await this.client.connect();
      this.connected = true;
      console.log('✅ Redis conectado');
    } catch (error) {
      console.error('❌ Erro ao conectar Redis:', error);
    }
  }

  async get(key: string): Promise<any> {
    if (!this.connected) return null;
    
    const start = performance.now();
    try {
      const value = await this.client.get(key);
      const duration = (performance.now() - start) / 1000;
      
      this.metrics.recordLatency('get', duration);
      
      if (value) {
        this.metrics.recordHit();
        return JSON.parse(value);
      }
      
      this.metrics.recordMiss();
      return null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.connected) return;
    
    const start = performance.now();
    try {
      await this.client.setEx(
        key, 
        ttl || this.ttl, 
        JSON.stringify(value)
      );
      const duration = (performance.now() - start) / 1000;
      this.metrics.recordLatency('set', duration);
      await this.updateMemoryUsage();
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.connected) return;
    await this.client.del(key);
  }

  async clear(): Promise<void> {
    if (!this.connected) return;
    await this.client.flushDb();
    this.metrics.reset();
  }

  async getStats() {
    if (!this.connected) {
      return { ...this.metrics.getStats(), keys: 0, memoryUsed: 0 };
    }
    
    const info = await this.client.info('stats');
    const memory = await this.client.info('memory');
    
    return {
      ...this.metrics.getStats(),
      keys: await this.client.dbSize(),
      memoryUsed: this.parseMemoryUsage(memory)
    };
  }

  private async updateMemoryUsage() {
    if (!this.connected) return;
    const memory = await this.client.info('memory');
    const bytes = this.parseMemoryUsage(memory);
    this.metrics.recordMemoryUsage(bytes);
  }

  private parseMemoryUsage(info: string): number {
    const match = info.match(/used_memory:(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async disconnect() {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }
}