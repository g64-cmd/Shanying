# HTTP 契约入口

C-001 在此创建 `openapi.yaml`，使用 OpenAPI 3.0.3，作为 HTTP 唯一事实来源。当前尚未定义正式端点，不把设计草案批量展开为空接口。

Go 使用 oapi-codegen 仅生成 types，手写薄 Hertz adapter；Web 使用 openapi-typescript/openapi-fetch；Android 使用 OpenAPI Generator Java Retrofit2。生成器与命令实际接入后统一放到 scripts 并锁定版本，不手改生成文件。

基路径为 `/api/v2`；失败使用真实 HTTP 状态与稳定 code；空数组返回 `[]`。UUID 为字符串，时间为 RFC 3339 UTC，BIGINT 序号/版本为十进制字符串，以整数语义比较。

每次变更校验 schema、正反例、breaking diff、重新生成无差异以及受影响三端构建/契约测试；删除字段或改变语义须版本化并保留旧 Android 的兼容窗口。
