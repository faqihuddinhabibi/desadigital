# Desa Digital by Fibernode

<p align="center">
  <img src="https://img.shields.io/badge/Docker-GUI_Deploy-blue?style=flat-square&logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/Portainer-Full_GUI-13BEF9?style=flat-square&logo=portainer" alt="Portainer" />
  <img src="https://img.shields.io/badge/SSL-Free_&_Auto-green?style=flat-square&logo=letsencrypt" alt="SSL" />
  <img src="https://img.shields.io/badge/Proxmox-Ready-orange?style=flat-square&logo=proxmox" alt="Proxmox" />
  <img src="https://img.shields.io/badge/Telegram-Alerts-blue?style=flat-square&logo=telegram" alt="Telegram" />
</p>

**"More Than Internet—A True Partner"**

Sistem Monitoring CCTV untuk desa. Deploy 100% lewat GUI — **tidak perlu ketik command di terminal**. Cukup pakai Proxmox + Portainer.

---

## 📋 Daftar Isi

1. [Fitur Utama](#-fitur-utama)
2. [Arsitektur & Port](#-arsitektur--port)
3. [Persiapan: Buat LXC di Proxmox](#-persiapan-buat-lxc-di-proxmox)
4. [Install Docker & Portainer (Satu Kali)](#-install-docker--portainer-satu-kali)
5. [Deploy via Portainer GUI](#-deploy-via-portainer-gui)
6. [Akun Superadmin & Login](#-akun-superadmin--login)
7. [Domain & SSL Gratis (via UI)](#-domain--ssl-gratis-via-ui)
8. [Cloudflare Tunnel (via UI)](#-cloudflare-tunnel-via-ui)
9. [Bot Telegram (via UI)](#-bot-telegram-via-ui)
10. [Backup & Restore Database](#-backup--restore-database)
11. [Logo & Branding (via UI)](#-logo--branding-via-ui)
12. [Menambahkan Kamera CCTV](#-menambahkan-kamera-cctv)
13. [Manajemen via Portainer GUI](#-manajemen-via-portainer-gui)
14. [Troubleshooting](#-troubleshooting)
15. [Kontak Support](#-kontak-support)

---

## ✨ Fitur Utama

- 📹 **Live Streaming CCTV** — Pantau kamera real-time via HLS
- 🏘️ **Multi-Desa & Multi-RT** — Satu sistem untuk banyak desa
- 👥 **Role-Based Access** — Superadmin, Admin RT, Warga
- 🖥️ **Full GUI Deploy** — Deploy & kelola semuanya lewat browser, tanpa terminal
- 🔒 **SSL Gratis & Otomatis** — Let's Encrypt atau Cloudflare Tunnel
- 🤖 **Bot Telegram** — Notifikasi kamera offline/online + backup harian
- 💾 **Auto Backup** — Database di-backup otomatis setiap hari jam 02:00
- 🎨 **Logo & Branding** — Ganti logo & nama aplikasi dari menu Pengaturan
- 🖥️ **Splash Screen** — 3 detik loading screen dengan logo custom
- 📊 **Monitoring** — Pantau kesehatan sistem & HTTP endpoints
- � **PWA & Responsive** — Bisa di-install di HP
- 🌓 **Dark/Light Mode**

---

## 🏗️ Arsitektur & Port

```
Internet
   │
   ├─ Port 80/443 ───▶ Nginx Proxy ─┬▶ /        → Frontend (React) :3000
   │                                 ├▶ /api/    → Backend API (Express) :4000
   │                                 ├▶ /ws/     → WebSocket (Socket.IO) :4000
   │                                 └▶ /streams/→ HLS Streams :4000
   │
   ├─ Port 9443 ────▶ Portainer GUI (install terpisah)
   │
   └─ (Opsional) ───▶ Cloudflare Tunnel
```

| Service | Port | Akses | Keterangan |
|---------|:----:|-------|------------|
| **Portainer** | **9443** | `https://IP:9443` | GUI untuk kelola Docker (install terpisah) |
| **Web App** | **80** | `http://IP` | Aplikasi Desa Digital |
| **SSL** | **443** | `https://domain` | Otomatis via Certbot |
| Backend API | 4000 | internal | Di-proxy oleh Nginx di `/api/` |
| WebSocket | 4000 | internal | Di-proxy oleh Nginx di `/ws/` |
| PostgreSQL | 5432 | internal | Tidak expose ke luar |
| FFmpeg | — | internal | Transcoding CCTV |
| DB Backup | — | internal | Cron backup jam 02:00 |

> **Firewall:** Buka port **80**, **443**, dan **9443** saja.

---

## � Persiapan: Buat LXC di Proxmox

### Langkah (GUI — di Proxmox Web UI)

1. Login ke **Proxmox Web UI** (`https://IP_PROXMOX:8006`)
2. Klik **local (storage)** → **CT Templates** → **Templates** → Download **ubuntu-22.04-standard**
3. Klik **Create CT** (tombol kanan atas)
4. Isi:

| Tab | Setting | Nilai |
|-----|---------|-------|
| **General** | Hostname | `desa-digital` |
| **General** | Password | *(password root LXC)* |
| **Template** | Template | `ubuntu-22.04-standard` |
| **Disks** | Disk size | `50 GB` |
| **CPU** | Cores | `2` (min) / `4` (rekomendasi) |
| **Memory** | Memory | `4096 MB` (min) / `8192 MB` (rekomendasi) |
| **Network** | IPv4 | DHCP atau Static IP |
| **Features** | ✅ Nesting | **Wajib dicentang!** |

5. Klik **Finish** → klik container → **Start**

---

## 🐳 Install Docker & Portainer (Satu Kali)

> **Ini satu-satunya langkah yang perlu terminal.** Setelah ini, semuanya via GUI.

1. Di Proxmox, klik container `desa-digital` → **Console**
2. Jalankan perintah ini (copy-paste sekaligus):

```bash
apt update && apt upgrade -y && curl -fsSL https://get.docker.com | sh && docker run -d -p 9443:9443 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce:lts
```

3. **Selesai!** Sekarang buka browser:

```
https://IP_CONTAINER:9443
```

4. Buat **username & password** admin Portainer (pertama kali saja)
5. Klik **Get Started** → klik **local** environment

> **Mulai dari sini, semua dilakukan via GUI Portainer.** Tidak perlu terminal lagi.

---

## 🚀 Deploy via Portainer GUI

### Langkah 1: Buat Stack dari Git Repository

1. Di Portainer, klik **Stacks** (sidebar kiri)
2. Klik **+ Add stack**
3. Isi:
   - **Name:** `desa-digital`
   - **Build method:** pilih **Repository**
   - **Repository URL:** `https://github.com/faqihuddinhabibi/desadigital`
   - **Repository reference:** `refs/heads/main`
   - **Compose path:** `docker-compose.prod.yml`

### Langkah 2: Isi Environment Variables

Scroll ke bawah ke bagian **Environment variables**, klik **Advanced mode**, lalu paste:

```env
POSTGRES_PASSWORD=GantiDenganPasswordKuat123
JWT_SECRET=paste_random_string_32_karakter_1
JWT_REFRESH_SECRET=paste_random_string_32_karakter_2
ENCRYPTION_KEY=paste_random_hex_64_karakter_3
CORS_ORIGIN=http://IP_CONTAINER_ANDA
ADMIN_USERNAME=superadmin
ADMIN_PASSWORD=PasswordKuatAnda123!
ADMIN_NAME=Super Admin
SEED_DEMO_DATA=false
```

> **Generate random key** di: https://generate-random.org/api-key-generator (pilih 256-bit Hex untuk `ENCRYPTION_KEY`, 256-bit untuk lainnya)

### Langkah 3: Deploy!

Klik **Deploy the stack** dan tunggu hingga semua container **running** (hijau).

### Langkah 4: Buka Aplikasi

Buka browser: `http://IP_CONTAINER`

---

## 👤 Akun Superadmin & Login

### Default

Username dan password superadmin sesuai yang Anda isi di environment variables:

| Setting | Default |
|---------|---------|
| `ADMIN_USERNAME` | `superadmin` |
| `ADMIN_PASSWORD` | `Admin123!` |
| `ADMIN_NAME` | `Super Admin` |

> Akun dibuat **otomatis sekali** saat pertama kali jalan. Setelah itu env vars diabaikan.

### Demo Data

Jika `SEED_DEMO_DATA=true`, akan dibuat juga:

| Role | Username | Password |
|------|----------|----------|
| Admin RT | `adminrt01` | `AdminRT123!` |
| Warga | `warga01` | `Warga123!` |

### Cara Login

1. Buka `http://IP_CONTAINER`
2. Masukkan username & password
3. Klik **Masuk**

---

## 🌐 Domain & SSL Gratis (via UI)

Semua pengaturan domain dan SSL bisa dilakukan dari **dalam aplikasi**.

1. Login sebagai Superadmin
2. Buka menu **Pengaturan** → tab **Domain & SSL**
3. Masukkan domain Anda (contoh: `cctv.desaanda.com`)
4. Pilih metode SSL:
   - **Let's Encrypt** — SSL gratis otomatis (perlu buka port 80/443)
   - **Cloudflare Tunnel** — SSL tanpa buka port
5. Klik **Simpan**

> Di halaman yang sama ada **tutorial langkah demi langkah** (klik untuk expand):
> - Tutorial Setting DNS
> - Tutorial SSL Let's Encrypt
> - Tutorial Cloudflare Tunnel

### Ringkasan DNS

Di panel DNS registrar domain Anda, buat:

| Type | Name | Value |
|------|------|-------|
| A | @ | IP Server |
| A | www | IP Server |

---

## ☁️ Cloudflare Tunnel (via UI)

1. Buat tunnel di https://one.dash.cloudflare.com → **Networks** → **Tunnels**
2. Copy token tunnel
3. Di aplikasi: **Pengaturan** → **Domain & SSL** → pilih **Cloudflare Tunnel** → paste token → **Simpan**
4. Di Portainer: edit stack → tambah env var `CLOUDFLARE_TUNNEL_TOKEN=eyJ...` → **Update the stack**
5. Di konfigurasi tunnel Cloudflare, tambah hostname: `cctv.desaanda.com` → `http://desa-digital-proxy:80`

---

## 🤖 Bot Telegram (via UI)

Semua pengaturan Telegram dilakukan dari **dalam aplikasi**.

1. Login sebagai Superadmin
2. Buka **Pengaturan** → tab **Telegram Bot**
3. Masukkan **Bot Token** dan **Chat ID**
4. Aktifkan notifikasi
5. Klik **Test Kirim** untuk verifikasi
6. Klik **Simpan**

> Di halaman yang sama ada **tutorial lengkap** cara membuat bot dan mendapatkan Chat ID.

### Yang Dikirim Otomatis

| Event | Contoh |
|-------|--------|
| 🔴 Kamera terputus | Nama kamera + daftar semua yang offline |
| 🟢 Kamera online kembali | Nama kamera + sisa yang masih offline |
| 💾 Backup harian | Nama file, ukuran, jumlah backup |

### Telegram untuk Backup

Jika ingin notifikasi backup juga dikirim, tambahkan env var di Portainer:

1. Di Portainer → **Stacks** → `desa-digital` → **Editor**
2. Scroll ke **Environment variables**, tambah:
   - `TELEGRAM_BOT_TOKEN` = token bot Anda
   - `TELEGRAM_CHAT_ID` = chat ID Anda
3. Klik **Update the stack**

---

## 💾 Backup & Restore Database

### Backup Otomatis

Database di-backup **otomatis setiap hari jam 02:00** oleh container `desa-digital-backup`. Backup disimpan selama 7 hari.

### Backup Manual (via Portainer)

1. Di Portainer → klik container **desa-digital-db** → **Console**
2. Pilih **/bin/sh** → **Connect**
3. Jalankan:
```
pg_dump -U postgres desa_digital > /tmp/backup.sql
```

### Restore (via Portainer)

1. Di Portainer → **Containers** → Stop **desa-digital-api**
2. Klik container **desa-digital-db** → **Console** → **/bin/sh**
3. Jalankan:
```
psql -U postgres desa_digital < /tmp/backup.sql
```
4. Start kembali **desa-digital-api**

### Reset Database

Di Portainer → **Stacks** → `desa-digital` → **Stop** → centang **Remove volumes** → **Delete** → Deploy ulang.

---

## 🎨 Logo & Branding (via UI)

1. Login sebagai Superadmin
2. Buka **Pengaturan** → tab **Logo & Branding**
3. Isi:
   - **Nama Aplikasi** — Tampil di login, sidebar, splash screen
   - **URL Logo** — Untuk login & sidebar (PNG/SVG, 200x200px)
   - **URL Logo Splash Screen** — Opsional, untuk splash screen saja
4. Klik **Simpan**
5. **Refresh halaman** untuk melihat perubahan

> Splash screen tampil selama 3 detik saat membuka aplikasi.

---

## 📹 Menambahkan Kamera CCTV

### Persyaratan

- Kamera mendukung **RTSP**
- Kamera terhubung ke jaringan server
- IP kamera **static** (disarankan)

### Format URL RTSP

| Merek | Format |
|-------|--------|
| **Hikvision** | `rtsp://admin:pass@192.168.1.100:554/Streaming/Channels/101` |
| **Dahua** | `rtsp://admin:pass@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0` |
| **TP-Link** | `rtsp://admin:pass@192.168.1.100:554/stream1` |
| **Generic** | `rtsp://admin:pass@192.168.1.100:554/live` |

### Langkah

1. **Test dulu** dengan VLC: Media → Open Network Stream → paste URL RTSP
2. Login Superadmin → **Kamera** → **+ Tambah Kamera**
3. Isi nama, URL RTSP, lokasi, pilih RT
4. **Simpan**

---

## �️ Manajemen via Portainer GUI

Setelah deploy, semua manajemen Docker dilakukan via Portainer (`https://IP:9443`):

| Aksi | Langkah di Portainer |
|------|---------------------|
| **Lihat status** | Stacks → `desa-digital` → lihat semua container |
| **Lihat logs** | Containers → klik container → **Logs** |
| **Restart service** | Containers → klik container → **Restart** |
| **Update stack** | Stacks → `desa-digital` → **Editor** → **Update the stack** |
| **Pull update terbaru** | Stacks → `desa-digital` → centang **Re-pull image** → **Update** |
| **Edit env vars** | Stacks → `desa-digital` → scroll ke Environment → edit → **Update** |
| **Masuk ke console** | Containers → klik container → **Console** → **/bin/sh** |
| **Stop semua** | Stacks → `desa-digital` → **Stop** |
| **Hapus stack** | Stacks → `desa-digital` → **Delete** |

---

## 🔧 Troubleshooting

### Container tidak running (merah)

1. Di Portainer → **Containers** → klik container yang merah
2. Klik **Logs** → lihat error terakhir
3. Klik **Restart**

### Database error

1. Pastikan container `desa-digital-db` running (hijau)
2. Klik container → **Console** → **/bin/sh**
3. Jalankan: `pg_isready -U postgres`

### Kamera offline

1. Test URL RTSP dengan VLC
2. Pastikan kamera bisa diakses dari server (ping IP kamera)
3. Di Portainer → container `desa-digital-ffmpeg` → **Logs**

### Tidak bisa akses aplikasi

1. Pastikan container `desa-digital-proxy` running
2. Cek firewall: port 80 harus terbuka
3. Di Portainer → container `desa-digital-proxy` → **Logs**

### Reset lengkap

1. Portainer → **Stacks** → `desa-digital` → **Delete** (centang remove volumes)
2. Deploy ulang dari repository

---

## 📞 Kontak Support

| Channel | Kontak |
|---------|--------|
| 📧 Email | support@fibernode.id |
| 📱 WhatsApp | +62 xxx-xxxx-xxxx |
| 🌐 Website | https://fibernode.id |

Saat melapor, sertakan:
1. Screenshot error dari Portainer (container logs)
2. Spesifikasi server

---

## 📄 Lisensi

Hak Cipta © 2024 Fibernode. Semua hak dilindungi.

---

<p align="center">
  <b>Desa Digital by Fibernode</b><br>
  <i>"More Than Internet—A True Partner"</i>
</p>
