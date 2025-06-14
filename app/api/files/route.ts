import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Accept extra fields but only use url, name, userId
  const body = await req.json();
  const { url, name, userId } = body;
  if (!url || !name || !userId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const file = await prisma.file.create({
    data: {
      url,
      name,
      userId,
    },
  });
  return NextResponse.json(file);
}