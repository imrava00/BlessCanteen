# School Catering - Sistem Pemesanan Katering Sekolah

Sistem pemesanan katering sekolah lengkap dengan panel admin dan halaman customer.

## 🚀 Fitur Utama

### 🛒 Halaman Customer (`/`)
- Form registrasi data siswa
- Pilihan menu per hari (Senin - Jumat)
- 3 kategori: Hidangan Utama, Makanan Ringan, Tambahan
- Keranjang belanja real-time
- Ringkasan pesanan
- Konfirmasi pesanan
- Integrasi WhatsApp untuk konfirmasi

### 👨‍💼 Panel Admin (`/admin`)
- Dashboard statististik (pesanan & pendapatan)
- Kelola menu mingguan (CRUD)
- Ubah harga menu
- Lihat daftar pesanan
- Update status pesanan
- Filter & pencarian pesanan

## 🔐 Login Admin

- **URL:** `/admin`
- **Username:** `admin`
- **Password:** `admin123`

## 📁 Struktur Proyek

```
src/
├── app/
│   ├── page.tsx              # Halaman customer (pemesanan)
│   ├── admin/
│   │   └── page.tsx          # Panel admin
│   ├── layout.tsx            # Root layout
│   └── api/
│       ├── auth/             # Authentication API
│       ├── menu/             # Menu CRUD API
│       ├── stats/route.ts    # Statistics API
│       └── orders/           # Orders API
├── components/ui/            # shadcn/ui components
├── hooks/
│   └── use-toast.ts          # Toast hook
├── lib/
│   ├── db.ts                 # Prisma client
│   └── utils.ts              # Utilities
prisma/
├── schema.prisma             # Database schema
└── seed.ts                   # Seed data
```

## 🚀 Instalasi & Running

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env

# 3. Push database schema
npx prisma db push

# 4. Seed data (admin user + sample menu)
npx tsx prisma/seed.ts

# 5. Run development server
npm run dev
```

Buka di browser:
- **Customer:** http://localhost:3000
- **Admin:** http://localhost:3000/admin

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** SQLite + Prisma ORM
- **UI:** Tailwind CSS + shadcn/ui
- **Auth:** Cookie-based session
- **Icons:** Lucide React

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login admin |
| GET | `/api/auth/check` | Check session |
| POST | `/api/auth/logout` | Logout |

### Menu
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | Get all weekly menus |
| POST | `/api/menu` | Create weekly menu |
| PUT | `/api/menu/[id]` | Update menu |
| DELETE | `/api/menu/[id]` | Delete menu |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get orders (pagination) |
| POST | `/api/orders` | Create order |
| PUT | `/api/orders/[id]` | Update status |
| DELETE | `/api/orders/[id]` | Delete order |

### Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Get dashboard statistics |

## 💾 Database Schema

- **Admin** - User admin untuk login
- **WeeklyMenu** - Konfigurasi menu mingguan
- **DayMenu** - Menu per hari (Senin-Jumat)
- **Category** - Kategori makanan (3 per hari)
- **MenuItem** - Item menu dengan harga
- **Order** - Data pesanan customer
- **OrderItem** - Item dalam pesanan

## 📝 Environment Variables

```env
DATABASE_URL="file:./db/custom.db"
```

## 🎨 Fitur UI

- ✅ Responsive design (mobile & desktop)
- ✅ Dark/Light mode ready
- ✅ Toast notifications
- ✅ Loading states
- ✅ Smooth animations
- ✅ Color-coded categories
- ✅ Real-time cart updates
- ✅ WhatsApp integration

## 📄 License

MIT License - Free to use for personal and commercial projects.
