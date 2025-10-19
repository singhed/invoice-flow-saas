FROM node:20-alpine AS builder

WORKDIR /app

# Create a minimal workspace definition for build context
RUN printf "packages:\n  - \"services/*\"\n  - \"packages/*\"\n" > pnpm-workspace.yaml

COPY package.json pnpm-lock.yaml ./
COPY packages/shared ./packages/shared
COPY services/api-gateway ./services/api-gateway

RUN npm install -g pnpm@8.15.8
RUN pnpm install --no-frozen-lockfile

# Build shared workspace to generate type declarations
RUN pnpm --filter "@invoice-saas/shared" build

WORKDIR /app/services/api-gateway
RUN pnpm build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/services/api-gateway/dist ./dist
COPY --from=builder /app/services/api-gateway/package.json ./
COPY --from=builder /app/services/api-gateway/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER node

CMD ["node", "dist/index.js"]
