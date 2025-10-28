import NodeRSA from 'node-rsa';

/**
 * 西安交通大学统一身份认证公钥
 * 用于加密登录凭据的 RSA 公钥
 */
const XJTU_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2u2v/bjSIVsaxCBBxkjW
f7LpmsjuhFJUJE7MYTn9hBcDXlK4smgtNoMqmGz4ztg5t1h+h0fqrJT3WkdoLV/F
KC8OwElTe+p+YLqA6/PgmGtsffcQmAW0eye5NygiWM+B0tO69ML6jNLpAWAvXwod
5kr/k7qsM1DGTux+e7bjdFz/IA8vOZx3IlGHnX+RE/uBJUwPXHnLPw5pQSwkWwfp
PwxMrgzwik6htqRHF2c7Z+pJToXbrIJWD5nmRiU6jzgu8ncLqbMb3WNOKSodcEnl
UpTH/ApH56IOJHWpq3mxJL9DaUaWzjziR93wjlyvR1K4VM7TLqD35CVZQaoE5FWg
ZwIDAQAB
-----END PUBLIC KEY-----`;

let _pubkeyCache: string | null = null;

/**
 * 获取公钥，支持缓存机制
 *
 * @param refresh - 是否强制刷新缓存
 * @returns 公钥字符串
 */
function getPubkey(refresh: boolean = false): string {
  if (_pubkeyCache === null || refresh) {
    _pubkeyCache = XJTU_PUBLIC_KEY;
  }
  return _pubkeyCache;
}

/**
 * 使用 RSA 公钥加密数据并添加前缀
 *
 * @param data - 待加密数据
 * @param pubkeyPem - 公钥（PKCS#1 或 PKCS#8 PEM 均可），默认使用西安交通大学公钥
 * @param header - 加密结果前缀，默认 '__RSA__'
 * @returns 形如 '__RSA__<base64密文>' 的加密字符串
 * @example
 * ```typescript
 * const encrypted = rsaEncryptWithHeader('password123');
 * // 返回: '__RSA__base64_encoded_ciphertext'
 * ```
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