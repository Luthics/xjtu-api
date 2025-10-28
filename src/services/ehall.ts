import axios, { AxiosInstance } from 'axios';
import { ApiResponse } from '../types/core/index.js';
import { Course, Score, ClassroomStatus } from '../types/api/ehall.xjtu.edu.cn/index.js';
import { RollResponse, RollGroup } from '../types/api/ehall.xjtu.edu.cn/appMultiGroupEntranceList.js';

export class EHallService {
  private session: AxiosInstance;
  private userAgent: string;

  constructor(userAgent: string) {
    this.userAgent = userAgent;
    this.session = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': this.userAgent,
      },
    });
  }

  async getEHallSession(idToken: string): Promise<AxiosInstance> {
    const baseUrl = 'https://org.xjtu.edu.cn/openplatform/oauth/authorize';
    const params = new URLSearchParams({
      responseType: 'code',
      scope: 'user_info',
      appId: '1030',
      state: 'da75aedb2910421aacdc54d479151197',
      redirectUri: 'http://ehall.xjtu.edu.cn/amp-auth-adapter/loginSuccess',
    });

    const ehallUrl = `${baseUrl}?${params}`;

    await this.session.get(ehallUrl, {
      headers: {
        'x-id-token': idToken,
        'accept-encoding': 'gzip',
      },
    });

    return this.session;
  }

  private async getRolls(appId: string): Promise<RollResponse> {
    const t = Date.now();
    const url = `https://ehall.xjtu.edu.cn/appMultiGroupEntranceList?r_t=${t}&appId=${appId}&param=`;
    const response = await this.session.get<RollResponse>(url);
    return response.data;
  }

  private async getTargetUrl(appId: string, keyword: string = '学生'): Promise<string> {
    const rolls = await this.getRolls(appId);
    const groupList: RollGroup[] = rolls.data.groupList;

    for (const roll of groupList) {
      if (roll.groupName.includes(keyword)) {
        return roll.targetUrl;
      }
    }

    throw new Error(`未找到包含关键词"${keyword}"的目标URL`);
  }

  async getCourse(termCode: string): Promise<ApiResponse<Course[]>> {
    const appId = '4770397878132218';
    const targetUrl = await this.getTargetUrl(appId);
    
    await this.session.get(targetUrl);

    try {
      const response = await this.session.post(
        'https://ehall.xjtu.edu.cn/jwapp/sys/wdkb/modules/xskcb/xskcb.do',
        { XNXQDM: termCode }
      );
      
      const data = response.data;
      
      if (data.code !== '0') {
        return {
          code: -1,
          message: '获取课表失败',
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
        message: `获取课表失败: ${error}`,
      };
    }
  }

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
          message: '获取成绩失败',
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
        message: `获取成绩失败: ${error}`,
      };
    }
  }

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
        message: `获取教室状态失败: ${error}`,
      };
    }
  }
}