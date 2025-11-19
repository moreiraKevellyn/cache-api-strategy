@echo off
chcp 65001 >nul
echo ════════════════════════════════════════════
echo 🧪 Testando Cache API Strategy
echo ════════════════════════════════════════════
echo.

set BASE_URL=http://localhost:3000

echo ❤️ 1. Health Check
curl -s %BASE_URL%/health
echo.
echo.

echo 📦 1. Testando SEM CACHE (baseline)
echo ------------------------------------
curl -s -X POST %BASE_URL%/cache/strategy -H "Content-Type: application/json" -d "{\"strategy\":\"none\"}"
echo.
echo   Primeira busca:
curl -s -i %BASE_URL%/products?limit=3 2>&1 | findstr "X-Cache"
echo   Segunda busca (também será MISS):
curl -s -i %BASE_URL%/products?limit=3 2>&1 | findstr "X-Cache"
echo.
echo.


echo 📦 2. Testando estratégia MEMORY
echo ------------------------------------
curl -s -X POST %BASE_URL%/cache/strategy -H "Content-Type: application/json" -d "{\"strategy\":\"memory\"}"
echo.
echo   Primeira busca (MISS):
curl -s -i %BASE_URL%/products?limit=3 2>&1 | findstr "X-Cache"
echo   Segunda busca (HIT):
curl -s -i %BASE_URL%/products?limit=3 2>&1 | findstr "X-Cache"
echo.
echo.

echo 📦 3. Testando estratégia LRU
echo ------------------------------------
curl -s -X POST %BASE_URL%/cache/strategy -H "Content-Type: application/json" -d "{\"strategy\":\"lru\"}"
echo.
echo   Primeira busca (MISS):
curl -s -i %BASE_URL%/products?limit=3 2>&1 | findstr "X-Cache"
echo   Segunda busca (HIT):
curl -s -i %BASE_URL%/products?limit=3 2>&1 | findstr "X-Cache"
echo.
echo.

echo 📦 4. Testando estratégia REDIS
echo ------------------------------------
curl -s -X POST %BASE_URL%/cache/strategy -H "Content-Type: application/json" -d "{\"strategy\":\"redis\"}"
echo.
echo   Primeira busca (MISS):
curl -s -i %BASE_URL%/products?limit=3 2>&1 | findstr "X-Cache"
echo   Segunda busca (HIT):
curl -s -i %BASE_URL%/products?limit=3 2>&1 | findstr "X-Cache"
echo.
echo.

echo 📦 5. Testando estratégia HTTP
echo ------------------------------------
curl -s -X POST %BASE_URL%/cache/strategy -H "Content-Type: application/json" -d "{\"strategy\":\"http\"}"
echo.
echo   Primeira busca (MISS):
curl -s -i %BASE_URL%/products?limit=3 2>&1 | findstr "X-Cache"
echo   Segunda busca (HIT):
curl -s -i %BASE_URL%/products?limit=3 2>&1 | findstr "X-Cache"
echo.
echo.

echo 📊 6. Estatísticas Finais
echo ------------------------------------
curl -s %BASE_URL%/cache/stats
echo.
echo.

echo ✅ Testes concluídos!
echo.
pause