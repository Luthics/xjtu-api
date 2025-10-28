import axios, { AxiosInstance } from 'axios';
import { WebVPNTicket } from '../types/api/webvpn.xjtu.edu.cn/index.js';

/**
 * WebVPN 服务类，提供西安交通大学 WebVPN 功能访问
 *
 * @example
 * ```typescript
 * const webvpn = xjtu.useWebVPN();
 * const ticket = await webvpn.getTicket();
 * ```
 */
export class WebVPNService {
  private session: AxiosInstance;
  private userAgent: string;
  private ticket?: string;
  private ticketTime?: number;
  private idToken?: string;

  /**
   * 创建 WebVPNService 实例
   *
   * @param userAgent - 用户代理字符串
   */
  constructor(userAgent: string) {
    this.userAgent = userAgent;
    this.session = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': this.userAgent,
      },
    });
  }

  /**
   * 获取 WebVPN 会话
   *
   * @param idToken - 身份令牌
   * @returns 配置好的 Axios 实例，可用于后续 WebVPN API 调用
   * @throws {Error} 当会话获取失败时抛出错误
   */
  async getWebVPNSession(idToken: string): Promise<AxiosInstance> {
    const response = await this.session.get('https://webvpn.xjtu.edu.cn/login?cas_login=true', {
      headers: {
        'x-id-token': idToken,
        'accept-encoding': 'gzip',
      },
    });

    this.idToken = idToken;
    
    // Extract ticket from response cookies
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      for (const cookie of cookies) {
        if (cookie.includes('wengine_vpn_ticketwebvpn_xjtu_edu_cn')) {
          const match = cookie.match(/wengine_vpn_ticketwebvpn_xjtu_edu_cn=([^;]+)/);
          if (match) {
            this.ticket = match[1];
          }
        }
      }
    }
    
    this.ticketTime = Date.now();

    // Set additional cookies manually
    this.session.defaults.headers.Cookie = [
      'show_vpn=0',
      'show_fast=0', 
      'heartbeat=1',
      'show_faq=0',
      'refresh=0'
    ].join('; ');

    return this.session;
  }

  /**
   * 获取 WebVPN 票据
   *
   * @returns 包含 WebVPN 票据和时间的对象
   * @throws {Error} 当未获取会话或票据过期时抛出错误
   * @example
   * ```typescript
   * const ticketInfo = await webvpn.getTicket();
   * console.log(`票据: ${ticketInfo.ticket}`);
   * ```
   */
  async getTicket(): Promise<WebVPNTicket> {
    if (!this.ticket || !this.ticketTime || Date.now() - this.ticketTime > 15 * 60 * 1000) {
      if (!this.idToken) {
        throw new Error('请先获取WebVPN会话');
      }
      await this.getWebVPNSession(this.idToken);
    }

    return {
      ticket: this.ticket!,
      ticketTime: this.ticketTime!,
    };
  }

  /**
   * 获取当前 WebVPN 会话实例
   *
   * @returns 当前配置的 Axios 实例
   * @example
   * ```typescript
   * const session = webvpn.getSession();
   * // 使用 session 进行自定义请求
   * ```
   */
  getSession(): AxiosInstance {
    return this.session;
  }
}