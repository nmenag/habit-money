# Use the Node version matching the project's .tool-versions
FROM node:25.2.1-slim

# Install system dependencies that might be needed for git, SSH, or curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    openssh-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies (respecting pnpm-lock.yaml)
RUN corepack enable && pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Expose the default Metro bundler port
EXPOSE 8081

# Expose Expo dev tools / debugging ports if needed
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Environment variables to ensure Expo runs properly inside the container
ENV PORT=8081
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

# Start Metro bundler by default
CMD ["pnpm", "start"]
