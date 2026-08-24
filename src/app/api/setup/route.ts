import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// GET - Check database status and show setup form
export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check if admin exists
    const adminCount = await prisma.admin.count();
    const menuCount = await prisma.weeklyMenu.count();
    
    return NextResponse.json({
      status: 'connected',
      message: 'Database connected successfully',
      data: {
        adminCount,
        menuCount,
        hasAdmin: adminCount > 0,
        hasMenus: menuCount > 0
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      help: {
        step1: 'Create a PostgreSQL database (Vercel Postgres, Neon, or Supabase)',
        step2: 'Set DATABASE_URL in Vercel Environment Variables',
        step3: 'Redeploy the application',
        step4: 'Visit this URL again to setup'
      }
    }, { status: 500 });
  }
}

// POST - Initialize database (create tables & seed data)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, adminUsername, adminPassword, adminName } = body;
    
    if (action === 'setup-admin') {
      // Create admin user
      const username = adminUsername || process.env.ADMIN_USERNAME || 'admin';
      const password = adminPassword || process.env.ADMIN_PASSWORD || 'admin123';
      const name = adminName || process.env.ADMIN_NAME || 'Administrator Bless Canteen';
      
      const hashedPassword = await hash(password, 10);
      
      // Check if admin already exists
      const existing = await prisma.admin.findUnique({ where: { username } });
      
      if (existing) {
        // Update existing admin
        await prisma.admin.update({
          where: { id: existing.id },
          data: { username, password: hashedPassword, name }
        });
      } else {
        // Create new admin
        await prisma.admin.create({
          data: { username, password: hashedPassword, name, role: 'admin' }
        });
      }
      
      return NextResponse.json({
        success: true,
        message: `Admin user '${username}' created/updated successfully`,
        login: { username, password }
      });
    }
    
    if (action === 'setup-sample-data') {
      // Create sample weekly menus for current week + next 3 weeks
      const now = new Date();
      const currentWeekNumber = getWeekNumber(now);
      const year = now.getFullYear();
      
      const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
      
      for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
        const weekNumber = currentWeekNumber + weekOffset;
        
        const weeklyMenu = await prisma.weeklyMenu.upsert({
          where: { weekNumber_year: { weekNumber, year } },
          update: {},
          create: {
            weekNumber,
            year,
            isActive: weekOffset === 0
          }
        });
        
        // Create days
        const dayMenus = [];
        for (let i = 0; i < days.length; i++) {
          const dayMenu = await prisma.dayMenu.upsert({
            where: { day_weekMenuId: { day: days[i], weekMenuId: weeklyMenu.id } },
            update: { dayOrder: i + 1 },
            create: { day: days[i], dayOrder: i + 1, weekMenuId: weeklyMenu.id }
          });
          dayMenus.push(dayMenu);
        }
        
        // Sample menus
        const sampleData = getSampleMenuData();
        
        for (const dayData of sampleData) {
          const dayMenu = dayMenus.find(d => d.day === dayData.day);
          if (!dayMenu) continue;
          
          for (const catData of dayData.categories) {
            const category = await prisma.category.upsert({
              where: { name_dayMenuId: { name: catData.name, dayMenuId: dayMenu.id } },
              update: { icon: catData.icon, gradient: catData.gradient },
              create: { name: catData.name, icon: catData.icon, gradient: catData.gradient, dayMenuId: dayMenu.id }
            });
            
            for (const itemData of catData.items) {
              await prisma.menuItem.upsert({
                where: { id: `${category.id}-${itemData.name.replace(/\s+/g, '-').toLowerCase()}` },
                update: { description: itemData.description, price: itemData.price, emoji: itemData.emoji },
                create: {
                  id: `${category.id}-${itemData.name.replace(/\s+/g, '-').toLowerCase()}`,
                  name: itemData.name,
                  description: itemData.description,
                  price: itemData.price,
                  emoji: itemData.emoji,
                  categoryId: category.id
                }
              });
            }
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Sample menu data created for 4 weeks'
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getSampleMenuData() {
  return [
    {
      day: 'Senin',
      categories: [
        { name: 'Hidangan Utama', icon: '🍛', gradient: 'from-orange-500 to-red-500', items: [
          { name: 'Nasi Ayam Bakar', description: 'Nasi dengan ayam bakar dan sayuran segar', price: 15000, emoji: '🍗' },
          { name: 'Mie Sapi', description: 'Mie dengan irisan daging sapi dan kuah kental', price: 18000, emoji: '🍜' },
          { name: 'Pasta Sayuran', description: 'Pasta dengan sayuran musiman dalam saus tomat', price: 14000, emoji: '🍝' },
          { name: 'Nasi Goreng Spesial', description: 'Nasi goreng dengan telur dan ayam suwir', price: 16000, emoji: '🍳' }
        ]},
        { name: 'Makanan Ringan', icon: '🥪', gradient: 'from-green-500 to-emerald-400', items: [
          { name: 'Buah Potong', description: 'Aneka buah segar musiman', price: 5000, emoji: '🍎' },
          { name: 'Salad Buah', description: 'Salad campuran buah dengan yogurt', price: 8000, emoji: '🥗' },
          { name: 'Roti Bakar', description: 'Roti bakar dengan selai coklat', price: 6000, emoji: '🍞' },
          { name: 'Kentang Goreng', description: 'Kentang goreng renyah dengan saus', price: 7000, emoji: '🍟' }
        ]},
        { name: 'Tambahan', icon: '🥤', gradient: 'from-blue-500 to-cyan-400', items: [
          { name: 'Jus Kotak', description: 'Jus apel atau jeruk', price: 4000, emoji: '🧃' },
          { name: 'Susu Coklat', description: 'Susu coklat hangat atau dingin', price: 5000, emoji: '🍫' },
          { name: 'Es Teh Manis', description: 'Es teh manis segar', price: 3000, emoji: '🧊' },
          { name: 'Air Mineral', description: 'Air mineral botolan 600ml', price: 2000, emoji: '💧' }
        ]}
      ]
    },
    {
      day: 'Selasa',
      categories: [
        { name: 'Hidangan Utama', icon: '🍛', gradient: 'from-orange-500 to-red-500', items: [
          { name: 'Fish & Chips', description: 'Filet ikan goreng renyah dengan kentang', price: 20000, emoji: '🐟' },
          { name: 'Wrap Ayam', description: 'Wrap ayam panggang dengan selada dan keju', price: 16000, emoji: '🌯' },
          { name: 'Bowl Sayuran', description: 'Bowl quinoa dengan sayuran panggang', price: 17000, emoji: '🥣' },
          { name: 'Soto Ayam', description: 'Soto ayam khas Jawa dengan nasi', price: 15000, emoji: '🍲' }
        ]},
        { name: 'Makanan Ringan', icon: '🥪', gradient: 'from-green-500 to-emerald-400', items: [
          { name: 'Pisang Goreng', description: 'Pisang goreng crispy dengan madu', price: 5000, emoji: '🍌' },
          { name: 'Lumpia Semarang', description: 'Lumpia isi rebung dan ayam', price: 8000, emoji: '🥟' },
          { name: 'Pudding Coklat', description: 'Puding lembut dengan saus coklat', price: 6000, emoji: '🍮' },
          { name: 'Cheese Stick', description: 'Keju mozarella crispy', price: 7000, emoji: '🧀' }
        ]},
        { name: 'Tambahan', icon: '🥤', gradient: 'from-blue-500 to-cyan-400', items: [
          { name: 'Susu Putih', description: 'Susu segar (plain)', price: 4000, emoji: '🥛' },
          { name: 'Jus Alpukat', description: 'Jus alpukat segar dengan susu', price: 8000, emoji: '🥑' },
          { name: 'Es Jeruk', description: 'Es jeruk peras segar', price: 5000, emoji: '🍊' },
          { name: 'Teh Botol', description: 'Teh manis botolan', price: 4000, emoji: '🫖' }
        ]}
      ]
    },
    {
      day: 'Rabu',
      categories: [
        { name: 'Hidangan Utama', icon: '🍛', gradient: 'from-orange-500 to-red-500', items: [
          { name: 'Spaghetti Bolognese', description: 'Pasta klasik dengan saus daging', price: 18000, emoji: '🍝' },
          { name: 'Ayam Teriyaki', description: 'Ayam teriyaki dengan nasi dan edamame', price: 20000, emoji: '🍗' },
          { name: 'Sandwich Keju', description: 'Sandwich keju panggang dengan sup tomat', price: 13000, emoji: '🥪' },
          { name: 'Nasi Kuning Komplit', description: 'Nasi kuning dengan lauk lengkap', price: 17000, emoji: '🟡' }
        ]},
        { name: 'Makanan Ringan', icon: '🥪', gradient: 'from-green-500 to-emerald-400', items: [
          { name: 'Parfait Yogurt', description: 'Yogurt dengan granola dan beri', price: 9000, emoji: '🍨' },
          { name: 'Martabak Mini', description: 'Martabak mini manis/gurih', price: 8000, emoji: '🥞' },
          { name: 'Onde-Onde', description: 'Onde-onde isi kacang hijau', price: 5000, emoji: '🟢' },
          { name: 'Biskuit & Susu', description: 'Paket biskuit dengan susu', price: 6000, emoji: '🍪' }
        ]},
        { name: 'Tambahan', icon: '🥤', gradient: 'from-blue-500 to-cyan-400', items: [
          { name: 'Smoothie Berry', description: 'Smoothie campuran berry segar', price: 10000, emoji: '🫐' },
          { name: 'Kopi Susu', description: 'Kopi susu gula aren', price: 8000, emoji: '☕' },
          { name: 'Es Campur', description: 'Es campur dengan topping lengkap', price: 12000, emoji: '🍧' },
          { name: 'Air Kelapa Muda', description: 'Air kelapa muda segar', price: 10000, emoji: '🥥' }
        ]}
      ]
    },
    {
      day: 'Kamis',
      categories: [
        { name: 'Hidangan Utama', icon: '🍛', gradient: 'from-orange-500 to-red-500', items: [
          { name: 'Nasi Babi Panggang', description: 'Babi panggang dengan kentang tumbuk', price: 22000, emoji: '🐷' },
          { name: 'Wrap Caesar', description: 'Salad caesar ayam dalam tortilla', price: 17000, emoji: '🌯' },
          { name: 'Sup Minestrone', description: 'Sup sayuran bergizi dengan roti', price: 12000, emoji: '🍲' },
          { name: 'Rendang Sapi', description: 'Rendang sapi empuk dengan nasi putih', price: 22000, emoji: '🥩' }
        ]},
        { name: 'Makanan Ringan', icon: '🥪', gradient: 'from-green-500 to-emerald-400', items: [
          { name: 'Potongan Apel', description: 'Apel segar dengan saus karamel', price: 5000, emoji: '🍏' },
          { name: 'Pasta Salad', description: 'Salad pasta dengan mayones', price: 8000, emoji: '🥗' },
          { name: 'Kue Lapis', description: 'Kue lapis tradisional', price: 6000, emoji: '🍰' },
          { name: 'Peanut Butter Sandwich', description: 'Sandwich selai kacang', price: 7000, emoji: '🥜' }
        ]},
        { name: 'Tambahan', icon: '🥤', gradient: 'from-blue-500 to-cyan-400', items: [
          { name: 'Es Teh Lemon', description: 'Es teh dengan lemon segar', price: 5000, emoji: '🍋' },
          { name: 'Jus Mangga', description: 'Jus mangga harum manis', price: 9000, emoji: '🥭' },
          { name: 'Susu Jahe', description: 'Susu jahe hangat', price: 6000, emoji: '🫚' },
          { name: 'Teh Tarik', description: 'Teh tarik creamy', price: 7000, emoji: '🫖' }
        ]}
      ]
    },
    {
      day: 'Jumat',
      categories: [
        { name: 'Hidangan Utama', icon: '🍛', gradient: 'from-orange-500 to-red-500', items: [
          { name: 'Pizza Meal', description: 'Dua potong pizza dengan salad sampingan', price: 19000, emoji: '🍕' },
          { name: 'Piring Taco', description: 'Dua taco dengan nasi dan kacang', price: 20000, emoji: '🌮' },
          { name: 'Box Sushi', description: 'Aneka sushi gulung dengan sup miso', price: 25000, emoji: '🍣' },
          { name: 'Nasi Goreng Seafood', description: 'Nasi goreng dengan seafood pilihan', price: 21000, emoji: '🦐' }
        ]},
        { name: 'Makanan Ringan', icon: '🥪', gradient: 'from-green-500 to-emerald-400', items: [
          { name: 'Brownies', description: 'Brownies coklat homemade', price: 8000, emoji: '🍫' },
          { name: 'Donat Glaze', description: 'Donat dengan glaze manis', price: 6000, emoji: '🍩' },
          { name: 'Es Krim Cup', description: 'Es krim cup berbagai rasa', price: 7000, emoji: '🍦' },
          { name: 'Bakso Kuah', description: 'Bakso sapi dengan kuah hangat', price: 12000, emoji: '🍢' }
        ]},
        { name: 'Tambahan', icon: '🥤', gradient: 'from-blue-500 to-cyan-400', items: [
          { name: 'Jus Campur', description: 'Jus buah segar campuran', price: 8000, emoji: '🧃' },
          { name: 'Matcha Latte', description: 'Latte matcha premium', price: 12000, emoji: '🍵' },
          { name: 'Kelapa Muda Es', description: 'Es kelapa muda segar', price: 10000, emoji: '🥥' },
          { name: 'Yakult', description: 'Minuman probiotik', price: 4000, emoji: '🥤' }
        ]}
      ]
    }
  ];
}
