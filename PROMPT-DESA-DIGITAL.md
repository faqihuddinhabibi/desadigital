# PROMPT: Desa Digital by Fibernode - CCTV Monitoring System

## Ringkasan Proyek

Bangun website monitoring CCTV bernama **"Desa Digital by Fibernode"** dengan tampilan minimal, mendukung mode dark dan light. Sistem ini memungkinkan superadmin mengelola multi-desa, setiap desa memiliki beberapa RT, dan setiap RT memiliki warga yang terdaftar.

---

## Tech Stack (Sama dengan FileConverter)

### Backend
- **Runtime:** Node.js 24
- **Framework:** Express.js 5
- **Database:** PostgreSQL 16 + Drizzle ORM
- **Functional:** Effect-TS
- **Auth:** JWT dengan refresh token
- **Logging:** Pino
- **Validation:** Zod
- **Testing:** Vitest + Supertest
- **Dokumentasi API:** Swagger/OpenAPI
- **Catatan:** Tidak menggunakan Sentry

### Frontend
- **Framework:** React 19 + TanStack Router + TanStack Query
- **Styling:** TailwindCSS 4
- **Icons:** Lucide React
- **Components:** shadcn/ui
- **Theme:** Dark/Light mode toggle
- **State:** TanStack Query untuk server state
- **Video Player:** HLS.js untuk streaming CCTV
- **Testing:** Vitest

### Streaming CCTV
- **Relay:** FFmpeg (paling ringan dan stabil)
- **Protokol Input:** RTSP dari CCTV
- **Protokol Output:** HLS (HTTP Live Streaming)
- **Player:** HLS.js (native browser support, low memory)

### DevOps
- **Container:** Docker + Docker Compose
- **CI/CD:** GitHub Actions (lint, test, build, semantic release, push image)
- **Registry:** GitHub Container Registry (ghcr.io)
- **Auto-update:** Watchtower
- **Domain:** Custom domain langsung (tanpa Cloudflare Tunnel)

---

## Struktur Role dan Permission

### 1. Superadmin
- Mengelola semua data (CRUD penuh)
- Membuat dan mengelola **Desa** (area)
- Membuat dan mengelola **RT** (sub-area) dalam desa
- Membuat akun **Admin RT** dan assign ke RT tertentu
- Membuat akun **Warga** dan assign ke RT tertentu
- Menambah, edit, hapus **Camera** dan assign ke RT tertentu
- Melihat semua CCTV di semua desa
- Melihat log aktivitas semua user

### 2. RT (Admin)
- Melihat semua CCTV yang ada di RT-nya
- Menambah camera baru ke RT-nya sendiri
- Melihat daftar warga di RT-nya
- Tidak bisa mengelola desa, RT lain, atau user di RT lain

### 3. Warga (User)
- Hanya bisa melihat CCTV yang ada di RT-nya
- Tidak bisa menambah atau mengedit apapun
- Tidak bisa melihat CCTV di RT lain

---

## Struktur Hierarki Data

```
Superadmin
├── Desa A
│   ├── RT 01
│   │   ├── Admin RT 01
│   │   ├── Camera 1
│   │   ├── Camera 2
│   │   ├── Warga 1
│   │   └── Warga 2
│   └── RT 02
│       ├── Admin RT 02
│       ├── Camera 3
│       └── Warga 3
└── Desa B
    └── RT 01
        ├── Admin RT 01
        ├── Camera 4
        └── Warga 4
```

---

## Database Schema (Drizzle ORM)

### Enums
```typescript
export const userRoleEnum = pgEnum('user_role', ['superadmin', 'admin_rt', 'warga']);
export const cameraStatusEnum = pgEnum('camera_status', ['online', 'offline', 'maintenance']);
```

### Tables

#### 1. users
```typescript
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  rtId: uuid('rt_id').references(() => rts.id, { onDelete: 'set null' }), // null untuk superadmin
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

#### 2. desas (Area)
```typescript
export const desas = pgTable('desas', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(), // Kode desa, misal: "DSA001"
  address: text('address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

#### 3. rts (Sub-Area)
```typescript
export const rts = pgTable('rts', {
  id: uuid('id').defaultRandom().primaryKey(),
  desaId: uuid('desa_id').notNull().references(() => desas.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(), // Contoh: "RT 01"
  rtNumber: integer('rt_number').notNull(),
  rwNumber: integer('rw_number'), // Opsional jika ada RW
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

#### 4. cameras
```typescript
export const cameras = pgTable('cameras', {
  id: uuid('id').defaultRandom().primaryKey(),
  rtId: uuid('rt_id').notNull().references(() => rts.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  rtspUrl: varchar('rtsp_url', { length: 500 }).notNull(), // URL RTSP camera
  hlsUrl: varchar('hls_url', { length: 500 }), // URL HLS setelah di-convert
  location: varchar('location', { length: 255 }), // Lokasi fisik camera
  status: cameraStatusEnum('status').default('offline').notNull(),
  lastOnlineAt: timestamp('last_online_at', { withTimezone: true }),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

#### 5. refresh_tokens (dengan device fingerprint)
```typescript
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 500 }).notNull().unique(),
  // Device fingerprint untuk prevent token theft
  userAgent: varchar('user_agent', { length: 500 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ([
  index('idx_refresh_tokens_user_id').on(table.userId),
  index('idx_refresh_tokens_expires').on(table.expiresAt),
]));
```

#### 6. activity_logs (Untuk audit)
```typescript
export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(), // 'login', 'view_camera', 'create_user', dll
  resource: varchar('resource', { length: 100 }), // 'camera', 'user', 'desa', dll
  resourceId: uuid('resource_id'),
  metadata: jsonb('metadata'), // Data tambahan
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

#### 7. login_attempts (Untuk brute force protection)
```typescript
export const loginAttempts = pgTable('login_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  success: boolean('success').notNull(),
  userAgent: varchar('user_agent', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ([
  index('idx_login_attempts_email_created').on(table.email, table.createdAt),
  index('idx_login_attempts_ip_created').on(table.ipAddress, table.createdAt),
]));
```

---

## API Endpoints

### Auth
```
POST   /api/auth/login           - Login dengan email/password
POST   /api/auth/refresh         - Refresh access token
POST   /api/auth/logout          - Logout (invalidate refresh token)
GET    /api/auth/me              - Get current user profile
```

### Users (Superadmin only, kecuali GET /me)
```
GET    /api/users                - List semua user (dengan filter role, rt)
POST   /api/users                - Buat user baru
GET    /api/users/:id            - Get user by ID
PATCH  /api/users/:id            - Update user
DELETE /api/users/:id            - Soft delete user (set isActive = false)
```

### Desas (Superadmin only)
```
GET    /api/desas                - List semua desa
POST   /api/desas                - Buat desa baru
GET    /api/desas/:id            - Get desa by ID (include RTs)
PATCH  /api/desas/:id            - Update desa
DELETE /api/desas/:id            - Hapus desa
```

### RTs (Superadmin only)
```
GET    /api/rts                  - List semua RT (dengan filter desa)
POST   /api/rts                  - Buat RT baru
GET    /api/rts/:id              - Get RT by ID (include cameras)
PATCH  /api/rts/:id              - Update RT
DELETE /api/rts/:id              - Hapus RT
```

### Cameras
```
GET    /api/cameras              - List cameras (filtered by permission)
POST   /api/cameras              - Tambah camera (superadmin/admin_rt)
GET    /api/cameras/:id          - Get camera by ID
PATCH  /api/cameras/:id          - Update camera (superadmin/admin_rt)
DELETE /api/cameras/:id          - Hapus camera (superadmin only)
GET    /api/cameras/:id/stream   - Get streaming URL untuk camera
```

### Dashboard
```
GET    /api/dashboard/stats      - Statistik (jumlah desa, rt, camera, user)
```

---

## Halaman Frontend

### 1. Public
- `/login` - Halaman login (ini adalah halaman awal, tidak ada company profile)
- **Tidak ada halaman register** - semua akun dibuat oleh superadmin
- **Tidak ada landing page/company profile** - langsung ke login

### 2. Protected (Semua Role)
- `/` - Dashboard dengan grid CCTV (sesuai permission)
- `/cameras/:id` - Fullscreen view single camera
- `/profile` - Edit profil sendiri (nama, password)

### 3. Admin RT Only
- `/my-cameras` - Kelola camera di RT-nya
- `/my-residents` - Lihat daftar warga di RT-nya

### 4. Superadmin Only
- `/admin/desas` - CRUD Desa
- `/admin/rts` - CRUD RT
- `/admin/users` - CRUD User
- `/admin/cameras` - CRUD semua Camera
- `/admin/logs` - Activity logs

---

## Fitur UI/UX (MENARIK)

### Branding - Fibernode

#### Logo Assets
```
/public/
├── logo-full-dark.png    # Logo lengkap untuk dark mode (putih)
├── logo-full-light.png   # Logo lengkap untuk light mode (hitam)
├── logo-icon.png         # Hexagon F merah (untuk favicon, sidebar collapsed)
├── favicon.ico           # 16x16, 32x32 dari hexagon F
└── apple-touch-icon.png  # 180x180 hexagon F
```

#### Penggunaan Logo
- **Header (expanded):** Logo full dengan tagline "More Than Internet—A True Partner"
- **Header (mobile/collapsed):** Hexagon F icon saja
- **Login page:** Logo full di atas form
- **Favicon:** Hexagon F merah

### Design System

#### Color Palette (Biru sebagai Primary)
```css
/* Brand Colors */
--fibernode-red: hsl(358 87% 52%);     /* #ED1C24 - Logo only */
--primary-blue: hsl(217 91% 60%);      /* #3B82F6 - UI Primary */
--primary-blue-hover: hsl(217 91% 50%);

/* Light Mode */
--background: hsl(0 0% 100%);           /* White */
--foreground: hsl(222 47% 11%);         /* Dark blue-gray */
--primary: hsl(217 91% 60%);            /* Blue - UI Primary */
--primary-foreground: hsl(0 0% 100%);   /* White text on blue */
--muted: hsl(210 40% 96%);
--muted-foreground: hsl(215 16% 47%);
--accent: hsl(142 76% 36%);             /* Green untuk online status */
--destructive: hsl(0 84% 60%);          /* Red untuk error/offline */
--border: hsl(214 32% 91%);
--card: hsl(0 0% 100%);

/* Dark Mode */
--background: hsl(222 47% 11%);         /* Dark blue-gray */
--foreground: hsl(210 40% 98%);         /* Off-white */
--primary: hsl(217 91% 65%);            /* Blue (brighter for dark) */
--muted: hsl(217 33% 17%);
--muted-foreground: hsl(215 20% 65%);
--border: hsl(217 33% 25%);
--card: hsl(222 47% 13%);
```

**Catatan Warna:**
- Logo Fibernode tetap merah sesuai brand asli
- UI/Button menggunakan **biru** sebagai primary
- Merah hanya untuk status error/offline

#### Typography
- Font: **Inter** (system font fallback untuk performa)
- Heading: Semi-bold, tracking-tight
- Body: Regular, leading-relaxed
- Tagline: Italic, lighter weight (seperti di logo)

### Theme
- Default: System preference (prefers-color-scheme)
- Toggle: Sun/Moon icon dengan smooth transition
- Persist: localStorage dengan key `theme`
- Transition: 200ms ease untuk semua color changes

### Layout

#### Desktop (>1024px)
- **Sidebar:** Fixed 240px, collapsible ke 64px (icon only)
- **Header:** Sticky, height 64px
- **Main:** Fluid dengan max-width 1440px

#### Mobile (<768px)
- **Sidebar:** Hidden, slide-in dari kiri saat hamburger di-tap
- **Header:** Sticky dengan hamburger menu
- **Bottom Nav:** Fixed bottom untuk quick access (Dashboard, Cameras, Profile)

### Login Page
- Centered card dengan max-width 400px
- Background: Subtle gradient (dark mode: near black, light mode: light gray)
- **Logo Fibernode full** di atas form (switch sesuai theme)
- Judul: "Desa Digital" dengan subtitle "Monitoring CCTV"
- Form: Email + Password + Remember me checkbox
- Button: Background Blue (#3B82F6)
- Error state: Shake animation + red border
- Loading state: Button dengan spinner

### Dashboard - CCTV Grid

#### Grid Layout
```css
/* Responsive grid */
grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
gap: 1rem;
```

#### Camera Card States
1. **Loading:** Skeleton dengan shimmer effect
2. **Online:** Green dot indicator, live thumbnail
3. **Offline:** Gray overlay, "Camera Offline" text, last seen time
4. **Error:** Red border, retry button

#### Camera Card Interactions
- Hover: Slight scale (1.02) + shadow elevation
- Click: Expand ke fullscreen modal
- Long press (mobile): Show quick actions menu

### Fullscreen Camera View
- Dark overlay background
- Video centered dengan max 16:9 ratio
- Controls: Close (X), Fullscreen toggle, Volume (muted default)
- Swipe left/right untuk camera sebelum/sesudah (mobile)
- Keyboard: ESC untuk close, Arrow keys untuk navigate

### Components (shadcn/ui)
- **Button:** Primary, Secondary, Ghost, Destructive variants
- **Input:** With label, error state, helper text
- **Select:** Searchable untuk list panjang (desa, RT)
- **Dialog:** Untuk confirm actions, forms
- **Table:** Sortable, dengan pagination
- **Card:** Untuk camera thumbnails
- **Toast:** Bottom-right, auto-dismiss 5s
- **Skeleton:** Untuk loading states
- **Badge:** Untuk status (Online/Offline/Maintenance)

### Micro-interactions
- Button press: Scale down 0.98
- Toast appear: Slide in dari kanan
- Modal open: Fade + scale from 0.95
- Theme toggle: Icon rotate 180°
- Sidebar collapse: Smooth width transition

### Accessibility (a11y)
- Semua interactive elements punya focus ring
- ARIA labels untuk icon-only buttons
- Keyboard navigation: Tab order logical
- Color contrast ratio minimal 4.5:1
- Screen reader friendly untuk camera status

### Empty States
- No cameras: Ilustrasi + "Belum ada camera" + CTA button
- No results: "Tidak ditemukan" + clear filter button
- Error: Friendly message + retry button

---

## Streaming CCTV - Arsitektur

### Arsitektur: FFmpeg + HLS (Dipilih karena paling ringan & stabil)
```
CCTV (RTSP) --> FFmpeg --> HLS Files (.m3u8 + .ts) --> Express Static --> Browser (HLS.js)
```

**Keunggulan:**
- FFmpeg sangat ringan dan stabil untuk long-running process
- HLS didukung native oleh Safari, dan HLS.js untuk browser lain
- Tidak perlu WebSocket, cukup HTTP static files
- Mudah di-cache dan di-CDN jika perlu scale
- Memory footprint rendah di browser

**Cara Kerja:**
1. FFmpeg berjalan sebagai child process atau container terpisah
2. Convert RTSP stream ke HLS segments (file .ts) + playlist (.m3u8)
3. Express serve folder HLS sebagai static files
4. Browser load .m3u8 dengan HLS.js, auto-fetch segments

### Konfigurasi FFmpeg (Optimized)
```bash
# Untuk camera dengan H.264 (copy stream, paling ringan)
ffmpeg -rtsp_transport tcp -i "rtsp://user:pass@192.168.1.100:554/stream" \
  -c:v copy -c:a aac -f hls \
  -hls_time 2 -hls_list_size 3 -hls_flags delete_segments+append_list \
  -hls_segment_type mpegts \
  /app/streams/camera-{id}/index.m3u8

# Jika perlu transcode (CPU lebih tinggi, tapi kompatibilitas lebih baik)
ffmpeg -rtsp_transport tcp -i "rtsp://user:pass@192.168.1.100:554/stream" \
  -c:v libx264 -preset ultrafast -tune zerolatency -crf 28 \
  -c:a aac -b:a 64k \
  -f hls -hls_time 2 -hls_list_size 3 -hls_flags delete_segments+append_list \
  /app/streams/camera-{id}/index.m3u8
```

**Catatan FFmpeg:**
- `-preset ultrafast`: CPU usage paling rendah
- `-tune zerolatency`: Minimize delay
- `-crf 28`: Quality cukup untuk monitoring (range 18-28)
- `copy`: Tidak transcode, paling ringan tapi camera harus H.264
- `-hls_flags append_list`: Prevent playlist corruption

### HLS.js di React
```tsx
import Hls from 'hls.js';
import { useEffect, useRef } from 'react';

function CameraPlayer({ streamUrl }: { streamUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    
    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
        backBufferLength: 30,
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);
      
      return () => hls.destroy();
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = streamUrl;
    }
  }, [streamUrl]);

  return <video ref={videoRef} controls autoPlay muted className="w-full h-full" />;
}
```

---

## Docker Compose - Services

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: desadigital
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: desadigital
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U desadigital"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: ./backend
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://desadigital:${DB_PASSWORD}@db:5432/desadigital
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 15m
      REFRESH_TOKEN_EXPIRES_IN: 7d
    ports:
      - "4000:4000"

  web:
    build: ./frontend
    environment:
      VITE_API_URL: http://api:4000
    ports:
      - "3000:3000"

  # FFmpeg relay service (satu per camera atau pooled)
  stream-relay:
    image: linuxserver/ffmpeg:latest
    volumes:
      - streams_data:/app/streams

volumes:
  pg_data:
  streams_data:
```

---

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://desadigital:secret@localhost:5432/desadigital

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Encryption (untuk RTSP credentials)
ENCRYPTION_KEY=your-32-character-encryption-key!

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug

# Streaming
STREAMS_DIR=/app/streams
FFMPEG_PATH=/usr/bin/ffmpeg
MAX_CONCURRENT_STREAMS=10

# Security
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCKOUT_MINUTES=15
BCRYPT_ROUNDS=12
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=Desa Digital
```

---

## Struktur Folder

```
desa-digital/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts
│   │   ├── db/
│   │   │   ├── index.ts
│   │   │   ├── migrate.ts
│   │   │   └── schema.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── roleGuard.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.schema.ts
│   │   │   ├── users/
│   │   │   ├── desas/
│   │   │   ├── rts/
│   │   │   ├── cameras/
│   │   │   └── streams/
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   ├── password.ts
│   │   │   └── ffmpeg.ts
│   │   └── index.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # shadcn components
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Layout.tsx
│   │   │   ├── camera/
│   │   │   │   ├── CameraGrid.tsx
│   │   │   │   ├── CameraCard.tsx
│   │   │   │   └── CameraPlayer.tsx
│   │   │   └── theme/
│   │   │       └── ThemeToggle.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useCameras.ts
│   │   │   └── useTheme.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   ├── routes/
│   │   │   ├── __root.tsx
│   │   │   ├── _auth.tsx      # Layout untuk protected routes
│   │   │   ├── _auth.index.tsx # Dashboard
│   │   │   ├── _auth.cameras.$id.tsx
│   │   │   ├── _auth.profile.tsx
│   │   │   ├── _auth.admin.desas.tsx
│   │   │   ├── _auth.admin.rts.tsx
│   │   │   ├── _auth.admin.users.tsx
│   │   │   ├── _auth.admin.cameras.tsx
│   │   │   └── login.tsx
│   │   ├── stores/
│   │   │   └── authStore.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── router.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docker/
│   ├── docker-compose.dev.yml
│   ├── docker-compose.prod.yml
│   └── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Seed Data (Development)

```typescript
// Seed superadmin default
const superadmin = {
  email: 'admin@desadigital.id',
  password: 'Admin123!', // Hash ini
  name: 'Super Admin',
  role: 'superadmin',
};

// Seed desa contoh
const desas = [
  { name: 'Desa Sukamaju', code: 'DSA001' },
  { name: 'Desa Mekarjaya', code: 'DSA002' },
];

// Seed RT contoh
const rts = [
  { desaId: 'desa-1-uuid', name: 'RT 01', rtNumber: 1, rwNumber: 1 },
  { desaId: 'desa-1-uuid', name: 'RT 02', rtNumber: 2, rwNumber: 1 },
];
```

---

## Prioritas Pengembangan (MVP)

### Phase 1: Foundation
1. Setup project structure (monorepo)
2. Backend: Express + Drizzle + Auth (JWT)
3. Frontend: TanStack Router + Basic layout + Theme toggle
4. Docker Compose untuk development

### Phase 2: Core Features
5. CRUD Desa, RT, Users (Superadmin)
6. Login page + Protected routes
7. Dashboard dengan daftar camera (placeholder)

### Phase 3: CCTV Streaming
8. Integrasi FFmpeg untuk RTSP → HLS
9. CameraPlayer component dengan HLS.js
10. Camera grid dengan lazy loading

### Phase 4: Polish & Deploy
11. Role-based filtering untuk cameras
12. Activity logging
13. CI/CD pipeline
14. Production deployment

---

## Catatan Penting

### Keamanan (CRITICAL)

#### Password & Authentication
- Password di-hash dengan **Argon2id** (lebih aman dari bcrypt, native di Node 24)
- Minimum password: 8 karakter, harus ada huruf besar, kecil, angka
- Account lockout: 5x gagal login = lock 15 menit
- JWT access token: 15 menit (short-lived)
- Refresh token: 7 hari, bind ke user-agent + IP (device fingerprint)
- Logout = invalidate semua refresh token user tersebut

#### Data Protection
- RTSP URL di-enkripsi dengan **AES-256-GCM** sebelum simpan ke database
- Encryption key disimpan di environment variable, bukan di code
- RTSP credentials TIDAK PERNAH dikirim ke frontend
- Frontend hanya terima HLS URL yang sudah di-generate backend

#### Network Security
- **HTTPS wajib** di production (redirect HTTP → HTTPS)
- CORS strict: hanya allow origin yang terdaftar
- Helmet.js untuk security headers (CSP, HSTS, X-Frame-Options)
- Rate limiting: 100 req/menit per IP untuk API, 10 req/menit untuk login

#### Input Validation
- Semua input di-validate dengan Zod di backend
- Sanitize HTML untuk prevent XSS
- Parameterized queries (Drizzle ORM sudah handle)
- File upload validation untuk camera thumbnail (jika ada)

### Performa & Optimasi (RINGAN)

#### Bundle Size Optimization
- Gunakan **hls.js/dist/hls.light.min.js** (~45KB vs ~60KB full)
- Import shadcn/ui components secara individual, bukan barrel import
- Tree-shaking strict di Vite config
- Lucide icons: import per-icon, bukan `import * from 'lucide-react'`
- Target bundle size: < 200KB gzipped untuk initial load

#### Lazy Loading Strategy
```tsx
// Intersection Observer untuk camera cards
const CameraPlayer = React.lazy(() => import('./CameraPlayer'));

// Hanya load player saat card visible di viewport
<IntersectionObserver threshold={0.1}>
  {isVisible && <Suspense fallback={<Skeleton />}><CameraPlayer /></Suspense>}
</IntersectionObserver>
```

#### Streaming Optimization
- `hls_time: 2` untuk segment 2 detik (balance latency vs buffering)
- `hls_list_size: 3` untuk playlist pendek (6 detik buffer)
- `delete_segments` aktif agar disk tidak penuh
- FFmpeg dengan `-preset ultrafast` untuk CPU rendah
- Limit concurrent streams: max 10 FFmpeg process per server

#### Caching Strategy
- Camera list: cache 30 detik di TanStack Query
- User session: cache di memory (tidak perlu Redis untuk MVP)
- HLS segments: HTTP cache-control max-age=2
- Static assets: cache 1 tahun dengan content hash

#### Database Performance
- Index pada: `users.email`, `cameras.rt_id`, `rts.desa_id`
- Connection pooling: min 2, max 10 connections
- Pagination default: 20 items per page

### Skalabilitas (Future)
- Dedicated streaming server jika > 20 camera
- CDN untuk distribute HLS segments
- Horizontal scaling dengan load balancer

---

## Perintah Development

```bash
# Install dependencies
npm install

# Start development (backend + frontend)
npm run dev:backend
npm run dev:frontend

# Database
npm run db:generate   # Generate migrations
npm run db:migrate    # Run migrations
npm run db:studio     # Open Drizzle Studio

# Testing
npm run test          # Run tests
npm run lint          # Lint code
npm run typecheck     # Type check

# Docker
docker compose -f docker/docker-compose.dev.yml up -d
```

---

*Dokumen ini dibuat sebagai panduan untuk development website monitoring CCTV "Desa Digital by Fibernode". Sesuaikan dengan kebutuhan spesifik project.*
