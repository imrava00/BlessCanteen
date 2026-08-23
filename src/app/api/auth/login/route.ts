import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { compare } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password harus diisi' },
        { status: 400 }
      );
    }

    // Find admin user
    const admin = await db.admin.findUnique({
      where: { username }
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await compare(password, admin.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Return admin info (excluding password)
    const { password: _, ...adminData } = admin;

    // Create session token
    const response = NextResponse.json({
      message: 'Login berhasil',
      admin: adminData,
      token: Buffer.from(JSON.stringify({ 
        id: admin.id, 
        username: admin.username,
        timestamp: Date.now() 
      })).toString('base64')
    });

    // Set a simple cookie for session management
    response.cookies.set('admin_session', JSON.stringify({
      id: admin.id,
      username: admin.username,
      name: admin.name
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
