# XJTU API

[![npm version](https://img.shields.io/npm/v/xjtu-api.svg?style=flat&logo=npm)](https://www.npmjs.com/package/xjtu-api)
[![GitHub](https://img.shields.io/badge/GitHub-Luthics%2Fxjtu--api-blue?logo=github)](https://github.com/Luthics/xjtu-api)
[![Telegram](https://img.shields.io/badge/Telegram-%40xjtu__api-blue?logo=telegram)](https://t.me/xjtu_api)

西安交通大学 API 封装库，提供统一身份认证、MFA 多因素认证、用户信息获取等功能。

## 特性

- ✅ 统一身份认证登录
- ✅ MFA 多因素认证支持
- ✅ 用户信息获取
- ✅ EHall 教务系统集成
- ✅ WebVPN 支持
- ✅ TypeScript 完整类型支持
- ✅ 正确的 RSA 加密方案

## 安装

```bash
# 使用 Bun
bun add xjtu-api

# 使用 npm
npm install xjtu-api

# 使用 yarn
yarn add xjtu-api

# 使用 pnpm
pnpm add xjtu-api
```

## 快速开始

### 基础登录

```typescript
import { XJTU } from 'xjtu-api';

async function basicLogin() {
  const xjtu = new XJTU({
    netid: 'your_netid',
    password: 'your_password'
  });

  try {
    const tokens = await xjtu.login();
    console.log('登录成功:', tokens);

    // 获取用户信息
    const userInfo = await xjtu.getUserInfo();
    console.log('用户信息:', userInfo);
  } catch (error) {
    console.error('登录失败:', error);
  }
}
```

### MFA 多因素认证登录

```typescript
import { XJTU } from 'xjtu-api';
import * as readline from 'readline';

async function mfaLogin() {
  const xjtu = new XJTU({
    netid: 'your_netid',
    password: 'your_password'
  });

  try {
    // 尝试登录
    const tokens = await xjtu.login();
    console.log('登录成功:', tokens);
  } catch (error: any) {
    // 检查是否需要 MFA 验证
    if (error.message.includes('需要完成身份验证')) {
      console.log('检测到需要 MFA 验证');

      // 从错误消息中提取 MFA 信息
      const mfaInfoMatch = error.message.match(/\{.*\}/);
      if (mfaInfoMatch) {
        const mfaInfo = JSON.parse(mfaInfoMatch[0]);
        console.log('MFA 信息:', mfaInfo);

        // 发送验证码
        await xjtu.mfaSendCode(mfaInfo.mfa_gid);
        console.log('验证码已发送到您的安全手机');

        // 等待用户输入验证码
        const mfaCode = await getUserInput('请输入验证码: ');

        // 使用验证码重新登录
        const tokens = await xjtu.login(mfaCode, mfaInfo.mfa_gid, mfaInfo.mfa_state);
        console.log('MFA 登录成功:', tokens);
      }
    } else {
      console.error('登录失败:', error);
    }
  }
}

// 辅助函数：获取用户输入
function getUserInput(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(prompt, (answer) => {
      resolve(answer);
      rl.close();
    });
  });
}
```

## API 文档

### XJTU 类

#### 构造函数

```typescript
new XJTU(credentials?: LoginCredentials)
```

**参数:**
- `credentials` (可选): 登录凭据
  - `netid` (string): 学号
  - `password` (string): 密码
  - `userAgent` (string, 可选): 用户代理
  - `deviceId` (string, 可选): 设备ID
  - `clientId` (string, 可选): 客户端ID

#### 方法

##### login
登录并获取访问令牌

```typescript
async login(mfaCode?: string, mfaGid?: string, mfaState?: string): Promise<TokenResponse>
```

**参数:**
- `mfaCode` (string, 可选): MFA 验证码
- `mfaGid` (string, 可选): MFA GID
- `mfaState` (string, 可选): MFA 状态

**返回:**
```typescript
{
  idToken: string;    // 身份令牌
  refreshToken: string; // 刷新令牌
}
```

##### mfaDetect
检测是否需要 MFA 验证

```typescript
async mfaDetect(): Promise<MFADetection>
```

**返回:**
```typescript
{
  need: boolean;  // 是否需要 MFA
  state?: string; // MFA 状态
}
```

##### mfaGetGid
获取 MFA GID

```typescript
async mfaGetGid(state: string): Promise<MFAGid>
```

**参数:**
- `state` (string): MFA 状态

**返回:**
```typescript
{
  gid: string;         // GID
  securePhone: string; // 安全手机号（部分隐藏）
}
```

##### mfaSendCode
发送 MFA 验证码

```typescript
async mfaSendCode(gid: string): Promise<boolean>
```

**参数:**
- `gid` (string): MFA GID

##### mfaVerifyCode
验证 MFA 验证码

```typescript
async mfaVerifyCode(gid: string, code: string): Promise<boolean>
```

**参数:**
- `gid` (string): MFA GID
- `code` (string): 验证码

##### getUserInfo
获取用户信息

```typescript
async getUserInfo(): Promise<UserInfo>
```

**返回:**
```typescript
{
  netid: string;     // 学号
  name: string;      // 姓名
  email: string;     // 邮箱
  department: string; // 院系
}
```

##### useEHall
获取 EHall 服务实例

```typescript
useEHall(): EHallService
```

##### useWebVPN
获取 WebVPN 服务实例

```typescript
useWebVPN(): WebVPNService
```

##### getIdToken
获取当前 ID Token

```typescript
getIdToken(): string
```

## 类型定义

```typescript
interface LoginCredentials {
  netid: string;
  password: string;
  userAgent?: string;
  deviceId?: string;
  clientId?: string;
}

interface TokenResponse {
  idToken: string;
  refreshToken: string;
}

interface UserInfo {
  netid: string;
  name: string;
  email: string;
  department: string;
}

interface MFADetection {
  need: boolean;
  state?: string;
}

interface MFAGid {
  gid: string;
  securePhone: string;
}
```

## 错误处理

- **登录失败**: 抛出包含错误信息的 Error
- **MFA 验证失败**: 抛出 "验证码错误"
- **网络错误**: 包含原始错误信息
- **参数缺失**: 抛出相应错误信息

## 高级用法

### 使用 EHall 服务

```typescript
const xjtu = new XJTU({
  netid: 'your_netid',
  password: 'your_password'
});

// 登录
await xjtu.login();

// 获取 EHall 服务
const ehall = xjtu.useEHall();

// 使用 EHall 功能
// await ehall.getCourse('2023-2024-1');
// await ehall.getScore('2023-2024-1');
```

### 使用 WebVPN 服务

```typescript
const xjtu = new XJTU({
  netid: 'your_netid',
  password: 'your_password'
});

// 登录
await xjtu.login();

// 获取 WebVPN 服务
const webvpn = xjtu.useWebVPN();

// 获取 WebVPN 票据
const ticket = await webvpn.getTicket();
```

## 注意事项

1. **安全性**: 使用与官方应用一致的 RSA 加密方案
2. **MFA 支持**: 完整支持多因素认证流程
3. **自动生成**: 自动处理设备 ID 和客户端 ID 生成
4. **错误处理**: 内置完善的错误处理机制
5. **类型安全**: 完整的 TypeScript 类型定义

## 许可证

MIT