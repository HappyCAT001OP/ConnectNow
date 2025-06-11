import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const messages = await prisma.message.findMany({
    include: { user: true, file: true },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const { userId, username, text, fileId } = await req.json();
  const message = await prisma.message.create({
    data: {
      userId,
      text,
      fileId,
      user: {
        connectOrCreate: {
          where: { id: userId },
          create: { id: userId, username, email: `${userId}@example.com` },
        },
      },
    },
    include: { user: true, file: true },
  });
  return NextResponse.json(message);
} 