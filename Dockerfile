# Dockerfile
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy lockfile and workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json tsconfig.json ./
COPY attached_assets ./attached_assets
COPY lib ./lib
COPY artifacts/wheatrisk/package.json ./artifacts/wheatrisk/package.json
COPY artifacts/api-server/package.json ./artifacts/api-server/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy remaining source code
COPY artifacts/wheatrisk ./artifacts/wheatrisk
COPY artifacts/api-server ./artifacts/api-server

# Build workspace packages
RUN pnpm --filter @workspace/api-server run build
RUN pnpm --filter @workspace/wheatrisk run build

# Production runner image
FROM node:22-slim AS runner
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY --from=base /app /app

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["pnpm", "--filter", "@workspace/api-server", "run", "start"]
