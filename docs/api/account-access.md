# 账号与权限 API 说明

日期：2026-10-26；契约版本0.1.0，尚未实现。唯一机器契约：[contracts/openapi.yaml](../../contracts/openapi.yaml)。本页补充不能仅靠 schema 表达的行为，不能作为第二套 DTO 定义。

## 路由清单

| 接口 | 行为 | 成功码 | 请求schema |
| --- | --- | --- | --- |
| `GET /health/live` | 进程存活 | 200 | — |
| `GET /health/ready` | 服务就绪 | 200 | — |
| `POST /api/v1/auth/registration-requests` | 请求注册验证邮件 | 202 | EmailRequest |
| `POST /api/v1/auth/registration-confirmations` | 确认邮箱并创建账号 | 201 | RegistrationConfirmation |
| `POST /api/v1/auth/password-reset-requests` | 请求找回密码邮件 | 202 | EmailRequest |
| `POST /api/v1/auth/password-resets` | 确认找回密码 | 204 | PasswordReset |
| `POST /api/v1/auth/sessions` | 密码登录 | 200 | LoginRequest |
| `POST /api/v1/auth/refresh` | 轮换刷新 | 200 | RefreshRequest |
| `POST /api/v1/auth/logout` | 退出当前会话 | 204 | RefreshRequest |
| `GET /api/v1/me` | 本人资料 | 200 | — |
| `PATCH /api/v1/me/profile` | 修改本人昵称和简介 | 200 | ProfileUpdate |
| `PATCH /api/v1/me/privacy` | 修改账号私密状态 | 200 | PrivacyUpdate |
| `POST /api/v1/me/password` | 修改密码并退出全部设备 | 204 | PasswordChange |
| `GET /api/v1/me/sessions` | 本人的会话列表 | 200 | — |
| `DELETE /api/v1/me/sessions/{session_id}` | 撤销本人的一个会话 | 204 | — |
| `GET /api/v1/users/{user_id}` | 用户最小公开资料 | 200 | — |
| `GET /api/v1/users/{user_id}/relationship` | 查看与目标的关系 | 200 | — |
| `PUT /api/v1/users/{user_id}/follow` | 关注或申请关注 | 200 | — |
| `DELETE /api/v1/users/{user_id}/follow` | 取消关注或申请 | 204 | — |
| `GET /api/v1/me/following` | 本人的关注及待批准申请 | 200 | — |
| `GET /api/v1/me/followers` | 本人的已批准粉丝 | 200 | — |
| `GET /api/v1/me/follow-requests` | 等待本人处理的申请 | 200 | — |
| `POST /api/v1/me/follow-requests/{request_id}/approve` | 批准关注申请 | 200 | — |
| `DELETE /api/v1/me/follow-requests/{request_id}` | 拒绝关注申请 | 204 | — |
| `DELETE /api/v1/me/followers/{user_id}` | 移除粉丝 | 204 | — |
| `GET /api/v1/me/blocks` | 本人黑名单 | 200 | — |
| `PUT /api/v1/me/blocks/{user_id}` | 完整屏蔽用户 | 204 | — |
| `DELETE /api/v1/me/blocks/{user_id}` | 解除本人发起的屏蔽 | 204 | — |

## 请求、错误与传输

- 请求拒绝未知字段；不允许客户端指定 actor_id、status、role、email_verified_at。PATCH profile至少含一个可改字段，不接受null清除；bio清空用空字符串。
- 400：字段/令牌/cursor无效；401：身份或会话失效；403：Origin/CSRF/角色/屏蔽等拒绝；404：缺失或无权拥有对象；409：version或申请状态冲突；429含Retry-After；500/503不泄漏内部错误。完整错误码枚举见契约。
- 错误体为 `{error:{code,message,details?},request_id}`，客户端按code分支，message只展示。204无响应体；身份和关系响应Cache-Control:no-store，X-Request-ID贯穿请求。
- Web登录/刷新必须X-Client-Type:web，HttpOnly cookie承载凭据，响应体禁止credentials；Android选android，响应body包含credentials且不设置cookie。refresh web提交{}、android提交refresh_token。不要将token放URL/query。
- Web写请求必须Origin白名单、X-CSRF-Protection:1和application/json；带cookie时不能通过伪装android绕过。受保护请求cookie/Bearer互斥。只发命令无body的接口无需JSON载荷，但浏览器仍需CSRF头和允许Origin。
- 请求体最大32KiB、limit默认20/最大100。UUID无效400；分页next_cursor为null代表结束。cursor有15min时效且绑定owner/集合/as_of，不保证实时总数。
- API暂不开放他人社交列表，不提供头像上传、邮箱更换、注销或角色管理。这些需要未来相应切片，不假装已完成完整用户产品。

## 邮箱确认与重发

注册第一步只提交邮箱；验证码邮件携带256位随机一次性链接token，15min有效。点击前端页面不消耗，用户输入密码/昵称后POST确认，成功201且必须另登录。重复确认400 TOKEN_INVALID。找回成功204且退出全部设备。重发同用途会替代旧token，旧邮件不能继续使用。

邮箱已注册、不存在、被邮箱配额抑制时请求邮件接口均202同消息；只有非法输入400或IP频控429等明确失败。SMTP故障不改变已接收的202，后台持久重试。用户能在60s间隔后重发；不通过公开查询接口暴露邮箱是否存在。

## 刷新、撤销与失败恢复

访问token15min，session idle7d/absolute30d；refresh轮换、不延长absolute。旧refresh重放撤销整个session，客户端必须single-flight且Web跨标签协调。刷新响应丢失不自动重发同token，重新登录；这是明确的首版失败恢复规则。普通幂等PUT/DELETE可以安全重试，刷新/注册确认/重置密码不按成功响应幂等重放。

logout优先refresh识别，允许过期access时仍退出；未知凭据204并清cookie。数据库故障返回503，不能仅清浏览器cookie就声称服务器已撤销。删除他人session为404；当前密码修改和找回撤销所有session。session撤销后的后续请求失败，已通过授权线性化点的在途操作不能保证撤回。

## 关系操作

PUT follow先锁双方并检查block：公开自动accepted、私密pending；重复不变。移除粉丝只处理accepted，不误拒绝pending；审批用request_id避免旧请求命中新申请。已批准request重复approve返回同一行；被删除request approve为404；reject已accepted为409。删除不存在request返回204、他人仍存在的request为404。

转公开不自动批准pending；保留为可审阅申请，申请者可取消后重发。该规则为本轮保守工程默认，若产品改变须同时改状态表/API测试。私密转公开不会恢复被移除或被拉黑的关系。

完整屏蔽会删双向pending/accepted、阻止重新关注及后续作品/私聊权限。解黑只删本人block，不复原关系。GET受屏蔽用户profile/relationship返回404，本人黑名单提供最小管理标识；不存在目标block PUT404，self400。未来交易处理不由此禁止。

## 最小成功/失败样例

以下是假数据，不是可用凭据。完整schema限制优先。

机器可读的正反样例见 [account-access.json](../../contracts/examples/account-access.json)，其valid仅说明是否符合schema，不能替代Origin、所有权、期限或数据库状态校验。

```json
{"email":"alice@example.test"}
```

202：
```json
{"message":"如该邮箱可用于此操作，我们将发送邮件。"}
```

PATCH privacy：
```json
{"is_private":true,"expected_version":1}
```

409：
```json
{"error":{"code":"VERSION_CONFLICT","message":"资料已更新，请重新读取。"},"request_id":"test-request-01"}
```

空关系列表：
```json
{"items":[],"next_cursor":null}
```

## 三端验收与参考

实现前生成/校验TS与Kotlin类型并验证上述样例、cookie/body差异、可空cursor、UUID及错误码；实际浏览器和设备行为需单独测试。当前文档/结构验证不等于这些已通过。

数据库见 [数据设计](../backend/account-database.md)，状态见 [状态机](../backend/account-state-machines.md)，验收见 [测试矩阵](../backend/account-test-matrix.md)。
