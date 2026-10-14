# CogniFlip production image (Dokploy / any Docker host). D-017.
# Build: docker build -t cogniflip .
# Run:   docker run -p 3000:3000 --env-file <prod env> cogniflip
FROM node:24.18.1-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
# Dependency install scripts are not needed (no native builds).
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
# prebuild copies the Pyodide and sql.js runtimes into public/.
RUN npm run build

FROM node:24.18.1-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
COPY --from=build --chown=node:node /app ./
USER node
EXPOSE 3000
# Applies pending migrations (idempotent), then starts the server.
CMD ["sh", "scripts/docker-start.sh"]
