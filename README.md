# FretoTVS Backend

Backend da aplicação FretoTVS desenvolvido com FastAPI e PostgreSQL no Cloud Run.

## 🚀 Funcionalidades

- API REST com FastAPI
- Autenticação JWT
- Gerenciamento de ônibus, linhas e horários
- Integração com Cloud SQL via Cloud SQL Auth Proxy
- Health checks automáticos

## 🏗️ Arquitetura

### Ambiente Local
- Usa SQLite para desenvolvimento
- Sem necessidade de proxy
- Configuração simplificada

### Cloud Run (Produção)
- PostgreSQL no Cloud SQL
- Cloud SQL Auth Proxy para conexão segura
- Configuração automática via entrypoint

## 🐳 Docker

### Build da Imagem
```bash
docker build -t fretotvs-backend .
```

### Execução Local
```bash
# Desenvolvimento (sem banco)
docker run -p 8080:8080 fretotvs-backend

# Com variáveis de produção
docker run -p 8080:8080 \
  -e K_SERVICE=cloud-run \
  -e DB_USER=postgres \
  -e DB_PASS=your_password \
  -e DB_NAME=fretotvs \
  -e INSTANCE_CONNECTION_NAME=your-project:region:instance \
  fretotvs-backend
```

## ☁️ Deploy no Cloud Run

### Pré-requisitos
1. Projeto GCP configurado
2. Cloud SQL instance criada
3. Service account com permissões para Cloud SQL

### Comando de Deploy
```bash
gcloud run deploy fretotvs-backend \
  --source . \
  --platform managed \
  --region us-east4 \
  --allow-unauthenticated \
  --set-env-vars="DB_USER=postgres,DB_PASS=your_password,DB_NAME=fretotvs,INSTANCE_CONNECTION_NAME=your-project:region:instance" \
  --add-cloudsql-instances your-project:region:instance
```

## 🔧 Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|---------|
| `PORT` | Porta do servidor | `8080` |
| `K_SERVICE` | Indica ambiente Cloud Run | - |
| `DB_USER` | Usuário do PostgreSQL | `postgres` |
| `DB_PASS` | Senha do PostgreSQL | - |
| `DB_NAME` | Nome do banco | `postgres` |
| `INSTANCE_CONNECTION_NAME` | Nome da instância Cloud SQL | - |

## 🏥 Health Checks

- `GET /` - Status básico da API
- `GET /health` - Health check simples
- `GET /ready` - Readiness check

## 🔒 Segurança

- Cloud SQL Auth Proxy para conexões seguras
- Autenticação JWT
- CORS configurado
- Usuário não-root no container

## 📊 Logs

O container gera logs detalhados:
- Inicialização do proxy
- Conexão com banco
- Status da aplicação
- Erros de configuração

## 🐛 Troubleshooting

### Container não inicia
1. Verificar logs do Cloud Run
2. Confirmar variáveis de ambiente
3. Verificar permissões da service account

### Erro de conexão com banco
1. Verificar se Cloud SQL instance está ativa
2. Confirmar INSTANCE_CONNECTION_NAME
3. Verificar credenciais do banco

### Timeout no startup
1. Aumentar timeout no Cloud Run
2. Verificar conectividade com Cloud SQL
3. Confirmar configuração do proxy
