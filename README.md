# Aula Abierta — LMS Platform

Full-stack LMS: React 18 + Vite frontend · Laravel 11 REST API backend.

---

## Quick start

### Prerequisites
- Node.js 20+, pnpm or npm
- PHP 8.3+, Composer
- PostgreSQL 15+
- (For storage) Cloudflare R2 bucket with credentials

---

### Frontend

```bash
cd aula-abierta-frontend
cp .env.example .env          # set VITE_API_BASE_URL
npm install
npm run dev                   # http://localhost:5173
```

**Fonts:** Place `Freude-Bold.woff2` and `Freude-ExtraBold.woff2` in `public/fonts/` then uncomment the `@font-face` blocks in `src/styles/fonts.css`.

---

### Backend

```bash
cd aula-abierta-backend
cp .env.example .env
composer install

php artisan key:generate
php artisan migrate
php artisan db:seed

php artisan serve                # http://localhost:8000
```

**Required .env values before seeding:**
```
DB_DATABASE=aula_abierta
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
AWS_ACCESS_KEY_ID=...           # Cloudflare R2
AWS_SECRET_ACCESS_KEY=...
AWS_ENDPOINT=https://<id>.r2.cloudflarestorage.com
AWS_BUCKET=aula-abierta
```

---

## Development seed users

Development seeders can create sample users, but passwords are not documented or hardcoded.
Set `AULA_SEED_*_PASSWORD` values locally if you need predictable development access.

---

## Architecture notes

- **Frontend never accesses DB or storage directly.** All data flows through the API.
- **Protected material** is served only as short-lived signed URLs (5 min) generated server-side. The raw R2 key (`storage_path`) is hidden in all model serialization.
- **Task reopening** is restricted to `admin` / `super_admin` roles at the policy layer (not just UI).
- **Trainers** cannot call any download or template-copy endpoint — enforced via policies and middleware, not button visibility.
- **AuditLog** records every access to `is_protected = true` materials via the `MaterialService`.
- **Grade formula:** sum of criterion scores ÷ total max × 100 → letter (A+ ≥ 90, A ≥ 80, B ≥ 70, C < 70).

---

## Adding the real logo

Replace the SVG placeholder in `src/core/ui/Logo/Logo.tsx` with `<img src="/logo.svg" alt="Aula Abierta" />` once the real asset is available. No other files need changing.
