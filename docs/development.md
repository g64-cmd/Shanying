# 开发入口与共同基底

日期：2026-10-10（北京时间）。本轮落实 v2 0.2 版设计的仓库结构，供 `dev/backend`、`dev/web`、`dev/android` 从同一 main 提交起步。

## 1. 当前可运行的检查

在仓库根目录执行以下纯仓库检查（可在 Windows 编辑工作区或 Ubuntu 上运行）：

```sh
node --version
node scripts/check-repository.mjs
git diff --check
```

Node 固定版本见根目录 .node-version。本轮检查无需安装包或启动容器：检查目录职责入口、相对链接目标、JSON 文件和 Markdown JSON 示例语法、文本 UTF-8/结尾换行，并拒绝 commerce 目录。链接检查不联网，也不校验标题锚点；本轮没有 Go 导入检查、OpenAPI/schema 校验或三端构建。

已配置[仓库 CI](../.github/workflows/repository.yml)，在 main、三个开发分支的 push 和所有 PR 上执行相同检查，固定 `runs-on: ubuntu-24.04`。工作流配置已经落地，远程运行结果需推送后验证。

## 2. 目录与实现状态

目录使用 README 跟踪职责，不用空业务包或伪启动命令占位。实际入口见根[README](../README.md)。server、apps、contracts、SDK、deploy、tests 当前都是结构入口，没有服务、页面、APK、正式接口、数据库或部署。

首个 Go/Web/Android 工程创建时，再建立真实构建配置和依赖锁；版本偏差与验证结果更新到[依赖基线](dependency-baseline.md)。统一检查入口随实现扩展，增加对应格式、lint、架构、契约和构建任务，不能一直只检查文档。

server 在自有 Ubuntu 24.04 服务器上构建、运行和验收，后端 CI 同样固定 ubuntu-24.04，不使用 Windows/WSL 的 server 运行路径。运行方式沿用 Docker Compose；本次仅检查编辑工作区，尚未连接 Ubuntu 服务器。部署决定见[ADR 0001](adr/0001-server-ubuntu-24.md)。

服务配置尽可能通过 Docker/Compose 完成，PostgreSQL 使用官方 17 系列镜像，API/worker 与其它基础服务优先容器化。后续运行说明以拉取/构建锁定镜像、注入配置、挂载持久化卷、执行迁移和启动 Compose 为主；不要求在宿主机逐项安装 PG 等服务。镜像、配置与例外记录见[部署说明](../deploy/README.md)及[ADR 0002](adr/0002-docker-first-services.md)，目前尚无真实 Compose 启动结果。

## 3. 三分支共同起点与同步

共同基底由本轮 main 的仓库初始化、Ubuntu 24.04 运行基线及 Docker 优先服务配置修订提交共同承载。先创建三个本地分支，再将它们快进同步到最终 main，保持当前工作目录位于 main。没有推送、归档旧仓库或部署服务器。

复核本地分支的提交：

```sh
git rev-parse main dev/backend dev/web dev/android
git status --short --branch
```

初始化后四个提交值应相同。开始一个端的任务前确认工作区干净，再切到对应分支，例如：

```sh
git switch dev/backend
```

三分支职责分别是 server/deploy/契约、apps/web/Web SDK、apps/android。公共契约先合入 main，三端再同步；小切片使用普通 merge，已共享分支不 rebase/force-push。以后同步时在所需分支执行 `git merge main`，并保留冲突处理与相关验证。

单人顺序开发使用当前 checkout 即可；并行任务必须使用独立 worktree，同一个目录不同时切换分支。分支推进后无需保持 tip 相等，共同基底应仍是三分支共同祖先。

## 4. 后续领取次序

1. B-001 / C-001：实际 Go 模块、最小 Hertz 契约、生成器与架构检查；正式契约先进入 main。
2. W-001 / A-001：锁定 pnpm 10 和 JDK 17 工具链，建立 React 与 Java Views 最小工程，共用契约样例。
3. B-002 / B-003 / B-004：PG 事务与任务、S3/FFmpeg、Gorse 禁训练与 Meilisearch 探针，逐项保留真实失败与结果。
4. Q-001 完善运行/CI，再按 P1 Web 真实闭环、Android 契约接入的顺序推进。

本次完成的是共同仓库基底，不代表 P0 全部通过。任务编号和完成定义见[开发与验收](v2/07-delivery.md)。

## 5. 初始化的本地验证

2026-10-10 在 Windows 编辑工作区 / Node 24.11.0 实际运行，初次初始化输出为：

- 仓库检查通过：34 个必需入口、37 份 Markdown、81 个本地链接、2 个 JSON 示例/文件。
- 临时加入错误 JSON 和缺失链接，检查退出码为 1 且分别报告错误；移除探针后恢复通过。
- 从 apps/web 目录调用同一脚本也通过，检查以脚本位置确定仓库根目录。
- `node --check scripts/check-repository.mjs` 与 `git diff --check` 通过。

Ubuntu 运行基线修订后重新运行仓库检查与补丁空白检查。CI 配置已静态审阅，尚未在 GitHub runner 上运行；本机可用 Python/Node 依赖中未找到 YAML 解析器，因此没有 YAML 解析器校验结果。三端构建、正式 schema 校验、Ubuntu 服务器连接、容器启动与六项 P0 探针均未执行。
