# Java Android

归属分支：`dev/android`。业务源码使用 Java，UI 使用 XML/Views 与 ViewBinding，构建脚本使用 Groovy。

设计基线：JDK 17、AGP 8.13.2、Gradle 8.13，minSdk 26，compileSdk/targetSdk 初步为 36。A-001 验证兼容后提交实际 Gradle wrapper、version catalog 和依赖锁定配置。

从少数必要模块起步，按 UI → ViewModel/LiveData → Repository 分工；不一次创建全部 feature/core 空壳。网络 DTO 从[共享契约](../../contracts/http/README.md)生成 Java Retrofit2 客户端，不手抄业务接口。

数据库、文件与网络不阻塞主线程；ViewModel 不持有 Activity/Surface；Media3 管理播放器。明文网络例外仅允许 debug，release 使用 HTTPS。

当前没有 Gradle 工程、APK 或播放实现。验收需实际 wrapper 对应的 lint、单测、debug 构建，并通过模拟器或真机验证启动、播放、旋转和前后台恢复。

实现依据：[客户端设计](../../docs/v2/06-clients.md)。
