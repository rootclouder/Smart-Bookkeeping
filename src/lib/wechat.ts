import crypto from 'crypto';
import { parseStringPromise, Builder } from 'xml2js';

// 为了简单起见，我们将 token 缓存在内存中。在分布式生产环境中应使用 Redis 或数据库。
let cachedAccessToken: string | null = null;
let accessTokenExpiresAt: number = 0;

export async function getWechatAccessToken() {
  if (cachedAccessToken && Date.now() < accessTokenExpiresAt) {
    return cachedAccessToken;
  }

  const appId = process.env.WECHAT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('WECHAT_APP_ID or WECHAT_APP_SECRET is not configured');
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.access_token) {
    cachedAccessToken = data.access_token;
    // 提前 5 分钟过期以防边界问题
    accessTokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
    return cachedAccessToken;
  } else {
    throw new Error(`Failed to get access token: ${data.errmsg}`);
  }
}

export function checkWechatSignature(signature: string, timestamp: string, nonce: string) {
  const token = process.env.WECHAT_TOKEN || 'your_default_wechat_token';
  const arr = [token, timestamp, nonce].sort();
  const str = arr.join('');
  const sha1 = crypto.createHash('sha1').update(str).digest('hex');
  return sha1 === signature;
}

export async function parseWechatXml(xml: string) {
  try {
    const result = await parseStringPromise(xml, { explicitArray: false });
    return result.xml;
  } catch (err) {
    console.error('XML Parse Error', err);
    return null;
  }
}

export function buildWechatXml(data: any) {
  const builder = new Builder({ rootName: 'xml', cdata: true, headless: true });
  return builder.buildObject(data);
}
