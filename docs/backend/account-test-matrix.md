# 首切片测试矩阵

所有条目当前为 **not_run**。U=纯单元，DB=Ubuntu真实PostgreSQL，HTTP=真实服务契约，C=TS/Kotlin消费，B=真实浏览器。CI lint和规范校验不代表这些通过。每行失败均阻止对应任务勾选。

| ID | 层级 | 输入/动作 | 必须断言 | 关联 |
| --- | --- | --- | --- | --- |
| F01 | HTTP/DB | DB断开、迁移落后、服务停止 | live与ready区分；ready503、保护请求503；无secret | backend-foundation |
| F02 | HTTP | malformed JSON/未知字段/32KiB以上/错误媒体类型 | 400/413/415及统一错误；request_id一致 | 全API |
| F03 | B/HTTP | 缺CSRF/错误Origin、android伪装、cookie+Bearer | 403或明确400，未发生副作用；不得从类型头绕过 | 会话交付 |
| F04 | HTTP | 超过IP/邮箱/用户配额，伪造Forwarded | IP429含Retry-After；邮箱抑制202；不信任未知代理 | 工程规则 |
| F05 | DB | outbox发送中进程死亡、租约过期重领、旧任务回写 | token匹配才能ACK；最多有限重试，允许重复邮件不重复消费 | 邮件持久 |
| F06 | DB | 空库/重复迁移/缺checksum/备份恢复 | schema符合设计、错误拒绝ready、恢复后约束有效 | 工程底座 |
| A01 | U/HTTP | email大小写空白、+后缀、非ASCII、过长 | 规范化符合说明；+不折叠；不支持明确400 | 邮箱建号 |
| A02 | HTTP/DB | 注册已有/不存在邮箱、同邮箱重发 | 统一202文案；旧token superseded；不改已有密码 | 邮件/身份 |
| A03 | U/HTTP | 密码11/12/128/129 Unicode标量、空格 | 边界正确、不trim；哈希和日志不含明文 | 邮箱建号 |
| A04 | DB/HTTP | 确认正确/过期/used/错purpose/token | 成功201不登录；无效400；单次消费 | 邮箱建号 |
| A05 | DB | 并发注册、同token重复确认 | 只一用户、一消费；唯一约束兜底，无半写入 | 邮箱建号 |
| A06 | HTTP | 错邮箱/错密码、正确密码但封禁 | 前两者同401；封禁403；无token泄漏 | 会话 |
| A07 | B/C | Web/Android login、refresh | cookie属性及JSON差异；空cursor/UUID/枚举可消费 | 跨端 |
| A08 | DB/HTTP | refresh成功、旧access、旧refresh重放 | 一current；旧access到期前可用；重放使整session失效 | 轮换 |
| A09 | DB/C | 同refresh并发、响应丢失 | 最多一次轮换；重放撤销；客户端无自动刷新重试循环 | 轮换 |
| A10 | HTTP | access15min/session idle7d/absolute30d边界 | 以服务端时钟拒绝过期；refresh不延长absolute | 会话 |
| A11 | HTTP | logout、重复logout、撤销其他设备、他人session | 204幂等，撤销后失败，他人404；DB故障503 | 会话所有权 |
| A12 | DB | reset与login/refresh并发 | reset后旧凭据不新建/继续session；全部旧会话撤销 | 密码并发 |
| A13 | HTTP | reset邮件不存在/已存在、重放、错误purpose | 响应不枚举；密码只改一次；无自动登录 | 密码 |
| A14 | HTTP/DB | change-password当前密码错误/正确 | 错误无变化，正确全设备撤销且当前cookie清除 | 密码 |
| P01 | HTTP | GET user匿名/本人/他人/带无效token | 公开无email/session；本人仅me得私有字段；无效token401 | 最小公开资料 |
| P02 | HTTP/DB | PATCH role/email/actor_id/null/空patch/旧version | 未知字段400；旧version409；无越权改动 | 资料版本 |
| R01 | HTTP/DB | 公开follow、私密follow、重复PUT/self | accepted/pending、单行、自关联400 | 关系 |
| R02 | DB | 转私密与follow并发 | 线性顺序明确；不在私密提交之后偷偷自动批准 | 隐私转换 |
| R03 | HTTP/DB | 公开↔私密、既有粉丝、pending | accepted保留；转公开pending不自动批准 | 隐私转换 |
| R04 | HTTP | approve/reject他人、已accepted、删除后再申请 | owner限制；409/404；旧request不批准新行 | 申请身份 |
| R05 | HTTP/DB | cancel、remove、重复操作、pending粉丝移除 | 删除指定方向accepted，不误删反向/pending；204幂等 | 关系 |
| R06 | DB | block与follow/approve并发 | block提交后无双向accepted/pending | 完整屏蔽 |
| R07 | HTTP/DB | 双向block、解单方、解双向 | 不恢复关系；残余block继续限制 | 完整屏蔽 |
| R08 | HTTP/U | 被屏蔽profile/relationship/follow及作品policy | 404/403按契约；作品policy deny；无伪造真实媒体验收 | 完整屏蔽 |
| R09 | HTTP/DB | 大列表limit0/101、游标篡改/过期/跨用户 | 400；正确分页无重复，删除允许空洞，next_cursor null结束 | 游标 |
| R10 | U | 私密+非粉丝/粉丝/好友、自己、被屏蔽的权限facts | 账号/作品交集；block优先；纯policy测试不等于视频已实现 | 后续边界 |
| X01 | HTTP | 首切片全部28个operation合法样例及主要错误 | 实际响应符合OpenAPI，所有未运行项显式not_run | 契约总门槛 |
| X02 | DB | rollback注入：在业务写后、审计前失败 | 用户/凭据/关系/安全事件一起回滚，不留半事务 | 事务 |
| X03 | HTTP/DB | 多用户并发关系变更、超时取消、重启 | 无死锁悬挂、无超过约束的重复；token保持安全失败 | 集成 |

## 事实边界

- 本切片不做视频/消息/订单接口，不能勾选真实作品屏蔽、消息额度或财务保留的整链验收；这里只验证事实提供与纯权限函数输入。
- 测试使用受控时钟与同步屏障构造并发，不用偶然sleep猜竞态；不要用mock DB替代唯一约束/行锁测试。
- Windows文档校验可先完成；DB/HTTP实际运行需Ubuntu。TS/Kotlin样例可在独立消费测试工程验证，不要求本轮先造完整UI。
- 结果记录环境、commit、命令、样例和pass/fail/not_run；不得填“预计通过”。
