# 技术基础设施

按实际接入需要增加连接池、日志、配置、事务/outbox/任务等技术能力。PostgreSQL 是业务事实来源，Redis、搜索与推荐是可重建缓存或投影。

不放通用业务实体、万能 CRUD repository、业务状态机或 `common/utils/base_service`。不提前接入全部中间件；PG 相关能力必须使用真实数据库验证锁、事务和 lease 语义。当前没有基础设施实现。
