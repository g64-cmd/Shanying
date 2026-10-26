# 账号切片 PostgreSQL 设计

状态：设计稿，不是已执行迁移。API 见 ../../contracts/openapi.yaml，转换见 account-state-machines.md。

## 通用规则

PostgreSQL 17；主键应用生成 UUID v4，UTC timestamptz，必填列 NOT NULL；下表标 `?` 才可空。所有用户引用 ON DELETE RESTRICT，不以删除用户级联清理未来财务依据。用户无硬删除 API。数据库状态采用 text + CHECK，避免 PostgreSQL enum 难以演进；密码、令牌明文不写普通表。所有表名为设计名，实施迁移必须与本文件逐项核对。

## 表、列与索引

### identity_users

`id uuid PK; email_normalized varchar(254) UNIQUE; password_hash text; display_name varchar(40); bio varchar(200) DEFAULT ''; is_private boolean DEFAULT false; status text CHECK IN ('active','suspended'); version bigint DEFAULT 1 CHECK BETWEEN 1 AND 9007199254740991; email_verified_at timestamptz; created_at timestamptz; updated_at timestamptz`。

只有邮箱确认且设置密码成功后才插入 active 用户；不保存可登录的 pending 账号。display_name 为 1–40 Unicode 标量，bio 0–200，不允许控制字符；无唯一昵称要求。email_normalized 遵守 ASCII/小写规范并有数据库 CHECK；唯一约束负责并发去重。status=suspended 为未来治理预留：首切片只有受控 fixture 可构造，不暴露管理员/自助修改 API。version 用于资料及隐私的乐观锁。

### identity_email_challenges

`id uuid PK; purpose text CHECK IN ('register','reset_password'); email_normalized varchar(254); user_id uuid? FK users; token_hash bytea UNIQUE CHECK octet_length=32; state text CHECK IN ('pending','consumed','superseded','expired'); expires_at timestamptz; consumed_at timestamptz?; created_at timestamptz`。

register 无 user_id，reset 必须有 user_id；数据库 CHECK purpose 与 user_id 组合。部分唯一索引 `(purpose,email_normalized) WHERE state='pending'`；索引 `(state,expires_at)`。时间过去但状态仍 pending 不能使用，所有确认必须同时检查 now<expires_at。重新发送将旧 pending 标 superseded，再插新令牌。原始随机 32-byte token 仅邮件任务加密载荷中短暂保存。

### identity_email_outbox

`id uuid PK; challenge_id uuid UNIQUE FK challenges; payload_ciphertext bytea?; key_id text?; state text CHECK IN ('pending','sending','sent','dead','cancelled'); attempts int DEFAULT 0 CHECK >=0; next_attempt_at timestamptz; lease_until timestamptz?; lease_token uuid?; last_error_code text?; created_at timestamptz; sent_at timestamptz?`。

payload 包含收件地址及验证链接，用部署秘密 AES-GCM 加密，密钥不入库。pending/sending/dead 要求 payload/key_id 非空，sent/cancelled 清空密文和key_id；sending 要求 lease_until/token。索引 `(state,next_attempt_at)`。领取时 FOR UPDATE SKIP LOCKED + 随机 lease_token，过期 lease 可重领，回写必须比较 lease_token。SMTP 结果丢失可能重复邮件，业务令牌只能消费一次。

### identity_sessions

`id uuid PK; user_id uuid FK users; client_type text CHECK IN ('web','android'); device_name varchar(80); created_at timestamptz; last_seen_at timestamptz; idle_expires_at timestamptz; absolute_expires_at timestamptz; revoked_at timestamptz?; revoke_reason text?`。

CHECK created_at<absolute_expires_at 且 idle_expires_at<=absolute_expires_at；索引 `(user_id,created_at DESC,id DESC)` 及未撤销 session 的过期索引。显示状态由 revoked_at 和当前时间派生，不以客户端传值决定。idle 默认 7d，每次成功刷新延长至 min(now+7d,absolute)；absolute 固定创建后30d。

### identity_access_tokens

`id uuid PK; session_id uuid FK sessions; token_hash bytea UNIQUE CHECK length=32; created_at timestamptz; expires_at timestamptz`。

有效期15min；索引 `(session_id)`、`(expires_at)`。不保存 token 明文，每次认证 join session/user 检查撤销/期限/status。刷新产生新 access，旧 access 至自己的15min到期仍可用，撤销 session 时全部即时失效。

### identity_refresh_tokens

`id uuid PK; session_id uuid FK sessions; token_hash bytea UNIQUE CHECK length=32; state text CHECK IN ('current','used','revoked'); created_at timestamptz; expires_at timestamptz; used_at timestamptz?; replaced_by uuid? FK self`。

部分唯一索引 `(session_id) WHERE state='current'`；索引 `(expires_at)`。expires_at 等于 session absolute；使用时还检查 idle。刷新在同事务先 used 旧令牌再插 current 新令牌，互相关联。旧哈希保留至 absolute 到期以检测重放。已用令牌再次提交将该 session 全部撤销；不跨其他设备撤销。

### relation_follows

`id uuid PK; follower_id uuid FK users; followee_id uuid FK users; state text CHECK IN ('pending','accepted'); created_at timestamptz; accepted_at timestamptz?`。

UNIQUE `(follower_id,followee_id)`；CHECK follower<>followee 且 accepted 当且仅当 accepted_at 非空。索引 `(followee_id,state,created_at DESC,id DESC)`、`(follower_id,state,created_at DESC,id DESC)`。拒绝、取消、移除直接删除关系行；安全审计保留操作事件，不设多余 removed 状态。

### relation_blocks

`id uuid PK; blocker_id uuid FK users; blocked_id uuid FK users; created_at timestamptz`。

UNIQUE `(blocker_id,blocked_id)`、CHECK blocker<>blocked；索引 `(blocker_id,created_at DESC,id DESC)` 和 `(blocked_id,blocker_id)`。屏蔽是有向记录、作用是双向；解除自己的记录不会删除对方的记录。与 follows 的跨表排斥通过统一锁协议及事务保证，不能声称普通 CHECK 可覆盖跨表。

### identity_security_events

`id uuid PK; actor_id uuid? FK users; subject_id uuid? FK users; session_id uuid? FK sessions; action text; outcome text; request_id varchar(64); target_fingerprint text?; created_at timestamptz`。

仅允许白名单 action/outcome，无自由秘密字段；索引 `(subject_id,created_at DESC)`。账号/会话/关系的成功变更同事务写入；失败登录单独记受限事件。运行角色对本表无 UPDATE/DELETE 权限；受控维护按后续留存策略执行，不把此表等同完整财务账。

### platform_rate_buckets

`scope text; key_hash bytea; window_start timestamptz; count int CHECK >=0; last_accepted_at timestamptz?; expires_at timestamptz; PRIMARY KEY(scope,key_hash,window_start)`。

key_hash 对邮箱/IP 使用部署 HMAC，不存原值；原子 UPSERT 计数。索引 expires_at 供清理。邮件最小发送间隔由邮箱互斥锁下最近 challenge.created_at 判定，不因切换窗口绕过。

## 事务、锁和竞态

统一顺序：涉及邮件先锁邮箱 `pg_advisory_xact_lock(hash64(purpose-independent normalized email))`；再按 UUID 排序锁所涉及 users 行；再锁 session；最后 challenge/token/关系行。这是单机数据库事务内互斥，不引入分布式锁服务。哈希碰撞只额外串行，不授予权限。

关系命令锁双方 users（即使关系行不存在），重新读双方 block、follow 和目标隐私。隐私更新锁自己的 user 行；因此并发关注与转私密必有清晰顺序。拉黑在同事务插入 block、删除两个方向 follows（含 pending）、写审计。所有 relations 写路径必须遵守此协议；不允许另一路绕过锁直接 INSERT。

密码重置先锁 email、再 user、challenge，写密码并消费令牌、撤销该用户所有 sessions、写审计，同事务提交。登录与刷新都先锁 user 再 session，避免重置后旧密码校验结果创建新会话。昂贵 hash 校验可在事务外，但锁内必须复核 password_hash 未变，否则重新验证/失败，不能使用过期校验结果。

刷新锁 user→session→refresh；两个相同 refresh 并发只有一次轮换，第二次检测 used 并撤销 session。客户端必须跨请求 single-flight，Web 多标签用共享协调；响应丢失或错误重试会要求重新登录，这是首版明确取舍，不承诺无损刷新重试。

数据隔离默认 READ COMMITTED + 上述行锁/唯一约束。死锁/序列化失败只对纯数据库可重试命令最多重试2次；SMTP、token 已响应等外部副作用不盲重试。所有受保护写命令在事务内复核 actor active/session 未撤销；已在线性化点前通过的在途请求不宣称可撤回。

## 分页与迁移

自有会话/粉丝/关注/申请/黑名单按 `(created_at DESC,id DESC)` keyset；cursor 签名绑定 owner、collection、last tuple、首请求 as_of、15min 到期。后续查询 created_at<=as_of 且 tuple<last，隐藏已删除记录；这是稳定游标遍历，不保证跨请求数据库快照或总数不变。篡改/过期/跨列表 cursor 返回400 INVALID_CURSOR。

迁移顺序：000001 identity_users/challenges/outbox → 000002 sessions/tokens/events/rate → 000003 relations。schema_migrations 记录版本与 checksum；上线前独立迁移任务、API readiness 检查预期版本。测试库可 down/up；非空真实库回退先备份并使用兼容 forward-fix，不能自动 DROP 数据。清理只针对到期 token/challenge/临时邮件，用户稳定 ID 永不复用；将来资金表引用用户必须 RESTRICT。
