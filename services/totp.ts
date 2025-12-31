/* Copyright (c) 2025 Jiangxi Star Hotel. 保留所有权利. */

/**
 * TOTP (基于时间的一次性密码) 实现
 * 遵循 RFC 6238 标准
 */

// Base32 编码和解码工具
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Base32 解码函数
function base32Decode(encoded: string): Uint8Array {
  encoded = encoded.toUpperCase().replace(/=+$/, '');
  const bytes = Math.floor((encoded.length * 5) / 8);
  const buffer = new Uint8Array(bytes);
  let bits = 0;
  let value = 0;
  let index = 0;

  for (let i = 0; i < encoded.length; i++) {
    const charIndex = BASE32_CHARS.indexOf(encoded[i]);
    if (charIndex === -1) {
      throw new Error(`Invalid Base32 character: ${encoded[i]}`);
    }

    value = (value << 5) | charIndex;
    bits += 5;

    if (bits >= 8) {
      buffer[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }

  return buffer;
}

// HMAC-SHA1 实现 (简化版，实际使用 Web Crypto API)
async function computeHmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  // 使用 Web Crypto API 实现 HMAC-SHA1
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
}

// 生成 TOTP 代码
async function generateTOTP(secret: string, window: number = 0): Promise<string> {
  try {
    // 解码 Base32 密钥
    const key = base32Decode(secret);
    
    // 计算当前时间步长 (默认 30 秒)
    const step = 30;
    const counter = Math.floor(Date.now() / 1000 / step) + window;
    
    // 将计数器转换为 8 字节数组 (大端序)
    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setUint32(4, counter, false); // 大端序
    
    // 计算 HMAC-SHA1 哈希
    const hash = await computeHmacSha1(key, new Uint8Array(counterBuffer));
    
    // 动态截断以获取 4 字节值
    const offset = hash[19] & 0xf;
    let binary = 
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);
    
    // 取模以获得 6 位数字
    binary = binary % 1000000;
    
    // 确保结果是 6 位数字 (补零)
    return binary.toString().padStart(6, '0');
  } catch (error) {
    console.error('TOTP generation failed:', error);
    throw error;
  }
}

// 验证 TOTP 代码
async function verifyTOTP(secret: string, token: string, window: number = 1): Promise<boolean> {
  // 检查令牌格式
  if (!/^\d{6}$/.test(token)) {
    return false;
  }

  // 在时间窗口内尝试验证 (默认 ±1 个时间步长)
  for (let i = -window; i <= window; i++) {
    const expectedToken = await generateTOTP(secret, i);
    if (expectedToken === token) {
      return true;
    }
  }

  return false;
}

// 生成安全的随机 Base32 密钥
function generateSecret(): string {
  const secretLength = 20; // 160 bits
  const secret = new Uint8Array(secretLength);
  crypto.getRandomValues(secret);
  
  // 转换为 Base32
  let encoded = '';
  let buffer = 0;
  let bitsInBuffer = 0;
  
  for (let i = 0; i < secret.length; i++) {
    buffer = (buffer << 8) | secret[i];
    bitsInBuffer += 8;
    
    while (bitsInBuffer >= 5) {
      const index = (buffer >>> (bitsInBuffer - 5)) & 31;
      encoded += BASE32_CHARS[index];
      bitsInBuffer -= 5;
    }
  }
  
  if (bitsInBuffer > 0) {
    const index = (buffer << (5 - bitsInBuffer)) & 31;
    encoded += BASE32_CHARS[index];
  }
  
  // 添加填充
  while (encoded.length % 8 !== 0) {
    encoded += '=';
  }
  
  return encoded;
}

// 生成 otpauth URL 用于二维码
function generateOtpAuthUrl(secret: string, accountName: string, issuer: string = 'JXCloud'): string {
  const encodedAccountName = encodeURIComponent(accountName);
  const encodedIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${issuer}:${encodedAccountName}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

export const TOTP = {
  generate: generateTOTP,
  verify: verifyTOTP,
  generateSecret,
  generateOtpAuthUrl
};