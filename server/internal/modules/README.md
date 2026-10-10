# 业务模块边界

模块按实际切片创建，当前不逐个创建业务空包。批准的模块与数据所有权见[总体架构](../../../docs/v2/02-architecture.md)。

模块内采用 `adapters → application → domain`，跨模块只使用 `public` 类型和公开能力。domain 不依赖 Hertz、SQL、Redis 或 SDK；sqlc 记录留在 PostgreSQL adapter，不直接作为 HTTP 响应。

B-001 从 identity/content 的实际需要开始。导入边界检查随首个 Go 实现进入 CI；当前仓库检查尚不提供 Go 导入或 SQL 所有权分析。禁止跨模块导入 repository、直接读写或 JOIN 业务表。

v2 不创建 commerce 模块、交易表、支付接口或商城入口。
