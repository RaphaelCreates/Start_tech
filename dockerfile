# Instalação das dependências
FROM node:18-alpine AS deps
WORKDIR /app

# Copia package.json e package-lock.json para o contêiner
COPY package.json package-lock.json* ./

# Instala as dependências  para CI/CD
RUN npm ci

# Build da aplicação
FROM node:18-alpine AS builder
WORKDIR /app

# Copia as dependências do estágio anterior
COPY --from=deps /app/node_modules ./node_modules

# Copia o restante do código da aplicação
COPY . .

# Desativa a telemetria do Next.js durante o build
ENV NEXT_TELEMETRY_DISABLED 1

# Executa o script de build definido no package.json
RUN npm run build

# Imagem final de produção
FROM node:18-alpine AS runner
WORKDIR /app

# Define o ambiente como produção
ENV NODE_ENV=production
# Desativa a telemetria do Next.js na execução
ENV NEXT_TELEMETRY_DISABLED 1

# Cria um usuário e grupo não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia os arquivos da saída 'standalone' gerada no estágio de build
# server.js e a pasta .next/standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copia a pasta public e os assets estáticos
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Define o usuário para executar a aplicação
USER nextjs

# Expõe a porta que o Next.js utiliza
EXPOSE 3000

# Define a variável de ambiente PORT que o Cloud Run espera
ENV PORT 3000

# Comando para iniciar o servidor Next.js
CMD ["node", "server.js"]