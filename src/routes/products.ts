import { Router, Request, Response } from 'express';
import { ProductModel } from '../models/Product';
import { CacheManager } from '../cache/CacheManager';
import { cacheMiddleware } from '../middleware/cacheMiddleware';

export function createProductRoutes(cacheManager: CacheManager): Router {
  const router = Router();

  router.use(cacheMiddleware(cacheManager));

  router.get('/', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const products = await ProductModel.findAll(limit, offset);
      const total = await ProductModel.count();

      res.json({
        data: products,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total
        }
      });
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const product = await ProductModel.findById(id);

      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      res.json(product);
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      res.status(500).json({ error: 'Erro ao buscar produto' });
    }
  });

  router.get('/category/:categoryId', async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const limit = parseInt(req.query.limit as string) || 50;

      if (isNaN(categoryId)) {
        return res.status(400).json({ error: 'Category ID inválido' });
      }

      const products = await ProductModel.findByCategory(categoryId, limit);

      res.json({
        categoryId,
        count: products.length,
        data: products
      });
    } catch (error) {
      console.error('Erro ao buscar produtos por categoria:', error);
      res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
  });

  router.get('/top/expensive', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const products = await ProductModel.findTopExpensive(limit);

      res.json({
        count: products.length,
        data: products
      });
    } catch (error) {
      console.error('Erro ao buscar top produtos:', error);
      res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
  });

  router.get('/price-range', async (req: Request, res: Response) => {
    try {
      const min = parseFloat(req.query.min as string) || 0;
      const max = parseFloat(req.query.max as string) || 1000;

      const products = await ProductModel.findByPriceRange(min, max);

      res.json({
        priceRange: { min, max },
        count: products.length,
        data: products
      });
    } catch (error) {
      console.error('Erro ao buscar produtos por preço:', error);
      res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
  });

  return router;
}