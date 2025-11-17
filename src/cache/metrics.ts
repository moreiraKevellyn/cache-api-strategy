import { Counter, Histogram, Gauge, register } from 'prom-client';

// Métricas Prometheus
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total de cache hits',
  labelNames: ['strategy']
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total de cache misses',
  labelNames: ['strategy']
});

export const cacheLatency = new Histogram({
  name: 'cache_operation_duration_seconds',
  help: 'Latência das operações de cache',
  labelNames: ['strategy', 'operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
});

export const cacheMemoryUsage = new Gauge({
  name: 'cache_memory_bytes',
  help: 'Uso de memória do cache',
  labelNames: ['strategy']
});

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duração das queries no banco',
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// Classe para métricas simplificadas
export class CacheMetrics {
  private hits = 0;
  private misses = 0;
  private strategy: string;

  constructor(strategy: string) {
    this.strategy = strategy;
  }

  recordHit() {
    this.hits++;
    cacheHits.labels(this.strategy).inc();
  }

  recordMiss() {
    this.misses++;
    cacheMisses.labels(this.strategy).inc();
  }

  recordLatency(operation: string, duration: number) {
    cacheLatency.labels(this.strategy, operation).observe(duration);
  }

  recordMemoryUsage(bytes: number) {
    cacheMemoryUsage.labels(this.strategy).set(bytes);
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) : '0.00',
      total
    };
  }

  reset() {
    this.hits = 0;
    this.misses = 0;
  }
}

export { register };