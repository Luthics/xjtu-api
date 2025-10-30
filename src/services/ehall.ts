/* global URL, console */
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from '../types/core/index.js';
import { Course, Score, ClassroomStatus } from '../types/api/ehall.xjtu.edu.cn/index.js';
import { RollResponse, RollGroup } from '../types/api/ehall.xjtu.edu.cn/appMultiGroupEntranceList.js';

/**
 * EHall 服务类，提供西安交通大学教务系统功能访问
 *
 * @example
 * ```typescript
 * const ehall = xjtu.useEHall();
 * const courses = await ehall.getCourse('2023-2024-1');
 * const scores = await ehall.getScore('2023-2024-1');
 * ```
 */
export class EHallService {
  private session: AxiosInstance;
  private userAgent: string;
  private cookies: Record<string, string> = {};
  public show302: boolean = false;

  /**
   * 创建 EHallService 实例
   *
   * @param userAgent - 用户代理字符串
   */
  constructor(userAgent: string) {
    this.userAgent = userAgent;
    this.session = axios.create({
      timeout: 10000,
      withCredentials: true,
      maxRedirects: 0,
      headers: {
        'User-Agent': this.userAgent,
      },
      validateStatus: (status: number) => {
        return status >= 200 && status < 400;
      },
    });

    // 添加请求拦截器处理 cookies
    this.session.interceptors.request.use((config) => {
      if (config.headers && Object.keys(this.cookies).length > 0) {
        config.headers.Cookie = Object.keys(this.cookies).map((key) => `${key}=${this.cookies[key]}`).join("; ");
      }
      return config;
    });

    // 添加响应拦截器处理 cookies 和重定向
    this.session.interceptors.response.use(
      async (res: AxiosResponse) => {
        if (res.headers["set-cookie"]) {
          const cookies = Array.isArray(res.headers["set-cookie"])
            ? res.headers["set-cookie"]
            : [res.headers["set-cookie"]];
          cookies.forEach((cookie: string) => {
            const [key, value] = cookie.split(";")[0].split("=");
            this.cookies[key] = value;
          });
        }
        if (res.status === 302 && res.headers.location) {
          let redirectUrl = res.headers.location;
          // 处理相对路径URL
          if (redirectUrl.startsWith('/')) {
            const currentUrl = res.config.url || 'https://ehall.xjtu.edu.cn';
            const baseUrl = new URL(currentUrl);
            redirectUrl = `${baseUrl.protocol}//${baseUrl.host}${redirectUrl}`;
          }
          if (this.show302) {
            // eslint-disable-next-line no-console
            console.log(res.status, redirectUrl);
          }
          const redirectRes = await this.session.get(redirectUrl);
          return redirectRes;
        }
        if (res.status === 301) {
          // eslint-disable-next-line no-console
          console.log(res.headers.location);
        }
        return res;
      },
      (error: unknown) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * 设置 cookies
   *
   * @param cookies - cookies 对象
   */
  public setCookies(cookies: Record<string, string>): void {
    this.cookies = cookies;
  }

  /**
   * 获取当前 cookies
   *
   * @returns 当前 cookies 对象
   */
  public getCookies(): Record<string, string> {
    return this.cookies;
  }

  /**
   * 获取 EHall 会话
   *
   * @param idToken - 身份令牌
   * @param appid - 应用 ID (可选)
   * @returns 配置好的 Axios 实例，可用于后续 EHall API 调用
   * @throws {Error} 当会话获取失败时抛出错误
   */
  async getEHallSession(idToken: string): Promise<AxiosInstance> {
    // 获取初始 cookies
    const res = await this.session.get("https://ehall.xjtu.edu.cn/login?service=https://ehall.xjtu.edu.cn/new/index.html?browser=no", {
      headers: {
        'x-id-token': idToken,
        'x-requested-with': 'com.supwisdom.xjtu',
        'accept-encoding': 'gzip',
      },
    });
    // eslint-disable-next-line no-console
    console.log("request url: ", res.config.url);
    await this.session.get(res.config.url!, {
      headers: {
        'x-id-token': idToken,
        'x-requested-with': 'com.supwisdom.xjtu',
        'accept-encoding': 'gzip',
      },
    })
    return this.session;
  }

  /**
   * 获取应用的角色列表
   *
   * @param appId - 应用ID
   * @returns 角色响应数据
   * @private
   */
  private async getRolls(appId: string): Promise<RollResponse> {
    const t = Date.now();
    const url = `https://ehall.xjtu.edu.cn/appMultiGroupEntranceList?r_t=${t}&appId=${appId}&param=`;
    const response = await this.session.get<RollResponse>(url);
    return response.data;
  }

  /**
   * 获取目标URL
   *
   * @param appId - 应用ID
   * @param keyword - 搜索关键词，默认为'移动应用学生'
   * @returns 目标URL
   * @throws {Error} 当未找到匹配的目标URL时抛出错误
   * @private
   */
  private async getTargetUrl(appId: string, keyword: string = '移动应用学生'): Promise<string> {
    const rolls = await this.getRolls(appId);
    const groupList: RollGroup[] = rolls.data.groupList;

    for (const roll of groupList) {
      if (roll.groupName.includes(keyword)) {
        return roll.targetUrl;
      }
    }

    throw new Error(`未找到包含关键词"${keyword}"的目标URL，请检查应用ID是否正确`);
  }

  /**
   * 获取指定学期的课程表
   *
   * @param termCode - 学期代码，格式如 '2023-2024-1'
   * @returns 包含课程信息的 API 响应
   * @example
   * ```typescript
   * const result = await ehall.getCourse('2023-2024-1');
   * if (result.code === 0) {
   *   console.log(`获取到 ${result.data.length} 门课程`);
   * }
   * ```
   */
  async getCourse(termCode: string): Promise<ApiResponse<Course[]>> {
    const appId = '4770397878132218';
    const targetUrl = await this.getTargetUrl(appId);

    await this.session.get(targetUrl);

    try {
      const response = await this.session.post(
        'https://ehall.xjtu.edu.cn/jwapp/sys/wdkb/modules/xskcb/xskcb.do',
        { XNXQDM: termCode },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
          }
        }
      );

      const data = response.data;

      if (data.code !== '0') {
        return {
          code: -1,
          message: `获取课表失败: ${data.message || '未知错误'}`,
        };
      }

      const courses: Course[] = [];
      const rows = data.datas.xskcb.rows;

      for (const row of rows) {
        const course: Course = {
          name: row.KCM,
          courseId: row.KCH,
          teachers: row.SKJS || '',
          location: row.JASMC || '',
          day: parseInt(row.SKXQ) || 0,
          sectionStart: parseInt(row.KSJC) || 0,
          sectionEnd: parseInt(row.JSJC) || 0,
          weeks: row.SKZC || '',
        };
        courses.push(course);
      }

      return {
        code: 0,
        message: 'success',
        data: courses,
      };
    } catch (error) {
      return {
        code: -1,
        message: `获取课表失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 获取指定学期的成绩信息
   *
   * @param termCode - 学期代码，格式如 '2023-2024-1'，传入 '0' 获取所有学期成绩
   * @returns 包含成绩信息的 API 响应
   * @example
   * ```typescript
   * const result = await ehall.getScore('2023-2024-1');
   * if (result.code === 0) {
   *   console.log(`获取到 ${result.data.length} 门课程成绩`);
   * }
   * ```
   */
  async getScore(termCode: string): Promise<ApiResponse<Score[]>> {
    const appId = '4768574631264620';
    const targetUrl = await this.getTargetUrl(appId);

    await this.session.get(targetUrl);

    const headers = {
      Origin: 'http://ehall.xjtu.edu.cn',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Host: 'ehall.xjtu.edu.cn',
    };

    const url = 'https://ehall.xjtu.edu.cn/jwapp/sys/cjcx/modules/cjcx/xscjcx.do';
    let data: Record<string, unknown> = {};

    if (termCode !== '0') {
      data = {
        querySetting: `[{"name":"XNXQDM","value":"${termCode}","linkOpt":"AND","builder":"m_value_equal","builderList":"cbl_String"},{"name":"SFYX","caption":"是否有效","linkOpt":"AND","builderList":"cbl_m_List","builder":"m_value_equal","value":"1","value_display":"是"},{"name":"*order","value":"-XNXQDM,-KCH,-KXH","linkOpt":"and","builder":"equal"}]`,
        '*order': '-XNXQDM,-KCH,-KXH',
        pageSize: '30',
        pageNumber: '1',
      };
    }

    try {
      const response = await this.session.post(url, data, { headers });
      const result = response.data;

      if (result.code !== '0') {
        return {
          code: -1,
          message: `获取成绩失败: ${result.message || '未知错误'}`,
        };
      }

      const scores: Score[] = [];
      const rows = result.datas.xscjcx.rows;
      const totalSize = result.datas.xscjcx.totalSize;

      if (totalSize === 0) {
        return {
          code: 0,
          message: 'success',
          data: [],
        };
      }

      for (const row of rows) {
        const score: Score = {
          name: row.KCM,
          score: row.ZCJ,
          credit: row.XF,
          gpa: row.XFJD,
          term: row.XNXQDM,
        };
        scores.push(score);
      }

      return {
        code: 0,
        message: 'success',
        data: scores,
      };
    } catch (error) {
      return {
        code: -1,
        message: `获取成绩失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 获取指定教室在指定日期的状态
   *
   * @param classroom - 教学楼代码，如 '1001', '1002' 等
   * @param date - 日期，格式如 '2024-10-28'
   * @returns 包含教室状态信息的 API 响应
   * @example
   * ```typescript
   * const result = await ehall.getClassroomStatus('1001', '2024-10-28');
   * if (result.code === 0) {
   *   console.log(`获取到 ${result.data.length} 个教室状态`);
   * }
   * ```
   */
  async getClassroomStatus(classroom: string, date: string): Promise<ApiResponse<ClassroomStatus[]>> {
    const appId = '4768402106681759';
    const targetUrl = await this.getTargetUrl(appId);

    await this.session.get(targetUrl);

    const result: ClassroomStatus[] = [];
    const timeSlots = [1, 3, 5, 7, 9];

    try {
      for (const timeSlot of timeSlots) {
        const data = {
          JXLDM: classroom,
          KXRQ: date,
          JSJC: String(timeSlot + 1),
          KSJC: String(timeSlot),
          pageSize: '55',
          pageNumber: '1',
        };

        const response = await this.session.post(
          'https://ehall.xjtu.edu.cn/jwapp/sys/kxjas/modules/kxjscx/cxkxjs.do',
          data
        );

        const res = response.data;

        if (res.datas?.cxkxjs?.extParams?.code === 1 && res.code === '0') {
          for (const message of res.datas.cxkxjs.rows) {
            let classroomName = message.JASMC;

            // Handle different classroom naming conventions
            if (['1007', '1008', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033'].includes(classroom)) {
              classroomName = message.JASMC.slice(4);
            } else if (['1001', '1002', '1003', '1004'].includes(classroom)) {
              classroomName = message.JASMC.slice(2);
            } else if (['1009', '1010'].includes(classroom)) {
              classroomName = message.JASMC.slice(3);
            } else if (['1017', '1011'].includes(classroom)) {
              classroomName = message.JASMC.slice(-3);
            } else if (classroom === '1012') {
              classroomName = message.JASMC.slice(3);
            }

            result.push({
              classroom: classroomName,
              time: timeSlot,
              status: 'available',
            });
          }
        }
      }

      return {
        code: 0,
        message: 'success',
        data: result,
      };
    } catch (error) {
      return {
        code: -1,
        message: `获取教室状态失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}