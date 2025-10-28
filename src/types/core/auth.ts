export interface LoginCredentials {
  netid: string;
  password: string;
  userAgent?: string;
  deviceId?: string;
  clientId?: string;
}

export interface TokenResponse {
  idToken: string;
  refreshToken: string;
}

export interface UserInfo {
  netid: string;
  name: string;
  email?: string;
  department?: string;
}

export interface MFADetection {
  need: boolean;
  state?: string;
}

export interface MFAGid {
  gid: string;
  securePhone: string;
}

export interface MFARequiredResponse {
  mfa_state: string;
  mfa_gid: string;
  mfa_securePhone: string;
}