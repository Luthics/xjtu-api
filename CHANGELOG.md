# 变更日志

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.1.0] - 2025-10-28

### 新增
- 支持多种登录方式
  - 账号密码登录（原有方式）
  - Token 登录（新增支持直接使用 idToken 和 refreshToken）
- 新增 `TokenCredentials` 类型定义
- 新增 `setTokens()` 方法用于动态设置 token
- 新增 `getRefreshToken()` 方法
- 改进 `getUserInfo()` 方法，支持在已有 token 的情况下直接使用

### 技术特性
- 向后兼容，原有 API 完全不受影响
- 完整的 TypeScript 类型支持
- 新增测试用例验证 token 登录功能
- 更新文档说明多种登录方式的使用

## [0.0.1] - 2024-10-28

### 新增
- 初始版本发布
- 统一身份认证登录功能
- MFA 多因素认证支持
- 用户信息获取功能
- EHall 服务集成
- WebVPN 服务集成
- TypeScript 完整类型支持
- 正确的 RSA 加密方案

### 技术特性
- 使用 Bun 作为运行时
- TypeScript 开发
- ESLint 代码检查
- GitHub Actions 持续集成
- 完整的测试覆盖

## [Unreleased]

### 计划功能
- [ ] 课表查询功能完善
- [ ] 成绩查询功能完善
- [ ] 教室状态查询
- [ ] 更多 EHall 功能集成
- [ ] 性能优化
- [ ] 错误处理改进