FROM node:20-slim
WORKDIR /app
COPY app/package*.json ./
RUN npm ci --omit=dev
COPY app/. ./
ENV PORT=3000
ENV VAULT_PATH=/vault
ENV AUTH_USER=kindle
ENV AUTH_PASS=changeme
ENV SESSION_SECRET=replace-me
EXPOSE 3000
CMD ["/bin/bash", "/app/docker_entrypoint.sh"]
