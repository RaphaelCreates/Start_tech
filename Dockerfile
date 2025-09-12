FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
# If you use yarn, uncomment the next line:
# COPY yarn.lock ./
# If you use pnpm, uncomment the next line:
# COPY pnpm-lock.yaml ./
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_BASE_URL=https://api-backend-506595925688.us-east4.run.app
RUN npm ci
COPY . .
# API URL será definida via variável de ambiente no Cloud Run
RUN npx next build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_BASE_URL=https://api-backend-506595925688.us-east4.run.app
# API URL será definida via variável de ambiente no Cloud Run
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
USER node
EXPOSE 3000
# Use the npm start script so the container respects $PORT provided by Cloud Run
CMD ["npm", "start"]
