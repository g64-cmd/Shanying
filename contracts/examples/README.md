# 三端共享正反例

每条正式 HTTP/WS/事件契约提供成功例与主要失败例，在同一契约变更中维护。fixture 明确关联 schema、预期接受/拒绝和原因，供 Go、TypeScript、Java 的契约测试共用。

优先覆盖 nullable、enum、字符串 UUID/BIGINT、错误响应和未知类型兼容；使用合成账号与数据，示例不含真实秘密。当前没有正式契约，因此尚无 fixture 或 mock 数据。
