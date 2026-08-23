import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const prismaSchemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    
    // Create tables
    try {
      execSync(`npx prisma db push --accept-data-loss --schema "${prismaSchemaPath}"`, {
        stdio: 'pipe',
        cwd: process.cwd(),
      });
    } catch (migrateError) {
      return NextResponse.json(
        { error: 'Failed to create database tables' },
        { status: 500 }
      );
    }

    // Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { username: process.env.ADMIN_USERNAME || 'admin' },
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Database already initialized!',
      });
    }

    // Create admin user
    const admin = await prisma.admin.create({
      data: {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        name: process.env.ADMIN_NAME || 'Administrator',
      },
    });

    // Create sample menu items
    const menuCount = await prisma.menuItem.count();
    if (menuCount === 0) {
      await prisma.menuItem.createMany({
        data: [
          { name: 'Nasi Goreng', price: 15000, category: 'Makanan', available: true, description: 'Nasi goreng spesial' },
          { name: 'Mie Goreng', price: 13000, category: 'Makanan', available: true, description: 'Mie goreng spesial' },
          { name: 'Ayam Bakar', price: 18000, category: 'Makanan', available: true, description: 'Ayam bakar bumbu kecap' },
          { name: 'Es Teh Manis', price: 5000, category: 'Minuman', available: true, description: 'Teh manis dingin' },
          { name: 'Es Jeruk', price: 7000, category: 'Minuman', available: true, description: 'Jus jeruk segar' },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully!',
      admin: { username: admin.username, name: admin.name },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Setup failed', details: String(error) },
      { status: 500 }
    );
  }
}