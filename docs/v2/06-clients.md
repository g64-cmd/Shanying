# 06 · Web 与 Android 开发设计

## 1. 共用产品与契约

两端共享用户语言、状态定义、错误码、埋点语义和 API 示例，不共享业务 UI 代码。Web 适配桌面与窄屏；Android 是 Java 原生应用，不是 WebView 套壳或 React Native。

主导航为“推荐 / 关注 / 消息 / 我”，搜索与发布作为一级操作。视频和聊天展示 loading、empty、error、offline 四类状态。管理台 `/admin` 仅在 Web 实现；v2 不展示商城或商家入口。

不硬编码视频 URL，不把底层对象 key 拼成公共地址；播放器通过 playback API 更新凭证。客户端可做输入校验改善体验，权限、内容可见性和状态转换由后端最终决定。

## 2. React Web

```text
apps/web/src/
  app/                  router、providers、启动和鉴权恢复
  pages/                页面编排与路由级加载
  features/
    auth/ feed/ upload/ search/ social/ chat/ moderation/
      api/              Query hooks 和该功能的网络映射
      model/            本功能状态、纯逻辑
      ui/               展示组件
  entities/             稳定的 VideoCard、UserBadge 等展示模型
  shared/
    ui/                 Button、Dialog、Toast 等基础组件
    player/             播放控制器与播放事件
    realtime/           连接、重连、同步协调
    lib/                时间格式化、错误映射
    styles/             tokens、基础样式
```

依赖方向 pages → features → entities/shared。功能间通过页面编排或公开 API 协作，禁止直接访问另一功能的内部 store。初期模块不为了“复用”提前打包，只有 SDK 和实际跨应用复用代码进 packages。

### 状态边界

| 状态 | 归属 | 约束 |
| --- | --- | --- |
| 视频列表、评论、资料 | TanStack Query | query key 包含账号/筛选/模式，退出清除私有缓存 |
| 搜索词、筛选、选中会话 | URL | 刷新/分享后可恢复，不与 store 双向循环同步 |
| 弹窗、静音、当前播放项 | 局部 state，必要时 Zustand | 不复制全量服务器数据 |
| 表单 | 局部状态，复杂表单 React Hook Form + Zod | 后端校验为最终依据 |
| 消息发送状态 | chat feature 的消息模型 | pending/sent/failed 按 client_message_id 合并 |

点赞/收藏使用乐观更新；失败回滚并提示，可重试；多次点击最终发送期望状态，避免 toggle 乱序。视频发布不以乐观更新宣告审核成功。搜索输入300 ms防抖、AbortSignal取消过期请求，账号变化后旧响应不得写入新账号缓存。

### 播放与长列表

页面只维持当前及前后邻近的最多3个 video 元素；长列表采用窗口化。只有当前可见项播放，下一条预加载受网络与省流模式限制；不可见/离开页面/切后台暂停。暂停同时结束曝光计时。

播放控制器负责 HLS 初始化/销毁、凭证过期续签、重试和错误分类；组件负责 UI。自动播放遭浏览器拒绝时显示手动播放入口，不吞掉 play() Promise。React StrictMode 的重复挂载不能留下多个播放器、监听器或 WS 连接。

进入详情保留 Feed 会话和位置；退出恢复时先检查游标有效期。记录首帧耗时、卡顿时长、错误类型，区分缓存命中与冷启动；不能只测 metadata API 就宣称播放快。

### 无障碍与安全

键盘可切换/暂停，焦点在弹窗内正确管理；按钮有可读名称，支持 reduced-motion。评论和聊天按纯文本渲染，搜索高亮不直接插入未净化 HTML。私有缓存清理、CSRF、同源 Cookie 规则遵循数据契约。

## 3. Java Android

采用 Activity/Fragment + XML + ViewBinding；ViewModel 暴露不可变 UiState 的 LiveData，Repository 负责网络/本地整合。ViewModel 不持有 Activity、View 或播放器 Surface。依赖由 Application 级手工容器组装，规模确实需要时才升级到 Dagger；不同时引入 RxJava、协程和多套状态框架。

```text
apps/android/
  app/                  导航、Application、依赖组装
  core-model/           跨模块稳定模型
  core-network/         生成 API、OkHttp、刷新令牌
  core-database/        Room、迁移、消息与待发送队列
  core-media/           Media3、缓存、播放会话
  core-ui/              主题和共用视图
  feature-feed/ feature-search/ feature-upload/
  feature-chat/ feature-profile/
```

feature 依赖 core，不能互相依赖具体 Fragment。只把存在独立职责的组件做 Gradle 模块，P0/P1 可先落地少数核心模块。业务源码使用 Java；构建脚本采用 Groovy，避免把 Kotlin DSL 的存在误认为客户端改用 Kotlin。

### 网络、存储与生命周期

- Retrofit/OkHttp 异步调用；DB/文件/计算在 ExecutorService，主线程只更新 UI。每个屏幕可取消不再需要的请求。
- 401 触发单次并发合并的 refresh；单请求最多刷新重试一次。退出或封禁清空会话及账号作用域缓存。
- Room 保存聊天历史、read cursor、client_message_id 和发送队列；联网时重发同 ID，ACK后更新本地状态。Room entity 与网络 DTO 分开。
- Feed 可以展示带过期提示的缓存，发布/审核离线时不能假装成功；聊天离线可进入待发送队列。
- 图片使用 Glide；视频由 Media3 管理磁盘缓存，初始上限300 MiB，缓存键基于 asset/version，不基于每次变化的签名 URL。
- 使用 ViewPager2 或 RecyclerView 实现竖滑；一个主播放器绑定当前项，预加载另行限额，不给每一页各建播放器。stop/destroy 时释放，旋转时保存位置再恢复。
- 选择本地视频使用系统内容 URI，保存必要 URI 权限；上传前断言权限仍有效。WorkManager 负责可延迟重试，显式长上传遵循当前系统前台工作限制并显示进度；不承诺被系统杀进程后永久后台保活。
- Android 默认调试连接模拟器宿主机 `10.0.2.2`；真机用局域网地址。明文网络仅允许 debug 配置，release 使用 HTTPS。

Media3 的 Java/XML 接入与官方架构建议作为参考；本项目为了 Java 选择 LiveData/Views，并非宣称这是 Android 唯一推荐路线。[Media3](https://developer.android.com/media/media3/exoplayer/hello-world) · [Android 架构](https://developer.android.com/topic/architecture)

## 4. 三端联调协议

后端契约先定义至少一个成功例和主要失败例，Web/Android 根据同一 fixtures 开发。mock 只用来推进 UI，阶段验收必须切换真实后端、真实 PG、真实视频样片。

跨端同一测试账号：Web 发消息→Android收到；Android离线→Web继续发送→Android恢复补拉；任一端收藏→另一端刷新得到相同状态；任一端拉黑后另一端不能继续发送消息。UI不追求逐像素相同，但业务结果必须一致。

功能开关由服务端 capabilities 响应约束，客户端隐藏尚未可用入口；服务器仍鉴权。发布时旧 Android 客户端可忽略新增字段，但核心 API 不能原地改语义。
