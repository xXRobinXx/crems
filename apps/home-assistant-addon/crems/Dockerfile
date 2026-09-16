FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /src
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/core ./packages/core
COPY apps/web ./apps/web
COPY apps/bridge ./apps/bridge
RUN pnpm install --frozen-lockfile && pnpm build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /src/apps/bridge/dist ./bridge
COPY --from=build /src/apps/bridge/data ./data
COPY --from=build /src/apps/web/dist ./web
COPY --from=build /src/node_modules ./node_modules
COPY --from=build /src/packages/core/package.json ./packages/core/package.json
COPY --from=build /src/packages/core/dist ./packages/core/dist
COPY apps/home-assistant-addon/crems/run.mjs ./run.mjs
ENV CREMS_BRIDGE_HOST=0.0.0.0 CREMS_BRIDGE_PORT=8099 CREMS_WEB_ROOT=/app/web HASS_URL=http://supervisor/core
EXPOSE 8099
CMD ["node", "/app/run.mjs"]
