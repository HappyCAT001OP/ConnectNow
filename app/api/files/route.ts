import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
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
  } catch (error) {
    console.error('File upload API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}