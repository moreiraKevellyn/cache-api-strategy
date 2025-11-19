# 🚀 Cache API Strategy - TCC Project

Implementação e avaliação de 4 estratégias de cache para APIs REST.

## 📋 Estratégias Implementadas

1. **Memory Cache** - Cache em memória com node-cache
2. **LRU Cache** - Least Recently Used com lru-cache
3. **Redis Cache** - Cache distribuído com Redis
4. **HTTP Cache** - Cache com headers HTTP (ETag, Last-Modified)

## 🛠️ Stack Tecnológica

- Node.js + TypeScript + Express
- PostgreSQL (10.000 produtos)
- Redis
- Artillery (testes de carga)
- Prometheus + Grafana

## ⚡ Quick Start
```bash
# 1. Instalar dependências
npm install

# 2. Subir containers
npm run docker:up

# 3. Aguardar 10 segundos

# 4. Rodar servidor
npm run dev
```

## 🎯 Endpoints
```bash
GET  /health
GET  /metrics
GET  /cache/stats
POST /cache/strategy
DELETE /cache/clear
GET  /products
GET  /products/:id
GET  /products/category/:categoryId
GET  /products/top/expensive
```

## 🧪 Testes de Carga
```bash
# Teste rápido
test-cache.bat

# Bateria completa
run-all-tests.bat

# Testes individuais
npm run test:low
npm run test:medium
npm run test:high
```

## 📊 Monitoramento

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

## 🔧 Comandos Úteis
```bash
# Resetar métricas
reset-metrics.bat

# Ver logs
docker-compose logs -f

# Parar tudo
docker-compose down
```

## 📖 Estrutura do Projeto
```
cache-api-strategy/
├── src/
│   ├── cache/
│   │   ├── strategies/
│   │   ├── CacheManager.ts
│   │   └── metrics.ts
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── index.ts
├── scripts/
│   ├── seed.sql
│   └── load-tests/
├── prometheus/
└── docker-compose.yml
```

## 📈 Resultados Esperados

| Estratégia | Hit Rate | Latência P50 |
|------------|----------|--------------|
| Memory     | ~65%     | 3ms          |
| LRU        | ~64%     | 3ms          |
| Redis      | ~65%     | 7ms          |
| HTTP       | ~66%     | 5ms          |

## 📝 Licença

MIT