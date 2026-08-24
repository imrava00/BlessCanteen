import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all weekly menus with full details
export async function GET() {
  try {
    console.log('📡 [API] Fetching all weekly menus...');
    
    const weeklyMenus = await db.weeklyMenu.findMany({
      orderBy: [
        { year: 'desc' },
        { weekNumber: 'desc' }
      ],
      include: {
        days: {
          orderBy: { dayOrder: 'asc' },
          include: {
            categories: {
              orderBy: { name: 'asc' },
              include: {
                items: {
                  orderBy: { name: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    console.log(`✅ [API] Found ${weeklyMenus.length} weekly menus`);
    return NextResponse.json({ weeklyMenus });
  } catch (error) {
    console.error('❌ [API] Error fetching menus:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data menu', details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Create new weekly menu
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekNumber, year, days } = body;

    console.log(`📥 [API] Creating new week: Week ${weekNumber}, Year ${year}`);
    console.log(`📥 [API] Days data:`, JSON.stringify(days?.map((d: any) => d.day)));

    if (!weekNumber || !year) {
      console.error('❌ [API] Missing weekNumber or year');
      return NextResponse.json(
        { error: 'Week number dan year harus diisi' },
        { status: 400 }
      );
    }

    // Check if weekly menu already exists
    console.log(`🔍 [API] Checking if week ${weekNumber}/${year} already exists...`);
    const existing = await db.weeklyMenu.findUnique({
      where: { weekNumber_year: { weekNumber, year } }
    });

    if (existing) {
      console.warn(`⚠️ [API] Week ${weekNumber}/${year} already exists`);
      return NextResponse.json(
        { error: 'Menu untuk minggu ini sudah ada', existingId: existing.id },
        { status: 409 }
      );
    }

    // Create weekly menu with days, categories, and items
    console.log('🔨 [API] Creating weekly menu structure...');
    
    // Map day names to dayOrder (Senin=1, Selasa=2, ..., Jumat=5)
    const dayOrderMap: Record<string, number> = {
      'Senin': 1,
      'Selasa': 2,
      'Rabu': 3,
      'Kamis': 4,
      'Jumat': 5
    };
    
    const weeklyMenu = await db.weeklyMenu.create({
      data: {
        weekNumber,
        year,
        days: {
          create: days?.map((day: any) => ({
            day: day.day,
            dayOrder: dayOrderMap[day.day] || 0,
            categories: {
              create: day.categories?.map((cat: any) => ({
                name: cat.name,
                icon: cat.icon || '🍽️',
                gradient: cat.gradient || 'from-gray-500 to-gray-400',
                items: {
                  create: cat.items?.map((item: any) => ({
                    name: item.name,
                    description: item.description || '',
                    price: item.price || 0,
                    emoji: item.emoji || '🍽️'
                  })) || []
                }
              })) || []
            }
          })) || []
        }
      },
      include: {
        days: {
          include: {
            categories: {
              include: {
                items: true
              }
            }
          }
        }
      }
    });

    console.log(`✅ [API] Weekly menu created successfully! ID: ${weeklyMenu.id}`);
    
    return NextResponse.json({ 
      message: 'Weekly menu berhasil dibuat',
      weeklyMenu 
    }, { status: 201 });
  } catch (error) {
    console.error('❌ [API] Error creating menu:', error);
    return NextResponse.json(
      { error: 'Gagal membuat menu', details: String(error) },
      { status: 500 }
    );
  }
}
