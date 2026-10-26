# 根目录协作规则

## 阅读与事实边界
- 开始前阅读本文件、目标端 AGENTS.md、docs/requirements.md、docs/workflow.md 和相关 OpenSpec change。
- 本轮用户明确指定 Kotlin、dev/frontend、.worktree、最新 Ubuntu LTS；不得恢复旧 Java、dev/web、.worktrees 或 Ubuntu 24.04 约定。
- 当前是工程基线。区分计划、已编码、静态检查、运行验证和人工验收；禁止把目录或 mock 当作产品完成。
- 用户指令优先；任务范围不清时先调查已有文档。不得自行扩大首期范围。
- 当前产品范围以 openspec/changes/define-shanying-platform 为准；初始化历史中的电商排除不再适用。采用单机模块化单体，不引入 K8s、微服务、RPC 拆分或分布式技术。
- 资金原始快照及调整记录须持久可追溯，删除业务实体不得级联删除交易依据；所有入口统一执行账号与作品权限。具体场景见上述规格。

## 目录与写入责任
- 单 Git 仓库；backend/、frontend/、android/ 独立管理构建与依赖。不得在其内部 git init 或添加 submodule。
- 通用契约只在根级 contracts/，API 说明在 docs/api/。禁止每端维护互相矛盾的协议副本。
- 三端 agent 分别在 .worktree/backend、.worktree/frontend、.worktree/android 工作；这是完整仓库检出，默认只编辑本端目录。
- 根目录协调者串行维护 contracts/、docs/、openspec/、scripts/、根 AGENTS.md 与共享配置。端侧发现协议不足时提出具体请求和样例，由协调者先合入 develop，再同步三端。
- worktree 只隔离文件和索引，不隔离端口、数据库、Docker 项目、缓存或外部服务。联调必须分配独立 Compose 项目名、端口与测试数据。

## 开发与交付
- main 仅承载经过发布验收的稳定版本；首次文档 bootstrap 是明确例外，不得称为稳定可运行应用。
- develop 为集成基线；固定分支 dev/backend、dev/frontend、dev/android 均从 develop 派生。
- 禁止自动 push、强推、删除远端、重写他人历史或丢弃未知变更。允许本地普通提交与合并；远端发布须用户明确授权。
- 行为变更先用 OpenSpec 明确 proposal/specs/design/tasks，再实现。按实际证据勾选任务；未运行验收保留未完成。
- 契约先行：OpenAPI、错误语义、样例与 Android 消费影响先收敛；实现后验证三端解析与兼容性。
- 当前首切片见 openspec/changes/backend-foundation-account-access 和 docs/backend/；后续逐切片细化，订单/库存/支付/退款/费用/分佣/结算须提前联合设计。未完成设计和测试矩阵前不得以总路线任务直接开写该业务。
- 手写代码在状态转换、事务、并发、失败恢复和资源归属处写中文解释性注释，避免逐行翻译。
- 禁止提交凭据、真实用户数据、签名密钥和构建产物。旧仓库代码引入前核对许可证及敏感配置。
- 实现阶段锁定依赖版本和镜像，提交锁文件；不使用浮动 latest。真实后端集成和部署验收在 Ubuntu 执行。
