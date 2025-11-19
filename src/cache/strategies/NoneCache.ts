import { CacheMetrics } from '../metrics';

export class NoneCache {
  private metrics: CacheMetrics;

  constructor() {
    this.metrics = new CacheMetrics('none');
  }

  async get(key: string): Promise<any> {
    const start = performance.now();
    const duration = (performance.now() - start) / 1000;
    
    this.metrics.recordLatency('get', duration);
    this.metrics.recordMiss();
    
    // Sempre retorna null (nunca tem cache)
    return null;
  }

  async set(key: string, value: any): Promise<void> {
    const start = performance.now();
    // Não faz nada (não armazena)
    const duration = (performance.now() - start) / 1000;
    this.metrics.recordLatency('set', duration);
  }

  async delete(key: string): Promise<void> {
    // Não faz nada
  }

  async clear(): Promise<void> {
    this.metrics.reset();
  }

  getStats() {
    return {
      ...this.metrics.getStats(),
      keys: 0
    };
  }
}