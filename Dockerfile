FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y jq && npm install -g yq && rm -rf /var/lib/apt/lists/*
COPY app/package*.json ./
RUN npm ci --omit=dev
COPY app/. ./
ENV PORT=3000
ENV VAULT_PATH=/vault
ENV AUTH_USER=kindle
ENV AUTH_PASS=changeme
EXPOSE 3000
CMD ["/bin/bash", "/app/docker_entrypoint.sh"]
