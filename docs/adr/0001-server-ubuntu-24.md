# ADR 0001：server 固定 Ubuntu 24.04

状态：已接受。日期：2026-10-10（北京时间）。对应设计决定：D09。

## 问题与证据

用户在仓库初始化过程中明确指定：server 将运行在 Ubuntu 24 服务器，不采用浮动 Linux runner，不考虑 Windows 或 WSL 运行 server。此前设计包含 Windows Docker Desktop/WSL2 的后端开发运行路径，需要同步修订。

这是目标环境约束，尚未连接或核实服务器已安装的系统、Docker、CPU、内存、磁盘或网络。

## 决定

- 将 Ubuntu 24 目标固定为 Ubuntu 24.04，server 的构建、运行、真实集成测试及阶段验收以此为准。
- 后端 GitHub Actions 显式使用 `runs-on: ubuntu-24.04`；当前仓库检查 CI 也采用此标签。
- 部署方式继续使用自有服务器上的 Docker Compose，不改变模块化单体、worker 与组件选型。
- 不提供 Windows/WSL 的 server 运行路径；Windows 编辑工作区可做仓库结构与文档检查，其结果不替代 Ubuntu 后端验证。

## 替代方案与影响

浮动 runner 与 Windows/WSL 后端环境不符合用户此次指定的运行边界，因此不纳入本基底。Web/Android 的开发机选择不因该 server 约束发生改变。

当前没有后端进程或部署，因此只需修订文档和 CI，无应用或数据迁移。实际服务器资源、容器镜像 digest 与 Go 工具链仍需在 P0 记录。

## 验证与回退

本轮验证仓库结构、文档相对链接、示例 JSON 与补丁空白，并静态检查 CI 固定标签。尚未运行 GitHub Actions、连接 Ubuntu 服务器或构建/运行 server。

P0 在 Ubuntu 24.04 上完成真实构建、PG/组件探针与运行记录；遇到兼容失败保留原始证据并修订本 ADR，不自动改回 Windows/WSL 或浮动 runner。部署后应用回退沿用兼容 schema 与上个镜像策略。
