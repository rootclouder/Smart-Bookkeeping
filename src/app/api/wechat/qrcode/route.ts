import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const sceneId = uuidv4().replace(/-/g, '').substring(0, 32);
    
    // 生成 6 位随机数字验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 将 Session 存入数据库
    await prisma.wechatLoginSession.create({
      data: {
        sceneId,
        code,
        status: 'pending',
      },
    });

    return NextResponse.json({
      sceneId,
      code,
      url: '/wechat-qrcode.png', // 返回固定的本地占位图片路径
      expireSeconds: 300, // 前端也可以基于此倒计时
    });
  } catch (error: any) {
    console.error('Code generation error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
