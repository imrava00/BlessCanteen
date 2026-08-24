import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all weekly menus with full details
export async function GET() {
  try {
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

    return NextResponse.json({ weeklyMenus });
  } catch (error) {
    console.error('Error fetching menus:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data menu' },
      { status: 500 }
    );
  }
}

// POST - Create new weekly menu
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekNumber, year, days } = body;

    if (!weekNumber || !year) {
      return NextResponse.json(
        { error: 'Week number dan year harus diisi' },
        { status: 400 }
      );
    }

    // Check if weekly menu already exists
    const existing = await db.weeklyMenu.findUnique({
      where: { weekNumber_year: { weekNumber, year } }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Menu untuk minggu ini sudah ada' },
        { status: 409 }
      );
    }

    // Create weekly menu with days, categories, and items
    const weeklyMenu = await db.weeklyMenu.create({
      data: {
        weekNumber,
        year,
        days: {
          create: days?.map((day: any) => ({
            day: day.day,
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

    return NextResponse.json({ 
      message: 'Weekly menu berhasil dibuat',
      weeklyMenu 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating menu:', error);
    return NextResponse.json(
      { error: 'Gagal membuat menu' },
      { status: 500 }
    );
  }
}
