# 部署配置入口

归属分支：`dev/backend`。目标是 Linux / Docker Compose；Windows 使用 Linux 容器或 WSL2。随着服务实际创建再增加 Compose、Caddy、镜像构建和运维配置，当前没有可启动的部署文件。

按 core → discovery → observability 分阶段启用；先核实自有服务器 CPU、内存、磁盘、网络与上行带宽。4 vCPU / 2 GB 是待实测基线，转码初始并发为 1，不承诺全部组件同时容纳。

镜像固定版本与 digest，记录到[依赖基线](../docs/dependency-baseline.md)。秘密通过环境注入，运行数据放在被忽略的 deploy/data，实际发布前确认环境与路径。

PG 与媒体分别备份，缓存/投影可重建；发布需就绪检查、显式迁移、兼容与回退路径。初始化仓库不代表已经部署。
