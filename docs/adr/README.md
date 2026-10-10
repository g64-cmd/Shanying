# 架构决策记录

已接受的 D01—D10 见[决策与来源](../v2/08-decisions-sources.md)。重要架构改变或 P0 兼容失败时增加独立 ADR，并同步相关设计。

新 ADR 使用 `NNNN-short-title.md`，包含状态、日期、问题与证据、决定、替代方案、影响、验证以及迁移/回退。

- [0001：server 固定 Ubuntu 24.04](0001-server-ubuntu-24.md)，由用户补充目标系统与 CI/运行边界。
- [0002：服务配置优先使用 Docker](0002-docker-first-services.md)，由用户补充 PostgreSQL 17 镜像与容器部署原则。
