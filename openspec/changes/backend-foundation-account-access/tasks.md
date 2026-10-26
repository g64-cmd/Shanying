# Tasks

当前仅完成设计，以下全部待实施。矩阵编号见 docs/backend/account-test-matrix.md；每项提交实现、相关测试和必要API说明后才可勾选，不用总平台规划替代此切片任务。

## 1. 固定工程与契约

- [ ] 1.1 锁定Go/Hertz/pgx/Argon2及生成校验工具版本和镜像digest，记录兼容性；验证Ubuntu容器可构建且无latest/微服务依赖。
- [ ] 1.2 按engineering.md建立bootstrap、identity、relations和policy依赖边界；用导入检查验证HTTP/PG类型不渗入domain，完成fmt/vet。
- [ ] 1.3 建立OpenAPI lint、样例检查和TS/Kotlin DTO消费测试；验证Web/Android响应分支、nullable cursor和错误码（A07、X01）。
- [ ] 1.4 落地配置、错误、Request-ID、脱敏日志和live/ready；用F01/F02验证依赖故障及请求失败，更新部署说明。

## 2. 数据与运行资源

- [ ] 2.1 编写identity_users/challenges/outbox迁移及SQL约束测试；完成空库、升级和checksum检查（F06）。
- [ ] 2.2 编写sessions/access/refresh/events/rate迁移与repository；验证唯一current、过期、权限及rollback不变量（A08、X02）。
- [ ] 2.3 编写follows/blocks迁移、索引及统一用户行锁入口；验证self/重复约束和关系事务并发（R01、R06、X03）。
- [ ] 2.4 建立Compose与开发邮件收件箱、显式迁移命令及密钥挂载；验证重启持久性、健康检查和备份恢复（F01、F06）。

## 3. 邮箱、密码与会话

- [ ] 3.1 实现邮箱/密码/资料校验、随机token、SHA256及Argon2id；运行A01/A03并记录Ubuntu哈希成本和并发上限。
- [ ] 3.2 实现Origin/CSRF/传输互斥及原子限流；运行F03/F04，验证类型头不能绕过cookie约束。
- [ ] 3.3 实现注册邮件和确认事务；运行A02/A04/A05，验证无pending可登录账号、重复确认及枚举响应。
- [ ] 3.4 实现加密outbox、租约、有限重试和失效清理；运行F05，验证旧lease不能ACK、重复邮件不重复消费。
- [ ] 3.5 实现登录、session查询及逐请求认证；运行A06/A07/A10/P01，验证cookie与body差异及DB失败关闭授权。
- [ ] 3.6 实现refresh轮换及重放撤销；运行A08/A09，更新两端single-flight及丢响应重登示例。
- [ ] 3.7 实现logout/会话撤销/当前密码修改；运行A11/A14，验证他人session404和当前会话清除。
- [ ] 3.8 实现找回密码的原子消费与全会话撤销；运行A12/A13，验证与登录/刷新并发不会恢复旧会话。

## 4. 资料、隐私与关系

- [ ] 4.1 实现me/public profile及版本化修改；运行P01/P02，验证公开字段最小化、mass-assignment拒绝和版本冲突。
- [ ] 4.2 实现follow/unfollow/审批/移除粉丝；运行R01–R05，验证隐私转换、旧申请ID及所有者授权。
- [ ] 4.3 实现完整block/unblock和黑名单；运行R06–R08，验证双向关系清理、残余屏蔽和解黑不恢复。
- [ ] 4.4 实现自有列表keyset和签名cursor；运行R09验证边界、跨用户和跨集合拒绝，说明动态列表空洞。
- [ ] 4.5 实现Identity/Relations public事实接口与纯policy；运行R10，不将纯测试标记为媒体/消息/交易已实现。

## 5. 首切片验收

- [ ] 5.1 在Ubuntu真实PG执行矩阵DB/HTTP和race检查；运行X01–X03并保存commit/命令/结果，不以mock DB代替约束。
- [ ] 5.2 验证Web cookie/CSRF与多标签刷新、Kotlin令牌解析与恢复；覆盖F03/A07/A09，明确没有完整UI的边界。
- [ ] 5.3 核对28个operation、数据约束与矩阵覆盖，记录pass/fail/not_run、迁移恢复和未决项；只有证据齐全后本切片才可宣布完成。

## Workflow follow-up

- 本轮设计完成后先评审，再由用户明确开始编码；不自动apply或归档。
- 总路线1.1/1.4/2.1–2.3仅在对应证据齐全时同步勾选，React/Android完整工程另行实施。
- 后续视频/媒体/隐私联合细化；消息/客服/关系联合细化；订单/库存/支付/退款/费用/分佣/结算必须先联合设计再编码。
