FROM node:22-bookworm-slim AS builder

LABEL description="SenNet Portal UI"

ARG HOST_GID
ARG HOST_UID

# Change to directory that contains the Dockerfile
WORKDIR /usr/src/app

# Update the package list and install git
RUN apt-get update -y && \
    apt-get dist-upgrade -y && \
    apt-get install git -y && \
    apt-get install curl -y

# Create the non-root codcc user
RUN groupadd -g $HOST_GID codcc && \
    useradd -m -u $HOST_UID -g codcc -s /bin/bash codcc

# Copy package.json and update npm
COPY --chown=codcc:codcc ./src .
COPY --chmod=755 ./entrypoint.sh /usr/local/bin/entrypoint.sh

# Update npm, install dependencies, and build the project
ENV NODE_ENV=production
RUN npm install -g npm@latest && \
    npm install --include=dev --no-audit --no-fund && \
    npm run sass-build && \
    npm run build && \
    npm prune --production

# Clean up
RUN apt-get purge -y git && \
    apt-get auto-remove -y

USER codcc

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
