# Spec Delta

## Purpose

为闪映单机服务提供明确的运行、错误、健康探针及邮件交付语义，使开发者能够区分进程存活与业务就绪，并在依赖失败、重启或请求重试时获得一致且不泄漏凭据的外部行为。

## ADDED Requirements

### Requirement: 就绪与依赖失败
服务 SHALL 区分存活和就绪，数据库或迁移版本不满足条件时就绪失败；受保护操作不能在数据库不可用时降级为允许。

#### Scenario: 数据库断开
- **WHEN** 数据库不可访问
- **THEN** live 可成功而 ready 返回503，受保护操作返回503且不写入半成品

### Requirement: 统一错误与秘密隔离
服务 SHALL 为错误提供稳定 code、可展示 message 和 request_id，不返回数据库、堆栈或凭据内容；运行日志不得记录密码、令牌、cookie 或邮件链接。

#### Scenario: 依赖抛出内部异常
- **WHEN** 请求发生数据库或密码处理内部异常
- **THEN** 客户端得到统一错误及 request_id，内部日志不包含本次请求秘密

### Requirement: 邮件请求持久接收
服务 SHALL 在邮件请求被接受后持久保存必要任务，失败或重启后可恢复；邮箱存在与否以及按邮箱抑制不得从公开响应区分；实际投递不保证恰好一次。

#### Scenario: SMTP暂时失败
- **WHEN** 请求已返回202而SMTP不可用
- **THEN** 任务保留并按有限重试规则处理，重发邮件不会让一次性凭证成功消费两次

### Requirement: 跨端凭据交付
服务 SHALL 向Web以受保护cookie交付凭据且禁止凭据进入响应JSON，向Android以响应JSON交付且不设置cookie；Web写请求必须经过Origin和CSRF检查，客户端类型声明不能绕过校验。

#### Scenario: 伪装Android的跨站cookie请求
- **WHEN** 带cookie的浏览器请求声称android且Origin不可信
- **THEN** 请求被拒绝，不返回或更新凭据
