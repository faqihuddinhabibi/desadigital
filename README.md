# Desa Digital by Fibernode

![Fibernode Logo](./frontend/public/logo-full-dark.png)

**More Than Internet—A True Partner**

CCTV Monitoring System untuk pengelolaan dan pemantauan kamera keamanan di lingkungan desa.

## Tech Stack

### Backend
- **Runtime:** Node.js 22+
- **Framework:** Express.js 5
- **Database:** PostgreSQL 16 + Drizzle ORM
- **Auth:** JWT dengan refresh token
- **Logging:** Pino
- **Validation:** Zod

### Frontend
- **Framework:** React 19 + TanStack Router + TanStack Query
- **Styling:** TailwindCSS 4
- **Icons:** Lucide React
- **Components:** shadcn/ui
- **Video Player:** HLS.js

## Quick Start

### Prerequisites
- Node.js 22+
- PostgreSQL 16+
- Docker & Docker Compose (optional)

### Development

```bash
# Install dependencies
npm install

# Setup environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Run database migrations
npm run db:migrate

# Seed database with default data
npm run db:seed

# Start development servers
npm run dev:backend   # Backend on http://localhost:4000
npm run dev:frontend  # Frontend on http://localhost:3000
```

### Using Docker

```bash
docker compose -f docker/docker-compose.dev.yml up -d
```

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Superadmin | admin@desadigital.id | Admin123! |

## Project Structure

```
desa-digital/
├── backend/          # Express.js API server
├── frontend/         # React SPA
├── docker/           # Docker configurations
└── README.md
```

## License

MIT © Fibernode
