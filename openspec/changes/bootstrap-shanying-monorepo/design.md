# Design

## Context

见 proposal.md。当前本地只有未提交的 Git 仓库，旧服务端/Web 的 README 分别描述 Gin/Vue；已有历史记录不能代表当前工作区。用户明确改为 Kotlin、dev/frontend、.worktree 和最新 Ubuntu LTS。

## Goals / Non-Goals

Goals：建立可并行工作的单仓库基础与契约评审规则，业务切片提前考虑 Android。

Non-Goals：本次不初始化可执行应用、不迁移旧数据、不复制旧仓库全部历史、不部署、不实现业务 API。

## Decisions

1. 单仓库下 backend/frontend/android 三独立工程；“各自仓库”解释为各自工程边界，因为用户同时明确最终仅保留一个仓库。未选 submodule，避免三份版本和契约提交失配。
2. 根检出为 develop，三个完整 worktree 位于 .worktree。使用用户指定分支名，普通 merge 同步；未选三个互不关联 clone，避免分叉流程及重复管理。
3. contracts/OpenAPI 为唯一协议源，docs/api 放说明；三端生成/校验语言类型。未选直接共享 TypeScript 类型，因为 Go/Kotlin 无法直接消费。
4. Go/Hertz 模块化单体，React/TypeScript，Kotlin/Gradle。不提前引入 Kitex 微服务；按真实需求扩展字节生态中间件。
5. Ubuntu 26.04 LTS + Docker Compose 为运行基线，PostgreSQL 17 为初始方案。客户端构建依赖版本在首次工程初始化时固定。
6. 基础设施任务和后续业务实现分开。契约场景是后续业务的发布要求，文档检查不能证明场景已经运行通过。

## Risks / Trade-offs

- 长期开发分支漂移 → 每个切片合并 develop，协调者串行整合共享文件。
- worktree 无法隔离运行资源 → Compose 项目名、端口和测试数据独立分配。
- Android 界面落后掩盖协议问题 → 每轮强制 Kotlin 构建及样例消费测试。
- 空仓库无稳定产品 → main 首次仅保存明确标注的 bootstrap，首个应用发布须完整验收。
- 产品范围来自初步收敛 → 业务切片使用独立 change 细化并审阅，不将本次规划描述为产品交付。

## Migration Plan

本轮只创建本地基础提交与分支，不改两个旧远端。以后按固定旧 commit 引用、许可证审计、逐模块移植、独立验收推进；回退使用普通 revert，业务部署回退方案随首个部署 change 编写。
