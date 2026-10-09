# 01 · 旧版核查与重构依据

## 核查范围

2026-10-09 读取源码快照，固定到以下提交，避免后续 main 变化使结论失去依据：

- 后端：[7a093311c963a651300b88f7e5da8d0c3e8fe2e0](https://github.com/g64-cmd/shanying_server/tree/7a093311c963a651300b88f7e5da8d0c3e8fe2e0)。
- Web：[07e7e1274faba515f7739ca2767c71d35a1b5a82](https://github.com/g64-cmd/shanying_web/tree/07e7e1274faba515f7739ca2767c71d35a1b5a82)。
- 当前新仓库起点：main，`cab332b9218f2b2818af333862f10b0a3e8c96ff`；检查时仅 README 与 MIT LICENSE，工作区干净。

重点读取依赖清单、应用组装、视频与互动服务、视频查询、建表 SQL、前端分页、令牌存储和播放组件。这是架构静态核查，不是全量审计或运行验收；测试文件存在不等于测试通过。

## 可保留的工程思路

| 观察到的设计 | v2 的处理 |
| --- | --- |
| Gin，手写 SQL，PostgreSQL，Redis，对象存储 | 保留 Go/PG 和显式 SQL；HTTP 框架改为 Hertz，数据库访问升级为 pgx + sqlc |
| 最新列表使用 `(created_at, video_id)` 游标 | 保留，并把外部游标变成不透明字符串 |
| 批量装配作者和互动信息，避免逐条查库 | 保留批量接口，由 Feed 查询编排负责 |
| 两级评论、软删除、关系唯一约束 | 保留业务语义，明确删除后的可见性与清理 |
| 上传失败时尝试清理对象 | 保留补偿意图，增加持久化任务和孤儿扫描 |
| 前端分页、播放组件、网络封装独立 | 保留职责划分，重新实现为 React 功能模块 |
| 默认配置与环境变量覆盖、应用优雅退出 | 保留；增加配置校验和后台任务排空 |

依据：[后端视频查询](https://github.com/g64-cmd/shanying_server/blob/7a093311c963a651300b88f7e5da8d0c3e8fe2e0/internal/repository/video_repo.go)、[建表 SQL](https://github.com/g64-cmd/shanying_server/blob/7a093311c963a651300b88f7e5da8d0c3e8fe2e0/scripts/init_db.sql)、[Web 视频流组件](https://github.com/g64-cmd/shanying_web/blob/07e7e1274faba515f7739ca2767c71d35a1b5a82/src/components/VideoFeed.vue)。

## 优先重构的边界

| 源码事实 | 对新增需求的影响（设计分析） | v2 决定 |
| --- | --- | --- |
| `VideoService` 同时持有视频、用户、互动、标签、社交仓库及 MinIO/Redis/config | 新业务会继续扩大服务的依赖面，替换实现和单测成本升高 | 内容、社交、媒体、Feed 分域；跨域只调用公开能力 |
| 视频、互动、标签、社交服务各有媒体 URL 签名逻辑 | 存储迁移、播放鉴权修改需要同步多处 | 单一媒体访问策略和批量媒体解析接口 |
| 上传流程内完成文件与 DB 操作，标签失败仅记录日志；默认时长为 1，直接正常发布 | 难以承载真实转码、处理进度、重试与审核 | 上传会话 + 媒体任务 + 独立发布状态机 |
| 浏览量更新、点赞/评论/关注通知依赖 goroutine | 进程退出时任务不具备持久恢复依据 | 行为批量入库，业务通知经事务 outbox |
| `enrichVideos` 遇到作者批量查询错误返回空数组；部分状态查询忽略错误 | 客户端无法区分“没有内容”和依赖故障 | 必需字段失败明确报错，可选字段降级显式标识 |
| 热门分页使用会变动的 `hot_score`；搜索仅按相关度 LIMIT | 跨页期间分数改变可能跳项或重复，无法提供稳定推荐会话 | 最新流用 keyset；热门/推荐/搜索采用有限结果快照 |
| 同一 `Video` 同时带数据库和 JSON 标签 | 数据存储结构变化容易传播到客户端 | domain、持久化记录、API DTO 分开 |

源码定位：[VideoService](https://github.com/g64-cmd/shanying_server/blob/7a093311c963a651300b88f7e5da8d0c3e8fe2e0/internal/service/video_service.go#L36)、[上传占位字段](https://github.com/g64-cmd/shanying_server/blob/7a093311c963a651300b88f7e5da8d0c3e8fe2e0/internal/service/video_service.go#L139)、[通知调用](https://github.com/g64-cmd/shanying_server/blob/7a093311c963a651300b88f7e5da8d0c3e8fe2e0/internal/service/interaction_service.go#L97)、[媒体签名重复实现](https://github.com/g64-cmd/shanying_server/blob/7a093311c963a651300b88f7e5da8d0c3e8fe2e0/internal/service/social_service.go#L434)。

## 前端迁移的重点

旧前端是 Vue 3、Pinia、Axios、Vite，包含刷新请求合并逻辑。重写时保留刷新并发控制的意图，但浏览器 refresh token 改为 HttpOnly Cookie，access token 仅放内存。旧令牌确实写入 localStorage，见 [token.ts](https://github.com/g64-cmd/shanying_web/blob/07e7e1274faba515f7739ca2767c71d35a1b5a82/src/utils/token.ts)。

旧 [分页 composable](https://github.com/g64-cmd/shanying_web/blob/07e7e1274faba515f7739ca2767c71d35a1b5a82/src/composables/useCursorPagination.ts) 直接暴露时间/ID 游标，未在该文件中看到请求取消或代际隔离。v2 使用 TanStack Query，并在切换搜索词、退出账号时取消过期请求；这是迁移需要覆盖的竞态场景，不声称已在旧应用复现故障。

旧 [package.json](https://github.com/g64-cmd/shanying_web/blob/07e7e1274faba515f7739ca2767c71d35a1b5a82/package.json) 的 scripts 只有 dev/build/preview，本次未运行构建。v2 从第一条用户链路开始设置客户端测试。

## 重写与迁移策略

新实现按领域重写，不整包搬运 service/repository。可以参考 SQL、边界案例、交互和测试思路；复制任何代码前检查该文件适用的授权与署名要求。旧仓库保持历史可追溯。

已确认没有历史数据；v2 独立数据库使用确定种子的合成数据，不安排迁移开发。仅当未来新增导入要求时，单独编写一次性导入工具：旧 ID → 新 UUID 映射、账号重设密码策略、对象校验、元数据重探测、计数重算和索引重建。旧会话令牌不迁移，不让 v1 与 v2 双写同一库。

归档前保存固定 tag 和说明页；当前没有历史业务数据备份任务；归档动作不等于删除。归档不属于本轮文档交付。
