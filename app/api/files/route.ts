import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { url, name, userId } = await req.json();
  const file = await prisma.file.create({
    data: {
      url,
      name,
      userId,
    },
  });
  return NextResponse.json(file);
} 