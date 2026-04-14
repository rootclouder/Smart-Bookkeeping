import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sceneId = searchParams.get('sceneId');

  if (!sceneId) {
    return NextResponse.json({ error: 'Missing sceneId' }, { status: 400 });
  }

  try {
    const session = await prisma.wechatLoginSession.findUnique({
      where: { sceneId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ status: session.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
