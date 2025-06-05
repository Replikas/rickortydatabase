# Multi-stage build for React + Node.js application
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies for both client and server
COPY package*.json ./
RUN npm ci --only=production

# Copy client package.json and install dependencies
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm ci

# Copy server package.json and install dependencies
WORKDIR /app
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci

# Build stage for client
FROM base AS build-client
WORKDIR /app

# Copy all source code
COPY . .

# Build the React application
WORKDIR /app/client
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy server dependencies and source
COPY --chown=nodejs:nodejs server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production && npm cache clean --force

# Copy server source code
COPY --chown=nodejs:nodejs server/ .

# Copy built client files
COPY --from=build-client --chown=nodejs:nodejs /app/client/build ./public

# Copy root package.json and scripts
WORKDIR /app
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs scripts/ ./scripts/

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "server/server.js"]