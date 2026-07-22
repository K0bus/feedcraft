FROM node:22-alpine AS base
RUN apk add --no-cache openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm db:generate
RUN pnpm --filter @feedcrafter/shared build
RUN pnpm --filter @feedcrafter/database build
RUN pnpm --filter @feedcrafter/worker build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app /app

CMD ["pnpm", "--filter", "@feedcrafter/worker", "start"]
