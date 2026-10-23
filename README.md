# 闪映 Shanying

面向抖音式短视频体验的单仓库重构。当前交付为需求、协作流程和工程目录基线，尚不是可运行产品。

| 路径 | 职责 |
| --- | --- |
| `backend/` | Go + CloudWeGo Hertz 服务端 |
| `frontend/` | React + TypeScript Web |
| `android/` | Kotlin + Gradle Android |
| `contracts/` | 三端共享的协议、类型定义与样例，唯一事实来源 |
| `docs/` | 需求、API 说明、开发流程及部署说明 |
| `openspec/` | 需求变更提案、场景和任务 |
| `scripts/` | 仓库检查 |
| `.worktree/` | 本地三端独立检出，不提交 |

三端是同一 Git 仓库中的独立工程，不创建嵌套仓库或 submodule。根目录集中存放共享资料的目录，避免散落文件。

从 [需求基线](docs/requirements.md)、[工作流](docs/workflow.md) 和 [AGENTS.md](AGENTS.md) 开始。
当前产品规格为 [define-shanying-platform](openspec/changes/define-shanying-platform/proposal.md)，覆盖内容、隐私私聊、多商家交易、资金、广告及治理；业务实现尚未开始。
开发环境 Windows 11；运行与集成验收环境 Ubuntu 26.04 LTS，服务优先 Docker Compose。

检查：`node scripts/check-repository.mjs`；`openspec validate bootstrap-shanying-monorepo --strict`。

旧仓库仅作为行为与迁移参考，尚未导入源码或历史，也没有修改远端：
- https://github.com/g64-cmd/shanying_server
- https://github.com/g64-cmd/shanying_web
