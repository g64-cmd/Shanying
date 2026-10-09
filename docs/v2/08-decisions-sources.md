# 08 · 决策记录、风险与来源

## 1. ADR摘要

用户已确认：单人开发、自有本地服务器部署、无历史数据、合成测试数据、Hertz、v2不实现电商。用户已接受当前 0.2 版设计，D01—D08 均作为实施基线；接受设计不等于选型已通过运行验证。后续按实施需要在 `docs/adr/` 拆分记录，改变决定时新增或取代旧 ADR，并同步设计文档。仓库开发约束见 [AGENTS.md](../../AGENTS.md)。

| ADR | 决定 | 接受的代价 | 重审条件 |
| --- | --- | --- | --- |
| D01 | 模块化单体+独立worker，单仓三端 | 数据库和发布仍有共享故障域 | 独立伸缩/发布需求和测量证据出现 |
| D02 | Hertz、pgx、sqlc、SQL迁移 | 增加生成步骤，开发者需理解SQL | 工具不兼容或明确框架能力缺口 |
| D03 | Meilisearch独立索引 | 异步一致性、重建和一个常驻进程 | 中文评测或查询能力不能满足目标 |
| D04 | Gorse标签候选，协同与排序模型均禁训练 | 个性化主要依赖标签质量和反馈供给 | 用户明确改变训练约束，或仅推理有证据收益 |
| D05 | S3抽象，开发存储SeaweedFS | 需要验证S3兼容和HLS鉴权 | 实际兼容失败、维护状态变化或云部署需求 |
| D06 | v2不实现电商，仅保留扩展边界；聊天先做单聊 | 与完整商业抖音功能有显著差距 | 已完成v2，且增加范围有明确收益/预算 |
| D07 | 三职责分支小步合并main | 需要维护契约和集成纪律 | 多人协作时增加临时feature分支 |
| D08 | Web先贯通，Android逐步接入 | 早期两端功能不完全一致 | 有Android优先展示需求 |

## 2. 主要风险与处理

| 风险 | 影响 | 前置措施/退出条件 |
| --- | --- | --- |
| 个人同时做四业务三端 | 长期无法形成可展示闭环 | 按P1/P2/P3各自演示；每阶段固定范围 |
| “禁训练”仅写在口头要求 | 框架默认FM可能违反约束 | 显式配置与配置测试；锁版本验证运行任务 |
| 源码结构好看但核心行为不正确 | 简历难以说明真实工程能力 | 针对发布、消息、媒体故障窗口验证 |
| 标签/素材/行为太少 | 推荐相似度和指标无意义 | 生成多主题合成素材、标注供给不足、分开合成与真实评价 |
| Android工具链/媒体兼容性 | 构建和真机播放耗时超预期 | P0确定版本组合和一段真实HLS样片 |
| 引擎接口或维护状态变化 | 文档与安装版本不一致 | P0锁定版本、镜像digest与原生配置；不照抄latest示例 |
| 队列重试导致重复外部副作用 | 重复索引、消息提示或通知 | 稳定幂等键、数据库约束、外部查询/对账 |
| 各模块绕过接口直接改表 | 单体重新退化为难拆的共享数据层 | 导入约束、公开接口、PR中检查表所有权 |
| 缓存/索引下架传播延迟 | 暴露不应继续展示的内容 | 响应前主库可见性过滤、媒体出口版本校验 |

## 3. 实施前待验证与补充的事实

无需重复确认已接受的模块化单体、单聊范围、三分支、禁训练原则及默认选型。后续变更可直接指出决策编号；以下事实仍需补充或实测：

- 完成技术选型文档中的六项 P0 探针，锁定实际依赖、镜像与工具链组合。
- 根据希望的展示日期、每周投入、本地服务器资源与上行带宽，调整里程碑规模。
- 按当前测试机内存基线确认组件共存能力；无历史数据，取消导入任务。

这些事实不影响设计作为实施基线；探针失败或资源不满足目标时，保留证据并修订对应决策或验收目标，不能将接受设计当作运行成功的证明。

## 4. 资料与证据索引

核查日期均为2026-10-09。源码使用固定提交；官方文档和维护状态会变化，实施时需要按选定版本复核。来源支持组件能力或核查事实，架构、配额、时延和工期是本项目的设计判断。

| 来源 | 用于支持 |
| --- | --- |
| [旧后端固定源码](https://github.com/g64-cmd/shanying_server/tree/7a093311c963a651300b88f7e5da8d0c3e8fe2e0) | Go/SQL/存储、服务依赖、上传与异步逻辑 |
| [旧Web固定源码](https://github.com/g64-cmd/shanying_web/tree/07e7e1274faba515f7739ca2767c71d35a1b5a82) | Vue依赖、分页、认证存储、播放组件 |
| [Go发布记录](https://go.dev/doc/devel/release) | Go版本支持策略；实施基线保留用户文档中的1.26.x |
| [Node发布状态](https://nodejs.org/en/about/previous-releases) | 24为LTS基线 |
| [React版本](https://react.dev/versions) | 19.3版本依据 |
| [Vite 8](https://vite.dev/blog/announcing-vite8) | Web构建主版本依据 |
| [PostgreSQL版本策略](https://www.postgresql.org/support/versioning/) | 17系列支持期；不要求追最新major |
| [PostgreSQL SELECT/锁](https://www.postgresql.org/docs/17/sql-select.html) | SKIP LOCKED工作队列模式的基础语义 |
| [Hertz文档](https://www.cloudwego.io/docs/hertz/) | 当前HTTP框架；不因框架选择预设业务微服务 |
| [sqlc](https://sqlc.dev/) | 从SQL生成类型安全代码 |
| [Go Argon2](https://pkg.go.dev/golang.org/x/crypto/argon2) | Argon2id密码哈希实现与参数校准依据 |
| [Meilisearch分词](https://www.meilisearch.com/docs/capabilities/indexing/advanced/tokenization) | 中文分词及相关性需要实测 |
| [Meilisearch异步操作](https://www.meilisearch.com/docs/capabilities/indexing/tasks_and_batches/async_operations) | 接受写请求与索引任务成功的区别 |
| [Gorse首页](https://gorse.io/) · [配置](https://gorse.io/docs/config) | 默认具有模型训练能力；必须显式禁用 |
| [Gorse标签推荐](https://gorse.io/docs/concepts/recommenders/item-to-item) · [排序](https://gorse.io/docs/concepts/ranking) | tags召回与none排序方式 |
| [Gorse单机部署](https://gorse.io/docs/deploy/docker) | in-one形态与PostgreSQL后端；不照抄示例中的老PG版本 |
| [MinIO仓库](https://github.com/minio/minio) | 核查时显示2026-04-25归档 |
| [SeaweedFS仓库](https://github.com/seaweedfs/seaweedfs) | S3兼容存储候选，实际子集必须跑探针 |
| [hls.js](https://github.com/video-dev/hls.js) | 浏览器HLS播放与原生支持检测 |
| [Hertz WebSocket迁移说明](https://github.com/hertz-contrib/websocket) | 旧扩展归档，改用HTTP Adaptor + gorilla/websocket |
| [Redis Pub/Sub](https://redis.io/docs/latest/develop/pubsub/) | 不持久的投递语义，需数据库补偿 |
| [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview) | Web服务端状态管理 |
| [Android架构](https://developer.android.com/topic/architecture) | UI/data职责及生命周期边界 |
| [Media3入门](https://developer.android.com/media/media3/exoplayer/hello-world) | Java/XML播放器接入 |
| [Android JDK](https://developer.android.com/build/jdks) · [AGP 8.13](https://developer.android.com/build/releases/agp-8-13-0-release-notes) | JDK与构建工具兼容性，需P0实际构建 |
| [OpenAPI 3.0.3](https://spec.openapis.org/oas/v3.0.3.html) | HTTP契约格式 |
| [oapi-codegen](https://github.com/oapi-codegen/oapi-codegen) · [openapi-fetch](https://openapi-ts.dev/openapi-fetch/) · [Java生成器](https://openapi-generator.tech/docs/generators/java/) | Go/TS/Java契约生成路线 |

## 5. 本轮交付与验证边界

已完成：两旧仓库固定源码核查、官方能力/维护状态核查、v2设计与选型、领域数据与协议草案、里程碑及验收计划。

尚未执行：旧项目构建/测试、v2依赖解析/代码生成、Compose启动、真机播放、任何负载/质量指标测试、远程归档、分支创建和推送。文档所列能力不等于项目已经具备。
