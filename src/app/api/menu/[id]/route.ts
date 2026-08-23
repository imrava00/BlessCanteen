import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET single menu by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const menu = await db.weeklyMenu.findUnique({
      where: { id: params.id },
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

    if (!menu) {
      return NextResponse.json(
        { error: 'Menu tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ menu });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data menu' },
      { status: 500 }
    );
  }
}

// PUT - Update entire weekly menu
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { isActive, days } = body;

    // Get existing menu
    const existingMenu = await db.weeklyMenu.findUnique({
      where: { id: params.id }
    });

    if (!existingMenu) {
      return NextResponse.json(
        { error: 'Menu tidak ditemukan' },
        { status: 404 }
      );
    }

    // Update basic fields
    const updateData: any = {};
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    await db.weeklyMenu.update({
      where: { id: params.id },
      data: updateData
    });

    // If days provided, rebuild the entire menu structure
    if (days && Array.isArray(days)) {
      // Delete existing days and their relations (cascade)
      await db.dayMenu.deleteMany({
        where: { weekMenuId: params.id }
      });

      // Recreate all days, categories, and items
      const dayOrderMap: { [key: string]: number } = {
        'Senin': 1,
        'Selasa': 2,
        'Rabu': 3,
        'Kamis': 4,
        'Jumat': 5
      };
      
      for (const day of days) {
        const createdDay = await db.dayMenu.create({
          data: {
            day: day.day,
            dayOrder: dayOrderMap[day.day] || 0,
            weekMenuId: params.id
          }
        });

        for (const cat of day.categories || []) {
          const createdCat = await db.category.create({
            data: {
              name: cat.name,
              icon: cat.icon || '🍽️',
              gradient: cat.gradient || 'from-gray-500 to-gray-400',
              dayMenuId: createdDay.id
            }
          });

          for (const item of cat.items || []) {
            await db.menuItem.create({
              data: {
                name: item.name,
                description: item.description || '',
                price: item.price || 0,
                emoji: item.emoji || '🍽️',
                categoryId: createdCat.id
              }
            });
          }
        }
      }
    }

    // Fetch and return updated menu
    const updatedMenu = await db.weeklyMenu.findUnique({
      where: { id: params.id },
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

    return NextResponse.json({ 
      message: 'Menu berhasil diperbarui',
      menu: updatedMenu 
    });
  } catch (error) {
    console.error('Error updating menu:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui menu' },
      { status: 500 }
    );
  }
}

// DELETE - Delete weekly menu
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingMenu = await db.weeklyMenu.findUnique({
      where: { id: params.id }
    });

    if (!existingMenu) {
      return NextResponse.json(
        { error: 'Menu tidak ditemukan' },
        { status: 404 }
      );
    }

    await db.weeklyMenu.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      message: 'Menu berhasil dihapus' 
    });
  } catch (error) {
    console.error('Error deleting menu:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus menu' },
      { status: 500 }
    );
  }
}
