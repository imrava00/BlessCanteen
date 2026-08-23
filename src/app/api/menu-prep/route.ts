import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get preparation summary for a specific week (orders grouped by menu item)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekNumber = searchParams.get('weekNumber');
    const year = searchParams.get('year');

    if (!weekNumber || !year) {
      return NextResponse.json(
        { error: 'Parameter weekNumber dan year diperlukan' },
        { status: 400 }
      );
    }

    // Get all orders for this week (only confirmed and pending orders - not cancelled)
    const orders = await db.order.findMany({
      where: {
        weekNumber: parseInt(weekNumber),
        year: parseInt(year),
        status: { in: ['pending', 'confirmed'] }
      },
      include: {
        items: true
      }
    });

    // Aggregate orders by day and menu item
    const prepSummary: Record<string, {
      day: string;
      itemName: string;
      categoryName: string;
      itemEmoji: string;
      totalQuantity: number;
      totalPrice: number;
      orderCount: number;
    }> = {};

    // Day order for sorting
    const dayOrder: Record<string, number> = {
      'Senin': 1,
      'Selasa': 2,
      'Rabu': 3,
      'Kamis': 4,
      'Jumat': 5
    };

    orders.forEach(order => {
      order.items.forEach(item => {
        const key = `${item.day}-${item.itemName}`;
        
        if (prepSummary[key]) {
          prepSummary[key].totalQuantity += item.quantity;
          prepSummary[key].totalPrice += item.price * item.quantity;
          prepSummary[key].orderCount += 1;
        } else {
          prepSummary[key] = {
            day: item.day,
            itemName: item.itemName,
            categoryName: item.categoryName,
            itemEmoji: item.itemEmoji || '',
            totalQuantity: item.quantity,
            totalPrice: item.price * item.quantity,
            orderCount: 1
          };
        }
      });
    });

    // Convert to array and sort by day then by item name
    const summaryArray = Object.values(prepSummary).sort((a, b) => {
      const dayA = dayOrder[a.day] || 99;
      const dayB = dayOrder[b.day] || 99;
      if (dayA !== dayB) return dayA - dayB;
      return a.itemName.localeCompare(b.itemName);
    });

    // Group by day for easier display
    const groupedByDay: Record<string, typeof summaryArray> = {};
    summaryArray.forEach(item => {
      if (!groupedByDay[item.day]) {
        groupedByDay[item.day] = [];
      }
      groupedByDay[item.day].push(item);
    });

    // Calculate totals
    const totalItems = summaryArray.reduce((sum, item) => sum + item.totalQuantity, 0);
    const totalRevenue = summaryArray.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalOrders = orders.length;

    return NextResponse.json({
      weekNumber: parseInt(weekNumber),
      year: parseInt(year),
      summary: summaryArray,
      groupedByDay,
      totals: {
        items: totalItems,
        revenue: totalRevenue,
        orders: totalOrders
      }
    });
  } catch (error) {
    console.error('Error fetching prep summary:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data persiapan' },
      { status: 500 }
    );
  }
}
