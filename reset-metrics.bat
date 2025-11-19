@echo off
echo ╔════════════════════════════════════════════╗
echo ║      🧹 LIMPANDO TODAS AS MÉTRICAS        ║
echo ╚════════════════════════════════════════════╝
echo.

echo 📊 1. Limpando cache da API...
curl -s -X DELETE "http://localhost:3000/cache/clear?strategy=all"
echo.
echo ✅ Cache da API limpo
echo.

echo 🐳 2. Parando containers...
docker-compose down
echo ✅ Containers parados
echo.

echo 🗑️ 3. Removendo volume do Prometheus...
docker volume rm cache-api-strategy_prometheus_data 2>nul
echo ✅ Volume removido
echo.

echo 🚀 4. Subindo containers novamente...
docker-compose up -d
echo ✅ Containers iniciados
echo.

echo ⏳ 5. Aguardando serviços ficarem prontos...
timeout /t 15 /nobreak >nul
echo ✅ Serviços prontos
echo.

echo ╔════════════════════════════════════════════╗
echo ║         ✅ MÉTRICAS RESETADAS!            ║
echo ╚════════════════════════════════════════════╝
echo.
pause