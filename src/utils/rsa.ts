import NodeRSA from 'node-rsa';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let _pubkeyCache: string | null = null;

function getPubkey(refresh: boolean = false): string {
  if (_pubkeyCache === null || refresh) {
    const keyPath = join(__dirname, '../assets/keys/token_1028.key');
    _pubkeyCache = readFileSync(keyPath, 'utf-8');
  }
  return _pubkeyCache;
}

/**
 * 使用给定的 PEM 公钥对 data 加密，返回形如 '__RSA__<base64密文>' 的字符串。
 * @param data 待加密数据（string）
 * @param pubkeyPem 公钥（PKCS#1 或 PKCS#8 PEM 均可）
 * @param header 前缀，默认 '__RSA__'
 */
export function rsaEncryptWithHeader(
  data: string,
  pubkeyPem: string = getPubkey(),
  header: string = '__RSA__'
): string {
  // 创建 RSA 实例并导入公钥
  const key = new NodeRSA(pubkeyPem);
  key.setOptions({ encryptionScheme: 'pkcs1' });

  // 加密数据
  const encrypted = key.encrypt(data, 'base64');

  return header + encrypted;
}