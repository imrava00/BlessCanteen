# 🚀 Panduan Deploy Bless Canteen ke Vercel

## 📋 Prasyarat

- Akun [Vercel](https://vercel.com) (gratis)
- Akun GitHub/GitLab/Bitbucket
- Database PostgreSQL (Vercel Postgres, Neon, atau Supabase)

---

## 🔧 Langkah 1: Setup Database (PENTING!)

### Opsi A: Vercel Postgres (Direkomendasikan)

1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Klik **Storage** → **Create Database**
3. Pilih **Postgres**
4. Set nama database (contoh: `bless-canteen-db`)
5. Klik **Create Database**

Setelah dibuat, copy **DATABASE_URL** (format: `postgresql://user:password@host:5432/dbname?schema=public`)

### Opsi B: Neon (Free Tier Besar)

1. Daftar di [Neon](https://neon.tech)
2. Buat project baru
3. Copy **Connection string** dari dashboard

### Opsi C: Supabase

1. Daftar di [Supabase](https://supabase.com)
2. Buat project baru
3. Go to **Settings** → **Database**
4. Copy **Connection string**

---

## 📁 Langkah 2: Push ke GitHub

```bash
# Di komputer lokal Anda (folder project)
cd ~/Documents/BlessCanteen

# Init git jika belum
git init

# Tambahkan semua file
git add .

# Commit pertama
git commit -m "Initial commit - Bless Canteen"

# Buat repository di GitHub, lalu:
git remote add origin https://github.com/USERNAME/bless-canteen.git
git branch -M main
git push -u origin main
```

---

## 🌐 Langkah 3: Deploy ke Vercel

### Via Vercel Dashboard (Mudah)

1. Buka [vercel.com](https://vercel.com) dan login
2. Klik **"Add New..."** → **"Project"**
3. Pilih repository **bless-canteen** dari GitHub
4. Vercel akan auto-detect ini adalah Next.js project

### Konfigurasi Environment Variables

Di halaman deploy, klik **Environment Variables** dan tambahkan:

| Variable | Value | Keterangan |
|----------|-------|------------|
| `DATABASE_URL` | `postgresql://...` | Dari langkah 1 |
| `NODE_ENV` | `production` | Otomatis |

Klik **Deploy** dan tunggu proses build selesai.

---

## ✅ Langkah 4: Setup Database Schema

Setelah deploy berhasil, jalankan migration:

### Opsi A: Via Vercel CLI (jika terinstall)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Jalankan database push
vercel env pull .env.local
npx prisma db push
```

### Opsi B: Remote Database (Lebih Mudah)

1. Buka dashboard database Anda (Neon/Supabase/Vercel)
2. Buka **SQL Editor**
3. Copy-paste schema dari file `prisma/schema.prisma`
4. Atau gunakan Prisma secara lokal:

```bash
# Set DATABASE_URL ke production
export DATABASE_URL="postgresql://production-url-here"

# Push schema
npx prisma db push

# Seed data awal (admin user + sample menu)
npx prisma db seed
```

---

## 🌱 Langkah 5: Seed Data Awal

Jalankan seed untuk membuat admin user dan menu contoh:

```bash
# Pastikan .env sudah benar
npx prisma db seed
```

**Default Login Admin:**
- Username: `admin`
- Password: `admin123`

⚠️ **UBAH PASSWORD setelah first login!**

---

## 🔒 Langkah 6: Keamanan (WAJIB!)

### 1. Ganti Password Default

Login ke `/admin` → Ganti password di database atau update via SQL:

```sql
UPDATE "Admin" SET password = '$2a$10$newhashedpassword' WHERE username = 'admin';
```

### 2. Set Domain Custom (Opsional)

1. Di Vercel Dashboard → Project Settings → Domains
2. Tambahkan domain Anda (contoh: `canteen.sekolah.id`)
3. Update DNS records sesuai instruksi Vercel

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@prisma/client'"

```bash
rm -rf node_modules .next
npm install
npm run build
```

### Error: Database Connection

Pastikan `DATABASE_URL` benar dan database accessible dari Vercel.

### Error: Build Failed

Cek build logs di Vercel Dashboard → Deployments → pilih deployment → Functions

---

## 📊 Fitur yang Sudah Siap

✅ Halaman pemesanan customer (`/`)  
✅ Admin dashboard (`/admin`)  
✅ Kelola menu mingguan  
✅ Ringkasan persiapan (jumlah pesanan per menu)  
✅ Status pesanan (Pending/Confirmed/Cancelled)  
✅ Integrasi WhatsApp  
✅ Format tanggal dd/mm/yyyy  
✅ Responsive design (mobile-friendly)  

---

## 💰 Biaya Estimasi

| Service | Free Tier | Paid |
|---------|-----------|------|
| Vercel (Hobby) | 100GB bandwidth/bulan | $20/bulan |
| Vercel Postgres | 256MB storage | $9/bulan |
| Neon | 0.5GB storage | Free tier generous |
| Supabase | 500MB database | $25/bulan |

**Total untuk start: GRATIS!** 🎉

---

## 📞 Bantuan

- Dokumentasi Vercel: [vercel.com/docs](https://vercel.com/docs)
- Dokumentasi Prisma: [prisma.io/docs](https://www.prisma.io/docs)
- Issue? Cek logs di Vercel Dashboard

---

**Selamat meng-deploy! 🚀**
