FROM php:8.3-cli-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip libpq-dev libzip-dev libpng-dev libjpeg62-turbo-dev \
        libfreetype6-dev libonig-dev libxml2-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_pgsql gd zip mbstring bcmath dom \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
WORKDIR /app
COPY aula-abierta-backend/ /app/
COPY docker/backend-entrypoint.sh /usr/local/bin/aula-entrypoint
COPY docker/bootstrap.php /usr/local/bin/aula-bootstrap.php
RUN mkdir -p storage/app/private storage/app/public storage/framework/cache/data \
        storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && composer install --no-interaction --prefer-dist \
    && chmod +x /usr/local/bin/aula-entrypoint

EXPOSE 8000
ENTRYPOINT ["sh", "/usr/local/bin/aula-entrypoint"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000", "--no-reload", "--tries=1"]
