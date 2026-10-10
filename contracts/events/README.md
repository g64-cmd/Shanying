# 内部事件契约入口

随着首个实际业务事件在此创建版本化 JSON Schema。事件由业务事务写入 outbox，每消费者独立 delivery，至少一次投递与幂等消费；重放保留 event_id。

事件携带必要业务事实、aggregate_id、十进制字符串版本和 UTC 时间，避免广播数据库整行、token、签名 URL 或聊天正文。新增可选字段与破坏性语义变更分别处理，保留兼容窗口。

当前没有事件 schema、持久化表或 dispatcher。规则见[数据与接口](../../docs/v2/04-data-contracts.md)。
