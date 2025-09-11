@echo off
echo 🚀 Iniciando FretoTVS API em modo desenvolvimento
echo.

REM Ativar ambiente virtual
call .venv\Scripts\activate.bat

REM Testar conexão com banco
echo 🔧 Testando conexão com banco...
python test_db.py
if %errorlevel% neq 0 (
    echo ❌ Falha no teste do banco. Abortando...
    pause
    exit /b 1
)

echo.
echo ✅ Banco OK! Iniciando API...
echo.

REM Iniciar API
uvicorn main:app --reload --host 0.0.0.0 --port 8000
