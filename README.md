# 闪映 Shanying

短视频平台的 v2 重构：Go 后端、React Web、Java Android。

**当前阶段：v2 0.2 版设计已接受，共同仓库基底已初始化，业务与三端应用尚未实现。** 目标是完成视频、搜索、无模型训练的推荐、聊天四类业务的可验证闭环。由一人开发，Go + Hertz 后端部署在自有 Ubuntu 24.04 服务器；测试使用合成数据，无历史数据迁移。电商仅保留未来扩展边界。

从 [v2 设计评审入口](docs/v2/README.md) 开始阅读。文档包含旧版核查、架构与选型、数据与接口约定、业务流程、客户端设计和开发验收计划。

开发代理开始工作前阅读根目录 [AGENTS.md](AGENTS.md)，遵循模块边界、契约、分支协作和验证规则。

## 仓库入口

| 路径 | 职责与当前状态 |
| --- | --- |
| [server](server/README.md) | Go API/worker、模块边界与迁移目录；尚无 Go 工程 |
| [apps/web](apps/web/README.md) | React Web 入口；尚无页面或依赖 |
| [apps/android](apps/android/README.md) | Java Views 入口；尚无 Gradle 工程 |
| [contracts](contracts/README.md) | HTTP、WS、事件及共享示例；正式契约待 C-001 |
| [packages/api-client-web](packages/api-client-web/README.md) | Web 生成 SDK 入口；尚无生成代码 |
| [deploy](deploy/README.md) | Ubuntu 24.04/Compose 部署入口；尚无可启动配置 |
| [scripts](scripts/README.md) | 已可运行的仓库检查；后续接入生成与启动工具 |
| [tests](tests/README.md) | 契约、真实闭环与负载测试入口；尚无业务测试 |
| [docs/adr](docs/adr/README.md)、[docs/benchmarks](docs/benchmarks/README.md) | 决策变更与实测证据入口 |

## 开始开发

安装 .node-version 指定的 Node，在仓库根目录运行：

```sh
node scripts/check-repository.mjs
```

检查无需依赖安装；当前仅验证仓库结构、文档链接、JSON 语法与文本约定。完整开发入口、分支同步、实际工具链差异和下一步任务见[开发说明](docs/development.md)与[依赖基线](docs/dependency-baseline.md)。

本轮初始化及 Ubuntu 24.04 运行基线修订共同构成 main 与 `dev/backend`、`dev/web`、`dev/android` 的共同起点；三分支按小切片普通 merge 回 main，公共契约先集成再同步客户端。本次仅建立并同步本地分支，未推送或部署；P0 六项技术验证仍待执行。

旧版参考：[shanying_server](https://github.com/g64-cmd/shanying_server) · [shanying_web](https://github.com/g64-cmd/shanying_web)。旧仓库尚未归档。
