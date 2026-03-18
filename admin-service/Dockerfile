FROM node:20-slim as builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src/

# Build TypeScript to JS
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Only copy production dependencies
COPY package*.json ./
RUN apt-get update -y && apt-get install -y wget
RUN npm install --only=production

# Copy built code
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3003

# Use the compiled JavaScript instead of ts-node in production
CMD ["node", "dist/index.js"]
