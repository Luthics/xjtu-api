import axios, { AxiosInstance } from 'axios';
import { WebVPNTicket } from '../types/api/webvpn.xjtu.edu.cn/index.js';

export class WebVPNService {
  private session: AxiosInstance;
  private userAgent: string;
  private ticket?: string;
  private ticketTime?: number;
  private idToken?: string;

  constructor(userAgent: string) {
    this.userAgent = userAgent;
    this.session = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': this.userAgent,
      },
    });
  }

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

  getSession(): AxiosInstance {
    return this.session;
  }
}