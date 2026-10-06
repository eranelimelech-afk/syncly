# DESK — Prompt Terminal
# Small, production-ready image. No build step; just the Node runtime + the SDK.
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install dependencies first (better layer caching).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# App source.
COPY server.js ./
COPY public ./public

# The server reads PORT from the environment (defaults to 3000).
EXPOSE 3000

# Run as the built-in non-root user.
USER node

CMD ["node", "server.js"]
