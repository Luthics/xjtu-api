/**
 * 通用 API 响应格式
 */
export interface ApiResponse<T> {
  /** 响应代码，0 表示成功 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 响应数据（可选） */
  data?: T;
}