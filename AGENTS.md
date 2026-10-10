# AGENTS.md

本文件约束在本仓库工作的开发代理。默认使用中文沟通、编写项目说明与决策记录；代码标识符使用英文。开始任务前阅读本文件，再按改动范围阅读对应设计文档。

## 1. 项目基线与任务边界

闪映 Shanying 是个人维护的短视频平台，采用 Monorepo：Go 后端、React Web、Java Android。用户已接受 v2 0.2 版设计作为后续实施基线。

- v2 实现视频、搜索、推荐、聊天四条业务主线，以及必要的账号、社交、通知和 Web 管理能力。
- 单人开发；后端部署在开发者自有 Ubuntu 24.04 服务器，server 不使用 Windows 或 WSL 运行。无历史数据迁移，测试使用合成账号、行为和可复现生成的有效视频。
- 后端使用 **Hertz**；Web 使用 **React + TypeScript**；Android 使用 **Java + XML/Views**。
- 推荐**完全不训练模型**，包括框架自动训练、微调和自动调参。初版不部署 embedding 模型，不依赖 GPU 或在线 LLM。
- v2 **不实现电商**。仅保持数据所有权、依赖方向和协议扩展边界；不创建空 commerce 包、交易表、支付接口或商城菜单。
- 聊天先做一对一文本和视频卡片；群聊、音视频通话、可靠后台推送不在本版范围。管理员功能集中在 Web。

当前仓库以设计文档为主。目标目录、命令、接口和测试在实际创建前都是计划，不能报告为已实现。维护本文件时，不应把某一轮“只交付文档”的范围变成永久禁止开发的规则。

用户后续明确指示优先于本文件及设计稿。正常实现细节按现有基线自主推进；发现设计冲突、兼容性失败或需要改变业务范围时，说明证据与影响，更新相关决策。不得静默替换已确定的语言、框架、禁训练约束或电商范围。

## 2. 按任务阅读设计

| 任务 | 必读文档 |
| --- | --- |
| 理解范围与背景 | [设计入口](docs/v2/README.md)、[旧版核查](docs/v2/01-legacy-review.md) |
| 后端结构、模块协作、部署 | [总体架构](docs/v2/02-architecture.md) |
| 初始化、依赖变更、组件接入 | [技术选型](docs/v2/03-technology.md) |
| API、数据库、认证、协议 | [数据与接口](docs/v2/04-data-contracts.md) |
| 视频、搜索、推荐、聊天实现 | [业务流程](docs/v2/05-domain-flows.md) |
| Web 与 Android | [客户端](docs/v2/06-clients.md) |
| 分支、里程碑、测试、发布 | [开发与验收](docs/v2/07-delivery.md) |
| 决策调整与来源核查 | [决策与来源](docs/v2/08-decisions-sources.md) |

本文件提取开发约束；字段、状态机、配置和验收细节以对应文档为准。发现两者不一致应显式解决，不能选择更方便的一份悄悄实现。重要架构改变在 `docs/adr/` 记录原因、替代方案、影响、验证和迁移/回退办法，并同步设计文档。

[未来电商备忘](docs/future/commerce-notes.md) 仅供参考，不是已批准需求。旧仓库也只用于理解既有行为和重构动机，不直接继承其技术栈、耦合和安全缺陷。

## 3. 目标结构与开发顺序

以下为目标结构，按当前切片需要逐步创建，不一次搭建所有业务空壳：

| 路径 | 职责 |
| --- | --- |
| `server/cmd/api`、`server/cmd/worker` | API 和后台任务入口，共用业务模块与发布版本 |
| `server/internal/modules` | identity、content、media、social、discovery、messaging、notification、moderation |
| `server/internal/platform`、`server/internal/bootstrap` | 技术基础设施、显式依赖组装与跨模块适配 |
| `server/migrations` | 全局有序 SQL 迁移 |
| `apps/web`、`apps/android` | 两个客户端 |
| `contracts/http`、`contracts/realtime`、`contracts/events`、`contracts/examples` | HTTP、WS、事件契约及共享正反例 |
| `packages/api-client-web` | 生成的 Web SDK 与少量运行时封装 |
| `deploy`、`scripts`、`tests` | 部署、复现工具、契约/端到端/负载测试 |

按 P0 技术验证 → P1 上传到双端播放 → P2 视频与搜索 → P3 推荐 → P4 聊天与客户端补齐 → P5 展示验收推进。先完成 Web 的真实闭环，Android 随契约接入；三分支不意味着一个人同时开展三项大任务。用户指定的当前任务可以调整执行顺序。

## 4. 后端架构与数据所有权

采用**模块化单体 + 独立 worker**。业务模块统一构建、发布，默认通过进程内 Go 接口协作；后台媒体任务可独立运行和限制资源。不得为了目录整齐引入内部 HTTP/RPC、微服务、注册中心或 Kubernetes。

- 模块内部依赖方向为 `adapters → application → domain`。domain 不依赖 Hertz、SQL、Redis 或第三方 SDK。
- Hertz RequestContext 留在 HTTP adapter；业务层接收标准 `context.Context` 和普通参数。不要让框架 DTO、数据库记录或 SDK 类型穿透领域边界。
- 接口由消费者按实际需要定义，bootstrap 显式注入。跨模块使用公开能力及 `public` 类型；不导入其它模块的 repository 或内部实现。
- 各模块拥有自己的 schema、表和业务状态。禁止跨模块直接读写或 JOIN 业务表；列表通过批量公开查询或所属读投影组装。
- 域内用 FK、CHECK、UNIQUE 和行锁保障不变量；跨域引用通过接口校验与修复任务维护，不用跨 schema 触发器隐式修改其它域。
- sqlc 记录留在 PostgreSQL adapter；领域模型不直接作为 HTTP 响应。迁移不在服务启动时自动执行。
- `platform` 仅提供技术能力。不得堆积万能 `common/utils/base_service`、通用业务实体、万能 CRUD repository、全局 service locator 或无实际需求的插件系统。
- 导入边界要通过 lint/架构检查和评审落实，不能只靠目录命名。

未来 commerce 拥有商品、库存、订单和视频商品关联数据，通过公开能力使用身份与内容。当前视频表不得提前加入价格、库存、订单字段，现有模块不依赖尚不存在的 commerce。

## 5. 技术与契约约束

具体版本详见[技术基线](docs/v2/03-technology.md)。保留 Go 1.26.x、PostgreSQL 17、pgx v5 + sqlc + goose、Redis、S3/SeaweedFS、FFmpeg、Meilisearch、Gorse 的既定路线。Web 使用 Vite、TanStack Query、hls.js；Android 使用 ViewModel/LiveData、Retrofit/OkHttp、Room、WorkManager、Media3。

- P0 完成六项验证：Hertz/契约/WS、PG 工具链、S3 子集、Gorse 禁训练、Meilisearch、Android 工具链与播放。兼容失败必须记录并修订决策，不能假装探针通过。
- 设计中的版本是选型基线，不是已经安装验证的锁文件。实际解析后提交 Go/pnpm/Gradle 锁定配置和镜像 digest，记录到 `docs/dependency-baseline.md`；不得长期使用浮动 `latest`。
- `contracts/http/openapi.yaml` 使用 OpenAPI 3.0.3，是 HTTP 契约唯一来源。先改契约、示例与兼容说明，再改实现及生成代码；不得手改生成文件或在三端各抄一套 DTO。
- Go 使用 oapi-codegen 生成 types，手写薄 Hertz 路由/handler 并验证请求响应契约；不生成 Gin server，不新增竞争的 Thrift/Protobuf 接口定义。
- Web 使用 openapi-typescript/openapi-fetch；Android 使用 OpenAPI Generator Java Retrofit2。WS 与内部事件使用版本化 JSON Schema。
- WebSocket 使用 Hertz HTTP Adaptor + gorilla/websocket；验证升级、Origin、一次性 ticket、心跳和关闭，不直接沿用旧框架中间件。
- HTTP 业务基路径为 `/api/v2`。使用正确状态码与稳定错误 code，不用 200 包装失败。数组为空返回 `[]`。
- UUID 用 JSON 字符串；时间用 RFC 3339 UTC；BIGINT 序号/版本用十进制字符串，以整数语义比较，避免 JS 精度丢失或字典序比较。
- 游标绑定用户、过滤条件和版本并验证签名；按契约处理过期与降级，不能混用不同排序模式的游标。
- 删除字段或改变语义必须版本化并提供兼容窗口；考虑已安装 Android 旧版本。未知响应类型有兼容占位，服务端拒绝未支持的发送类型和非法 payload。

## 6. 可靠性与核心业务不变量

PostgreSQL 是业务事实来源；Redis、搜索和推荐数据是可重建缓存或投影，不能保存唯一业务事实。

- 业务变更与 outbox 在同一数据库事务提交。每个消费者独立 delivery；采用至少一次投递、消费幂等和可观测重试，不宣称端到端 exactly-once。
- job/delivery 用短事务认领并写 lease；网络调用、转码在事务外执行。完成结果校验 lease token，过期任务可重领，旧 worker 不得覆盖新结果。
- 数据库副作用与 inbox 去重同事务；外部副作用使用稳定幂等键、版本和对账。重放保留 event_id。重试有上限、退避和 dead 状态。
- 创建视频、发布和上传完成按约定幂等；同键不同请求返回冲突。点赞/收藏/关注使用幂等 set/unset，不能用 toggle 代替。
- 媒体处理与内容发布有独立状态机。时长/编码由 ffprobe 实测，禁止占位值冒充真实结果；转码受资源限制，不能拼接用户输入为 shell 命令。
- 服务端验证上传归属、完成状态、处理产物与发布条件。处理重试不能使已删除内容复活。HLS 鉴权覆盖子清单与分片，不能只签主清单。
- 搜索/推荐结果返回前复核内容可见性；投影处理版本与乱序。Meilisearch 返回任务 ID 不等于成功，确认 task succeeded 后才能确认同步完成。
- Gorse 显式设置 `collaborative.type=none` 和 `ranker.type=none`，按固定版本验证配置及运行任务均无训练。Go 负责标签候选、热度/新内容/关注混排、冷启动和降级。
- 合成推荐评估固定种子、数据和时间边界，避免未来标签泄漏。不得将合成指标宣称为真实用户偏好、CTR 提升或商业收益。
- 聊天消息、会话序号、用户 inbox 与 outbox 持久化提交后才 ACK。重发使用稳定 client_message_id；同 ID 不同内容拒绝。
- 用户增量同步序号必须保证提交可见顺序，不能直接用可能乱序提交的全局自增序列充当可靠水位。并发锁按约定固定顺序获取。
- Redis Pub/Sub 与 WS 只负责实时提示；漏推通过 PG 历史/增量同步恢复。实现前台补拉、断线重连、背压和单调已读游标；PG 不可写时不得假装关键写入成功。

## 7. 客户端与权限

- Web 按业务 feature 组织；服务端状态交给 TanStack Query，筛选进入 URL，局部状态留在组件，确有需要再用 Zustand。避免跨 feature 访问内部 store。
- Android 保持 Java 源码与 Views，不改 Kotlin/Compose 或跨端框架。UI、ViewModel、Repository 分工；数据库、文件和网络不得阻塞主线程，ViewModel 不持有 Activity/Surface。
- 两端管理播放器生命周期和资源释放；Web 视频 DOM 有界、单视频播放，Android 处理旋转/前后台恢复。不能仅以“能构建”判断播放正确。
- 认证刷新合并并发请求；缓存按账号隔离，退出清除私有状态。Android 离线发送队列保留稳定消息 ID。
- Web access token 放内存，refresh 放受保护 Cookie；Cookie 端点做 Origin/CSRF 校验。Android refresh 由 Keystore 密钥加密保存。会话撤销和 refresh 轮换遵循契约。
- 作者、发送者和权限来自服务端认证；资源归属、会话成员、拉黑与管理员权限由后端验证，不能只隐藏按钮。相关写入必须覆盖跨用户访问测试。
- 密码、token、预签名 URL、聊天正文不进入日志；事件只包含必要事实。秘密通过配置注入，不提交到仓库；开发明文网络例外不得进入 Android release。

## 8. Git 与变更纪律

三个开发分支固定为 **`dev/backend`、`dev/web`、`dev/android`**，从同一 main 基线建立；不要自行改名。main 持续集成可验证的小切片，未完成功能必要时由 feature flag 隔离。

- 开始编辑前检查当前分支与工作区，阅读已有文件，保留用户及其它任务的修改。不得顺手清理无关文件、覆盖未知更改或重置工作区。
- 后端负责 server/deploy 及契约主导；Web 负责 apps/web 与 Web SDK；Android 负责 apps/android。公共契约先合入 main，再同步客户端；契约变更触发三端兼容检查。
- 每完成约 1—3 天的小切片就集成，不积累数月分叉。反复使用的分支采用普通 merge；不 rebase/force-push 已共享分支。采用 squash 时按设计从新 main 重建分支。
- 同目录不能被多个任务同时切换分支；需要并行时使用独立 worktree，并协调契约、锁文件和部署配置的编辑。
- 任务授权决定本次操作范围。本文件不自动触发旧仓库归档、分支创建、提交、推送或服务器发布；用户已明确授权的工作不重复征求确认。
- 一次变更围绕具体问题与验收闭环，必要的代码、迁移、契约、生成文件、测试、配置和说明一起更新；不夹带无关重构。

## 9. 验证、部署与交付

先检查实际存在的构建文件、脚本和 CI，再运行相应命令。仓库尚无应用或脚本时不得编造执行结果；P0 建立统一入口并把可复现命令写入运行文档。

| 改动范围 | 必须完成的相关验证 |
| --- | --- |
| 纯文档 | 相对链接、示例语法、前后术语与范围一致；无需启动全栈 |
| Go 业务 | 在实际 Go module 中格式检查、`go test ./...`、`go vet ./...`，以及已配置的 lint/边界检查；覆盖改动涉及的状态与失败路径 |
| SQL、队列、聊天顺序 | 真实 PG 集成测试：唯一性、回滚、并发、lease 恢复、重复投递；mock 不替代锁与事务语义 |
| 契约/生成器 | schema 校验、正反例、breaking diff、重新生成无差异、三端受影响构建与契约测试 |
| Web | 已配置的类型检查、lint、相关单测和构建；受影响用户流程用浏览器验证 |
| Android | 实际 Gradle wrapper 对应的 lint、单测和 debug 构建；播放器/生命周期改动补模拟器或真机验证 |
| 跨端/可靠性 | 两账号真实闭环及相关故障注入；验证重复请求、worker 中止、连接中断与补拉后的最终状态 |
| 发布/数据迁移 | Compose 配置、就绪与健康检查、迁移兼容、回退路径；按阶段完成备份恢复演练 |

测试围绕业务不变量与真实失败风险，避免只复述实现。检查通过后不无依据地重复扩大测试；无法运行时明确缺少的条件、已做检查和剩余风险，不能把静态检查、mock 或截图当真实联调。

server 的构建、运行与验收以 Ubuntu 24.04 为基线，部署使用该服务器上的 Docker Compose；后端 CI 固定 `runs-on: ubuntu-24.04`，不用浮动 Linux runner，也不提供 Windows/WSL 的 server 运行路径。Windows 可以编辑仓库或执行纯文档检查，本机检查不替代 Ubuntu 后端验证。保留规划的 **4 vCPU / 2 GB** 测试基线，但实际服务器配置、磁盘、网络和上行带宽须 P0 核实。先测 core，再启用 discovery/observability；转码初始并发为 1，不能预先承诺 2 GB 同时承载全部组件与数据集。

PG 与媒体分别备份；缓存和投影可重建。迁移采用扩展、兼容、回填、收缩，避免破坏性改表与应用切换同时发生；不能把强行 down 迁移当默认回退。操作自有服务器时确认具体环境与目标路径，不清理其它服务或无关数据。

性能、工期、RPO/RTO 均是待验证目标。报告保留提交、依赖/镜像版本、硬件、资源限额、数据种子、负载脚本和原始结果；不同运行配置分别报告，元数据 API 容量与视频分发能力分开表述。

完成任务时用中文说明：改了什么、为何这样改、实际验证了什么、还有哪些限制；附关键文件路径。没有执行的测试、没有部署的服务、没有完成的功能和没有实测的简历指标必须明确区分。
