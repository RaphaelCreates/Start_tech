#!/bin/bash

set -e

echo "🚀 Iniciando FretoTVS Backend com Cloud SQL Auth Proxy..."

# Verificar se estamos no Cloud Run
if [ -z "$K_SERVICE" ]; then
    echo "💻 Ambiente local detectado - pulando Cloud SQL Proxy"
    echo "Iniciando aplicação diretamente..."
    exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
fi

# Configurações do Cloud SQL
INSTANCE_CONNECTION_NAME="${INSTANCE_CONNECTION_NAME:-totvs-colab5:us-east4:fretotvs}"
DB_USER="${DB_USER:-postgres}"
DB_PASS="${DB_PASS:-}"
DB_NAME="${DB_NAME:-postgres}"

echo "📊 Configurações do banco:"
echo "  - Instance: $INSTANCE_CONNECTION_NAME"
echo "  - User: $DB_USER"
echo "  - Database: $DB_NAME"

# Baixar Cloud SQL Auth Proxy
echo "⬇️  Baixando Cloud SQL Auth Proxy..."
wget -q https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.1/cloud-sql-proxy.linux.amd64 -O /tmp/cloud-sql-proxy
chmod +x /tmp/cloud-sql-proxy

echo "🔐 Iniciando Cloud SQL Auth Proxy em background..."
/tmp/cloud-sql-proxy "$INSTANCE_CONNECTION_NAME" \
    --port 5432 \
    --private-ip \
    --quiet &

# Aguardar o proxy estar pronto
echo "⏳ Aguardando Cloud SQL Proxy ficar pronto..."
timeout=60
counter=0

while ! nc -z localhost 5432; do
    if [ $counter -ge $timeout ]; then
        echo "❌ Timeout aguardando Cloud SQL Proxy"
        exit 1
    fi
    echo "Aguardando proxy... ($counter/$timeout)"
    sleep 1
    counter=$((counter + 1))
done

echo "✅ Cloud SQL Proxy está pronto!"

# Testar conexão com o banco
echo "🔍 Testando conexão com PostgreSQL..."
python3 -c "
import psycopg2
import os
try:
    conn = psycopg2.connect(
        host='localhost',
        port=5432,
        user=os.environ.get('DB_USER', 'postgres'),
        password=os.environ.get('DB_PASS', ''),
        database=os.environ.get('DB_NAME', 'postgres'),
        connect_timeout=10
    )
    conn.close()
    print('✅ Conexão com PostgreSQL estabelecida!')
except Exception as e:
    print(f'⚠️  Aviso na conexão: {e}')
    print('Continuando inicialização...')
"

echo "🚀 Iniciando aplicação FastAPI..."
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
