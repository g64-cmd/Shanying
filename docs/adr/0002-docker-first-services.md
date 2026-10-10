# ADR 0002：服务配置优先使用 Docker

状态：已接受。日期：2026-10-10（北京时间）。对应设计决定：D10。

## 问题与证据

用户明确要求尽可能通过 Docker 完成服务配置，例如 PostgreSQL 应拉取 PostgreSQL 17 镜像，而不是安装在服务器宿主系统中。仅写“使用 Compose”不足以约束实际组件的安装、配置与数据边界。

目标系统继续为 Ubuntu 24.04，见[ADR 0001](0001-server-ubuntu-24.md)。当前仓库没有可启动的 Compose 或应用镜像，也未连接服务器。

## 决定

- PostgreSQL 使用 Docker Official Image 的 17 系列，通过 Compose 管理，不在宿主机安装 PostgreSQL 服务。
- Redis、SeaweedFS、Meilisearch、Gorse、Caddy 及按需启用的观测组件优先使用项目维护的镜像；API/worker 从本仓库构建镜像，FFmpeg/ffprobe 固定在媒体 worker 镜像内。
- 宿主机维护 Docker Engine、Compose 及必要的系统、网络和存储环境；服务通过 Compose、受版本管理的非敏感配置和外部注入秘密配置。
- PG 和媒体使用显式持久化卷或 bind mount，数据独立于容器生命周期，另做备份恢复。
- `postgres:17` 仅表示主版本要求；实际部署锁定完整补丁、镜像变体与 digest，记录到[依赖基线](../dependency-baseline.md)。

## 替代方案与影响

逐项安装 PG 等宿主服务会扩大机器配置差异，因此不作为默认部署方式。确有兼容性或资源方面的实际需要时，可以采用有记录的宿主运行例外，说明证据、原因、运维影响与替代/回退方式。

继续按 core、discovery、observability 分阶段启用，不预先承诺 2 GB 同时运行所有服务。容器化不改变 PG 事实来源、禁训练要求、模块边界或显式迁移规则。

## 验证、迁移与回退

本轮仅补充原则与文档，验证相对链接、示例语法与内容一致性；没有选择最终镜像引用、拉取镜像、启动容器或做数据库测试。

P0 接入实际 Compose 时验证配置解析、镜像版本、健康/就绪、PG 17 空库迁移、容器重建后数据持久化及备份恢复。当前没有已部署服务，因此无数据迁移；未来应用回退保留上个镜像与兼容 schema，不把容器重建当作数据库恢复。

## 官方参考

[PostgreSQL 官方镜像说明](https://github.com/docker-library/docs/tree/master/postgres)支持镜像与 17 系列选择；[Docker 数据卷说明](https://docs.docker.com/engine/storage/volumes/)支持数据独立于容器生命周期。这里不把官方可变标签当作已验证的项目镜像锁定结果。
