import axios, { AxiosInstance } from 'axios';
import {
  LoginCredentials,
  TokenCredentials,
  TokenResponse,
  UserInfo,
  MFADetection,
  MFAGid
} from '../types/core/index.js';
import { EHallService } from '../services/ehall.js';
import { WebVPNService } from '../services/webvpn.js';
import { rsaEncryptWithHeader } from '../utils/rsa.js';

/**
 * XJTU API 核心类，提供西安交通大学统一身份认证和相关服务访问
 *
 * @example
 * ```typescript
 * // 账号密码登录
 * const xjtu = new XJTU({
 *   netid: 'your_netid',
 *   password: 'your_password'
 * });
 * await xjtu.login();
 *
 * // Token 登录
 * const xjtu = new XJTU({
 *   idToken: 'your_id_token',
 *   refreshToken: 'your_refresh_token'
 * });
 * ```
 */
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

  /**
   * 创建 XJTU API 实例
   *
   * @param credentials - 登录凭据，支持账号密码或 Token 两种方式
   * @example
   * ```typescript
   * // 账号密码登录
   * const xjtu = new XJTU({
   *   netid: 'your_netid',
   *   password: 'your_password'
   * });
   *
   * // Token 登录
   * const xjtu = new XJTU({
   *   idToken: 'your_id_token',
   *   refreshToken: 'your_refresh_token'
   * });
   * ```
   */
  constructor(credentials?: LoginCredentials | TokenCredentials) {
    this.userAgent = credentials?.userAgent || this.getRandomUserAgent();
    this.deviceId = credentials?.deviceId || this.generateMockVisitorId();
    this.clientId = credentials?.clientId || this.generateMockVisitorId();

    if (credentials) {
      if ('netid' in credentials) {
        // 账号密码登录
        this.netid = credentials.netid;
        this.password = credentials.password;
      } else if ('idToken' in credentials) {
        // Token 登录
        this.idToken = credentials.idToken;
        this.refreshToken = credentials.refreshToken || '';
      }
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

  /**
   * 登录并获取访问令牌
   *
   * @param mfaCode - MFA 验证码（如果需要多因素认证）
   * @param mfaGid - MFA GID（如果需要多因素认证）
   * @param mfaState - MFA 状态（如果需要多因素认证）
   * @returns 包含 idToken 和 refreshToken 的对象
   * @throws {Error} 当登录失败、需要 MFA 验证或参数缺失时抛出错误
   * @example
   * ```typescript
   * // 基础登录
   * const tokens = await xjtu.login();
   *
   * // MFA 登录
   * const tokens = await xjtu.login('123456', 'mfa_gid', 'mfa_state');
   * ```
   */
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

  /**
   * 检测是否需要 MFA 多因素认证
   *
   * @returns 包含是否需要 MFA 和状态信息的对象
   * @throws {Error} 当检测失败或参数缺失时抛出错误
   * @example
   * ```typescript
   * const detection = await xjtu.mfaDetect();
   * if (detection.need) {
   *   console.log('需要 MFA 验证');
   * }
   * ```
   */
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

  /**
   * 获取 MFA GID（Group ID）
   *
   * @param state - MFA 状态，从 mfaDetect() 获取
   * @returns 包含 GID 和安全手机号的对象
   * @throws {Error} 当获取失败或尝试次数过多时抛出错误
   * @example
   * ```typescript
   * const detection = await xjtu.mfaDetect();
   * const gidInfo = await xjtu.mfaGetGid(detection.state!);
   * ```
   */
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

  /**
   * 发送 MFA 验证码到用户的安全手机
   *
   * @param gid - MFA GID，从 mfaGetGid() 获取
   * @returns 是否成功发送验证码
   * @throws {Error} 当发送失败时抛出错误
   * @example
   * ```typescript
   * const success = await xjtu.mfaSendCode('mfa_gid');
   * if (success) {
   *   console.log('验证码已发送');
   * }
   * ```
   */
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

  /**
   * 验证 MFA 验证码
   *
   * @param gid - MFA GID，从 mfaGetGid() 获取
   * @param code - 用户收到的验证码
   * @returns 验证码是否正确
   * @throws {Error} 当验证失败时抛出错误
   * @example
   * ```typescript
   * const isValid = await xjtu.mfaVerifyCode('mfa_gid', '123456');
   * if (isValid) {
   *   console.log('验证码正确');
   * }
   * ```
   */
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

  /**
   * 获取当前登录用户的详细信息
   *
   * @returns 包含用户学号、姓名、邮箱和院系信息的对象
   * @throws {Error} 当获取失败或未登录时抛出错误
   * @example
   * ```typescript
   * const userInfo = await xjtu.getUserInfo();
   * console.log(`姓名: ${userInfo.name}`);
   * console.log(`学号: ${userInfo.netid}`);
   * ```
   */
  async getUserInfo(): Promise<UserInfo> {
    if (!this.idToken) {
      if (!this.netid || !this.password) {
        throw new Error('请先登录或提供账号密码');
      }
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

  /**
   * 获取 EHall 服务实例
   *
   * @returns EHallService 实例，用于访问教务系统功能
   * @example
   * ```typescript
   * const ehall = xjtu.useEHall();
   * const courses = await ehall.getCourse('2023-2024-1');
   * ```
   */
  useEHall(): EHallService {
    if (!this.ehall) {
      this.ehall = new EHallService(this.userAgent);
    }
    return this.ehall;
  }

  /**
   * 获取 WebVPN 服务实例
   *
   * @returns WebVPNService 实例，用于访问 WebVPN 功能
   * @example
   * ```typescript
   * const webvpn = xjtu.useWebVPN();
   * const ticket = await webvpn.getTicket();
   * ```
   */
  useWebVPN(): WebVPNService {
    if (!this.webvpn) {
      this.webvpn = new WebVPNService(this.userAgent);
    }
    return this.webvpn;
  }

  /**
   * 获取当前的身份令牌 (idToken)
   *
   * @returns 当前的身份令牌字符串
   * @throws {Error} 当未登录时抛出错误
   * @example
   * ```typescript
   * const idToken = xjtu.getIdToken();
   * console.log(`当前 token: ${idToken}`);
   * ```
   */
  getIdToken(): string {
    if (!this.idToken) {
      throw new Error('请先登录');
    }
    return this.idToken;
  }

  /**
   * 设置身份令牌和刷新令牌
   *
   * @param idToken - 身份令牌
   * @param refreshToken - 刷新令牌（可选）
   * @example
   * ```typescript
   * xjtu.setTokens('new_id_token', 'new_refresh_token');
   * ```
   */
  setTokens(idToken: string, refreshToken?: string): void {
    this.idToken = idToken;
    this.refreshToken = refreshToken || '';
  }

  /**
   * 获取当前的刷新令牌 (refreshToken)
   *
   * @returns 当前的刷新令牌字符串
   * @throws {Error} 当没有 refreshToken 时抛出错误
   * @example
   * ```typescript
   * const refreshToken = xjtu.getRefreshToken();
   * console.log(`当前 refreshToken: ${refreshToken}`);
   * ```
   */
  getRefreshToken(): string {
    if (!this.refreshToken) {
      throw new Error('没有 refreshToken');
    }
    return this.refreshToken;
  }
}