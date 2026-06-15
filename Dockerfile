# =============================================================================
# YÌJÌNG OS: MULTI-STAGE DOCKER BUILD
# =============================================================================
# @description
# Implements a 3-stage build pipeline to minimize the final container footprint.
# Security is enforced by running the production server as a non-root user.
# =============================================================================

# -----------------------------------------------------------------------------
# STAGE 1: Dependency Resolution
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable pnpm via Corepack
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

# Bypass interactive CLI prompts during automated builds
ENV CI=true
RUN pnpm i --frozen-lockfile

# -----------------------------------------------------------------------------
# STAGE 2: Application Compilation
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV CI=true

# Executes the Next.js build process. 
# Pre-build scripts (e.g., theme extraction) are triggered automatically 
# via the package.json "build" directive.
RUN pnpm build

# -----------------------------------------------------------------------------
# STAGE 3: Production Server (Minimal Footprint)
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# [SECURITY]: Establish least-privilege execution environment
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Transfer only the compiled static assets and standalone binaries
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Downgrade privileges from root to the dedicated nextjs user
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]