/**
 * 账号密码登录凭据
 */
export interface LoginCredentials {
  /** 学号 */
  netid: string;
  /** 密码 */
  password: string;
  /** 用户代理（可选） */
  userAgent?: string;
  /** 设备ID（可选） */
  deviceId?: string;
  /** 客户端ID（可选） */
  clientId?: string;
}

/**
 * Token 登录凭据
 */
export interface TokenCredentials {
  /** 身份令牌 */
  idToken: string;
  /** 刷新令牌（可选） */
  refreshToken?: string;
  /** 用户代理（可选） */
  userAgent?: string;
  /** 设备ID（可选） */
  deviceId?: string;
  /** 客户端ID（可选） */
  clientId?: string;
}

/**
 * 登录响应，包含身份令牌和刷新令牌
 */
export interface TokenResponse {
  /** 身份令牌 */
  idToken: string;
  /** 刷新令牌 */
  refreshToken: string;
}

/**
 * 用户信息
 */
export interface UserInfo {
  /** 学号 */
  netid: string;
  /** 姓名 */
  name: string;
  /** 邮箱（可选） */
  email?: string;
  /** 院系（可选） */
  department?: string;
}

/**
 * MFA 检测结果
 */
export interface MFADetection {
  /** 是否需要 MFA 验证 */
  need: boolean;
  /** MFA 状态（如果需要验证） */
  state?: string;
}

/**
 * MFA GID 信息
 */
export interface MFAGid {
  /** MFA GID */
  gid: string;
  /** 安全手机号（部分隐藏） */
  securePhone: string;
}

/**
 * MFA 验证所需信息
 */
export interface MFARequiredResponse {
  /** MFA 状态 */
  mfa_state: string;
  /** MFA GID */
  mfa_gid: string;
  /** 安全手机号（部分隐藏） */
  mfa_securePhone: string;
}