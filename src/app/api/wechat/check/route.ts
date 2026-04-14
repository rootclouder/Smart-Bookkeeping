import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sceneId = searchParams.get('sceneId');

  if (!sceneId) {
    return NextResponse.json({ error: 'Missing sceneId' }, { status: 400, headers: noStoreHeaders });
  }

  try {
    const session = await prisma.wechatLoginSession.findUnique({
      where: { sceneId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404, headers: noStoreHeaders });
    }

    return NextResponse.json({ status: session.status }, { headers: noStoreHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}
