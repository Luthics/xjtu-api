import axios, { AxiosInstance } from 'axios';
import {
  LoginCredentials,
  TokenResponse,
  UserInfo,
  MFADetection,
  MFAGid
} from '../types/index.js';
import { EHallService } from '../services/ehall.js';
import { WebVPNService } from '../services/webvpn.js';
import { rsaEncryptWithHeader } from '../utils/rsa.js';

export class XJTU {
  private session: AxiosInstance;
  private netid?: string;
  private password?: string;
  private userAgent: string;
  private idToken: string = '';
  private refreshToken: string = '';
  private deviceId: string;
  private clientId: string;
  private ehall?: EHallService;
  private webvpn?: WebVPNService;

  constructor(credentials?: LoginCredentials) {
    this.userAgent = credentials?.userAgent || this.getRandomUserAgent();
    this.deviceId = credentials?.deviceId || this.generateMockVisitorId();
    this.clientId = credentials?.clientId || this.generateMockVisitorId();
    
    if (credentials) {
      this.netid = credentials.netid;
      this.password = credentials.password;
    }

    this.session = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': this.userAgent,
      },
    });
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; InfoPath.3; .NET4.0C; .NET4.0E)',
      'Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_3_3 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8J2 Safari/6533.18.5',
      'Mozilla/5.0 (iPad; U; CPU OS 4_2_1 like Mac OS X; zh-cn) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8C148 Safari/6533.18.5',
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  private generateMockVisitorId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private rsaEncrypt(text: string): string {
    return rsaEncryptWithHeader(text);
  }

  async login(mfaCode?: string, mfaGid?: string, mfaState?: string): Promise<TokenResponse> {
    if (!this.netid || !this.password) {
      throw new Error('NetID and password are required for login');
    }

    // 如果提供了 MFA 验证码，先验证
    if (mfaCode && mfaGid) {
      const isValid = await this.mfaVerifyCode(mfaGid, mfaCode);
      if (!isValid) {
        throw new Error('验证码错误');
      }
    }

    // 如果没有提供 MFA 验证码，检查是否需要 MFA
    if (!mfaCode) {
      const mfaDetection = await this.mfaDetect();
      if (mfaDetection.need) {
        const gidInfo = await this.mfaGetGid(mfaDetection.state!);
        throw new Error(`需要完成身份验证: ${JSON.stringify({
          mfa_state: mfaDetection.state,
          mfa_gid: gidInfo.gid,
          mfa_securePhone: gidInfo.securePhone
        })}`);
      }
    }

    const params = new URLSearchParams({
      username: this.rsaEncrypt(this.netid),
      password: this.rsaEncrypt(this.password),
      appId: 'com.supwisdom.xjtu',
      geo: '',
      deviceId: this.deviceId,
      osType: 'android',
      clientId: this.clientId,
      mfaState: mfaState || '',
    });

    const url = `https://login.xjtu.edu.cn/token/password/passwordLogin?${params}`;

    try {
      const response = await this.session.post(url);
      const data = response.data;

      if (data.message === 'exception.mfa.verify.error') {
        throw new Error('需要完成身份验证');
      }

      if (data.status === 401 || data.status === 400) {
        throw new Error(data.message);
      }

      this.idToken = data.data.idToken;
      this.refreshToken = data.data.refreshToken;

      return {
        idToken: this.idToken,
        refreshToken: this.refreshToken,
      };
    } catch (error) {
      throw new Error(`登录失败: ${error}`);
    }
  }

  async mfaDetect(): Promise<MFADetection> {
    if (!this.netid || !this.password) {
      throw new Error('NetID and password are required for MFA detection');
    }

    const params = new URLSearchParams({
      username: this.netid,
      password: this.rsaEncrypt(this.password),
      deviceId: this.deviceId,
    });

    const url = `https://login.xjtu.edu.cn/token/mfa/detect?${params}`;

    try {
      const response = await this.session.post(url);
      const data = response.data;

      if (data.code !== 0) {
        throw new Error(JSON.stringify(data));
      }

      if (data.data.mfaEnabled || data.data.need) {
        return {
          need: true,
          state: data.data.state,
        };
      }

      return {
        need: false,
        state: undefined,
      };
    } catch (error) {
      throw new Error(`MFA检测失败: ${error}`);
    }
  }

  async mfaGetGid(state: string): Promise<MFAGid> {
    const params = new URLSearchParams({ state });
    const url = `https://login.xjtu.edu.cn/token/mfa/initByType/securephone?${params}`;

    try {
      const response = await this.session.get(url);
      const data = response.data;

      if (data.code !== 0) {
        if (data.error === 'not support') {
          throw new Error('尝试次数过多，请稍后再试');
        }
        throw new Error(data.error || JSON.stringify(data));
      }

      if (data.data.gid) {
        return {
          gid: data.data.gid,
          securePhone: data.data.securePhone,
        };
      }

      throw new Error(JSON.stringify(data));
    } catch (error) {
      throw new Error(`获取GID失败: ${error}`);
    }
  }

  async mfaSendCode(gid: string): Promise<boolean> {
    const data = { gid };
    const url = 'https://login.xjtu.edu.cn/attest/api/guard/securephone/send';

    try {
      const response = await this.session.post(url, data);
      const result = response.data;

      if (result.code !== 0) {
        throw new Error(result.data);
      }

      return result.data.result === 'ok';
    } catch (error) {
      throw new Error(`发送验证码失败: ${error}`);
    }
  }

  async mfaVerifyCode(gid: string, code: string): Promise<boolean> {
    const data = { gid, code };
    const url = 'https://login.xjtu.edu.cn/attest/api/guard/securephone/valid';

    try {
      const response = await this.session.post(url, data);
      const result = response.data;

      if (result.code !== 0) {
        throw new Error(result.data);
      }

      return result.data.status === 2;
    } catch (error) {
      throw new Error(`验证码验证失败: ${error}`);
    }
  }

  async getUserInfo(): Promise<UserInfo> {
    if (!this.idToken) {
      await this.login();
    }

    const headers = {
      'x-id-token': this.idToken!,
      'user-agent': this.userAgent,
      'accept-encoding': 'gzip',
    };

    try {
      const response = await this.session.get(
        'https://authx-service.xjtu.edu.cn/personal/api/v1/personal/me/user',
        { headers }
      );
      const data = response.data;

      return {
        netid: data.netid,
        name: data.name,
        email: data.email,
        department: data.department,
      };
    } catch (error) {
      throw new Error(`获取用户信息失败: ${error}`);
    }
  }

  useEHall(): EHallService {
    if (!this.ehall) {
      this.ehall = new EHallService(this.userAgent);
    }
    return this.ehall;
  }

  useWebVPN(): WebVPNService {
    if (!this.webvpn) {
      this.webvpn = new WebVPNService(this.userAgent);
    }
    return this.webvpn;
  }

  getIdToken(): string {
    if (!this.idToken) {
      throw new Error('请先登录');
    }
    return this.idToken;
  }
}