# 显式依赖组装

集中完成配置校验、技术组件初始化、消费者接口注入与跨模块适配。API/worker 入口调用这里的实际组装函数，不引入全局 service locator。

跨模块接口由消费者按实际用例定义，bootstrap 使用提供者公开能力接线。业务层接收标准 `context.Context`，不接收 Hertz RequestContext。当前没有组装实现。
