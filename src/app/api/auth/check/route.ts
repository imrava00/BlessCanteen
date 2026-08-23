import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('admin_session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No session found'
      });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ 
        authenticated: false,
        message: 'Invalid session'
      });
    }

    if (!session.id || !session.username) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'Invalid session data'
      });
    }

    return NextResponse.json({ 
      authenticated: true,
      admin: {
        id: session.id,
        username: session.username,
        name: session.name
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
