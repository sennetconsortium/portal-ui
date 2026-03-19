FROM node:22-bookworm-slim AS builder

LABEL description="SenNet Portal UI"

ARG HOST_GID
ARG HOST_UID

# Set working directory
WORKDIR /usr/src/app

# System dependencies
RUN apt-get update -y && \
    apt-get dist-upgrade -y && \
    apt-get install -y git curl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g $HOST_GID codcc && \
    useradd -m -u $HOST_UID -g codcc -s /bin/bash codcc

# Enable corepack and activate pnpm
RUN corepack enable && \
    corepack prepare pnpm@latest --activate

# Copy source
COPY --chown=codcc:codcc ./src .
COPY --chmod=755 ./entrypoint.sh /usr/local/bin/entrypoint.sh

# Production environment
ENV NODE_ENV=production

# Install deps and build using pnpm
RUN pnpm install --prod && \
    pnpm run sass-build && \
    pnpm run build

# Remove git after build
RUN apt-get purge -y git && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

USER codcc

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
