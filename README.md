# Aula Abierta

**An open source learning platform for language academies.** Aula Abierta gives a school everything it needs to run its classes online or in person: a course catalog, classrooms, attendance, assignments, rubric-based grading, live sessions, family visibility and a game-like experience that keeps young learners coming back.

It was built for English academies for children and teens, but nothing in it is tied to one language or one school. Fork it, rename it, teach with it.

> Stack: **React 18 + Vite + TypeScript** (frontend) · **Laravel 11 + PostgreSQL** (REST API) · S3-compatible storage (Cloudflare R2, MinIO, AWS S3)

---

## What it can do

### For students
- **Personal dashboard** with upcoming tasks, classes and progress.
- **Classroom journey and star wall:** every classroom shows the learning path week by week, with stars and rewards for progress.
- **Tasks and submissions:** read the instructions, open the class materials, upload evidence and see the rubric before handing in.
- **Grades and certificate:** see every graded criterion with the teacher's feedback and open a printable, shareable achievement certificate.
- **Word Lab:** a spaced-repetition (Leitner-style) flashcard engine built from the vocabulary of each lesson. Words you miss come back sooner, words you know come back later.
- **Pronunciation studio:** hear each word read aloud with speech synthesis, record yourself with a live waveform, play it back and move to the next word.
- **Arena:** live quizzes that the teacher launches from class; students answer from their own device while the teacher reveals questions one at a time.
- **Class TV:** a curated library of learning videos per classroom.
- **Avatar, coins and shop:** an owl companion the learner can customize with cosmetics bought with coins earned in class.
- **Calendar and messages:** class schedule with links to live sessions, and a message board for each classroom.
- **Passwordless entry by QR:** teachers print or project a QR access pass so young children can join their classroom without typing credentials.

### For teachers (trainers)
- **Classroom toolkit** with in-class tools: student picker, countdown timer, team randomizer and noise meter.
- **Attendance** per class, with history.
- **Grading queue:** pending submissions across all classrooms, graded with rubrics. The score is computed for you (see the grade formula below).
- **Live quizzes (Arena):** create questions on the fly, reveal them one at a time and follow the answers as they come in.
- **Live sessions:** schedule a class session and generate a Google Meet link (requires Google service-account credentials on the server).
- **Reports:** printable PDF reports for grades and attendance.
- **Classroom messages** with students.

### For coordinators and admins
- **Programs, levels and course templates:** design a curriculum once (weeks, materials, tasks, rubrics), **freeze** it when it is approved and **clone** it to create a new version.
- **Classrooms from templates:** spin up a classroom from a template, assign a teacher, enroll students and customize its theme.
- **User management:** create users one by one or **bulk import** them from a spreadsheet, with role-based permissions.
- **Metrics dashboards** for coordinators and administrators.
- **Audit log:** a searchable record of sensitive actions, including every access to protected material.
- **Task reopening**, restricted to admins by policy.

### For families
- **Family dashboard:** parents and guardians see the progress, grades and upcoming work of each linked child.

### Platform-wide
- **Real-time updates** through a server-sent events stream, with polling for live quizzes.
- **In-app notifications** with read/unread state.
- **Installable and offline-friendly (PWA):** service worker with a cached app shell.
- **Command palette** for fast keyboard navigation.
- **Accessible, animated UI** that respects reduced-motion preferences.
- **Extensive role-based access control** (Spatie Permission + policies).

---

## Why use it

- **Built for kids, usable by adults.** Game mechanics (stars, coins, avatar, quizzes) are part of the core, not a plugin. Learners get instant feedback; teachers keep the pedagogy in their hands.
- **One system for the whole academy.** Curriculum, classrooms, attendance, grading, reports and parent communication live in the same place instead of five spreadsheets and three chat groups.
- **Reusable curriculum.** Templates can be frozen and cloned, so a course is authored once and taught many times with no copy-paste drift.
- **Consistent grading.** Rubrics with weighted criteria produce a transparent score and letter grade.
- **Protects your content.** Materials are served through short-lived signed URLs and can be marked as protected. Protected downloads carry a per-user forensic fingerprint, and every access is written to the audit log, so leaks can be traced.
- **Security enforced on the server.** Permissions live in policies and middleware, never only in hidden buttons.
- **Modern, boring, hireable stack.** Laravel, React, PostgreSQL and TypeScript, with a REST API you can build other clients on (mobile app, kiosk, integrations).
- **Self-hostable and open source (MIT).** Your students' data stays in your infrastructure.

---

## Roles

| Role | What they see |
|---|---|
| `student` | Dashboard, classrooms, tasks, grades, Word Lab, pronunciation, Arena, Class TV, shop, certificate |
| `teacher` (trainer) | Classrooms, toolkit, attendance, grading, reports, Arena, messages |
| `admin` (coordinator) | Programs, templates, classrooms, students, reports, metrics |
| `super_admin` | Everything above plus user management and the audit log |
| `family` | Read-only dashboard for each linked child |

---

## Architecture

```
aula-abierta-frontend/   React SPA (Vite, TypeScript, Tailwind, TanStack Query, Zustand)
aula-abierta-backend/    Laravel REST API (Sanctum auth, Spatie Permission, activity log)
```

- Layered backend: controllers → services → repositories, with API resources, form requests and policies.
- Feature-based frontend: `src/features/{student,teacher,coordinator,admin,family,...}`, each with its own API client, hooks and pages, plus a shared design system in `src/core`.
- Files (materials, avatars, evidence, covers) live in S3-compatible object storage, never in the database.
- PDF reports are generated with DomPDF, spreadsheets are handled with Laravel Excel.

### Design decisions worth knowing

- **The frontend never touches the database or storage directly.** All data flows through the API.
- **Protected material** is served only as short-lived signed URLs (5 minutes) generated server-side. The raw storage key (`storage_path`) is hidden in all model serialization.
- **Trainers** cannot call any download or template-copy endpoint, enforced by policies and middleware.
- **Audit log** records every access to `is_protected = true` materials through `MaterialService`.
- **Grade formula:** sum of criterion scores ÷ total max × 100 → letter (A+ ≥ 90, A ≥ 80, B ≥ 70, C < 70).

---

## Quick start

### Prerequisites
- Node.js 20+
- PHP 8.3+ and Composer
- PostgreSQL 15+
- An S3-compatible bucket (Cloudflare R2, MinIO, AWS S3) for file storage

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

Set these values in `.env` before seeding:

```
DB_DATABASE=aula_abierta
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
AWS_ACCESS_KEY_ID=...            # S3-compatible credentials
AWS_SECRET_ACCESS_KEY=...
AWS_ENDPOINT=https://<id>.r2.cloudflarestorage.com
AWS_BUCKET=aula-abierta
```

Run the tests with `php artisan test`.

### Frontend

```bash
cd aula-abierta-frontend
cp .env.example .env             # set VITE_API_BASE_URL
npm install
npm run dev                      # http://localhost:5173
```

**Fonts:** to use the display font, place `Freude-Bold.woff2` and `Freude-ExtraBold.woff2` in `public/fonts/` and uncomment the `@font-face` blocks in `src/styles/fonts.css`. Without them the app falls back to system fonts.

### Development users

The development seeders can create sample users for each role. Passwords are neither documented nor hardcoded: set the `AULA_SEED_*_PASSWORD` values in your local `.env` if you want predictable development access.

---

## Branding

The logo and mascot are simple placeholders. To use your own logo, edit `src/core/ui/Logo/Logo.tsx` (for example `<img src="/logo.svg" alt="Your school" />`) and, for illustrations, `src/core/ui/Mascot/Mascot.tsx`.

---

## Contributing

Issues and pull requests are welcome. Good places to start:

- Add internationalization: UI copy is currently hardcoded per component.
- Improve test coverage for the Arena and Word Lab.
- Add new gamification rewards or cosmetics.
- Write deployment guides (Docker, Fly.io, Railway, VPS).

## License

[MIT](LICENSE)
