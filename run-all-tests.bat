@echo off
chcp 65001 >nul
echo ╔════════════════════════════════════════════╗
echo ║  🧪 Coleta de Dados - TCC Cache Strategy  ║
echo ╚════════════════════════════════════════════╝
echo.

set BASE_URL=http://localhost:3000

if not exist "test-results" mkdir test-results
set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set RESULT_DIR=test-results\%TIMESTAMP%
mkdir "%RESULT_DIR%"

echo 📁 Salvando resultados em: %RESULT_DIR%
echo.

set STRATEGIES=none memory lru redis http
set LOADS=low medium high

for %%s in (%STRATEGIES%) do (
    echo.
    echo ════════════════════════════════════════════
    echo 📦 TESTANDO ESTRATÉGIA: %%s
    echo ════════════════════════════════════════════
    echo.
    
    echo 🔄 Configurando estratégia...
    curl -s -X POST %BASE_URL%/cache/strategy -H "Content-Type: application/json" -d "{\"strategy\":\"%%s\"}"
    echo.
    
    timeout /t 3 /nobreak >nul
    
    for %%l in (%LOADS%) do (
        echo.
        echo   ▶️ Executando teste de carga: %%l
        echo   ----------------------------------------
        
        curl -s -X DELETE %BASE_URL%/cache/clear >nul
        timeout /t 2 /nobreak >nul
        
        call npm run test:%%l > "%RESULT_DIR%\%%s_%%l.txt" 2>&1
        
        echo   📊 Coletando estatísticas...
        curl -s %BASE_URL%/cache/stats > "%RESULT_DIR%\%%s_%%l_stats.json"
        
        timeout /t 5 /nobreak >nul
        
        echo   ✅ Teste %%s com carga %%l concluído
    )
    
    echo.
    echo ✅ Estratégia %%s concluída
    echo.
)

echo.
echo ════════════════════════════════════════════
echo 📊 COLETANDO MÉTRICAS FINAIS
echo ════════════════════════════════════════════
echo.

echo 📈 Exportando métricas do Prometheus...
curl -s "http://localhost:9090/api/v1/query?query=cache_hits_total" > "%RESULT_DIR%\prometheus_hits.json"
curl -s "http://localhost:9090/api/v1/query?query=cache_misses_total" > "%RESULT_DIR%\prometheus_misses.json"
curl -s "http://localhost:9090/api/v1/query?query=cache_operation_duration_seconds_sum" > "%RESULT_DIR%\prometheus_latency.json"
curl -s "http://localhost:9090/api/v1/query?query=cache_memory_bytes" > "%RESULT_DIR%\prometheus_memory.json"

curl -s %BASE_URL%/cache/stats > "%RESULT_DIR%\final_stats.json"

echo.
echo ╔════════════════════════════════════════════╗
echo ║           ✅ TESTES CONCLUÍDOS!            ║
echo ╚════════════════════════════════════════════╝
echo.
echo 📁 Resultados salvos em: %RESULT_DIR%
echo.
echo 📊 Arquivos gerados:
dir /b "%RESULT_DIR%"
echo.
echo 🎯 Próximos passos:
echo    1. Analise os arquivos .txt (saída do Artillery)
echo    2. Analise os arquivos .json (estatísticas de cache)
echo    3. Acesse o Prometheus para visualizar gráficos
echo    4. Configure o Grafana para dashboards visuais
echo.
pause