# Tasks

## 1. 基础结构

- [x] 1.1 建立三端目录与四份 AGENTS.md，通过仓库结构脚本检查。
- [x] 1.2 编写需求、工作流和共享 API 容器，人工检查技术栈、职责及未实现边界。
- [ ] 1.3 创建 main/develop/三端分支与 worktree，通过 git worktree list 和共同祖先检查。

## 2. 基线验证

- [ ] 2.1 运行 OpenSpec strict validation、仓库检查及 git diff --check，记录验证结果。

## Workflow follow-up

- 本 change 仅交付规范和工程基线；规格中的业务运行场景由后续业务 change 实现与验证，不在本轮勾选为已实现。
- 后续分别创建认证、Feed、上传发布、互动关系 change，补齐 API schemas、三端工程及自动化检查。
- 经需求审阅后再归档本 change；不将规划完成解释为业务场景通过。
