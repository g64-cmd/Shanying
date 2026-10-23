# Proposal

## Why

用户已确认闪映的目标是 UGC 短视频、用户观看、商家广告投流与多商家购物的完整闭环。初始化阶段的“电商不进入首期”草案已失效，需要将讨论结果转为可验收的业务规格，避免三端各自解释权限和资金规则。

## What Changes

- 定义推荐流、关注流、搜索、媒体处理及作品可见性。
- 定义邮箱账号、关系管理、私密账号、通用私聊及单店客服入口。
- 定义少量独立商家、购物车与跨店拆单、模拟支付/物流、售后评价。
- 定义创作者带货归因、平台交易服务费、佣金快照、结算与持久业务追溯原则。
- 定义仅商家自有视频的曝光计费投放，以及最小平台管理后台。
- 固定单机模块化单体、PostgreSQL、Docker Compose；禁止引入 K8s、微服务和分布式方案。
- 本轮仅交付规划；业务任务均待实现。保留 bootstrap change 作为历史，不将基础结构完成当作业务完成。

## Capabilities

### New Capabilities
- `account-privacy`：邮箱身份、会话、关注审批、移除粉丝、黑名单与私密账号。
- `video-discovery`：UGC 生命周期、作品权限、关注/推荐流、搜索与商品关联。
- `direct-messaging`：通用一对一私聊、陌生人限制、卡片权限与客服入口。
- `commerce-orders`：多商家商品、购买、模拟支付、物流、退款及评价。
- `commerce-accounting`：订单归属、创作者归因、平台费、快照和可追溯结算。
- `merchant-advertising`：商家自有视频投放、有效曝光计费、预算与效果记录。
- `platform-governance`：审核、下架、封禁、争议介入与审计。

### Modified Capabilities

无已归档主规格。沿用 bootstrap change 中的 `cross-client-api-consistency` 要求，不重复定义。

## Impact

涉及根级共享契约以及 Go/Hertz、React/TypeScript、Kotlin/Gradle 三端后续实现；数据库仍为 PostgreSQL。旧仓库仅补充未提及细节，不作为架构或正确性依据。先模拟验证，再另行接入微信/支付宝；本轮不实现真实支付、提现、税务申报、竞价广告、群聊、音视频通话或多客服分配。
