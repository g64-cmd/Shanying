# 后端代码结构与工程规则

日期：2026-10-26；状态：实施设计，尚无业务实现。范围见 backend-foundation-account-access。

## 目录与依赖

```text
backend/
  cmd/server/main.go              # 唯一服务入口，装配与信号处理
  cmd/migrate/main.go             # 显式迁移命令，不随 API 启动偷偷改库
  internal/bootstrap/            # 配置、组件构造、启动/关闭顺序
  internal/platform/
    config/ database/ httpserver/ observability/ mail/ clock/
  internal/modules/identity/
    domain/                      # 用户、凭证、状态与纯校验
    app/                         # 用例、事务边界、消费者侧接口
    adapter/http/                # Hertz handler、DTO 映射
    adapter/postgres/            # pgx 查询与持久化
    public/                      # 其他模块可调用的身份/授权事实接口
  internal/modules/relations/
    domain/ app/ adapter/http/ adapter/postgres/ public/
  internal/policy/              # 纯权限判定；只吃事实，不持有数据库或 HTTP
  internal/generated/api/       # 根 OpenAPI 生成的 DTO，不手改
  migrations/                  # 全局递增 SQL，模块在文件名标明
  tests/integration/           # 真实 PostgreSQL、HTTP、并发与故障测试
  tests/contract/              # 请求/响应/样例校验
  deploy/                     # Dockerfile、compose、示例配置
```

规划路径，当前不创建这些空代码包。依赖方向为 HTTP/PG adapter → app → domain；bootstrap 负责装配，domain 不依赖 Hertz/pgx。Hertz RequestContext 只留在 HTTP adapter，app 使用标准 context.Context。跨模块只调用 public 接口；不要导入对方 repository 或自行 JOIN 对方私有表。relations 需要身份行锁时通过 identity 提供的窄接口并共享同一 PG 事务，不另开事务。

首版直接 pgx/v5 + 参数化 SQL，不引入 ORM、泛型仓储或 RPC。数据库池、时钟、密码哈希器、随机源、邮件发送器按用例需要注入，不建立全局 service locator。事务在 app 管理、repository 不提交；查询只返回领域数据/错误，不返回 HTTP 状态。身份模块拥有会话和邮件凭证；关系模块拥有关注/屏蔽。

## 技术及配置决策

- 单机单 API 实例，Go + Hertz、PostgreSQL 17、Docker Compose；同进程的有界邮件任务循环可在重启后恢复，不是微服务。
- 工具/库补丁版本在开始代码前记录并锁定至 go.mod/go.sum 和镜像 digest，禁止 latest；当前未下载、构建或验证任何版本组合。
- 配置由环境变量/secret 文件传入并在启动验证；缺 DATABASE_URL、邮件密钥、允许 Origin 等必要配置时失败退出。示例配置不带真实秘密。
- 本地邮件使用 Compose 开发邮件收件箱，正式环境 SMTP；只向显式配置的邮件服务器连接。SMTP 网络调用不占数据库事务。
- HTTP JSON body 上限 32 KiB、业务超时 5s、数据库语句超时 3s；密码哈希并发池默认 4，满时 429。作为首版可配置工程默认值，需 Ubuntu 测量。
- Argon2id 初值 m=19456 KiB、t=2、p=1，随机 salt 16 字节，保存 PHC 格式；基于服务机测量提高成本，不低于该初值。密码 12–128 个 Unicode 标量、不裁剪/不自动规范化，不强制字符类别。
- 邮箱采用 ASCII 地址、首尾空白去除、整体小写的产品规范，长度最多 254；不折叠 Gmail 点号/+后缀。IDN/SMTPUTF8、邮箱换绑另切片；同规范值唯一。
- ID 统一 UUID 字符串，数据库 uuid；时间 timestamptz/UTC RFC3339。所有列表默认 20、最多 100，不透明签名 cursor。

## HTTP、安全与可观测性

中间件顺序：恢复/Request-ID → 访问日志 → body/超时与 Origin/CORS → 限流 → 认证 → handler。错误为统一 JSON，日志只记 request_id、operation、结果码、耗时和必要内部 ID；禁止密码、token、cookie、邮件链接及完整邮箱进入日志。客户端 request ID 必须校验长度/字符，否则生成新的。

每次受保护调用检查数据库中 user 与 session 的有效性，数据库故障返回 503，不沿用缓存放行。公共接口携带无效凭证也返回 401，不偷偷降级匿名。审计记录和关键安全写入在同一事务中；登录失败审计只存邮箱 HMAC、不存原值。

同源 Web 用 Secure/HttpOnly/SameSite=Lax 的 __Host-sy_access、__Host-sy_refresh（Path=/、无 Domain）；JS 不读 token、不存 localStorage。所有来自浏览器的写请求（含登录、重置、刷新）必须有精确允许的 Origin 和 X-CSRF-Protection: 1，有body时必须JSON；无body的DELETE不要求虚构JSON载荷。只凭 SameSite 不够；显式 Origin 不在白名单一律拒绝。开发环境只允许明确配置的 localhost 例外 cookie 名 sy_dev_*，非开发环境不能关闭 Secure。

Android 用 Authorization: Bearer <access>；登录响应给 token，刷新在 JSON 提交 refresh_token。X-Client-Type: web/android 是传输选择，不是可信身份：有 Origin 的请求即使声称 android 也检查来源；携带 cookie 的写请求始终检查 CSRF。cookie 与 Authorization 同时出现、传输类型不匹配时拒绝，避免身份混淆。Web 只允许同源部署或开发代理，不开放任意 credentials CORS。

限流首版用 PostgreSQL 固定窗口原子计数，客户端 IP 只信任配置的反代。默认：登录 IP 30/min、邮箱 HMAC 10/15min；邮件请求 IP 20/h、邮箱 3/h且间隔60s；确认链接 IP 30/min；刷新 session 20/min；一般写请求 user 60/min。邮箱目标被抑制时邮件请求仍返回 202，IP 触发限流返回 429 + Retry-After。计数清理不能删除尚有效窗口。

## 生命周期与工程门槛

GET /health/live 仅证明进程可响应；GET /health/ready 检查 PG 连接、迁移版本与停止状态，失败 503，不暴露 DSN。关闭时先停止 readiness、停止领取任务、最多 20s 排空请求、取消任务、关闭 DB。邮件 at-least-once 发送，重复邮件可接受，令牌仅可成功消费一次；不宣称 exactly-once。

邮件初始最多5次发送，间隔15/30/60/120秒，单次SMTP超时10秒、lease30秒、并发2；发送前复查challenge仍pending且未过期，否则cancelled并清密文。达到重试上限dead，凭证到期后清密文并cancelled；用户重发新challenge可恢复，不无限重试死任务。cookie Max-Age与token/session有效期一致；清除时使用原名称/Path/Secure属性。

以 Go fmt/vet/test/race、边界依赖检查、OpenAPI lint、真实 PG 约束与并发测试作为必需验证。SQL 变更先空库迁移、重复执行、已存在数据升级，再写恢复说明；业务库不能用 SQLite 测试替代。Windows 可以运行纯测试和文档校验，真实依赖验收在 Ubuntu。CI 命令/镜像随实现落地，此文不是已存在脚本清单。

## 后续切片共同设计门槛

- 视频/隐私/媒体访问：共同确定可见性、缓存失效和访问授权后再编码。
- 消息/关系/客服：共同确定首条额度、双向会话事实、拉黑和订单卡片权限；首切片只给关系事实接口。
- 订单/库存/支付/退款/费用/佣金/结算：必须一次联合设计 API、表、状态和金额不变量，不能先实现 paid 布尔值再补账。落实商家子订单、归因快照、幂等通知、迟到支付、部分退款/尾差与持久依据后才开工。
- 广告/曝光/预算/资金：联合确定曝光资格、并发预算与费用追溯，不能把客户端上报当作扣款授权。

## 参考与取舍

本设计选择及数值是项目初始决策，不是已验证性能结论。核对于 2026-10-26：
- Hertz middleware：https://www.cloudwego.io/docs/hertz/tutorials/basic-feature/middleware/
- pgx/v5：https://pkg.go.dev/github.com/jackc/pgx/v5
- 密码存储：https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- 会话管理：https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- CSRF：https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- PostgreSQL锁：https://www.postgresql.org/docs/17/explicit-locking.html
