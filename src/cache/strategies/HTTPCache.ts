import { Request, Response } from 'express';
import { CacheMetrics } from '../metrics';

interface CacheEntry {
  data: any;
  etag: string;
  lastModified: Date;
  expiresAt: Date;
}

export class HTTPCache {
  private cache = new Map<string, CacheEntry>();
  private metrics: CacheMetrics;
  private maxAge: number;

  constructor(maxAge: number = 300) {
    this.maxAge = maxAge;
    this.metrics = new CacheMetrics('http');
    
    setInterval(() => this.cleanup(), 60000);
  }

  private generateETag(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return `"${Math.abs(hash).toString(36)}"`;
  }

  async get(key: string, req: Request): Promise<any> {
    const start = performance.now();
    const entry = this.cache.get(key);
    const duration = (performance.now() - start) / 1000;
    
    this.metrics.recordLatency('get', duration);

    if (!entry || new Date() > entry.expiresAt) {
      this.metrics.recordMiss();
      if (entry) this.cache.delete(key);
      return null;
    }

    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch === entry.etag) {
      this.metrics.recordHit();
      return { status: 304, etag: entry.etag };
    }

    const ifModifiedSince = req.headers['if-modified-since'];
    if (ifModifiedSince) {
      const clientDate = new Date(ifModifiedSince);
      if (clientDate >= entry.lastModified) {
        this.metrics.recordHit();
        return { status: 304, etag: entry.etag };
      }
    }

    this.metrics.recordHit();
    return entry;
  }

  async set(key: string, value: any): Promise<CacheEntry> {
    const start = performance.now();
    const now = new Date();
    
    const entry: CacheEntry = {
      data: value,
      etag: this.generateETag(value),
      lastModified: now,
      expiresAt: new Date(now.getTime() + this.maxAge * 1000)
    };

    this.cache.set(key, entry);
    
    const duration = (performance.now() - start) / 1000;
    this.metrics.recordLatency('set', duration);
    this.updateMemoryUsage();
    
    return entry;
  }

  applyHeaders(res: Response, entry: CacheEntry) {
    res.setHeader('Cache-Control', `public, max-age=${this.maxAge}`);
    res.setHeader('ETag', entry.etag);
    res.setHeader('Last-Modified', entry.lastModified.toUTCString());
    res.setHeader('Expires', entry.expiresAt.toUTCString());
    res.setHeader('X-Cache-Strategy', 'HTTP');
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
      keys: this.cache.size
    };
  }

  private cleanup() {
    const now = new Date();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    this.updateMemoryUsage();
  }

  private updateMemoryUsage() {
    const estimatedBytes = this.cache.size * 2048;
    this.metrics.recordMemoryUsage(estimatedBytes);
  }
}