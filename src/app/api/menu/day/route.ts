import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT - Update menu for a specific day
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, day, categories } = body;

    console.log(`📥 [API Day] Updating menu for date: ${date}, day: ${day}`);

    if (!date || !day) {
      return NextResponse.json(
        { error: 'Date and day are required' },
        { status: 400 }
      );
    }

    // Parse the date
    const targetDate = new Date(date);
    const year = targetDate.getFullYear();
    
    // Calculate week number from date
    const getWeekNumber = (d: Date) => {
      const dateObj = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = dateObj.getUTCDay() || 7;
      dateObj.setUTCDate(dateObj.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(dateObj.getUTCFullYear(), 0, 1));
      return Math.ceil((((dateObj.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    const weekNumber = getWeekNumber(targetDate);

    console.log(`📅 [API Day] Week: ${weekNumber}, Year: ${year}`);

    // Find or create weekly menu
    let weeklyMenu = await db.weeklyMenu.findUnique({
      where: { weekNumber_year: { weekNumber, year } },
      include: {
        days: {
          include: {
            categories: {
              include: { items: true }
            }
          }
        }
      }
    });

    if (!weeklyMenu) {
      console.log('🔨 [API Day] Creating new weekly menu...');
      
      // Create new weekly menu with all days
      const allDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
      
      weeklyMenu = await db.weeklyMenu.create({
        data: {
          weekNumber,
          year,
          days: {
            create: allDays.map((d, idx) => ({
              day: d,
              dayOrder: idx + 1,
              categories: {
                create: [
                  { name: 'Hidangan Utama', icon: '🍽️', gradient: 'from-orange-500 to-red-500' },
                  { name: 'Makanan Ringan', icon: '🍪', gradient: 'from-green-500 to-emerald-400' },
                  { name: 'Tambahan', icon: '🥤', gradient: 'from-blue-500 to-cyan-400' }
                ]
              }
            }))
          }
        },
        include: {
          days: {
            include: {
              categories: {
                include: { items: true }
              }
            }
          }
        }
      });
    }

    // Find the specific day
    let targetDay = weeklyMenu.days.find(d => d.day === day);

    if (!targetDay) {
      console.log(`⚠️ [API Day] Day "${day}" not found in week`);
      return NextResponse.json(
        { error: `Day "${day}" not found in this week` },
        { status: 404 }
      );
    }

    console.log(`✅ [API Day] Found day: ${targetDay.day} (ID: ${targetDay.id})`);

    // Update categories and items for this day
    // First, delete existing items for this day's categories
    for (const category of targetDay.categories) {
      if (category.items.length > 0) {
        await db.menuItem.deleteMany({
          where: { categoryId: category.id }
        });
      }
    }

    // Now update/create items for each category
    for (const catData of categories) {
      const existingCategory = targetDay.categories.find(c => c.name === catData.name);
      
      if (existingCategory && catData.items && catData.items.length > 0) {
        // Create new items
        await db.menuItem.createMany({
          data: catData.items.map((item: any) => ({
            name: item.name,
            description: item.description || '',
            price: item.price || 0,
            emoji: item.emoji || '🍽️',
            categoryId: existingCategory.id
          }))
        });
        
        console.log(`  ✅ Added ${catData.items.length} items to ${catData.name}`);
      }
    }

    // Fetch updated data
    const updatedMenu = await db.weeklyMenu.findUnique({
      where: { id: weeklyMenu.id },
      include: {
        days: {
          orderBy: { dayOrder: 'asc' },
          include: {
            categories: {
              orderBy: { name: 'asc' },
              include: {
                items: { orderBy: { name: 'asc' } }
              }
            }
          }
        }
      }
    });

    console.log(`✅ [API Day] Menu updated successfully!`);

    return NextResponse.json({
      message: 'Menu berhasil diperbarui',
      day: updatedMenu?.days.find(d => d.day === day),
      weeklyMenu: updatedMenu
    });

  } catch (error) {
    console.error('❌ [API Day] Error:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui menu', details: String(error) },
      { status: 500 }
    );
  }
}
