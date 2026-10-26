# 首切片状态转换与授权

状态：设计；所有状态按服务端时间与数据库事实判断。

## 注册、凭证与密码

| 当前状态 | 命令/条件 | 结果 |
| --- | --- | --- |
| 无账号 | registration-requests，邮箱合法且未被抑制 | 生成 register challenge + mail outbox；统一202，不创建账号 |
| 邮箱已注册/被抑制 | 同上 | 同样202，不更改账号/密码，不向攻击者泄漏是否存在 |
| pending challenge | 再请求且通过间隔/配额 | 旧 challenge superseded，新 token pending |
| pending 且未过期 | confirm registration，token正确、密码合法 | 唯一约束下创建 active 已验证账号，challenge consumed；201，不自动登录 |
| used/superseded/expired/未知 token | confirm | 400 TOKEN_INVALID；不返回具体失效原因 |
| 有 active 账号 | password-reset-requests | 生成 reset challenge + outbox，统一202；不存在邮箱也202但不发信 |
| 有效 reset challenge | confirm reset + 新密码 | 更新密码、消费 challenge、撤销全部 sessions；204，不自动登录 |
| 已登录 | change password + 当前/新密码 | 校验当前密码，同事务修改并撤销全部 sessions；204，客户端清本地身份 |
| active | 受控封禁事实（以后治理切片） | suspended，所有认证/刷新失败；本切片无封禁 HTTP API |

注册确认两个请求并发只有一次消费；重复返回400，不重新发账号。邮件令牌15min有效，register/reset 用途不互通。GET 邮件链接不得消费令牌：链接放前端固定路由 fragment，用户提交 JSON 确认；不允许用户输入任意 return URL，避免邮件扫描器点击直接改变状态。

## 会话

| 当前状态 | 动作 | 结果 |
| --- | --- | --- |
| 无会话 | login，已验证 active，密码正确 | 新 session + access15min + refresh，idle7d/absolute30d |
| active session | current refresh | 旧 refresh used，新 token 对，延长 idle、不延长 absolute |
| active session | used refresh 重放 | session revoked，旧/新 access/refresh 均失效，401 SESSION_INVALID |
| revoked/idle过期/absolute过期 | authenticate/refresh | 401 SESSION_INVALID，不创建新 session |
| active session | logout 或 owner 撤销 session | revoked，后续认证失效 |
| 任意 sessions | 密码改变或找回成功 | 全部撤销，其他设备也必须重新登录 |

注销当前会话也可用 refresh 识别，避免 access 过期无法退出。未知凭据 logout 返回204并清 Web cookie；refresh 错误返回401且清 cookie。撤销其他人的 session 统一404。不会在单个用户角色字段中预置 merchant/admin 权限；本切片所有正常账号都是成员，后续角色/店铺权限由相应模块赋予。

## 关注与隐私

| 当前关系 | 动作/条件 | 最终关系 |
| --- | --- | --- |
| none | PUT follow，目标公开 | accepted |
| none | PUT follow，目标私密 | pending |
| pending/accepted | 重复 PUT | 原状态不变，不重复计数 |
| pending | 目标主人 approve | accepted |
| pending | 主人 reject 或申请者 DELETE follow | none |
| accepted | 关注者 DELETE follow 或主人移除粉丝 | none |
| 任意 | 任一方拉黑 | 双向 none，新增有向 block |
| blocked | PUT follow/approve | 403 RELATIONSHIP_NOT_ALLOWED，不产生关系 |
| blocked | 解除自己的 block | 仅删自己记录，原 follows 不恢复；对方仍拉黑则继续屏蔽 |

PUT self follow/block 返回400 SELF_RELATIONSHIP。重复取消/移除不存在的关系返回204。批准/拒绝均针对 request id，不用 follower id，以免旧审批请求误批准新的申请；只有 followee 可处理。approve 已accepted的同一行返回200，已删除/不属于自己404；reject 已accepted返回409 REQUEST_NOT_PENDING，已删除返回204（但必须不泄漏他人 request）。

公开→私密保留已accepted粉丝；新申请受审批。私密→公开不自动批准既有pending，保持 pending，用户可批准/申请者可取消后重试；这是保守的工程默认，避免隐私切换暗中批准请求。资料/隐私 PATCH 携带 expected_version，冲突409 VERSION_CONFLICT，读取最新后重试，防止覆盖设置。

## 授权优先级与模块边界

1. 用户/sessions 无效拒绝受保护动作；资源不存在和无权拥有对象统一404。
2. actor=owner 的资料编辑、设置、列表管理仅本人；请求不接受可替换 actor_id。
3. 任一方向 block 存在：不能新关注、访问对方作品或发送消息。双方用户资料查询返回404（本人不受影响），本人黑名单仍显示所管理对象的最小标识。
4. 未屏蔽时，用户公开资料仅 id/display_name/bio/is_private/created_at；不暴露邮箱、会话、粉丝/关注列表和隐私内部字段。本人 GET /me 才返回邮箱与 version。
5. 将来作品访问先检查 block，再取账号私密和作品可见性的交集。未来消息再检查客服/互关/双向历史/首条额度。

首切片提供 `Identity.GetActiveUser/Authenticate`、`Relations.GetFacts(actor,target)` 和纯 `policy` 输入/输出契约（实现时为 Go public 接口），不暴露可被外部拿来绕过业务接口的通用 `/authorize` HTTP。Relations facts 包含两向 accepted/pending、block 两向及目标隐私；无缓存事实在当前事务内获取。作品详情和消息发送必须在各自将来切片重复检查，前端查看能力提示不是授权票据。

普通列表只提供本人的 follows/followers/requests/blocks；公开查看他人社交图不在此切片。交易、售后与财务的访问由将来订单归属规则决定，不能因 block 而删除或剥夺必要处理能力；此处不编造交易表。
