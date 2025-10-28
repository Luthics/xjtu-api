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

export interface Course {
  name: string;
  courseId: string;
  teachers: string;
  location: string;
  day: number;
  sectionStart: number;
  sectionEnd: number;
  weeks: string;
}

export interface CourseSchedule {
  week: number;
  day: number;
  sectionStart: number;
  sectionEnd: number;
  location: string;
}

export interface Score {
  name: string;
  score: string;
  credit: string;
  gpa: string;
  term: string;
}

export interface ScoreDetail {
  type: string;
  score: string;
}

export interface ClassroomStatus {
  classroom: string;
  time: number;
  status: 'available' | 'occupied';
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
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

export interface WebVPNTicket {
  ticket: string;
  ticketTime: number;
}