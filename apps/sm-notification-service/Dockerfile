# Stage 1: Builder
FROM node:24-alpine AS builder
WORKDIR /app

# Copy shared package first
COPY packages/shared ./packages/shared

# Copy this service's package.json
COPY apps/sm-notification-service/package.json ./package.json

# Remove @sms/shared from dependencies using Node.js (proper JSON handling)
RUN node -e "const p=require('./package.json'); delete p.dependencies['@sms/shared']; require('fs').writeFileSync('./package.json', JSON.stringify(p, null, 2));"

# Install dependencies
RUN npm install

# Copy shared package into node_modules
RUN mkdir -p node_modules/@sms && cp -r packages/shared node_modules/@sms/shared

# Copy service source code
COPY apps/sm-notification-service/ ./

# Stage 2: Production
FROM node:24-alpine AS runner
WORKDIR /app

# Copy from builder
COPY --from=builder /app ./

# Expose port (sm-notification-service runs on 5008)
EXPOSE 5008

# Start the server
CMD ["node", "index.js"]
