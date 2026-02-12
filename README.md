# Desa Digital by Fibernode

<p align="center">
  <img src="https://img.shields.io/badge/Docker-One_Command-blue?style=flat-square&logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/SSL-Free_&_Auto-green?style=flat-square&logo=letsencrypt" alt="SSL" />
  <img src="https://img.shields.io/badge/Proxmox-Ready-orange?style=flat-square&logo=proxmox" alt="Proxmox" />
  <img src="https://img.shields.io/badge/Telegram-Alerts-blue?style=flat-square&logo=telegram" alt="Telegram" />
</p>

**"More Than Internet—A True Partner"**

Sistem Monitoring CCTV untuk pengelolaan dan pemantauan kamera keamanan di lingkungan desa. Cukup jalankan **satu perintah Docker** dan semua langsung berjalan.

---

## 📋 Daftar Isi

1. [Fitur Utama](#-fitur-utama)
2. [Arsitektur & Port](#-arsitektur--port)
3. [Instalasi di Proxmox (Docker LXC)](#-instalasi-di-proxmox-docker-lxc)
4. [Konfigurasi Environment (.env)](#-konfigurasi-environment-env)
5. [Menjalankan Aplikasi](#-menjalankan-aplikasi)
6. [Akun Superadmin](#-akun-superadmin)
7. [Domain Custom & SSL Gratis](#-domain-custom--ssl-gratis)
8. [Cloudflare Tunnel (Tanpa Buka Port)](#-cloudflare-tunnel-tanpa-buka-port)
9. [Bot Telegram (Notifikasi)](#-bot-telegram-notifikasi)
10. [Backup & Restore Database](#-backup--restore-database)
11. [Logo & Branding](#-logo--branding)
12. [Menambahkan Kamera CCTV](#-menambahkan-kamera-cctv)
13. [Troubleshooting](#-troubleshooting)
14. [Kontak Support](#-kontak-support)

---

## ✨ Fitur Utama

- 📹 **Live Streaming CCTV** — Pantau kamera real-time dengan HLS
- 🏘️ **Multi-Desa & Multi-RT** — Kelola banyak desa/RT dalam satu sistem
- 👥 **Role-Based Access** — Superadmin, Admin RT, Warga
- 🌓 **Dark/Light Mode** — Nyaman di berbagai kondisi
- 📱 **PWA & Responsive** — Bisa di-install di HP
- 🔒 **SSL Otomatis & Gratis** — Let's Encrypt atau Cloudflare Tunnel
- 🤖 **Bot Telegram** — Notifikasi kamera offline/online + backup harian
- 💾 **Auto Backup** — Database di-backup otomatis setiap hari
- 🎨 **Logo & Branding** — Ganti logo dan nama aplikasi dari menu setting
- 🖥️ **Splash Screen** — 3 detik loading screen dengan logo custom
- 📊 **Monitoring Dashboard** — Pantau kesehatan sistem & HTTP endpoints
- 🐳 **One Command Deploy** — Cukup `docker compose up -d`

---

## 🏗️ Arsitektur & Port

```
Internet
   │
   ├─ Port 80/443 ──▶ Nginx Proxy ──▶ Frontend (React) :3000
   │                        │
   │                        └────────▶ Backend API (Express) :4000
   │
   └─ (Opsional) ───▶ Cloudflare Tunnel
```

### Daftar Service & Port

| Service | Container | Port Internal | Port Expose | Keterangan |
|---------|-----------|:---:|:---:|------------|
| **Nginx Proxy** | desa-digital-proxy | 80, 443 | **80, 443** | Satu-satunya port yg terbuka |
| **Frontend** | desa-digital-web | 3000 | — | Di-proxy oleh Nginx |
| **Backend API** | desa-digital-api | 4000 | — | Di-proxy oleh Nginx |
| **PostgreSQL** | desa-digital-db | 5432 | — | Tidak expose ke luar |
| **FFmpeg** | desa-digital-ffmpeg | — | — | Transcoding CCTV |
| **Certbot** | desa-digital-certbot | — | — | Auto-renew SSL |
| **DB Backup** | desa-digital-backup | — | — | Backup harian 02:00 |
| **Watchtower** | desa-digital-watchtower | — | — | Auto-update images |

> **Yang perlu dibuka di firewall: hanya port 80 dan 443.**

---

## 🐳 Instalasi di Proxmox (Docker LXC)

Anda menggunakan Proxmox? Langsung buat container Docker. Tidak perlu install Linux terpisah.

### Langkah 1: Buat LXC Container di Proxmox

1. Buka **Proxmox Web UI** → klik **Create CT**
2. Isi konfigurasi:
   - **Template:** `ubuntu-22.04-standard` (download dulu di local storage)
   - **Hostname:** `desa-digital`
   - **RAM:** 4096 MB (minimum), 8192 MB (rekomendasi)
   - **CPU:** 2 core (minimum), 4 core (rekomendasi)
   - **Disk:** 50 GB
   - **Network:** Bridge ke jaringan Anda (DHCP atau static IP)
3. ✅ Centang **Nesting** di tab Features (wajib untuk Docker)
4. Klik **Create**, lalu **Start**

### Langkah 2: Install Docker di LXC

Masuk ke console LXC (klik container → Console), lalu jalankan:

```bash
# Update sistem
apt update && apt upgrade -y

# Install Docker (satu perintah)
curl -fsSL https://get.docker.com | sh

# Verifikasi
docker --version
docker compose version
```

### Langkah 3: Clone Repository

```bash
cd /opt
git clone https://github.com/faqihuddinhabibi/desadigital.git
cd desadigital
```

> **Butuh akses?** Repository ini private. Kirim username GitHub Anda ke tim Fibernode untuk mendapatkan undangan.

### Langkah 4: Buat File .env

```bash
cp .env.example .env
nano .env
```

Lihat bagian [Konfigurasi Environment](#-konfigurasi-environment-env) di bawah.

### Langkah 5: Jalankan!

```bash
# Satu perintah untuk semua service
docker compose -f docker-compose.prod.yml up -d

# Lihat status
docker compose -f docker-compose.prod.yml ps

# Lihat logs
docker compose -f docker-compose.prod.yml logs -f
```

**Selesai!** Buka `http://IP_CONTAINER` di browser.

---

## ⚙️ Konfigurasi Environment (.env)

Buat file `.env` di root folder project:

```env
# ── Database ──
POSTGRES_USER=postgres
POSTGRES_PASSWORD=GantiDenganPasswordKuat123!
POSTGRES_DB=desa_digital

# ── Security (WAJIB diganti untuk production!) ──
# Generate dengan: openssl rand -hex 32
JWT_SECRET=paste_hasil_openssl_rand_hex_32_pertama
JWT_REFRESH_SECRET=paste_hasil_openssl_rand_hex_32_kedua
ENCRYPTION_KEY=paste_hasil_openssl_rand_hex_32_ketiga

# ── Domain & CORS ──
# Tanpa domain (akses via IP): http://IP_SERVER
# Dengan domain: https://cctv.desaanda.com
CORS_ORIGIN=http://IP_SERVER

# ── Akun Superadmin (dibuat otomatis saat pertama kali) ──
ADMIN_USERNAME=superadmin
ADMIN_PASSWORD=PasswordKuatAnda123!
ADMIN_NAME=Super Admin

# ── Data Demo (true = isi contoh desa/RT/kamera, false = kosong) ──
SEED_DEMO_DATA=false

# ── Docker Hub (untuk auto-update) ──
DOCKERHUB_USERNAME=faqihuddinhabibi

# ── Telegram (opsional, bisa diisi dari menu Setting di UI) ──
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# ── Cloudflare Tunnel (opsional) ──
CLOUDFLARE_TUNNEL_TOKEN=
```

### Generate Secret Keys

```bash
# Jalankan 3x untuk 3 secret yang berbeda
openssl rand -hex 32
```

---

## 🚀 Menjalankan Aplikasi

### Perintah Utama

```bash
# Jalankan semua service
docker compose -f docker-compose.prod.yml up -d

# Dengan Cloudflare Tunnel
docker compose -f docker-compose.prod.yml --profile cloudflare up -d

# Stop semua
docker compose -f docker-compose.prod.yml down

# Restart
docker compose -f docker-compose.prod.yml restart

# Lihat logs
docker compose -f docker-compose.prod.yml logs -f backend

# Update ke versi terbaru
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Akses Aplikasi

| Akses | URL |
|-------|-----|
| **Web App** | `http://IP_SERVER` (atau `https://domain-anda.com`) |
| **Health Check** | `http://IP_SERVER/health` |

---

## 👤 Akun Superadmin

### Pengaturan Awal via .env

Username dan password superadmin dikonfigurasi di file `.env` **sebelum** pertama kali menjalankan Docker:

```env
ADMIN_USERNAME=superadmin
ADMIN_PASSWORD=PasswordKuatAnda123!
ADMIN_NAME=Super Admin
```

> Akun hanya dibuat **sekali** saat pertama kali jalan. Jika sudah ada superadmin, env vars di atas diabaikan.

### Data Seed (Demo)

```env
# true  = buat contoh desa, RT, user demo, kamera demo
# false = kosong, hanya superadmin
SEED_DEMO_DATA=false
```

Jika `SEED_DEMO_DATA=true`, akun demo berikut juga dibuat:

| Role | Username | Password |
|------|----------|----------|
| **Admin RT** | `adminrt01` | `AdminRT123!` |
| **Warga** | `warga01` | `Warga123!` |

### Login

1. Buka `http://IP_SERVER` di browser
2. Masukkan username & password yang sudah diatur
3. Klik **Masuk**

### Struktur Role

| Role | Akses |
|------|-------|
| **Superadmin** | Semua fitur: kelola desa, RT, user, kamera, pengaturan |
| **Admin RT** | Lihat & kelola kamera di RT-nya |
| **Warga** | Hanya lihat kamera di RT-nya |

---

## 🌐 Domain Custom & SSL Gratis

SSL **gratis dan otomatis** menggunakan Let's Encrypt. Berikut cara setupnya:

### Langkah 1: Beli Domain

Beli dari registrar manapun: Niagahoster, Hostinger, Namecheap, Cloudflare, dll.

### Langkah 2: Setting DNS

Login ke panel DNS domain Anda, tambahkan record:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **A** | `@` | `IP_SERVER_ANDA` | 300 |
| **A** | `www` | `IP_SERVER_ANDA` | 300 |

> **Cek propagasi DNS:** Buka https://dnschecker.org dan masukkan domain Anda. Tunggu hingga semua server menunjukkan IP yang benar (biasanya 5-30 menit).

### Langkah 3: Update .env

```env
CORS_ORIGIN=https://cctv.desaanda.com
```

### Langkah 4: Generate SSL

```bash
# Pastikan Docker sudah jalan
docker compose -f docker-compose.prod.yml up -d

# Generate SSL
./scripts/setup-ssl.sh cctv.desaanda.com admin@email.com

# Restart
docker compose -f docker-compose.prod.yml restart
```

**Selesai!** Buka `https://cctv.desaanda.com`. SSL akan otomatis diperpanjang oleh Certbot.

> SSL juga bisa dikonfigurasi dari **menu Pengaturan → Domain & SSL** di dalam aplikasi.

---

## ☁️ Cloudflare Tunnel (Tanpa Buka Port)

Alternatif SSL tanpa perlu membuka port 80/443 di firewall. Cocok untuk jaringan di belakang NAT.

### Langkah 1: Buat Akun Cloudflare

1. Daftar gratis di https://dash.cloudflare.com
2. Tambahkan domain Anda ke Cloudflare
3. Pindahkan nameserver domain ke Cloudflare (ikuti panduan di dashboard)

### Langkah 2: Buat Tunnel

1. Buka https://one.dash.cloudflare.com
2. Pilih **Networks** → **Tunnels** → **Create a tunnel**
3. Pilih **Cloudflared**, beri nama (contoh: `desa-digital`)
4. **Copy token** yang diberikan (dimulai dengan `eyJ...`)

### Langkah 3: Konfigurasi Hostname

Di halaman tunnel, tambahkan **Public Hostname**:

| Subdomain | Domain | Service |
|-----------|--------|---------|
| `cctv` | `desaanda.com` | `http://desa-digital-proxy:80` |

### Langkah 4: Jalankan dengan Tunnel

```bash
# Tambahkan token ke .env
echo "CLOUDFLARE_TUNNEL_TOKEN=eyJ..." >> .env

# Jalankan dengan profile cloudflare
docker compose -f docker-compose.prod.yml --profile cloudflare up -d
```

**Selesai!** Buka `https://cctv.desaanda.com`.

> Tunnel juga bisa dikonfigurasi dari **menu Pengaturan → Domain & SSL** di dalam aplikasi.

---

## 🤖 Bot Telegram (Notifikasi)

Terima notifikasi otomatis di Telegram untuk:
- 🔴 **Kamera terputus** — beserta daftar kamera yang masih offline
- 🟢 **Kamera terhubung kembali** — beserta daftar yang masih offline
- 💾 **Backup database harian** — ukuran file dan jumlah backup

### Cara Membuat Bot Telegram

1. Buka Telegram, cari **@BotFather**
2. Kirim `/newbot`
3. Masukkan nama bot: `Desa Digital Alert`
4. Masukkan username bot: `desadigital_alert_bot` (harus unik)
5. **Copy Bot Token** yang diberikan

### Cara Mendapatkan Chat ID

**Opsi A — Via grup:**
1. Buat grup Telegram, tambahkan bot ke grup
2. Kirim pesan apapun di grup
3. Buka di browser: `https://api.telegram.org/bot<TOKEN>/getUpdates`
4. Cari `"chat":{"id":-100xxx}` — itulah Chat ID

**Opsi B — Via bot bantuan:**
- Kirim pesan ke [@userinfobot](https://t.me/userinfobot) atau [@getmyid_bot](https://t.me/getmyid_bot)

### Konfigurasi

**Via .env (untuk backup notification):**
```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
TELEGRAM_CHAT_ID=-1001234567890
```

**Via UI (untuk semua notifikasi):**
1. Login sebagai Superadmin
2. Buka **Pengaturan** → **Telegram Bot**
3. Masukkan Bot Token dan Chat ID
4. Aktifkan notifikasi
5. Klik **Test Kirim** untuk verifikasi
6. Klik **Simpan**

---

## 💾 Backup & Restore Database

### Backup Otomatis

Database di-backup **otomatis setiap hari jam 02:00**. File backup disimpan di folder `./backups/` dan otomatis dihapus setelah 7 hari.

Jika Telegram dikonfigurasi, notifikasi backup akan dikirim setiap hari.

### Backup Manual

```bash
# Backup ke file SQL
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U postgres desa_digital | gzip > backup_manual_$(date +%Y%m%d).sql.gz
```

### Restore Database

```bash
# 1. Stop backend dulu
docker compose -f docker-compose.prod.yml stop backend

# 2. Restore dari file backup
gunzip -c ./backups/desa_digital_20250212_020000.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres desa_digital

# 3. Start backend
docker compose -f docker-compose.prod.yml start backend
```

### Restore dari File .sql (tanpa gzip)

```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres desa_digital < backup_file.sql
```

### Reset Database (Hapus Semua Data)

⚠️ **HATI-HATI: Menghapus semua data!**

```bash
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d
```

---

## 🎨 Logo & Branding

Logo, nama aplikasi, dan splash screen bisa diganti dari **menu Pengaturan**:

1. Login sebagai Superadmin
2. Buka **Pengaturan** → **Logo & Branding**
3. Isi:
   - **Nama Aplikasi** — Ditampilkan di login, sidebar, splash screen
   - **URL Logo** — Untuk halaman login dan sidebar (PNG/SVG, 200x200px)
   - **URL Logo Splash Screen** — Opsional, untuk splash screen saja
4. Klik **Simpan**
5. **Refresh halaman** untuk melihat perubahan

> Splash screen muncul selama 3 detik saat membuka aplikasi.

---

## 📹 Menambahkan Kamera CCTV

### Persyaratan

- Kamera mendukung **RTSP streaming**
- Kamera terhubung ke jaringan yang sama (atau bisa diakses dari server)
- IP kamera sebaiknya **static**

### Format URL RTSP

| Merek | Format |
|-------|--------|
| **Hikvision** | `rtsp://admin:password@192.168.1.100:554/Streaming/Channels/101` |
| **Dahua** | `rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0` |
| **TP-Link** | `rtsp://admin:password@192.168.1.100:554/stream1` |
| **Generic** | `rtsp://admin:password@192.168.1.100:554/live` |

### Langkah

1. **Test dulu** dengan VLC: Media → Open Network Stream → masukkan URL RTSP
2. Login sebagai Superadmin → **Kamera** → **+ Tambah Kamera**
3. Isi nama, URL RTSP, lokasi, dan pilih RT
4. Klik **Simpan**

---

## 🔧 Troubleshooting

### Container tidak bisa start

```bash
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Database connection error

```bash
docker compose -f docker-compose.prod.yml ps postgres
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d desa_digital -c "SELECT 1"
```

### Kamera offline

1. Test URL RTSP dengan VLC
2. Pastikan kamera bisa diakses dari server: `curl rtsp://...` atau ping IP kamera
3. Cek firewall tidak memblokir port 554
4. Lihat logs: `docker compose -f docker-compose.prod.yml logs ffmpeg-relay`

### SSL error

```bash
# Cek sertifikat
docker compose -f docker-compose.prod.yml exec certbot certbot certificates

# Renew manual
docker compose -f docker-compose.prod.yml exec certbot certbot renew
docker compose -f docker-compose.prod.yml restart nginx-proxy
```

### Reset lengkap (mulai dari awal)

```bash
docker compose -f docker-compose.prod.yml down -v --rmi all
docker compose -f docker-compose.prod.yml up -d
```

---

## 📞 Kontak Support

| Channel | Kontak |
|---------|--------|
| 📧 Email | support@fibernode.id |
| 📱 WhatsApp | +62 xxx-xxxx-xxxx |
| 🌐 Website | https://fibernode.id |

Saat melapor, sertakan:
1. Screenshot error
2. Output `docker compose -f docker-compose.prod.yml logs`
3. Spesifikasi server (RAM, CPU, disk)

---

## 📄 Lisensi

Hak Cipta © 2024 Fibernode. Semua hak dilindungi.

---

<p align="center">
  <b>Desa Digital by Fibernode</b><br>
  <i>"More Than Internet—A True Partner"</i>
</p>
