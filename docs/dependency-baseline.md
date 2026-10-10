# 依赖与工具链基线

记录日期：2026-10-10（北京时间）。本次只初始化仓库结构和检查入口，三端应用及 P0 六项探针尚未实施；下表分开记录本机发现与项目要求。

| 项目 | 设计要求 | 本次实际观察 | 状态 |
| --- | --- | --- | --- |
| 仓库检查 Node | Node 24 LTS | `node --version` 为 v24.11.0；固定在 .node-version | 用于本轮仓库检查 |
| Go | Go 1.26.x + Hertz | `go version` 为 go1.26.8 windows/amd64 | 尚无 Go module，未构建后端 |
| Web 包管理器 | pnpm 10，固定 packageManager + lockfile | 当前命令解析到 pnpm 11.25.0 | W-001 需安装/解析 pnpm 10，未作为项目依赖基线 |
| Android JDK | JDK 17 | PATH 中 `java -version` 为 Java 25 | A-001 需配置 JDK 17，未构建 Android |
| Android Gradle/SDK | AGP 8.13.2 / Gradle 8.13 / SDK 36（待兼容验证） | 无项目 wrapper；ANDROID_HOME/ANDROID_SDK_ROOT 未配置 | 尚未验证，不等于断言机器未安装 SDK |
| Docker Compose | Linux 容器/WSL2 | 本次 PATH 未找到 docker 命令 | 未启动容器；P0 补核实 |
| 应用库与生成器 | 见技术选型 | 尚未解析 | 无 go.sum、pnpm-lock、Gradle 锁文件 |
| 数据库/搜索/推荐/存储镜像 | 固定版本及 digest | 尚未拉取 | 无可部署镜像清单 |

仓库检查脚本只使用 Node 标准库，不需要依赖安装。没有为尚不存在的应用创建伪锁文件；创建实际工程时提交解析后的 Go/pnpm/Gradle 锁定配置，并将验证命令、结果及兼容性偏差补充到本页。

CI 使用以下固定 Action 提交，已核实官方仓库对应源码；这不等于已运行 GitHub Actions：

- [actions/checkout v4.2.2](https://github.com/actions/checkout/tree/11bd71901bbe5b1630ceea73d27597364c9af683)。
- [actions/setup-node v4.4.0](https://github.com/actions/setup-node/tree/49933ea5288caeca8642d1e84afbd3f7d6820020)。

P0 仍需验证 Hertz/契约/WS、PG 工具链、S3 子集、Gorse 禁训练、Meilisearch 和 Android 构建/播放，详见[技术选型](v2/03-technology.md)。
