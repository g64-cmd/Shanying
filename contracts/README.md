# 共享契约

此处是 Go、TypeScript、Kotlin 协议唯一事实来源。协议为语言无关的 OpenAPI/JSON Schema，不在根目录制造无法被三端共同消费的单一语言类型包。

- `openapi.yaml`：OpenAPI 3.0.3 初始容器；paths 为空意味着尚未定义业务接口，不代表服务存在。
- 后续 `examples/`：成功、错误和边界样例。
- 生成客户端放各端 generated 目录，记录生成器版本及契约提交 SHA，禁止手改。
- API 行为解释和能力清单见 `docs/api/README.md`。

首个接口 change 必须补齐校验/生成命令及跨端消费测试，之后才允许将其称为可用契约。
