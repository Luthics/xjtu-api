# 贡献指南

感谢您考虑为 XJTU API 项目做出贡献！

## 开发环境设置

1. Fork 项目仓库
2. 克隆你的 fork：
   ```bash
   git clone https://github.com/Luthics/xjtu-api.git
   cd xjtu-api
   ```

3. 安装依赖：
   ```bash
   bun install
   ```

4. 创建功能分支：
   ```bash
   git checkout -b feature/amazing-feature
   ```

## 开发流程

### 代码规范

- 使用 TypeScript 编写代码
- 遵循现有的代码风格
- 为所有公共 API 添加 JSDoc 注释
- 确保所有测试通过

### 运行测试

```bash
# 运行所有测试
bun test

# 运行特定测试文件
bun test src/core/xjtu.test.ts
```

### 代码检查

```bash
# 运行 ESLint
bun run lint

# 自动修复 ESLint 问题
bun run lint:fix
```

### 构建项目

```bash
bun run build
```

## 提交 Pull Request

1. 确保你的代码遵循项目规范
2. 添加或更新相关测试
3. 更新 README.md 文档（如果需要）
4. 提交清晰的 commit 信息
5. 创建 Pull Request 到主仓库的 `main` 分支

## Commit 信息规范

使用以下格式：

```
类型(范围): 描述

详细说明（可选）

BREAKING CHANGE: 破坏性变更说明（可选）
```

类型包括：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变动

## 报告问题

如果发现 bug 或有功能建议，请创建 issue 并包含：

- 问题的详细描述
- 复现步骤
- 期望的行为
- 实际的行为
- 环境信息（Node.js 版本、Bun 版本等）

## 行为准则

请遵守项目的行为准则，保持专业和尊重的交流环境。

## 许可证

通过提交贡献，您同意您的贡献将在 MIT 许可证下授权。