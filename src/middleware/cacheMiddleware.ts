import { Request, Response, NextFunction } from 'express';
import { CacheManager } from '../cache/CacheManager';

export function cacheMiddleware(cacheManager: CacheManager) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${req.path}:${JSON.stringify(req.query)}`;
    const strategy = cacheManager.getStrategy();

    try {
      const cachedData = await cacheManager.get(cacheKey, req);

      if (cachedData && cachedData.status === 304) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Strategy', strategy);
        return res.status(304).end();
      }

      if (cachedData) {
        if (strategy === 'http' && cachedData.etag) {
          res.setHeader('Cache-Control', 'public, max-age=300');
          res.setHeader('ETag', cachedData.etag);
          res.setHeader('Last-Modified', cachedData.lastModified);
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('X-Cache-Strategy', strategy);
          return res.json(cachedData.data);
        }

        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Strategy', strategy);
        return res.json(cachedData);
      }

      const originalJson = res.json.bind(res);
      let headersSent = false;
      
      res.json = function(data: any) {
        if (headersSent) {
          return originalJson(data);
        }
        
        headersSent = true;
        
        cacheManager.set(cacheKey, data).then((entry) => {
          if (strategy === 'http' && entry && !res.headersSent) {
            try {
              res.setHeader('Cache-Control', 'public, max-age=300');
              res.setHeader('ETag', entry.etag);
              res.setHeader('Last-Modified', entry.lastModified.toUTCString());
            } catch (err) {
              // Headers já enviados
            }
          }
        });

        if (!res.headersSent) {
          res.setHeader('X-Cache', 'MISS');
          res.setHeader('X-Cache-Strategy', strategy);
        }
        
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Erro no cache middleware:', error);
      next();
    }
  };
}