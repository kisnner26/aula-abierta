FROM node:22-bookworm-slim
WORKDIR /app
COPY aula-abierta-frontend/package*.json ./
RUN npm ci --no-fund \
    && sha256sum package-lock.json | cut -d ' ' -f 1 > node_modules/.aula-lock-hash
COPY aula-abierta-frontend/ ./
COPY docker/frontend-entrypoint.sh /usr/local/bin/aula-entrypoint
EXPOSE 5173
ENTRYPOINT ["sh", "/usr/local/bin/aula-entrypoint"]
CMD ["npm", "run", "dev", "--", "--host=0.0.0.0", "--port=5173", "--strictPort"]
