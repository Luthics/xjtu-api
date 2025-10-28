import NodeRSA from 'node-rsa';

// 西安交通大学统一身份认证公钥
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

function getPubkey(refresh: boolean = false): string {
  if (_pubkeyCache === null || refresh) {
    _pubkeyCache = XJTU_PUBLIC_KEY;
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