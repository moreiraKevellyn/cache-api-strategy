import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { CacheManager, CacheStrategy } from './cache/CacheManager';
import { createProductRoutes } from './routes/products';
import { db } from './database';
import { register } from './cache/metrics';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar cache manager
const cacheManager = new CacheManager();

// Middleware
app.use(express.json());

// CORS simples
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Logging simples
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== ROTAS ====================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    strategy: cacheManager.getStrategy()
  });
});

// Métricas Prometheus
app.get('/metrics', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// Cache management endpoints
app.get('/cache/stats', async (req: Request, res: Response) => {
  const stats = await cacheManager.getAllStats();
  res.json(stats);
});

app.post('/cache/strategy', (req: Request, res: Response) => {
  const { strategy } = req.body;
  
  const validStrategies: CacheStrategy[] = ['memory', 'lru', 'redis', 'http'];
  
  if (!validStrategies.includes(strategy)) {
    return res.status(400).json({ 
      error: 'Estratégia inválida',
      valid: validStrategies 
    });
  }

  cacheManager.setStrategy(strategy);
  res.json({ 
    message: `Estratégia alterada para: ${strategy}`,
    strategy: cacheManager.getStrategy()
  });
});

app.delete('/cache/clear', async (req: Request, res: Response) => {
  const { strategy } = req.query;

  if (strategy === 'all') {
    await cacheManager.clearAll();
    return res.json({ message: 'Todos os caches limpos' });
  }

  await cacheManager.clear();
  res.json({ 
    message: `Cache limpo para estratégia: ${cacheManager.getStrategy()}` 
  });
});

// Rotas de produtos
app.use('/products', createProductRoutes(cacheManager));

// Rota 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ==================== INICIALIZAÇÃO ====================

async function waitForDatabase(maxRetries = 10, delay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await db.testConnection();
      return true;
    } catch (error) {
      console.log(`⏳ Aguardando PostgreSQL... (tentativa ${i + 1}/${maxRetries})`);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error('Não foi possível conectar ao PostgreSQL após várias tentativas');
}

async function startServer() {
  try {
    // Testar conexão com database (com retry)
    await waitForDatabase();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════════╗');
      console.log('║   🚀 Cache API Strategy - TCC Project     ║');
      console.log('╚════════════════════════════════════════════╝');
      console.log('');
      console.log(`📡 Servidor rodando em: http://localhost:${PORT}`);
      console.log(`📊 Métricas Prometheus: http://localhost:${PORT}/metrics`);
      console.log(`💾 Estratégia atual: ${cacheManager.getStrategy()}`);
      console.log('');
      console.log('Endpoints disponíveis:');
      console.log('  GET  /health');
      console.log('  GET  /metrics');
      console.log('  GET  /cache/stats');
      console.log('  POST /cache/strategy');
      console.log('  DEL  /cache/clear');
      console.log('  GET  /products');
      console.log('  GET  /products/:id');
      console.log('  GET  /products/category/:categoryId');
      console.log('  GET  /products/top/expensive');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Recebido SIGTERM, fechando servidor...');
  await cacheManager.disconnect();
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nRecebido SIGINT, fechando servidor...');
  await cacheManager.disconnect();
  await db.close();
  process.exit(0);
});

// Iniciar
startServer();