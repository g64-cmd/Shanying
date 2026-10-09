# 闪映 Shanying

短视频平台的 v2 重构：Go 后端、React Web、Java Android。

**当前阶段：v2 0.2 版设计基线已接受，尚未实现 v2。** 目标是完成视频、搜索、无模型训练的推荐、聊天四类业务的可验证闭环。由一人开发，Go + Hertz 后端部署在自有本地服务器；测试使用合成数据，无历史数据迁移。电商仅保留未来扩展边界。

从 [v2 设计评审入口](docs/v2/README.md) 开始阅读。文档包含旧版核查、架构与选型、数据与接口约定、业务流程、客户端设计和开发验收计划。

开发代理开始工作前阅读根目录 [AGENTS.md](AGENTS.md)，遵循模块边界、契约、分支协作和验证规则。

旧版参考：[shanying_server](https://github.com/g64-cmd/shanying_server) · [shanying_web](https://github.com/g64-cmd/shanying_web)。旧版归档与开发分支创建将在设计评审后执行；本轮没有修改远程仓库。
