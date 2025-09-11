# FretoTVS API - Desenvolvimento Local com PostgreSQL

## ✅ Status: FUNCIONANDO!

A API está configurada para funcionar com PostgreSQL via Cloud SQL Proxy.

## 🚀 Como executar

### 1. Pré-requisitos
- Google Cloud SDK instalado e autenticado
- Cloud SQL Proxy baixado
- Ambiente virtual Python configurado

### 2. Iniciar Cloud SQL Proxy
```bash
# Em outro terminal/cmd
cd C:\cloud-sql-proxy
cloud_sql_proxy.exe totvs-colab5:us-east4:fretotvs --port=15432
```

### 3. Executar API
```bash
# Opção 1: Script automático (recomendado)
start_api.bat

# Opção 2: Manual
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Verificar funcionamento
- **API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health
- **Documentação**: http://localhost:8000/docs

## 🔧 Configuração do Banco

### Credenciais (arquivo .env)
```env
DATABASE_URL=postgresql+psycopg2://postgres:Postgres123!@localhost:15432/postgres
DB_USER=postgres
DB_PASS=Postgres123!
DB_NAME=postgres
DB_PORT=15432
```

### Teste de Conexão
```bash
python test_connection.py  # Teste básico
python test_db.py         # Teste completo com tabelas
```

## 📊 Endpoints Disponíveis

### Health Checks
- `GET /` - Status da API
- `GET /health` - Health check simples
- `GET /ready` - Readiness check

### Ônibus (Bus)
- `GET /bus/` - Listar todos os ônibus
- `GET /bus/{id}` - Buscar ônibus por ID
- `POST /bus/{id}` - Criar ou buscar ônibus
- `PATCH /bus/{id}` - Atualizar ônibus
- `DELETE /bus/{id}` - Deletar ônibus

## 🐛 Troubleshooting

### Erro: "Connection refused"
```
✅ Solução: Verifique se o Cloud SQL Proxy está rodando
cloud_sql_proxy.exe totvs-colab5:us-east4:fretotvs --port=15432
```

### Erro: "no password supplied"
```
✅ Solução: Verifique se a senha está correta no .env
DATABASE_URL=postgresql+psycopg2://postgres:Postgres123!@localhost:15432/postgres
```

### Erro: "Instance is stopped"
```
✅ Solução: Iniciar a instância Cloud SQL
gcloud sql instances patch fretotvs --activation-policy ALWAYS
```

### Verificar status da instância
```bash
gcloud sql instances list
gcloud sql instances describe fretotvs --format="value(state)"
```

## 📁 Arquivos Importantes

- `.env` - Configurações de ambiente
- `core/database.py` - Configuração do banco
- `test_connection.py` - Teste básico de conexão
- `test_db.py` - Teste completo com tabelas
- `start_api.bat` - Script para iniciar tudo

## 🎯 Próximos Passos

1. ✅ Conexão com PostgreSQL funcionando
2. ✅ Tabelas sendo criadas automaticamente
3. ⏳ Implementar endpoints restantes
4. ⏳ Adicionar autenticação JWT
5. ⏳ Configurar deploy no Cloud Run
