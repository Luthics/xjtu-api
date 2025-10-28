# 发布指南

## 发布流程

### 1. 准备工作

确保所有测试通过：
```bash
bun test
bun run lint
bun run build
```

### 2. 更新版本号

使用语义化版本控制：

- **主版本号 (MAJOR)**: 不兼容的 API 修改
- **次版本号 (MINOR)**: 向下兼容的功能性新增
- **修订号 (PATCH)**: 向下兼容的问题修正

```bash
# 更新版本号
npm version patch  # 修复 bug
npm version minor  # 新增功能
npm version major  # 不兼容变更
```

### 3. 更新 CHANGELOG

在发布前更新 `CHANGELOG.md` 文件，记录本次发布的变更。

### 4. 提交更改

```bash
git add .
git commit -m "chore: release v1.x.x"
git push origin main
```

### 5. 创建 Git Tag

```bash
git tag -a v1.x.x -m "Release v1.x.x"
git push origin v1.x.x
```

### 6. 发布到 npm

```bash
npm publish
```

### 7. 创建 GitHub Release

1. 前往 GitHub Releases 页面
2. 点击 "Draft a new release"
3. 选择刚才创建的 tag
4. 填写发布标题和描述
5. 发布

## 自动化发布

项目配置了 GitHub Actions，在推送到 `main` 分支时会自动：

1. 运行测试和代码检查
2. 构建项目
3. 发布到 npm（需要配置 NPM_TOKEN）

## 环境变量配置

### GitHub Secrets

在 GitHub 仓库设置中配置以下 secrets：

- `NPM_TOKEN`: npm 发布令牌

### 获取 NPM_TOKEN

1. 登录 npm 账户
2. 前往 Account Settings
3. 选择 "Access Tokens"
4. 创建新的 Token（选择 "Automation" 类型）

## 发布检查清单

- [ ] 所有测试通过
- [ ] 代码检查通过
- [ ] 构建成功
- [ ] 版本号已更新
- [ ] CHANGELOG 已更新
- [ ] README 文档已更新（如果需要）
- [ ] 依赖包已更新到最新版本
- [ ] 没有已知的安全漏洞

## 回滚流程

如果发布出现问题：

1. 从 npm 撤回包：
   ```bash
   npm unpublish xjtu-api@1.x.x
   ```

2. 删除 Git tag：
   ```bash
   git tag -d v1.x.x
   git push origin :refs/tags/v1.x.x
   ```

3. 回滚代码更改

## 支持策略

- 主版本：长期支持
- 次版本：支持到下一个次版本发布
- 修订版：支持到下一个修订版发布