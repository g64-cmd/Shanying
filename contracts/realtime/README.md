# WebSocket 契约入口

C-001 在此落地版本化 JSON Schema、允许发送/接收的 envelope 和兼容说明；共享正反例放在[examples](../examples/README.md)。当前没有 schema 或 WS 实现。

v2 仅支持单聊文本与视频卡片。服务端拒绝未支持发送类型和非法 payload，旧客户端收到未知类型展示占位。一次性 ticket、Origin、心跳、关闭和背压须实际验证。

WS 仅提示实时变化，消息提交后才 ACK，历史和增量同步从 PG 恢复；不能以连接可用代替可靠持久化。
