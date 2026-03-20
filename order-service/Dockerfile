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
EXPOSE 3001
CMD ["sh", "-c", "export DB_HOST=$(echo $DATABASE_URL | awk '{print $1}' | sed -E 's|.*://||' | cut -d/ -f1) && export DATABASE_URL=\"postgresql://$DATABASE_USER:$DATABASE_PASSWORD@$DB_HOST/order_db?schema=public&sslmode=require\" && echo \"Prisma connecting to $DB_HOST/order_db\" && npx prisma db push --accept-data-loss && node dist/index.js"]
