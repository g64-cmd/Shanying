# 后端首切片设计索引

日期：2026-10-26。当前阶段为“先设计，再编码”，没有应用、迁移或接口运行验收。

建议评审顺序：
1. [OpenSpec提案](../../openspec/changes/backend-foundation-account-access/proposal.md)：范围及总路线映射。
2. [代码结构和工程规则](engineering.md)：单体模块、依赖、事务、配置、凭据及开发规则。
3. [API说明](../api/account-access.md) 与 [OpenAPI](../../contracts/openapi.yaml)：28个操作，唯一契约源。
4. [数据库](account-database.md)：10张表、字段、约束、索引、锁顺序和迁移计划。
5. [状态机与权限](account-state-machines.md)：认证、会话、关注、隐私及完整屏蔽。
6. [测试矩阵](account-test-matrix.md)：35条场景，当前not_run。
7. [实施任务](../../openspec/changes/backend-foundation-account-access/tasks.md)：24项待实施任务。
8. [设计验证记录](account-design-validation.md)：静态通过项与运行not_run边界。

本轮明确选定的工程默认：邮箱确认后建号；opaque token与数据库会话；Web cookie/Android Bearer；严格refresh重放撤销（响应丢失需重登）；私密转公开不自动批准pending申请。完整屏蔽已由用户明确确认。业务确认与工程默认分开标注，后续调整需同步契约、数据、状态和矩阵。

后续按业务切片逐步细化，不在本轮创建所有业务表。订单、库存、支付、退款、平台费、佣金及结算必须提前联合设计；见engineering.md的联合设计门槛。
