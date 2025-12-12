import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const admin = cookieStore.get('admin')?.value === '1';
  return NextResponse.json({ admin });
}



