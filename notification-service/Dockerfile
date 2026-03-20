# Build stage
FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
COPY tsconfig.json ./
COPY src ./src/
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl wget && rm -rf /var/lib/apt/lists/*
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
USER appuser
EXPOSE 3002
CMD ["sh", "-c", "export DATABASE_URL=$(echo $DATABASE_URL | sed 's|^jdbc:postgresql:|postgresql:|') && npx prisma db push --accept-data-loss && node dist/index.js"]
