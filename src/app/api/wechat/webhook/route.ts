import { NextRequest, NextResponse } from 'next/server';
import { checkWechatSignature, parseWechatXml, buildWechatXml, getWechatAccessToken } from '@/lib/wechat';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const signature = searchParams.get('signature') || '';
  const timestamp = searchParams.get('timestamp') || '';
  const nonce = searchParams.get('nonce') || '';
  const echostr = searchParams.get('echostr') || '';

  if (checkWechatSignature(signature, timestamp, nonce)) {
    return new NextResponse(echostr, { status: 200 });
  } else {
    return new NextResponse('Invalid signature', { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const signature = searchParams.get('signature') || '';
  const timestamp = searchParams.get('timestamp') || '';
  const nonce = searchParams.get('nonce') || '';

  // if (!checkWechatSignature(signature, timestamp, nonce)) {
  //   return new NextResponse('Invalid signature', { status: 403 });
  // }

  const xmlBody = await req.text();
  const message = await parseWechatXml(xmlBody);

  if (!message) {
    return new NextResponse('success', { status: 200 });
  }

  const { ToUserName, FromUserName, CreateTime, MsgType, Event, EventKey, Content } = message;
  let replyContent = '';

  try {
    // 1. 处理扫码关注/登录事件（如果以后有了服务号也能兼容）
    if (MsgType === 'event' && (Event === 'subscribe' || Event === 'SCAN')) {
      let sceneId = EventKey || '';
      
      if (Event === 'subscribe' && sceneId.startsWith('qrscene_')) {
        sceneId = sceneId.replace('qrscene_', '');
      }

      if (sceneId) {
        // MUST ensure user exists BEFORE updating session to scanned
        await ensureUserExists(FromUserName);

        await prisma.wechatLoginSession.updateMany({
          where: { sceneId },
          data: { status: 'scanned', openid: FromUserName },
        });

        replyContent = '登录成功！您可以返回网页继续操作。您也可以直接发送“餐饮 50”格式的消息来记账。';
      } else if (Event === 'subscribe') {
        replyContent = '欢迎关注智慧财务管理！请回复网页上显示的 6 位验证码进行登录，或直接回复如“餐饮 50”来记账。';
      }
    }

    // 2. 处理文本消息（验证码登录 或 记账）
    else if (MsgType === 'text' && Content) {
      const textContent = Content.trim();
      
      // 检查是否为 6 位数字验证码
      if (/^\d{6}$/.test(textContent)) {
        // 查找对应的 pending 登录会话
        const session = await prisma.wechatLoginSession.findFirst({
          where: { 
            code: textContent,
            status: 'pending'
          },
          orderBy: { createdAt: 'desc' }
        });

        if (session) {
          // 1. MUST ensure user and account exist BEFORE marking session as scanned!
          // Otherwise frontend check will race and fail NextAuth authorize
          await ensureUserExists(FromUserName);

          // 2. Mark as scanned to release the frontend polling
          await prisma.wechatLoginSession.update({
            where: { id: session.id },
            data: { status: 'scanned', openid: FromUserName },
          });

          replyContent = '登录成功！网页端即将自动跳转。后续可直接在此发送如“餐饮 50”进行记账。';
        } else {
          replyContent = '验证码错误或已过期，请在网页端刷新二维码后重试。';
        }
      } 
      // 不是验证码，则走记账逻辑
      else {
        const user = await ensureUserExists(FromUserName);
        const parseResult = parseBookkeepingMessage(textContent);
      
      if (!parseResult) {
        replyContent = '未能识别记账格式。请尝试回复如：\n餐饮 50\n工资 5000 收入\n打车 20 备注信息';
      } else {
        const { amount, category, type, description } = parseResult;
        
        // 我们假设 default account, 实际中需要用户选择或设定默认
        const stateSync = await prisma.appStateSync.findUnique({
          where: { userId: user.id }
        });

        if (!stateSync) {
          replyContent = '您还没有初始化账本，请先在网页端登录一次。';
        } else {
          // 这里我们只是回复成功，因为完整修改 JSON 状态树在此处略显复杂
          // 在生产中，我们应直接在 Zustand JSON 里添加 Transaction
          const state: any = stateSync.state || { transactions: [] };
          if (!state.transactions) state.transactions = [];
          
          state.transactions.push({
            id: crypto.randomUUID(),
            accountId: state.accounts?.[0]?.id || 'default',
            categoryId: 'uncategorized', // 可以根据文本匹配具体 categoryId
            amount,
            type,
            date: new Date().toISOString(),
            description: description || category,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });

          await prisma.appStateSync.update({
            where: { userId: user.id },
            data: { state }
          });

          replyContent = `记账成功：${type === 'expense' ? '支出' : '收入'} ¥${amount} (${category})`;
        }
      }
    }
    }

    // 如果没有生成回复内容，则回复空字符串（微信要求）
    if (!replyContent) {
      return new NextResponse('', { status: 200 });
    }

    // 构造回复 XML
    const replyXml = buildWechatXml({
      ToUserName: FromUserName,
      FromUserName: ToUserName,
      CreateTime: Math.floor(Date.now() / 1000),
      MsgType: 'text',
      Content: replyContent,
    });

    return new NextResponse(replyXml, { 
      status: 200, 
      headers: { 'Content-Type': 'application/xml' } 
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new NextResponse('', { status: 200 }); // 发生错误也返回空，避免微信不断重试
  }
}

async function ensureUserExists(openid: string) {
  let nickname = '微信用户';
  let headimgurl = '';
  
  try {
    const token = await getWechatAccessToken();
    const userInfoRes = await fetch(`https://api.weixin.qq.com/cgi-bin/user/info?access_token=${token}&openid=${openid}&lang=zh_CN`);
    const userInfo = await userInfoRes.json();
    if (userInfo.nickname) {
      nickname = userInfo.nickname;
      headimgurl = userInfo.headimgurl;
    }
  } catch (err) {
    console.warn('Failed to fetch user info', err);
  }

  // Use upsert to avoid race conditions when multiple webhooks arrive simultaneously
  // Also updates the user's nickname and avatar if they have changed
  const account = await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: 'wechat-mp',
        providerAccountId: openid,
      }
    },
    update: {
      user: {
        update: {
          name: nickname,
          image: headimgurl,
        }
      }
    },
    create: {
      type: 'oauth',
      provider: 'wechat-mp',
      providerAccountId: openid,
      user: {
        create: {
          name: nickname,
          image: headimgurl,
        }
      }
    },
    include: { user: true }
  });

  return account.user;
}

function parseBookkeepingMessage(text: string) {
  // 简单正则：(类目) (金额) (可选：收入/支出) (可选：备注)
  // 例：餐饮 50
  // 例：工资 5000 收入
  const regex = /^(\S+)\s+(\d+(?:\.\d+)?)(?:\s+(收入|支出))?(?:\s+(.+))?$/;
  const match = text.match(regex);

  if (!match) return null;

  const category = match[1];
  const amount = parseFloat(match[2]);
  const typeStr = match[3];
  const description = match[4] || '';

  const type = (typeStr === '收入' || category.includes('收入') || category.includes('工资')) ? 'income' : 'expense';

  return { amount, category, type, description };
}
