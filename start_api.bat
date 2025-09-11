@echo off
echo 🚀 Iniciando FretoTVS API com PostgreSQL
echo.

REM Verificar se o proxy está rodando
echo 🔍 Verificando Cloud SQL Proxy...
tasklist /FI "IMAGENAME eq cloud_sql_proxy.exe" 2>NUL | find /I /N "cloud_sql_proxy.exe">NUL
if %ERRORLEVEL% neq 0 (
    echo ⚠️  Cloud SQL Proxy não encontrado. Inicie-o primeiro:
    echo cloud_sql_proxy.exe totvs-colab5:us-east4:fretotvs --port=15432
    pause
    exit /b 1
)

echo ✅ Proxy encontrado!

REM Ativar ambiente virtual
call .venv\Scripts\activate.bat

REM Testar conexão com banco
echo 🔧 Testando conexão com banco...
python test_db.py
if %errorlevel% neq 0 (
    echo ❌ Falha na conexão com banco. Abortando...
    pause
    exit /b 1
)

echo.
echo ✅ Banco OK! Iniciando API...
echo URL: http://localhost:8000
echo Documentação: http://localhost:8000/docs
echo.

REM Iniciar API
uvicorn main:app --reload --host 0.0.0.0 --port 8000
