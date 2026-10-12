#!/bin/sh
set -eu
cd /app

mkdir -p storage/app/private storage/app/public storage/framework/cache/data \
    storage/framework/sessions storage/framework/views storage/logs storage/docker bootstrap/cache

# Synchronize the dependency volume when composer.lock changes.
composer install --no-interaction --prefer-dist

# Keep the key in a volume, available to both the server and compose exec.
# Laravel's Docker environment path never reads or rewrites the host's .env.
if [ -n "${AULA_DOCKER_APP_KEY:-}" ]; then
    printf '%s' "$AULA_DOCKER_APP_KEY" > storage/docker/app-key
elif [ ! -s storage/docker/app-key ]; then
    php -r 'echo "base64:".base64_encode(random_bytes(32));' > storage/docker/app-key
fi
printf 'APP_KEY="%s"\n' "$(cat storage/docker/app-key)" > storage/docker/.env
chmod 600 storage/docker/app-key storage/docker/.env

php artisan config:clear --no-ansi
php artisan migrate --force --no-ansi
php /usr/local/bin/aula-bootstrap.php
php artisan storage:link --no-ansi
exec "$@"
