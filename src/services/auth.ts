/**
 * JX CLOUD - 极简 TOTP 算法实现 (Web Crypto API)
 * 支持与 Google Authenticator 对齐
 */

// Base32 字符表
const B32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32ToUint8Array(base32: string): Uint8Array {
  let s = base32.toUpperCase().replace(/=+$/, '');
  let len = s.length;
  let buf = new Uint8Array(Math.floor((len * 5) / 8));
  let val = 0;
  let bits = 0;
  let j = 0;

  for (let i = 0; i < len; i++) {
    val = (val << 5) | B32_CHARS.indexOf(s[i]);
    bits += 5;
    if (bits >= 8) {
      buf[j++] = (val >> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return buf;
}

export const totp = {
  /**
   * 生成一个随机的 Base32 密钥
   */
  generateSecret(length = 16): string {
    return Array.from({ length }, () => B32_CHARS[Math.floor(Math.random() * 32)]).join('');
  },

  /**
   * 校验 TOTP 动态码
   * @param token 用户输入的 6 位动态码
   * @param secret 用户账户存储的 Base32 密钥
   * @param window 容错步长 (默认 1，即允许 30s 误差)
   */
  async verify(token: string, secret: string, window = 1): Promise<boolean> {
    if (!token || !secret || token.length !== 6) return false;
    
    const timeStep = Math.floor(Date.now() / 1000 / 30);
    
    // 遍历容错窗口 (当前、前一个、后一个)
    for (let i = -window; i <= window; i++) {
      const expected = await this.generateToken(secret, timeStep + i);
      if (expected === token) return true;
    }
    
    return false;
  },

  /**
   * 根据密钥和时间步长生成 Token
   */
  async generateToken(secret: string, counter: number): Promise<string> {
    const keyData = base32ToUint8Array(secret);
    const counterBuf = new Uint8Array(8);
    let tmp = counter;
    for (let i = 7; i >= 0; i--) {
      counterBuf[i] = tmp & 0xff;
      tmp = tmp >> 8;
    }

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData.buffer as ArrayBuffer,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuf);
    const hmac = new Uint8Array(signature);
    const offset = hmac[hmac.length - 1] & 0xf;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  }
};