# API 入口

这里放启动代码：读取并校验配置、调用 bootstrap 组装、启动 Hertz、管理优雅关闭。HTTP 业务基路径为 `/api/v2`，WS 使用 Hertz HTTP Adaptor + gorilla/websocket。

业务用例、SQL 和领域规则不放在 main。健康检查与就绪检查分离，迁移不随 API 启动自动执行。当前尚无可执行文件。
