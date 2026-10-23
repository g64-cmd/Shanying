# Android

继承根 AGENTS.md。工作目录 .worktree/android，分支 dev/android，默认仅修改 android/。

- Kotlin + Gradle Kotlin DSL；初始化应用时提交 Gradle Wrapper、锁定插件和依赖版本，记录 JDK、SDK 要求。
- UI 默认 Jetpack Compose，播放默认 Media3；正式引入前核对版本兼容性。不沿用旧 Java 基线。
- 目录规划：app/src/main、app/src/test、app/src/androidTest。网络 DTO、领域状态和界面状态隔离。
- 每个后端业务切片同时交付 Kotlin DTO/客户端及契约样例解析测试，界面可以后续推进。
- 契约评审必须覆盖令牌刷新/撤销、弱网重试、重复提交、游标分页、上传状态恢复、媒体 URL 失效和错误码。
- 本地持久化凭据使用平台安全存储方案；生命周期切换释放播放器，避免后台泄漏与重复请求。
- 合入 develop 至少提供编译和 JVM 契约测试证据；涉及播放、后台切换和上传时补充设备/模拟器验收。设备未测试须明确记录。
- 服务端新接口没有 Android 消费验证时，不能标记跨端契约验收完成。
