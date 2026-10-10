# 共享契约

公共契约由后端主导，先合入 main，再同步三个开发分支。契约变更需连同示例、兼容说明、生成代码与相关三端检查一起交付。

| 目录 | 约定 |
| --- | --- |
| [http](http/README.md) | OpenAPI 3.0.3，唯一 HTTP 契约来源 |
| [realtime](realtime/README.md) | 版本化 WS JSON Schema |
| [events](events/README.md) | 版本化内部事件 JSON Schema |
| [examples](examples/README.md) | 三端共享正反例 |

当前仅建立目录和约束，尚无正式 OpenAPI/JSON Schema、样例或生成代码；C-001 落地第一条小契约时再建立实际文件及校验器。设计文档的端点表仍是草案。

规则依据：[数据与接口](../docs/v2/04-data-contracts.md)、[开发与验收](../docs/v2/07-delivery.md)。
