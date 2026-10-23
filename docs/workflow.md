# 协作与交付工作流

## 分支与目录

根检出用于 develop 集成。三个端侧 worktree 是同一个仓库的完整副本，共享 Git 对象但各有分支、索引和工作区。

| 分支 | 工作区 | 写入责任 |
| --- | --- | --- |
| main | 发布时单独检出或临时切换干净根目录 | 已验收版本 |
| develop | 仓库根目录 | 共享契约、规范、集成 |
| dev/backend | .worktree/backend | backend/ |
| dev/frontend | .worktree/frontend | frontend/ |
| dev/android | .worktree/android | android/ |

首次空仓库需要一个文档 bootstrap 提交使分支可创建。main 上的该提交只是可验证的工程基线，明确不是可运行平台；首个应用版本通过全套验收后才成为稳定发布。

在已存在 develop、且目标路径/分支尚不存在的新检出中，可从仓库根目录创建：

```powershell
git worktree add .worktree/backend -b dev/backend develop
git worktree add .worktree/frontend -b dev/frontend develop
git worktree add .worktree/android -b dev/android develop
```

若分支已存在，去掉 `-b` 并使用对应分支作为最后参数。先检查 `git worktree list`，不得覆盖已有目录或重复检出同一分支。不要在根目录来回切换三端分支。

## 每个切片的顺序

1. 协调者创建 OpenSpec proposal/specs/design/tasks，明确用户场景、范围、兼容和验收；执行 strict validation。
2. 协调者在 develop 更新 contracts/ 和 docs/api/；三端评审请求/响应、错误、授权、分页及移动端恢复语义。先提交共享契约。
3. 各端在自己干净 worktree 执行 `git merge develop`，基于同一契约提交开始实现。禁止跨 worktree 编辑文件。
4. 各端运行本端检查并记录命令、结果、环境和未验证项；Android 至少提交客户端/解析验证。
5. 协调者确认根工作区干净，在 develop 依次 `git merge --no-ff dev/backend`、`git merge --no-ff dev/frontend`、`git merge --no-ff dev/android`。冲突人工审阅，不自动取一侧。
6. develop 上验证契约、三端构建和 Ubuntu 联调。失败时修复后重验，不提升 main。
7. 全部发布门槛通过后才合并 develop 到 main，记录发布与回滚点。远端 push/PR/发布须用户授权。
8. 三端分别合并新的 develop，再开始下一切片。不要对已共享提交 rebase 或强推。

长期分支采用短周期合并，任务应尽量在一个业务切片内完成。根级共享文件只有协调者写入；worktree 并不能自动消除合并冲突。

## 检查门槛

- 基础结构：仓库检查脚本、OpenSpec strict validation、git diff --check、分支/worktree 映射。
- 契约：OpenAPI lint、breaking-change 检测、示例 schema 校验、Go/TS/Kotlin 消费验证。实现切片必须补齐对应工具和固定版本；当前尚无运行中的契约 CI。
- 后端：单元/权限/幂等测试、数据库迁移及 Ubuntu 真实依赖集成。
- Web：类型检查、生产构建、主要交互及真实接口联调。
- Android：Gradle 编译、JVM 契约测试；播放器与生命周期需设备证据。
- 发布：三端适配、核心闭环、权限边界、媒体失败恢复、迁移与回滚演练、部署健康检查。
- 当前验收见 define-shanying-platform：跨入口隐私矩阵、首条私聊权限、多店隔离、支付重放、部分退款、财务持久化、广告预算和模拟整链。模拟通过不代表真实支付或税务验收。

检查不通过或未运行须记录 fail / not_run，不允许用“文件已创建”替代运行验收。

## 环境隔离

Windows 11 负责编辑、Web/Android 开发及静态检查；Ubuntu 26.04 LTS 承担后端运行和真实集成验收。后续 Compose 放 backend/deploy/，固定镜像版本，每组 agent 使用独立项目名、端口、数据库和存储前缀。Gradle 缓存/锁、设备和测试账号也需要协调。

## 旧仓库与回退

本次不复制旧源码，也不删除/归档两个远端。后续迁移先固定原仓库 commit SHA，检查许可证、敏感文件及行为差异，按模块移植并保留出处。出现问题通过普通 revert 或已记录发布版本回退；不得用 reset --hard 抹去他人工作。旧 API 兼容需求必须单独评估，当前不承诺兼容所有旧客户端。
