import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: 'Admin password not configured' },
        { status: 500 }
      );
    }

    if (password === adminPassword) {
      // Skapa en JWT token
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key');
      const token = await new SignJWT({ role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);
      
      return NextResponse.json({ 
        success: true,
        token
      });
    } else {
      return NextResponse.json(
        { error: 'Felaktigt lösenord' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error in admin verification:', error);
    return NextResponse.json(
      { error: 'Ett fel uppstod' },
      { status: 500 }
    );
  }
} 