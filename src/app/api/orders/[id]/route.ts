import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET single order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await db.order.findUnique({
      where: { id: params.id },
      include: {
        items: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data pesanan' },
      { status: 500 }
    );
  }
}

// PUT - Update order (e.g., change status)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    const existingOrder = await db.order.findUnique({
      where: { id: params.id }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (status && ['pending', 'confirmed', 'cancelled'].includes(status)) {
      updateData.status = status;
    }

    const updatedOrder = await db.order.update({
      where: { id: params.id },
      data: updateData,
      include: { items: true }
    });

    return NextResponse.json({ 
      message: 'Pesanan berhasil diperbarui',
      order: updatedOrder 
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui pesanan' },
      { status: 500 }
    );
  }
}

// DELETE - Delete order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingOrder = await db.order.findUnique({
      where: { id: params.id }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    await db.order.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      message: 'Pesanan berhasil dihapus' 
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus pesanan' },
      { status: 500 }
    );
  }
}
