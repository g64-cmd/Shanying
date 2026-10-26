# 共享契约

此处是 Go、TypeScript、Kotlin 协议唯一事实来源。协议为语言无关的 OpenAPI/JSON Schema，不在根目录制造无法被三端共同消费的单一语言类型包。

- `openapi.yaml`：OpenAPI 3.0.3，已定义后端底座及账号权限首切片的28个操作；这是设计契约，尚未实现服务。
- 后续 `examples/`：成功、错误和边界样例。
- 生成客户端放各端 generated 目录，记录生成器版本及契约提交 SHA，禁止手改。
- API 行为解释和能力清单见 `docs/api/README.md`。

首切片为 backend-foundation-account-access；静态契约检查不等于跨端运行通过，生成/消费及实际服务验证在该切片实施任务中跟踪。
