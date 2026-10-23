# 需求基线

记录日期：2026-10-24。用户明确要求：单仓库、Go、字节开源中间件、React、Kotlin + Gradle、三开发分支和 .worktree、Windows 11 开发及最新 Ubuntu LTS 运行。

## 本次完成范围

建立工程目录、根与三端 agent 规则、分支/worktree 及 OpenSpec 需求与工作流。业务代码、旧仓库导入、部署和可运行产品不属于本次基础结构验收。

## 产品收敛方案

以下为首期建议基线，进入对应业务 change 前可以调整；模仿抖音的核心体验，不代表实现其全部能力或已核实其内部完整技术栈。

| 阶段 | 范围 | 可观察验收 |
| --- | --- | --- |
| P0-1 | 注册/登录、刷新/退出、个人资料 | Web 与 Android 使用同样的认证语义，失效令牌不能继续写入 |
| P0-2 | 视频流、播放、游标分页、视频详情 | 不重复加载同页；未就绪/删除内容不可播放；失败可恢复 |
| P0-3 | 上传、处理状态、发布、删除自己的视频 | 上传成功不等于发布成功，所有权和处理状态校验通过后才能入流 |
| P0-4 | 点赞、评论、关注、个人作品和关注流 | 重试不产生重复关系，未授权操作明确失败 |
| P1 | 搜索、收藏、通知、举报与管理能力 | 单独 OpenSpec 收敛后实施；公开运营前必须补齐必要治理能力 |

首期以规则排序/关注流形成可用闭环，不引入模型训练。直播、电商、支付、复杂即时通讯、完整抖音功能复制及历史数据迁移不进入当前方案。使用合成测试数据；以后若需要迁移，单独审计旧 schema 和数据。

Android 不要求与 Web 同期完成全部界面，但每个 P0 切片必须完成契约评审、DTO/请求实现及样例解析验证；不能留到最后才检查 API。

## 技术决策与依据

- 后端：Go + Hertz 模块化单体，后续真实 RPC 需求出现才评估 Kitex。字节生态优先是应用框架/中间件选型原则，不等于所有基础设施必须来自字节。
- Web：React + TypeScript；Android：Kotlin + Gradle，建议 Compose + Media3。
- 部署：Ubuntu 26.04 LTS（截至记录日期最新 LTS），Docker Compose 优先。升级 OS 必须另行验证，不能自动追随版本。
- PostgreSQL 17 官方镜像保留为初始方案；对象存储、缓存和媒体处理实现留给相应切片设计，不在空目录阶段虚构已部署能力。

旧仓库 README 阅读结果：服务端是 Gin + PostgreSQL/Redis/MinIO，Web 是 Vue 3 + TypeScript。此次为架构与客户端重构，不可直接把旧依赖改名视为迁移完成；尚未进行源码、许可证或安全审计。

来源：
- https://github.com/g64-cmd/shanying_server
- https://github.com/g64-cmd/shanying_web
- https://www.cloudwego.io/docs/hertz/overview/
- https://ubuntu.com/about/release-cycle
