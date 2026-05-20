# Next.js website — dev-mode container.
# docker-compose bind-mounts the project over /app for hot reload; this image
# just provides Node + an installed node_modules.
FROM node:22-bookworm-slim

WORKDIR /app

# Install dependencies first so this layer is cached across source changes.
COPY package.json package-lock.json ./
RUN npm ci

# App source — kept so the image can run standalone; the compose bind mount
# shadows it at runtime.
COPY . .

EXPOSE 3000

# -H 0.0.0.0 so the dev server is reachable from outside the container.
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
