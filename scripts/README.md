# 统一脚本入口

当前可执行：`node scripts/check-repository.mjs`。它只依赖 Node 24 标准库与 Git，检查本地结构、文档链接、JSON 语法与文本约定，不访问外网，不执行应用构建或部署。

后续随工程接入增加生成、启动、迁移、合成数据和业务验证命令。先确保脚本真实存在并运行，再写入[开发说明](../docs/development.md)；敏感输入不拼接为 shell 命令。
