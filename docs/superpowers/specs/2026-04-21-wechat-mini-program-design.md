# Wardrowbe 微信小程序设计说明

## 概要

本文档定义一个新的微信小程序客户端，用于完整复刻当前 `frontend/` 的功能面，同时保持业务接口调用与现有后端 `/api/v1/**` 契约一致。该小程序将作为一个独立客户端实现，而不是把当前 Next.js 前端直接迁移为多端运行时。

小程序必须同时支持生产可用的微信登录和开发态登录。后端改动范围仅限于小程序专用认证接口及其配套认证配置。所有现有业务域继续复用当前后端 API。

## 目标

- 在微信小程序中完整复刻当前 `frontend/` 的功能面。
- 保持业务 API 调用与现有 `/api/v1/**` 后端接口一致。
- 同时支持 `wechat-login` 和 `dev-login`。
- 保持 `zh` 与 `en` 的国际化能力对齐。
- 在不强行重构现有 Web 前端的前提下，尽量复用领域逻辑、类型定义和 API 行为。

## 非目标

- 不把现有 Next.js 前端改造成多平台应用。
- 不新增一套仅供小程序使用的平行业务 API。
- 不追求与 Web 前端像素级一致的 UI。
- 不进行与本任务无关的前后端架构重构。

## 现状背景

当前 `frontend/` 是一个 Next.js 应用，主要依赖：

- `next-auth` 处理 Web 端认证会话
- `next-intl` 处理本地化
- `@tanstack/react-query` 处理服务端状态
- `frontend/lib/api.ts` 作为 `/api/v1/**` 的本地 API 封装
- `frontend/lib/hooks/` 下的业务 hooks
- `frontend/app/[locale]/` 下的页面路由

当前功能面包括：

- 登录与引导
- Dashboard 首页
- 衣橱列表、筛选、文件夹、批量操作、单品详情、编辑、AI 重分析
- 多图上传与数量跟踪
- 支持未来日期和天气的穿搭推荐
- 搭配 Pairings
- 手动穿搭与穿搭历史
- 数据分析 Analytics
- Learning 洞察
- 家庭管理与家庭动态
- 多通知渠道与 Webhook 预设
- 设置与用户偏好
- 邀请流程与错误处理

## 产品范围

小程序必须覆盖所有当前对用户可见的 Web 前端业务域：

- `login`
- `onboarding`
- `invite`
- `dashboard`
- `wardrobe`
- `suggest`
- `pairings`
- `outfits`
- `history`
- `analytics`
- `family`
- `family/feed`
- `notifications`
- `learning`
- `settings`
- 通用错误态与加载态

实现可以按多个工程里程碑推进，但目标发布范围必须与当前 Web 前端保持完整功能对齐。

## 高层架构

### 客户端策略

在仓库根目录新增独立小程序客户端 `wechat-miniapp/`，技术路线采用 `Taro + React + TypeScript`。

该客户端与 `frontend/` 保持独立，但通过新的共享模块复用以下能力：

- API 客户端行为
- 领域类型定义
- taxonomy 与翻译数据
- 纯业务工具函数

### 共享运行时模型

共享逻辑需要设计成 Web 前端和小程序都能消费同一套领域与 API 行为，同时把平台相关运行时细节隔离开。

共享模块固定放在仓库根目录 `packages/` 下。仓库中 `packages/shared-api`、`packages/shared-domain`、`packages/shared-i18n` 三个包及其 `src/` 骨架已先行创建，后续实现阶段在其中扩展并通过 workspace 被 `frontend/` 和 `wechat-miniapp/` 引用：

- `packages/shared-api`：请求核心与各运行时适配器
- `packages/shared-domain`：领域类型、taxonomy、工具函数
- `packages/shared-i18n`：语言包与轻量 runtime

monorepo 工具链使用 `pnpm` workspaces；`frontend/`、`wechat-miniapp/` 与 `packages/*` 位于同一个 workspace，共享包通过 `workspace:*` 协议引用，消费端直接走 TypeScript path 读取 `src/` 以避免预构建开销。

职责边界固定如下：

- 共享模块负责纯逻辑与 API 语义
- 各客户端各自负责路由、UI 组件、存储与平台 API

## 认证设计

### 设计理由

当前 Web 前端依赖 `next-auth`，这套运行时无法直接复用到小程序。小程序不应尝试模拟 `next-auth`，而应与 Web 端在“最终拿到同一种后端 access token”这一结果上保持一致。

### 登录模式

小程序必须同时支持：

- `wechat-login`
- `dev-login`

### 微信登录流程

1. 小程序调用 `wx.login()` 获取微信 `code`。
2. 小程序将该 `code` 发送到新增后端接口。
3. 后端向微信换取身份信息，解析 `openid` 等标识，创建或绑定本地用户，并返回可直接访问当前 `/api/v1/**` 的后端 access token。
4. 小程序本地保存该 access token，并在后续所有业务请求中使用它。

### 开发态登录流程

1. 小程序提供开发专用登录表单，能力上与 Web 端 dev login 对齐。
2. 小程序将 email 与 display name 提交到现有 `POST /api/v1/auth/sync` 接口，`id_token` 留空。
3. 后端在 `_is_dev_mode()` 为真时直接创建或同步本地用户并返回 access token；Web 端 NextAuth 的 dev credentials 走的也是同一条路径，行为一致。
4. 小程序保存该 token，后续业务流程与微信登录保持一致。

### 后端认证接口

后端新增范围仅限于微信认证接口与小量认证配置：

- `POST /api/v1/auth/wechat/code`：接收小程序 `wx.login()` 的 `code`，向微信换取 `openid`（以及可选 `unionid`），写入/绑定 User 并返回与 `/auth/sync` 一致结构的 access token
- `GET /api/v1/auth/status`：返回结构扩展 `supported_modes`（取值为 `"oidc" | "wechat" | "dev"` 的数组），让小程序能先查可用登录方式再决定 UI

dev login 复用既有 `POST /api/v1/auth/sync`（`_is_dev_mode()` 为真时直接签发 token），不再为小程序新增 dev 专用接口。不为 wardrobe、outfits、family、settings、analytics、learning、notifications 等业务域新增小程序专用业务接口。

### 账户身份模型

为承载多种身份来源并为未来的多身份绑定留出空间：

- `User` 模型新增 `provider`（`"oidc" | "wechat" | "dev"`）与 `provider_id`（OIDC `sub` / 微信 `openid` / dev email）两列，`(provider, provider_id)` 建唯一索引
- 现有 `external_id` 保留为向下兼容字段，由迁移回填；`provider_id` 成为真源
- 数据迁移：存量 OIDC 用户回填 `provider="oidc"`、`provider_id=external_id`；dev 用户回填 `provider="dev"`、`provider_id=email`
- 微信登录写入 `provider="wechat"`、`provider_id=openid`；如拿到 `unionid` 额外存 `provider_secondary_id` 以便未来跨平台身份合并
- access token 的 `sub` 字段不直接暴露 `openid`，而是使用稳定的内部用户标识
- 邮箱冲突策略：OIDC 仍保留现有"相同邮箱需 `email_verified=true`"规则；微信端因不能提供可信邮箱，默认不与已有邮箱账户自动合并，由用户在 settings 中手动绑定

### 小程序会话模型

小程序维护自己的认证状态存储，并且应当：

- 使用微信存储持久化 access token
- 在应用启动时恢复会话状态
- 为业务请求统一注入 `Authorization: Bearer <token>`
- 在收到 `401` 后清空认证状态并跳转登录页
- 在登录跳转前保存被守卫页面目标，登录成功后恢复跳回

小程序不得依赖浏览器 cookie、`credentials: include` 或 `next-auth` session。

## 共享 API 层设计

### 当前约束

`frontend/lib/api.ts` 当前默认运行在浏览器环境，依赖：

- `fetch`
- 浏览器在线状态检测
- 模块级 token 状态
- 可选的 `credentials: include`

这些假设不足以支撑小程序运行时。

### 目标形态

将 API 层抽到共享包，并拆成三类职责：

1. 请求核心行为
   - endpoint 路径拼接
   - query 参数编码
   - header 合并
   - 错误解析
   - `ApiError` 与 `NetworkError`
2. 运行时适配器
   - Web 端 `fetch` 适配器
   - 小程序 `Taro.request` 或底层微信请求适配器
3. 运行时绑定
   - access token getter/setter
   - locale getter/setter
   - base URL 解析

对外调用风格要在两个客户端中保持稳定：

- `api.get('/users/me')`
- `api.post('/outfits/suggest', payload)`
- `api.patch('/preferences', payload)`
- `api.delete('/items/:id')`

### 文件上传支持

文件上传需要从通用 JSON 请求封装中独立出来，作为共享上传 helper 提供，并由不同运行时各自实现底层适配。

小程序上传能力必须支持：

- 带主图的单品创建
- 在当前后端限制范围内上传附加图片
- 上传失败重试与进度、错误展示
- 在现有 multipart 接口已可用的前提下，继续复用当前后端上传语义

小程序侧需显式处理的平台差异：

- `Taro.uploadFile` / `wx.uploadFile` 每次只能上传一个文件，且不能与 JSON body 一起混发；多图创建/编辑需在小程序端把聚合流程拆成"先逐张上传、再调用 JSON 接口绑定资源 id"两步
- 上传源是临时本地路径（`tempFilePath`）而非 Blob/File，预览与再编辑需围绕该路径展开，并在 token 过期时重新获取
- 微信对单文件约 10MB、整体内存、并发连接数均有限制，重试策略要兼顾网络切换导致的断点与前台切换挂起
- 上传 helper 需暴露可被测试 mock 的适配层边界，便于客户端单测与集成测试

业务含义保持不变，仅在传输方式与本地预览行为上做平台适配。

## 共享领域层

从 Web 前端抽取后，小程序应共享以下类型的内容：

- 当前位于 `frontend/lib/types.ts` 的 TypeScript 领域类型
- taxonomy label 解析逻辑
- 日期工具函数
- 温度转换与显示逻辑
- 不依赖 DOM 或浏览器运行时的重排、筛选、排序工具函数
- 平台无关的 API 消息映射与通用错误辅助函数

小程序不应直接复用与以下运行时强耦合的 Web hooks：

- `next-auth`
- `next-intl`
- Next.js 导航
- 浏览器专有 API

正确做法是：

- 抽取 service 层业务函数
- Web 与小程序各自基于共享 service 重写平台相关 hooks

## 国际化设计

小程序必须支持 `zh` 与 `en`，并保持与 Web 前端相同的有效功能覆盖。

实现方向固定如下：

- 从 `frontend/messages/en.json` 与 `frontend/messages/zh.json` 抽取共享消息源
- 保持 Web 与小程序的翻译 key 对齐
- 小程序使用轻量级 i18n runtime，而不是复用 `next-intl`
- 后端请求继续带上 `Accept-Language`

小程序无需复制 `next-intl` 的实现细节，只需要保证结果层面的语言行为和翻译覆盖一致。

## UI 与交互设计

### 核心原则

必须保证功能对齐，不要求布局对齐。

小程序需要保留：

- 页面级信息架构
- 与 Web 对应的用户操作入口
- 对等的筛选、表单、详情与业务流程
- 相同的用户可见领域实体

小程序应按微信习惯适配交互：

- 用底部 tab 或移动端导航替代桌面侧边栏
- 用单列移动布局替代多列桌面布局
- 视情况用页面、抽屉、底部弹层替代大量 modal
- 移除所有 hover 驱动交互
- 表单以触摸输入和移动端滚动场景为优先

### 页面域预期

#### 认证与引导

- 登录页同时支持微信登录与开发态登录
- 引导流程覆盖 welcome、family、location、preferences、first item upload
- 邀请处理与错误回退能力

#### Dashboard

- 天气摘要
- 待处理 outfits
- 快捷操作
- 通知摘要
- 有家庭时的家庭摘要

#### Wardrobe

- 适配移动端的列表或网格展示
- 筛选、搜索、排序、文件夹过滤
- 适配移动端的批量工具条
- 单品详情与编辑
- 收藏、洗护、重分析、归档状态
- 多图浏览

#### Suggest

- 天气上下文
- 目标日期选择
- occasion 选择
- 推荐生成
- 接受与拒绝
- 手动创建 outfit 与现有 AI 学习回流能力

#### Pairings 与 Outfits

- 搭配列表与筛选
- 预览与反馈
- 手动创建 outfit
- outfit 列表与对应筛选能力

#### History

- 适配移动端约束的日历浏览
- 选中日期的 outfit 详情
- 反馈与预览能力

#### Analytics 与 Learning

- 保留现有指标与洞察
- 使用适合移动端的数据可视化方式
- 允许图表渲染形式与 Web 不同，但必须保证信息对齐

#### Family 与 Family Feed

- 家庭创建与加入
- 邀请码处理，三种入口必须都覆盖：手动粘贴邀请码、通过"扫一扫"打开带参数的小程序码（解析 `q` 参数）、通过转发的小程序卡片冷启动（解析 `scene` 参数并 URL-decode 邀请码）
- 成员管理、角色修改、移除
- 家庭动态浏览
- 家庭评分交互

#### Notifications

- 现有配置项覆盖
- 各通知渠道配置
- webhook preset 处理
- 测试发送与启停切换

#### Settings

- 偏好设置
- 位置与时区
- 计量单位
- AI endpoint 配置与测试
- 当前 Web 前端已有的 profile 相关设置

## 状态管理设计

小程序采用两层状态模型。

### 全局状态

- auth/session
- 当前 locale
- 当前用户与家庭上下文
- 全局瞬时错误状态
- 上传任务状态

### 页面级服务端状态

- 列表分页
- 筛选与排序
- 详情请求
- mutation 状态
- 预览与临时编辑态

小程序端服务端状态默认使用 Zustand 作为容器，通过 thunk 风格的 action 调用共享 service 层；store 内保存 `data`、`loading`、`error`、`lastFetchedAt`，并按资源维度手工实现 invalidate、乐观更新与错误回滚。shared service 层的函数签名与 Web 端 React Query 的 `queryKey`（资源 + 入参）在概念上保持对齐，但两端 hook 互不复用，Web 仍保留 React Query。

若后续验证 React Query 在 Taro 下稳定，可在小程序端以 RQ 封装替换 Zustand store，service 契约保持不变；这是可选优化，而不是首版目标。

## 工程拆分

虽然产品目标是首版全量对齐，但工程执行必须拆成有依赖顺序的多个轨道。后续 implementation plan 至少要分为这些部分：

1. 小程序应用壳与认证
2. shared API/domain/i18n 抽取
3. wardrobe、suggest、pairings、outfits、dashboard
4. history、analytics、learning
5. family 与 notifications
6. settings、onboarding、invite、回归加固

这只是执行结构，不改变最终发布范围。

## 仓库与分支策略

实现必须新建开发分支 `dev-wechat`。

由于当前仓库里已经存在与本任务无关的本地改动 `backend/app/utils/network.py`，实现阶段应当为 `dev-wechat` 使用独立 worktree，避免小程序开发干扰其他进行中的改动。

当前设计 spec 可以继续在现有分支上编写和修订，后续再用于驱动 `dev-wechat` 上的实现工作。

## 测试策略

实现必须至少包含四层验证。

### 共享层测试

- API 错误解析与请求配置
- 抽取后的认证运行时纯逻辑
- 日期、温度、筛选、排序、taxonomy 等工具函数

### 小程序客户端测试

- 认证状态流转
- 页面表单行为
- 列表筛选与分页逻辑
- 上传状态流转
- 关键空态、错误态与加载态

### 集成测试

- 微信登录后端链路
- 开发态登录后端链路
- 已登录状态下的 `/api/v1/**` 访问
- 多图上传
- wardrobe、suggestions、family、notifications 等代表性业务操作

### 人工回归矩阵

对当前 `frontend/app/[locale]/` 下每一个面向用户的页面，都要检查：

- 小程序中是否有可达入口
- 数据是否可加载
- 核心写操作是否可完成
- 空态、错误态、加载态是否完整
- `zh` 与 `en` 是否可用
- 微信开发者工具与真机上是否可正常使用

## 风险与缓解

### 认证风险

风险：
- 微信认证与当前后端用户模型可能无法一次对齐。

缓解：
- 将小程序认证隔离在新增认证接口后
- 下游业务认证仍复用现有 backend token 模型

### 上传风险

风险：
- 多图上传与图片预览在 Web 和小程序运行时差异较大。

缓解：
- 将上传实现成独立适配层
- 尽早验证 create、update、retry、reanalyze 路径

### 范围风险

风险：
- 所有 Web 业务域一次性全量追平，范围非常大，不能以单次无结构实现推进。

缓解：
- 严格拆成子计划与里程碑执行，同时保持最终发布范围不变

### 共享代码风险

风险：
- 如果直接复用 Web hooks，会把大量运行时假设扩散到整个项目。

缓解：
- 共享 services、types、utilities
- hooks 按平台分别实现

## 验收标准

当满足以下条件时，可以视为本设计已被正确实现：

- 仓库中存在新的微信小程序客户端
- 实现工作在 `dev-wechat` 分支上推进
- 小程序用户可以通过微信登录进入系统
- 开发人员在允许的环境中可以通过 dev login 进入系统
- 小程序业务功能覆盖与当前 `frontend/` 相同的页面级功能面
- 业务数据访问继续与 `/api/v1/**` 保持一致
- 后端新增范围仅限 `POST /api/v1/auth/wechat/code`、`/auth/status` 的字段扩展，以及 User 身份字段迁移；dev login 复用现有 `/auth/sync`
- 小程序完整支持 `zh` 与 `en`
- 小程序通过共享层测试、关键客户端测试，以及对照现有 Web 前端的逐页回归矩阵

## 本设计已明确的决策

- 采用独立小程序客户端，而不是把 Web 应用改成多端运行时
- 小程序技术路线采用 `Taro + React + TypeScript`
- 共享代码放在仓库根目录 `packages/shared-api|shared-domain|shared-i18n`（骨架已存在），monorepo 使用 pnpm workspaces 拉通
- 业务 API 继续复用 `/api/v1/**`
- 后端新增仅限 `POST /api/v1/auth/wechat/code` 与 `/auth/status` 的字段扩展；dev login 复用既有 `POST /auth/sync`
- User 模型加 `provider` 与 `provider_id` 列以承载多身份来源；微信身份不与已有邮箱账户自动合并
- 小程序服务端状态默认使用 Zustand + thunk；service 边界向 Web 的 React Query 概念对齐，RQ 仅作后续可选优化
- 同时支持微信登录与开发态登录
- 发布范围目标是首版全量功能追平
- 实现必须拆成多个结构化子计划执行，而不是单次大杂烩式开发
