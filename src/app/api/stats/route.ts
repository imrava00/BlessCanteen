import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get order statistics
export async function GET() {
  try {
    // Total orders
    const totalOrders = await db.order.count();

    // Orders today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const ordersToday = await db.order.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // This week's orders
    const startOfWeek = new Date(today);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const ordersThisWeek = await db.order.count({
      where: {
        createdAt: {
          gte: startOfWeek
        }
      }
    });

    // This month's orders
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const ordersThisMonth = await db.order.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    // Revenue calculations
    const totalRevenueResult = await db.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: { not: 'cancelled' } }
    });

    const todayRevenueResult = await db.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        },
        status: { not: 'cancelled' }
      }
    });

    const weekRevenueResult = await db.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: {
          gte: startOfWeek
        },
        status: { not: 'cancelled' }
      }
    });

    // Orders per day (for chart)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await db.order.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      });

      const revenue = await db.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          },
          status: { not: 'cancelled' }
        }
      });

      last7Days.push({
        date: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
        orders: count,
        revenue: revenue._sum.totalAmount || 0
      });
    }

    // Orders by status
    const pendingOrders = await db.order.count({ where: { status: 'pending' } });
    const confirmedOrders = await db.order.count({ where: { status: 'confirmed' } });
    const cancelledOrders = await db.order.count({ where: { status: 'cancelled' } });

    // Recent orders (last 10)
    const recentOrders = await db.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true
      }
    });

    return NextResponse.json({
      summary: {
        totalOrders,
        ordersToday,
        ordersThisWeek,
        ordersThisMonth,
        totalRevenue: totalRevenueResult._sum.totalAmount || 0,
        todayRevenue: todayRevenueResult._sum.totalAmount || 0,
        weekRevenue: weekRevenueResult._sum.totalAmount || 0
      },
      byStatus: {
        pending: pendingOrders,
        confirmed: confirmedOrders,
        cancelled: cancelledOrders
      },
      last7Days,
      recentOrders
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil statistik' },
      { status: 500 }
    );
  }
}
