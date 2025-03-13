# docker/Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /server

# Copy package.json and package-lock.json
COPY ../package.json ../package-lock.json ./



# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm install  # <-- Use install instead of ci to avoid missing dependencies
COPY client/. .
RUN npm run build


# Return to main directory
WORKDIR /app

# Production image
FROM node:18-alpine

# Set environment variables
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Copy built artifacts from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/build ./client/build

# Expose port
EXPOSE 5000

# Start command
CMD ["node", "server/index.js"]