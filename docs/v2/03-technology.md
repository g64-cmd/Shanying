# 03 · 技术选型与版本策略

## 1. 明确的技术基线

| 层 | 选择 | 原因与边界 |
| --- | --- | --- |
| 后端 | Go 1.26.x；Hertz（P0 锁定稳定版本） | 按用户决定采用 Hertz；框架只在 HTTP adapter 中出现 |
| 数据库 | PostgreSQL 17，受支持的最新补丁 | 事务、行锁、约束、JSONB 满足当前四类业务；不为模块新增数据库类型 |
| SQL | pgx v5 + sqlc 1.x | 保留 SQL 可控性，生成类型安全访问代码；替换 sqlx 反射映射 |
| 迁移 | goose v3，SQL migrations | 迁移进入代码评审；不在服务启动时自动改表 |
| 缓存 | Redis 8.x + go-redis v9 | 缓存、限流、短期会话列表、在线通知提示；不保存唯一业务事实 |
| 后台任务 | PG outbox + delivery/job 表 | 事务一致性、可观察重试；第一版不加消息代理 |
| 对象存储 | S3 协议；本地 SeaweedFS；Go AWS SDK v2 | 业务不绑定供应商；自有本地服务器使用同一 S3 adapter，未来可替换存储端 |
| 媒体处理 | FFmpeg + ffprobe，独立 worker | 提取真实参数、封面、H.264/AAC MP4/HLS |
| 搜索 | Meilisearch 1.x，自托管 | 有中文分词、过滤、相关性配置；由固定查询集评估效果 |
| 推荐 | Gorse，非训练配置 | 标签相似候选；Go 负责确定性混排；不依赖在线 LLM |
| 实时连接 | gorilla/websocket + Hertz HTTP Adaptor + REST 历史补拉 | 按 Hertz 迁移指引接入标准 WebSocket；P0 验证升级、鉴权、关闭与代理透传 |
| 认证 | JWT access + opaque refresh，服务端会话表；密码用 Argon2id | 短 access 生命周期，轮换和设备撤销可控；密码成本参数按演示机校准 |
| API 契约 | OpenAPI 3.0.3；WS/事件 JSON Schema | 兼顾 Go/TS/Java 生成器成熟度；先定义契约再并行实现 |
| Web | React 19.3 + TypeScript strict + Vite 8 | SPA 适合视频流应用；当前不承担 SEO/SSR 需求 |
| Web 数据 | React Router 7 + TanStack Query 5 | URL 管理筛选，Query 管理服务端缓存；必要的 UI 状态用 Zustand 5 |
| Web UI | CSS Modules + CSS variables + Radix primitives | 业务样式自主，复用无障碍基础交互；不做自研组件框架 |
| Web 播放 | 原生 video + hls.js | 支持原生 HLS 时直接使用，否则经 hls.js；另有 MP4 回退 |
| Web 工具链 | Node.js 24 LTS + pnpm 10 | 锁文件、workspace、固定包管理器版本 |
| Android | Java 17 + XML/Views + AndroidX | 遵守 Java 约束；不使用以 Kotlin 为核心的 Compose |
| Android 架构 | ViewModel + LiveData + Repository | 单向状态流；线程任务用 ExecutorService |
| Android 网络/存储 | Retrofit 2、OkHttp 4、Room 2、WorkManager 2 | 网络隔离、聊天本地存储、允许条件下的后台重试 |
| Android 播放 | AndroidX Media3 1.x ExoPlayer | 生命周期管理、HLS、自适应播放；不用旧 ExoPlayer 2 包 |
| Android 构建 | JDK 17 / AGP 8.13.2 / Gradle 8.13 | 官方工具链兼容表支持该组合；P0 再验证所选 AndroidX 的 minCompileSdk 与实际构建 |
| 观测 | slog JSON + OpenTelemetry + Prometheus/Grafana/Tempo | request/trace ID 贯穿 HTTP、任务、外部调用 |
| 测试 | Go testing/testcontainers-go；Vitest/RTL/MSW/Playwright；JUnit/Espresso | 数据约束用真实 PG 集成测试，三端用共享契约样例 |
| 交付 | GitHub Actions + Docker Compose + Caddy | 单机可复现，先不引入 Kubernetes/Terraform |

Go、React、Node 状态已在 2026-10-09 官方页面核查；其余 major 是设计基线，不是“所有最新版本”的声明。框架补丁、镜像 digest、Android 工具链兼容组合必须在 P0 安装验证后进入锁文件。**本轮没有执行依赖解析，不能把这张表当成已经验证可编译的 lockfile。**

Android `minSdk=26`；初步 `compileSdk/targetSdk=36`。本稿以本地安装演示为目标，不声称满足未来应用商店提交政策。Java 源码兼容级别和 Gradle 运行 JDK 分开固定；若 AGP/AndroidX 要求不同，按兼容表整体升级，不任意只改一项。[Android JDK 文档](https://developer.android.com/build/jdks)

## 2. 为什么不选其它方案

| 取舍 | 本稿结论 |
| --- | --- |
| Hertz 替代 Gin | 用户已确定采用 Hertz；路由、中间件与绑定层随之更换，领域层不依赖框架。采用 Hertz 不要求同时引入微服务、Kitex 或注册中心。[Hertz](https://www.cloudwego.io/docs/hertz/) |
| sqlc vs GORM | 选择 sqlc；消息序号锁、游标和批量查询需要显式 SQL。代价是维护 SQL、迁移和生成配置。[sqlc](https://sqlc.dev/) |
| Meilisearch vs PG zhparser vs OpenSearch | 选择 Meilisearch；脱离旧定制 PG 镜像且支持中文。接受额外投影一致性与运维；中文相关性必须测。OpenSearch 暂不引入，PG 不承担主搜索功能。[官方分词文档](https://www.meilisearch.com/docs/capabilities/indexing/advanced/tokenization) |
| Gorse vs 自研推荐框架 | 用其已有标签近邻能力；显式关闭训练。只开发业务策略和评估，不造训练平台；若固定版本无法满足禁训练要求，P0 判失败并提交替代 ADR，不能静默开启训练。 |
| SeaweedFS vs 继续 MinIO | 旧 MinIO 接口经验仍可复用；截至核查日 MinIO 官方仓库已显示归档，新项目不默认依赖它。本稿选择 SeaweedFS，必须验证所用 S3 子集。[MinIO](https://github.com/minio/minio) · [SeaweedFS](https://github.com/seaweedfs/seaweedfs) |
| PG 队列 vs Redis Streams/NATS/Kafka | 当前优先可靠性和少依赖；业务数据与 outbox 同事务。需要大规模流处理时再评审代理，不给浏览量直接上 Kafka |
| Vite SPA vs Next.js | 当前为交互应用，Go 已负责业务，无 SSR 要求；引入 Next 会增加服务端边界。若公开页面 SEO 成为目标，再单独设计公开页面 |
| Java Views vs Compose | Java 是用户确定的要求；Views + Media3 提供直接 Java 接入路径。[Media3](https://developer.android.com/media/media3/exoplayer/hello-world) |
| 自研聊天协议 vs 成品 IM | 用标准 WS + 很小的消息协议展示可靠交付能力；不做完整 IM SDK、群聊或通话 |

## 3. P0 必须完成的技术验证

这些是启动开发的验证任务，不是将关键选型拖成无穷候选列表。失败时必须记录原因并修改决策。

1. Hertz + OpenAPI 契约：`oapi-codegen` 仅生成 Go types，手写薄 Hertz 路由/handler，测试校验请求与响应符合 OpenAPI；不再生成 Gin server。Web 使用 `openapi-typescript` + `openapi-fetch`，Android 使用 OpenAPI Generator Java Retrofit2。对 nullable、枚举、字符串 ID、错误响应跑同一组样例，校验 operationId 与实际路由一一对应。暂不另加 Thrift/Protobuf 作为第二份接口事实来源。P0 同时验证 Hertz HTTP Adaptor + gorilla/websocket 的握手、Origin/ticket 校验、心跳与优雅关闭。
2. pgx/sqlc/goose：从空库迁移，生成查询，做真实事务回滚；CI 重新生成后必须无差异。
3. SeaweedFS：验证 multipart create/upload/list/complete/abort、预签名、HEAD、Range GET、跨域与删除；失败不靠扩大 bucket 公共权限解决。
4. Gorse：固定镜像后验证 `collaborative.type=none`、`ranker.type=none` 生效，检查运行日志/任务列表无模型拟合或调参，标签相似候选确有个性差异。
5. Meilisearch：固定中文混合查询集；验证异步 task 状态、文档删除和新索引切换。
6. Android：验证 JDK/Gradle/AGP/SDK/Room/Media3 组合；Java 工程启动、连接 mock API、播放同一 HLS 样片。

版本锁定产物为 `go.mod/go.sum`、`pnpm-lock.yaml`、`packageManager`、Gradle wrapper/version catalog、镜像 digest 清单。P0 发布 `docs/dependency-baseline.md`，列明具体版本、验证命令、兼容性偏差。禁止开发环境长期使用浮动 `latest`。

## 4. 运行成本边界

推荐没有训练机和 GPU 前置条件；v2 首版不部署 embedding 模型。FFmpeg 转码和媒体出网预计是主要资源消耗，需分别测量 CPU 秒/视频分钟、转码失败率、存储放大倍数、每次有效播放字节数。搜索与推荐由 profile 按阶段启用。

部署使用自有本地服务器，不假定云主机采购。P0 依据实际 CPU、内存、磁盘和上行带宽确定限额；合成视频也必须测量真实转码与播放开销。不能用容器能启动替代容量验证。

Hertz 配套 WebSocket 旧扩展已归档，其仓库建议迁移到 HTTP Adaptor + gorilla/websocket；本稿按该路线调整，不直接沿用旧 Gin/net/http 中间件。[迁移依据](https://github.com/hertz-contrib/websocket)
