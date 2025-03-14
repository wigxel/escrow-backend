FROM ubuntu:22.04

# Install Node.js and dependencies
RUN apt-get update && \
    apt-get install --yes --no-install-recommends \
    curl \
    gnupg \
    apt-transport-https \
    build-essential \
    ca-certificates && \
    curl --silent --location https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install --yes nodejs && \
    npm install -g pnpm && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./
COPY patches ./patches

# Install dependencies
RUN pnpm install # --frozen-lockfile

# Copy application code
COPY . .

# Build the application
RUN pnpm rebuild && pnpm run build

# Set environment variables
ENV PORT=8080
ENV NODE_ENV=production

# Expose the port
EXPOSE $PORT

# Start the application
CMD ["pnpm", "run", "start"]
