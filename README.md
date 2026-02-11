# Desa Digital by Fibernode

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22+-green?style=flat-square&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-Ready-blue?style=flat-square&logo=docker" alt="Docker" />
</p>

**"More Than Internet—A True Partner"**

Sistem Monitoring CCTV untuk pengelolaan dan pemantauan kamera keamanan di lingkungan desa. Mendukung multi-desa, multi-RT, dengan role-based access control.

---

## 📋 Daftar Isi

1. [Fitur Utama](#-fitur-utama)
2. [Arsitektur Sistem](#-arsitektur-sistem)
3. [Persyaratan Sistem](#-persyaratan-sistem)
4. [Cara Mendapatkan Akses Repository](#-cara-mendapatkan-akses-repository)
5. [Instalasi dengan Docker (Direkomendasikan)](#-instalasi-dengan-docker-direkomendasikan)
6. [Instalasi Manual](#-instalasi-manual)
7. [Konfigurasi Environment](#-konfigurasi-environment)
8. [Konfigurasi Database](#-konfigurasi-database)
9. [Menjalankan Aplikasi](#-menjalankan-aplikasi)
10. [Akun Default & Manajemen User](#-akun-default--manajemen-user)
11. [Menambahkan Kamera CCTV](#-menambahkan-kamera-cctv)
12. [Deployment ke Production](#-deployment-ke-production)
13. [Konfigurasi Domain & SSL](#-konfigurasi-domain--ssl)
14. [Troubleshooting](#-troubleshooting)
15. [Kontak Support](#-kontak-support)

---

## ✨ Fitur Utama

- 📹 **Live Streaming CCTV** - Pantau kamera secara real-time dengan HLS streaming
- 🏘️ **Multi-Desa & Multi-RT** - Kelola banyak desa dan RT dalam satu sistem
- 👥 **Role-Based Access** - 3 level akses: Superadmin, Admin RT, Warga
- 🌓 **Dark/Light Mode** - Tampilan yang nyaman di berbagai kondisi
- 📱 **Responsive Design** - Bisa diakses dari HP, tablet, atau komputer
- 🔒 **Keamanan** - JWT authentication dengan refresh token
- 🐳 **Docker Ready** - Mudah di-deploy dengan Docker

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CCTV Camera   │────▶│  FFmpeg Relay   │────▶│   HLS Stream    │
│    (RTSP)       │     │  (Transcoding)  │     │   (.m3u8)       │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
┌─────────────────┐     ┌─────────────────┐              │
│    Frontend     │◀────│    Backend      │◀─────────────┘
│   (React 19)    │     │  (Express.js)   │
│   Port: 3000    │     │   Port: 4000    │
└─────────────────┘     └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   PostgreSQL    │
                        │   Port: 5432    │
                        └─────────────────┘
```

### Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 19, TanStack Router, TanStack Query, TailwindCSS 4, HLS.js |
| **Backend** | Node.js 22, Express.js 5, Drizzle ORM, Zod, Pino |
| **Database** | PostgreSQL 16 |
| **Streaming** | FFmpeg, HLS (HTTP Live Streaming) |
| **Container** | Docker, Docker Compose |

---

## 💻 Persyaratan Sistem

### Minimum (Development)
- **OS:** Windows 10/11, macOS 10.15+, atau Ubuntu 20.04+
- **RAM:** 4 GB
- **Storage:** 10 GB
- **CPU:** 2 Core

### Recommended (Production)
- **OS:** Ubuntu 22.04 LTS
- **RAM:** 8 GB
- **Storage:** 50 GB SSD
- **CPU:** 4 Core
- **Bandwidth:** 100 Mbps (tergantung jumlah kamera)

### Software yang Dibutuhkan

| Software | Versi | Keterangan |
|----------|-------|------------|
| Docker | 24+ | **Wajib** untuk instalasi dengan Docker |
| Docker Compose | 2.20+ | **Wajib** untuk instalasi dengan Docker |
| Node.js | 22+ | **Wajib** untuk instalasi manual |
| PostgreSQL | 16+ | **Wajib** untuk instalasi manual |
| Git | 2.30+ | **Wajib** untuk clone repository |

---

## 🔑 Cara Mendapatkan Akses Repository

Repository ini bersifat **private**. Ikuti langkah berikut untuk mendapatkan akses:

### Langkah 1: Buat Akun GitHub (Jika Belum Punya)

1. Buka https://github.com
2. Klik **"Sign up"**
3. Isi form pendaftaran dengan email aktif Anda
4. Verifikasi email Anda

### Langkah 2: Kirim Username GitHub Anda

Kirim **username GitHub** Anda ke tim Fibernode melalui:
- 📧 Email: support@fibernode.id
- 📱 WhatsApp: +62 xxx-xxxx-xxxx

Tim kami akan mengirimkan undangan kolaborator ke repository.

### Langkah 3: Terima Undangan

1. Buka email dari GitHub dengan subjek "Invitation to collaborate"
2. Klik **"View invitation"**
3. Klik **"Accept invitation"**

### Langkah 4: Generate Personal Access Token (PAT)

Token ini digunakan untuk clone repository via command line.

1. Login ke GitHub
2. Klik foto profil (kanan atas) → **Settings**
3. Scroll ke bawah, klik **Developer settings** (sidebar kiri)
4. Klik **Personal access tokens** → **Tokens (classic)**
5. Klik **Generate new token** → **Generate new token (classic)**
6. Isi:
   - **Note:** `Desa Digital Access`
   - **Expiration:** 90 days (atau sesuai kebutuhan)
   - **Scopes:** Centang `repo` (full control of private repositories)
7. Klik **Generate token**
8. ⚠️ **PENTING:** Salin token yang muncul dan simpan di tempat aman! Token hanya ditampilkan sekali.

### Langkah 5: Clone Repository

```bash
# Clone dengan HTTPS (akan diminta username & token)
git clone https://github.com/faqihuddinhabibi/desadigital.git

# Saat diminta password, masukkan Personal Access Token (bukan password GitHub)
```

Atau gunakan format langsung dengan token:
```bash
git clone https://<USERNAME>:<TOKEN>@github.com/faqihuddinhabibi/desadigital.git
```

---

## 🐳 Instalasi dengan Docker (Direkomendasikan)

Cara termudah untuk menjalankan aplikasi adalah menggunakan Docker. Semua dependency termasuk PostgreSQL akan otomatis terinstall.

### Langkah 1: Install Docker

#### Windows
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Jalankan installer dan ikuti petunjuk
3. Restart komputer
4. Buka Docker Desktop dan tunggu sampai running

#### macOS
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Drag ke folder Applications
3. Buka Docker dan ikuti petunjuk setup
4. Tunggu sampai Docker running (icon di menu bar)

#### Ubuntu/Linux
```bash
# Update package index
sudo apt-get update

# Install dependencies
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group (agar tidak perlu sudo)
sudo usermod -aG docker $USER

# Logout dan login kembali, atau jalankan:
newgrp docker

# Verifikasi instalasi
docker --version
docker compose version
```

### Langkah 2: Clone Repository

```bash
cd ~
git clone https://github.com/faqihuddinhabibi/desadigital.git
cd desadigital
```

### Langkah 3: Konfigurasi Environment (Opsional)

Untuk development, konfigurasi default sudah cukup. Untuk production, edit file berikut:

```bash
# Salin file contoh environment
cp backend/.env.example backend/.env

# Edit sesuai kebutuhan (lihat bagian Konfigurasi Environment)
nano backend/.env
```

### Langkah 4: Jalankan dengan Docker Compose

```bash
# Build dan jalankan semua service
docker compose up --build -d

# Lihat status container
docker compose ps

# Lihat logs
docker compose logs -f
```

### Langkah 5: Akses Aplikasi

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Health Check:** http://localhost:4000/health

### Perintah Docker Berguna

```bash
# Stop semua service
docker compose down

# Stop dan hapus data (termasuk database)
docker compose down -v

# Restart service tertentu
docker compose restart backend

# Lihat logs service tertentu
docker compose logs -f backend

# Masuk ke container
docker compose exec backend sh
docker compose exec postgres psql -U postgres -d desa_digital
```

---

## 🔧 Instalasi Manual

Jika tidak ingin menggunakan Docker, ikuti langkah berikut.

### Langkah 1: Install Node.js 22

#### Windows/macOS
Download dari https://nodejs.org (pilih versi LTS 22.x)

#### Ubuntu/Linux
```bash
# Install Node.js 22 menggunakan NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verifikasi
node --version  # Harus v22.x.x
npm --version
```

### Langkah 2: Install PostgreSQL 16

#### Windows
1. Download dari https://www.postgresql.org/download/windows/
2. Jalankan installer
3. Catat password untuk user `postgres`
4. Port default: 5432

#### macOS
```bash
# Menggunakan Homebrew
brew install postgresql@16
brew services start postgresql@16
```

#### Ubuntu/Linux
```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update

# Install PostgreSQL 16
sudo apt-get install -y postgresql-16

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Set password untuk user postgres
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

### Langkah 3: Buat Database

```bash
# Masuk ke PostgreSQL
sudo -u postgres psql

# Di dalam psql, jalankan:
CREATE DATABASE desa_digital;
\q
```

### Langkah 4: Clone dan Setup Project

```bash
# Clone repository
cd ~
git clone https://github.com/faqihuddinhabibi/desadigital.git
cd desadigital

# Install dependencies untuk semua packages
npm install
```

### Langkah 5: Konfigurasi Environment

```bash
# Backend
cp backend/.env.example backend/.env
nano backend/.env
```

Edit file `backend/.env`:
```env
NODE_ENV=development
PORT=4000

# Database - sesuaikan dengan konfigurasi PostgreSQL Anda
DATABASE_URL=postgres://postgres:postgres@localhost:5432/desa_digital

# JWT Secrets - GANTI untuk production!
JWT_SECRET=ganti-dengan-string-acak-minimal-32-karakter
JWT_REFRESH_SECRET=ganti-dengan-string-acak-berbeda-minimal-32-karakter

# Encryption Key - HARUS 64 karakter hexadecimal
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info

# Streams directory
STREAMS_DIR=./streams
```

```bash
# Frontend
cp frontend/.env.example frontend/.env
nano frontend/.env
```

Edit file `frontend/.env`:
```env
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=Desa Digital
```

### Langkah 6: Jalankan Migrasi Database

```bash
# Jalankan migrasi untuk membuat tabel
npm run db:migrate --workspace=backend

# Isi data awal (superadmin)
npm run db:seed --workspace=backend
```

### Langkah 7: Jalankan Aplikasi

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## ⚙️ Konfigurasi Environment

### Backend Environment Variables

| Variable | Deskripsi | Development | Production |
|----------|-----------|-------------|------------|
| `NODE_ENV` | Mode aplikasi | `development` | `production` |
| `PORT` | Port backend | `4000` | `4000` |
| `DATABASE_URL` | Connection PostgreSQL | `postgres://postgres:postgres@postgres:5432/desa_digital` | Ganti password! |
| `JWT_SECRET` | Secret access token | `dev-jwt-secret...` | **Wajib diganti!** |
| `JWT_REFRESH_SECRET` | Secret refresh token | `dev-jwt-refresh...` | **Wajib diganti!** |
| `ENCRYPTION_KEY` | Key enkripsi RTSP (64 hex) | Default dev key | **Wajib diganti!** |
| `CORS_ORIGIN` | URL frontend | `http://localhost:3000` | `https://domain-anda.com` |
| `LOG_LEVEL` | Level logging | `debug` | `info` |

### Frontend Environment Variables

| Variable | Deskripsi | Development | Production |
|----------|-----------|-------------|------------|
| `VITE_API_URL` | URL backend API | `http://localhost:4000` | `https://api.domain-anda.com` |

### Contoh Konfigurasi Development (Default)

File `backend/.env`:
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgres://postgres:postgres@postgres:5432/desa_digital
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=dev-jwt-refresh-secret-change-in-production
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
STREAMS_DIR=./streams
```

### Contoh Konfigurasi Production

⚠️ **PENTING:** Untuk production, WAJIB generate secret keys baru!

```bash
# Generate secret keys di terminal
openssl rand -hex 32  # Untuk JWT_SECRET
openssl rand -hex 32  # Untuk JWT_REFRESH_SECRET  
openssl rand -hex 32  # Untuk ENCRYPTION_KEY
```

File `backend/.env` untuk production:
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgres://postgres:PASSWORD_KUAT_ANDA@postgres:5432/desa_digital
JWT_SECRET=hasil_dari_openssl_rand_hex_32_pertama
JWT_REFRESH_SECRET=hasil_dari_openssl_rand_hex_32_kedua
ENCRYPTION_KEY=hasil_dari_openssl_rand_hex_32_ketiga
CORS_ORIGIN=https://cctv.domain-anda.com
LOG_LEVEL=info
STREAMS_DIR=/app/streams
```

File `frontend/.env` untuk production:
```env
VITE_API_URL=https://api.cctv.domain-anda.com
```

### Penjelasan CORS

**CORS (Cross-Origin Resource Sharing)** mengontrol domain mana yang boleh mengakses API.

| Situasi | Nilai CORS_ORIGIN |
|---------|-------------------|
| Development lokal | `http://localhost:3000` |
| Production dengan domain | `https://cctv.domain-anda.com` |
| Multiple domain | `https://domain1.com,https://domain2.com` |

⚠️ Jika CORS salah konfigurasi, frontend tidak bisa berkomunikasi dengan backend!

---

## 🗄️ Konfigurasi Database

### Struktur Database

Aplikasi menggunakan tabel-tabel berikut:

| Tabel | Deskripsi |
|-------|-----------|
| `users` | Data pengguna (superadmin, admin_rt, warga) |
| `desas` | Data desa |
| `rts` | Data RT (relasi ke desa) |
| `cameras` | Data kamera CCTV (relasi ke RT) |
| `refresh_tokens` | Token refresh untuk autentikasi |
| `activity_logs` | Log aktivitas pengguna |
| `login_attempts` | Catatan percobaan login |

### Perintah Database

```bash
# Jalankan migrasi (buat/update tabel)
npm run db:migrate --workspace=backend

# Generate migrasi baru (setelah ubah schema)
npm run db:generate --workspace=backend

# Seed data awal
npm run db:seed --workspace=backend

# Buka Drizzle Studio (GUI database)
npm run db:studio --workspace=backend
```

### Backup Database

```bash
# Backup
docker compose exec postgres pg_dump -U postgres desa_digital > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T postgres psql -U postgres desa_digital < backup_20240101.sql
```

---

## 🚀 Menjalankan Aplikasi

### Development Mode

```bash
# Dengan Docker
docker compose up --build

# Manual - Backend (terminal 1)
cd backend && npm run dev

# Manual - Frontend (terminal 2)
cd frontend && npm run dev
```

### Production Mode

```bash
# Build untuk production
npm run build --workspace=backend
npm run build --workspace=frontend

# Jalankan
NODE_ENV=production node backend/dist/index.js
```

### Akses Aplikasi

| Service | URL | Keterangan |
|---------|-----|------------|
| Frontend | http://localhost:3000 | Antarmuka web |
| Backend API | http://localhost:4000 | REST API |
| API Health | http://localhost:4000/health | Status server |
| Drizzle Studio | http://localhost:4983 | GUI Database |

---

## 👤 Akun Default & Manajemen User

### Kredensial Default

Setelah menjalankan `db:seed`, akun berikut akan dibuat:

| Role | Email | Password |
|------|-------|----------|
| **Superadmin** | `superadmin@fibernode.id` | `SuperAdmin123!` |

⚠️ **PENTING:** Segera ganti password default setelah login pertama!

### Cara Login

1. Buka http://localhost:3000
2. Masukkan email: `superadmin@fibernode.id`
3. Masukkan password: `SuperAdmin123!`
4. Klik **Login**

### Ganti Password

1. Login ke aplikasi
2. Klik nama Anda di pojok kanan atas
3. Pilih **Profil**
4. Isi password baru di bagian "Ubah Password"
5. Klik **Simpan Perubahan**

### Membuat User Baru

1. Login sebagai Superadmin
2. Klik menu **Kelola User**
3. Klik tombol **+ Tambah User**
4. Isi form:
   - **Nama:** Nama lengkap user
   - **Email:** Email aktif (untuk login)
   - **Password:** Minimal 8 karakter
   - **Role:** Pilih level akses
     - `Superadmin` - Akses penuh
     - `Admin RT` - Kelola RT tertentu
     - `Warga` - Hanya lihat kamera RT-nya
   - **RT:** Pilih RT (untuk Admin RT dan Warga)
5. Klik **Simpan**

### Struktur Role

```
Superadmin
├── Bisa akses semua fitur
├── Kelola Desa, RT, User, Kamera
└── Lihat semua CCTV

Admin RT
├── Lihat CCTV di RT-nya
├── Tambah kamera di RT-nya
└── Lihat daftar warga RT-nya

Warga
└── Hanya lihat CCTV di RT-nya
```

---

## 📹 Menambahkan Kamera CCTV

### Persyaratan Kamera

- Mendukung **RTSP streaming**
- Terhubung ke jaringan yang sama atau bisa diakses dari server
- Memiliki **IP static** (disarankan)

### Format URL RTSP

```
rtsp://username:password@ip_address:port/path
```

Contoh berbagai merek:
| Merek | Format URL RTSP |
|-------|-----------------|
| Hikvision | `rtsp://admin:password@192.168.1.100:554/Streaming/Channels/101` |
| Dahua | `rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0` |
| TP-Link | `rtsp://admin:password@192.168.1.100:554/stream1` |
| Generic | `rtsp://admin:password@192.168.1.100:554/live` |

### Langkah Menambah Kamera

1. Login sebagai **Superadmin** atau **Admin RT**
2. Klik menu **Kamera** (di sidebar)
3. Klik tombol **+ Tambah Kamera**
4. Isi form:
   - **Nama Kamera:** Contoh: "CCTV Pos Ronda RT 01"
   - **RTSP URL:** URL streaming dari kamera
   - **Lokasi:** Deskripsi lokasi kamera
   - **RT:** Pilih RT tempat kamera berada
5. Klik **Simpan**
6. Tunggu beberapa detik, kamera akan muncul di daftar

### Test RTSP URL

Sebelum menambahkan, test URL dengan VLC:
1. Buka VLC Media Player
2. Klik **Media** → **Open Network Stream**
3. Masukkan URL RTSP
4. Klik **Play**
5. Jika video muncul, URL valid

---

## 🌐 Deployment ke Production

### Opsi 1: VPS/Cloud Server (Direkomendasikan)

#### Langkah 1: Siapkan Server

Sewa VPS dari provider seperti:
- **DigitalOcean** (mulai $6/bulan)
- **Vultr** (mulai $6/bulan)
- **Linode** (mulai $5/bulan)
- **AWS EC2** / **Google Cloud** / **Azure**

Spesifikasi minimum:
- Ubuntu 22.04 LTS
- 2 vCPU, 4 GB RAM
- 50 GB SSD

#### Langkah 2: Setup Server

```bash
# SSH ke server
ssh root@IP_SERVER

# Update sistem
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Buat user baru (jangan pakai root)
adduser deploy
usermod -aG docker deploy
usermod -aG sudo deploy

# Switch ke user deploy
su - deploy
```

#### Langkah 3: Clone dan Konfigurasi

```bash
# Clone repository
git clone https://github.com/faqihuddinhabibi/desadigital.git
cd desadigital

# Konfigurasi environment production
cp backend/.env.example backend/.env
nano backend/.env
```

Edit untuk production:
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgres://postgres:PASSWORD_KUAT@postgres:5432/desa_digital
JWT_SECRET=GENERATE_DENGAN_openssl_rand_hex_32
JWT_REFRESH_SECRET=GENERATE_DENGAN_openssl_rand_hex_32
ENCRYPTION_KEY=GENERATE_DENGAN_openssl_rand_hex_32
CORS_ORIGIN=https://cctv.domainanda.com
LOG_LEVEL=info
STREAMS_DIR=/app/streams
```

#### Langkah 4: Jalankan dengan Docker

```bash
docker compose up --build -d
```

### Opsi 2: Shared Hosting

⚠️ **Tidak Direkomendasikan** - Shared hosting biasanya tidak mendukung:
- Docker
- WebSocket
- FFmpeg
- Port custom

---

## 🔐 Konfigurasi Domain & SSL

### Langkah 1: Beli/Siapkan Domain

Beli domain dari registrar seperti:
- Niagahoster
- Hostinger
- Namecheap
- Cloudflare

### Langkah 2: Arahkan DNS

Login ke panel DNS domain Anda, tambahkan record:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | IP_SERVER_ANDA | 300 |
| A | www | IP_SERVER_ANDA | 300 |
| A | api | IP_SERVER_ANDA | 300 |

### Langkah 3: Install Nginx & Certbot

```bash
# Install Nginx
sudo apt install nginx -y

# Install Certbot untuk SSL
sudo apt install certbot python3-certbot-nginx -y
```

### Langkah 4: Konfigurasi Nginx

```bash
sudo nano /etc/nginx/sites-available/desadigital
```

Isi dengan:
```nginx
# Frontend
server {
    listen 80;
    server_name cctv.domainanda.com www.cctv.domainanda.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.cctv.domainanda.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Untuk upload file besar (jika ada)
        client_max_body_size 100M;
    }

    # Untuk HLS streaming
    location /streams/ {
        proxy_pass http://localhost:4000/streams/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Aktifkan konfigurasi
sudo ln -s /etc/nginx/sites-available/desadigital /etc/nginx/sites-enabled/

# Test konfigurasi
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Langkah 5: Install SSL Certificate

```bash
# Generate SSL untuk semua domain
sudo certbot --nginx -d cctv.domainanda.com -d www.cctv.domainanda.com -d api.cctv.domainanda.com

# Ikuti petunjuk:
# 1. Masukkan email
# 2. Setuju terms of service (Y)
# 3. Pilih redirect HTTP ke HTTPS (2)
```

### Langkah 6: Update Environment

Edit `backend/.env`:
```env
CORS_ORIGIN=https://cctv.domainanda.com
```

Edit `frontend/.env`:
```env
VITE_API_URL=https://api.cctv.domainanda.com
```

Rebuild aplikasi:
```bash
docker compose down
docker compose up --build -d
```

### Langkah 7: Auto-Renew SSL

Certbot otomatis menambahkan cron job untuk renewal. Verifikasi:
```bash
sudo certbot renew --dry-run
```

---

## 🔧 Troubleshooting

### Masalah Umum

#### 1. Container tidak bisa start

```bash
# Lihat logs
docker compose logs -f

# Restart semua container
docker compose down
docker compose up --build -d
```

#### 2. Database connection error

```bash
# Pastikan PostgreSQL running
docker compose ps postgres

# Cek koneksi
docker compose exec postgres psql -U postgres -d desa_digital -c "SELECT 1"

# Reset database (HATI-HATI: hapus semua data)
docker compose down -v
docker compose up --build -d
```

#### 3. Kamera tidak tampil / offline

1. Pastikan URL RTSP benar (test dengan VLC)
2. Pastikan kamera bisa diakses dari server
3. Cek firewall tidak memblokir port RTSP (biasanya 554)
4. Lihat logs FFmpeg:
   ```bash
   docker compose logs ffmpeg-relay
   ```

#### 4. SSL certificate error

```bash
# Renew manual
sudo certbot renew

# Cek status certificate
sudo certbot certificates
```

#### 5. Port sudah dipakai

```bash
# Cari proses yang menggunakan port
sudo lsof -i :3000
sudo lsof -i :4000

# Kill proses jika perlu
sudo kill -9 PID
```

### Reset Lengkap

Jika ingin mulai dari awal:

```bash
# Stop dan hapus semua container & data
docker compose down -v

# Hapus images
docker compose down --rmi all

# Clone ulang
cd ..
rm -rf desadigital
git clone https://github.com/faqihuddinhabibi/desadigital.git
cd desadigital

# Jalankan ulang
docker compose up --build -d
```

---

## 📞 Kontak Support

Jika mengalami kendala, hubungi tim Fibernode:

| Channel | Kontak |
|---------|--------|
| 📧 Email | support@fibernode.id |
| 📱 WhatsApp | +62 xxx-xxxx-xxxx |
| 🌐 Website | https://fibernode.id |

### Informasi yang Diperlukan Saat Laporan

1. Screenshot error
2. Langkah yang dilakukan sebelum error
3. Output dari `docker compose logs`
4. Versi sistem operasi
5. Spesifikasi server

---

## 📄 Lisensi

Hak Cipta © 2024 Fibernode. Semua hak dilindungi.

Software ini merupakan proprietary software dan hanya boleh digunakan sesuai dengan perjanjian lisensi yang berlaku.

---

<p align="center">
  <b>Desa Digital by Fibernode</b><br>
  <i>"More Than Internet—A True Partner"</i>
</p>
