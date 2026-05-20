# Strapi 5 — local dashboard image.
# Runs in `develop` mode so the Content-Type Builder is available in the admin UI.
FROM node:22-bookworm-slim

# Toolchain for native modules (better-sqlite3, sharp) in case no prebuilt
# binary is available for this platform.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 build-essential \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/app

# Install dependencies first so this layer is cached across source changes.
COPY package.json ./
RUN npm install

# App source. At runtime ./app is bind-mounted over this (see docker-compose.yml),
# so the COPY mainly keeps the image self-contained.
COPY . .

EXPOSE 1337

CMD ["npm", "run", "develop"]
