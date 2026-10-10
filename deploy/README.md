# 部署配置入口

归属分支：`dev/backend`。目标是自有 Ubuntu 24.04 服务器上的 Docker Compose；server 不在 Windows 或 WSL 运行。后端构建、CI 与验收同样固定 Ubuntu 24.04。随着服务实际创建再增加 Compose、Caddy、镜像构建和运维配置，当前没有可启动的部署文件。

尽可能用镜像与 Compose 管理服务，减少宿主机逐项安装与手工配置。宿主机负责 Docker Engine、Compose 和必要的系统、网络、存储环境；具体决定见[ADR 0002](../docs/adr/0002-docker-first-services.md)。

| 服务/能力 | 默认部署方式 |
| --- | --- |
| PostgreSQL | Docker Official Image 的 17 系列，由 Compose 启动；不在宿主机安装 PostgreSQL 服务 |
| Redis、SeaweedFS、Meilisearch、Gorse、Caddy | 使用对应项目维护的镜像，随阶段接入并锁定版本与 digest |
| API / worker | 从本仓库构建项目镜像；媒体 worker 镜像包含固定版本的 FFmpeg/ffprobe |
| 观测组件 | 使用锁定镜像，通过 observability profile 按需启用 |

这里的 `postgres:17` 表示主版本选择，尚未解析可发布的补丁版本、镜像变体或 digest。P0 选定实际镜像后，在 Compose 与依赖基线固定完整引用；不长期依赖可变的 major 标签或 latest。

按 core → discovery → observability 分阶段启用；先核实自有服务器 CPU、内存、磁盘、网络与上行带宽。4 vCPU / 2 GB 是待实测基线，转码初始并发为 1，不承诺全部组件同时容纳。

Compose、非敏感配置与镜像构建定义纳入本目录；秘密通过配置注入。镜像固定版本与 digest，记录到[依赖基线](../docs/dependency-baseline.md)。PG 和媒体通过显式持久化卷或 bind mount 保存，不能依赖容器可写层；使用 bind mount 时可在确认目标路径后放到被忽略的 deploy/data，实际卷与路径由 Compose 和运行文档记录。

确因兼容性或资源限制需要宿主运行的组件，应记录实际证据、原因、运维影响与替代/回退方式，同步决策和部署文档。容器化优先不要求一次启动全部 profile，也不替代备份、数据库迁移或恢复演练。

PG 与媒体分别备份，缓存/投影可重建；发布需就绪检查、显式迁移、兼容与回退路径。初始化仓库不代表已经部署。
