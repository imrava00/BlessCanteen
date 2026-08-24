import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';

const prisma = new PrismaClient();

// GET /api/setup - Initialize database (create tables + seed admin)
// Run this ONCE after deployment or when database is reset
export async function GET() {
  try {
    // Step 1: Get the schema path
    const prismaSchemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    
    // Step 2: Push schema to database (creates tables if not exist)
    try {
      execSync(`npx prisma db push --accept-data-loss --schema "${prismaSchemaPath}"`, {
        stdio: 'pipe',
        cwd: process.cwd(),
      });
    } catch (migrateError) {
      console.error('Migration error:', migrateError);
      return NextResponse.json(
        { error: 'Failed to create database tables', details: String(migrateError) },
        { status: 500 }
      );
    }

    // Step 3: Check if admin user already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { username: process.env.ADMIN_USERNAME || 'admin' },
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Database already initialized. Admin user exists.',
        note: 'Tables created and admin user already seeded.',
      });
    }

    // Step 4: Create admin user
    const admin = await prisma.admin.create({
      data: {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        name: process.env.ADMIN_NAME || 'Administrator',
      },
    });

    // Step 5: Create sample menu items if none exist
    const menuCount = await prisma.menuItem.count();
    if (menuCount === 0) {
      await prisma.menuItem.createMany({
        data: [
          { name: 'Nasi Goreng', price: 15000, category: 'Makanan', available: true, description: 'Nasi goreng spesial dengan telur dan ayam' },
          { name: 'Mie Goreng', price: 13000, category: 'Makanan', available: true, description: 'Mie goreng dengan sayuran dan bakso' },
          { name: 'Ayam Bakar', price: 18000, category: 'Makanan', available: true, description: 'Ayam bakar bumbu kecap dengan lalapan' },
          { name: 'Es Teh Manis', price: 5000, category: 'Minuman', available: true, description: 'Teh manis dingin segar' },
          { name: 'Es Jeruk', price: 7000, category: 'Minuman', available: true, description: 'Jus jeruk segar' },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully!',
      admin: {
        username: admin.username,
        name: admin.name,
        password: '*** (check your .env for actual password)',
      },
      menuItemsCreated: menuCount === 0 ? 5 : 0,
      nextSteps: [
        'Go to /admin to login with your credentials',
        'DELETE this route or restrict access for security',
      ],
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize database', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
