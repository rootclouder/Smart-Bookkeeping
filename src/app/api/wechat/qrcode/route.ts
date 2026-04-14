import { NextResponse } from 'next/server';
import { getWechatAccessToken } from '@/lib/wechat';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const sceneId = uuidv4().replace(/-/g, '').substring(0, 32); // 微信要求长度限制
    const token = await getWechatAccessToken();

    // 生成带参数的临时二维码（有效期 5 分钟）
    const res = await fetch(`https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${token}`, {
      method: 'POST',
      body: JSON.stringify({
        expire_seconds: 300,
        action_name: 'QR_STR_SCENE',
        action_info: {
          scene: {
            scene_str: sceneId,
          },
        },
      }),
    });

    const data = await res.json();

    if (!data.ticket) {
      return NextResponse.json({ error: 'Failed to generate QR Code', details: data }, { status: 500 });
    }

    // 将 Session 存入数据库
    await prisma.wechatLoginSession.create({
      data: {
        sceneId,
        ticket: data.ticket,
        status: 'pending',
      },
    });

    return NextResponse.json({
      sceneId,
      ticket: data.ticket,
      url: `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(data.ticket)}`,
      expireSeconds: data.expire_seconds,
    });
  } catch (error: any) {
    console.error('QR Code error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
