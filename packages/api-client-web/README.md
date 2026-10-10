# Web API 客户端

归属分支：`dev/web`，契约语义由 contracts 维护。在 HTTP 契约与生成器落地后，用 openapi-typescript 生成类型，openapi-fetch 承担调用；只增加实际需要的运行时封装。

当前没有 package.json、生成文件或客户端实现。生成产物需要提交，禁止手改；CI 重新生成后必须无差异。业务 Query hooks 保留在 Web 各 feature，不放到通用 SDK。

来源：[HTTP 契约入口](../../contracts/http/README.md)。
