# React Web

归属分支：`dev/web`。使用 React + TypeScript strict + Vite，Node 24 LTS + pnpm 10；具体依赖在 W-001 实际解析后提交锁文件。

按 `src/app`、`pages`、`features`、`entities`、`shared` 分工；依赖方向为 pages → features → entities/shared，按功能切片逐步创建。服务端状态使用 TanStack Query，筛选进入 URL，局部状态保留在组件。

HTTP 类型来自[共享契约](../../contracts/http/README.md)，SDK 位于[api-client-web](../../packages/api-client-web/README.md)。Web access token 放内存，refresh 使用受保护 Cookie；管理路由集中在 Web。

当前只有职责说明，没有 package.json、页面或可启动应用。W-001 建立实际工程后补类型检查、lint、相关测试、构建及浏览器流程验证。

实现依据：[客户端设计](../../docs/v2/06-clients.md)。
