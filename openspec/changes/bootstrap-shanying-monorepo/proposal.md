# Proposal

## Why

原有两个仓库分别维护服务端与 Web，新增 Android 后需要统一 API 和协作基线，避免客户端后期发现契约缺口导致三线返工。当前本地为空仓库，先建立清晰可验证的结构。

## What Changes

- 建立单仓库三工程、共享契约目录和 API 文档，明确三端 agent 的写入范围。
- 建立 develop 集成、三个 dev 分支及 .worktree 隔离工作流，main 保留发布门槛。
- 收敛 P0 产品闭环与 Android 契约跟进要求；仅规划业务，不实现业务功能。
- 初始化 OpenSpec，提供场景、设计和可追踪任务。

## Capabilities

### New Capabilities
- `cross-client-api-consistency`：三端在发布前验证同一协议及其移动端失败恢复语义。

### Modified Capabilities
无现存规格。

## Impact

影响根目录、三端目录、Git 工作区和后续发布流程。Go/Hertz、React、Kotlin/Gradle 为新基线；不导入旧代码、不改远端、不宣称当前具备业务运行能力。
