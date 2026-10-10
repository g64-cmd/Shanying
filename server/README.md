# Go 后端

归属分支：`dev/backend`。采用 Go 1.26.x + Hertz 的模块化单体，API 与 worker 共享业务模块和发布版本。

server 的构建、运行和验收目标为自有 Ubuntu 24.04 服务器，后端 CI 固定 `ubuntu-24.04`；不使用 Windows/WSL 运行 server。

| 目录 | 职责 |
| --- | --- |
| [cmd/api](cmd/api/README.md) | API、WebSocket 入口 |
| [cmd/worker](cmd/worker/README.md) | 持久任务入口 |
| [internal/bootstrap](internal/bootstrap/README.md) | 配置校验、显式组装、跨模块适配 |
| [internal/platform](internal/platform/README.md) | 技术基础设施 |
| [internal/modules](internal/modules/README.md) | 业务模块及依赖边界 |
| [migrations](migrations/README.md) | 全局有序 SQL 迁移 |

目前只有目录与职责说明，尚无 Go module、依赖或可启动进程。B-001 创建实际 Go module 时锁定 Hertz，随后在模块目录运行格式检查、`go test ./...`、`go vet ./...` 和导入边界检查。

实现依据：[总体架构](../docs/v2/02-architecture.md)、[技术选型](../docs/v2/03-technology.md)、[数据与接口](../docs/v2/04-data-contracts.md)。
