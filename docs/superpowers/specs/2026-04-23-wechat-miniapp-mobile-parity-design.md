# 微信小程序移动端页面对齐设计稿

日期：2026-04-23
状态：待用户确认后进入实现计划
范围：仅覆盖 `wechat-miniapp` 当前已有页面
执行分支：直接在当前分支上修改，不创建 worktree

## 一、目标

将 `wechat-miniapp` 当前所有已有页面，在视觉、布局、信息层级和交互语义上，尽可能与 `frontend` 现有 mobile 版本保持一致。

这次工作的本质不是新增功能，也不是后端改造，而是一次小程序端的产品外观与页面结构统一工程。目标是让用户在小程序中感受到的产品，与移动端 web 版本是同一套设计语言、同一套页面骨架、同一套交互决策路径。

在微信小程序能力受限的地方，允许做等效替代，但不允许随意改动信息架构和页面语义。

## 二、非目标

本次工作不包含以下内容：

- 不为追 web 页面而新增小程序路由
- 不重构后端 API
- 不修改业务规则或权限模型
- 不做与页面对齐无关的功能开发
- 不在实现过程中每完成一页就停下来做完整逐页测试

## 三、明确执行规则

根据用户要求，本次工作采用以下执行方式：

- 不新建 worktree
- 直接在当前分支上修改
- 先完成共享骨架和全部页面对齐
- 所有页面完成后，再逐页进行测试和验收

测试策略约束如下：

- 实现过程中不按“每页完成一次就立即完整测试”的方式推进
- 优先完成整体视觉与结构复刻
- 全部页面调整完成后，再进行逐页测试
- 仅在开发被阻塞时，允许做最小必要的构建或运行检查

## 四、参考来源

本次对齐的主要参照物为：

- `frontend/app/[locale]/dashboard/*`
- `frontend/app/[locale]/login/page.tsx`
- `frontend/app/[locale]/onboarding/page.tsx`
- `frontend/app/[locale]/invite/page.tsx`

视觉参考优先级如下：

1. mobile 页面整体布局
2. 卡片层级与间距节奏
3. 顶部栏与底部导航结构
4. 字体大小、字重、密度
5. 操作路径和按钮语义

## 五、目标页面范围

本次需要对齐的小程序现有页面共 15 个：

- `dashboard`
- `wardrobe`
- `suggest`
- `outfits`
- `history`
- `analytics`
- `settings`
- `family`
- `family-feed`
- `notifications`
- `learning`
- `login`
- `onboarding`
- `invite`
- `pairings`

## 六、页面映射关系

### 1. 直接对应页面

- `wechat-miniapp/src/pages/dashboard/index.tsx`
  对齐 `frontend/app/[locale]/dashboard/page.tsx`
- `wechat-miniapp/src/pages/wardrobe/index.tsx`
  对齐 `frontend/app/[locale]/dashboard/wardrobe/page.tsx`
- `wechat-miniapp/src/pages/suggest/index.tsx`
  对齐 `frontend/app/[locale]/dashboard/suggest/page.tsx`
- `wechat-miniapp/src/pages/outfits/index.tsx`
  对齐 `frontend/app/[locale]/dashboard/outfits/page.tsx`
- `wechat-miniapp/src/pages/history/index.tsx`
  对齐 `frontend/app/[locale]/dashboard/history/page.tsx`
- `wechat-miniapp/src/pages/analytics/index.tsx`
  对齐 `frontend/app/[locale]/dashboard/analytics/page.tsx`
- `wechat-miniapp/src/pages/settings/index.tsx`
  对齐 `frontend/app/[locale]/dashboard/settings/page.tsx`
- `wechat-miniapp/src/pages/family/index.tsx`
  对齐 `frontend/app/[locale]/dashboard/family/page.tsx`
- `wechat-miniapp/src/pages/family-feed/index.tsx`
  对齐 `frontend/app/[locale]/dashboard/family/feed/page.tsx`
- `wechat-miniapp/src/pages/notifications/index.tsx`
  对齐 `frontend/app/[locale]/dashboard/notifications/page.tsx`
- `wechat-miniapp/src/pages/learning/index.tsx`
  对齐 `frontend/app/[locale]/dashboard/learning/page.tsx`
- `wechat-miniapp/src/pages/login/index.tsx`
  对齐 `frontend/app/[locale]/login/page.tsx`
- `wechat-miniapp/src/pages/onboarding/index.tsx`
  对齐 `frontend/app/[locale]/onboarding/page.tsx`
- `wechat-miniapp/src/pages/invite/index.tsx`
  对齐 `frontend/app/[locale]/invite/page.tsx`
- `wechat-miniapp/src/pages/pairings/index.tsx`
  对齐 `frontend/app/[locale]/dashboard/pairings/page.tsx`

### 2. 允许等效替代的 web 页面能力

`frontend` 中存在一些并未在当前小程序中独立成页的能力，例如：

- `outfits/[id]`
- `outfits/new`

这些能力本次不通过新增小程序路由来实现，而是在现有页面内用以下方式等效承接：

- 页面内详情态
- 底部弹层
- 局部展开面板
- 现有页面内部的新增/编辑流程

## 七、核心设计原则

### 1. 同一产品，不是两个风格版本

小程序不能继续表现成一个“功能接近但视觉独立”的版本，而必须与 mobile web 在气质和结构上属于同一产品。

### 2. 接近像素级复刻

目标不是“差不多像”，而是尽量接近像素级复刻，重点包括：

- 页面整体布局
- 上下左右留白
- 卡片尺寸和圆角
- 标题层级和说明文字位置
- 图标尺寸和密度
- 顶部栏与底部导航

### 3. 小程序限制下的等效替代

当 web 使用的原语在小程序中无法直接复刻时，替代方案必须保持以下不变：

- 信息优先级
- 用户决策路径
- 操作按钮主次关系
- 内容显隐逻辑

### 4. 先统一骨架，再逐页细化

不能先零散地一页页堆样式。必须先把共享骨架做准，再把 15 个页面逐页贴齐。

## 八、共享骨架设计

这是第一阶段，也是整个项目的视觉基线。

### 1. 顶部栏

小程序顶部栏需要尽可能对齐 web mobile 版本的结构，包括：

- 左侧菜单按钮或等效占位
- 中部语言切换区域
- 主题切换按钮
- 用户头像
- 退出入口
- 深色背景与边框分隔

即便小程序不能完整复刻 web 的 dropdown 行为，顶部栏的布局、控制项顺序和视觉密度也必须保持一致。

### 2. 页面内容骨架

当前小程序使用的是偏浅色、工具型的壳层，需要整体替换为和 web mobile 一致的深色页面骨架。

统一规则：

- 深色背景
- 移动端内容宽度节奏一致
- 页面区块纵向间距一致
- 标题和副标题字阶一致
- 卡片区块之间的留白一致
- 底部安全区和 tab bar 之间的空间一致

### 3. 底部导航

底部导航需要对齐 web mobile 版的：

- 图标顺序
- 文案顺序
- 激活态/未激活态
- 边框和背景
- 点击区域与间距

同时保留微信小程序 tab 页导航的正确行为。

### 4. 共享组件体系

需要抽成可复用的小程序组件或统一样式模式的内容包括：

- 页面壳层
- 区块卡片
- 统计卡片
- 主按钮 / 次按钮 / 描边按钮
- badge
- 空状态
- 骨架屏
- 列表项
- 头像与占位头像
- 表单行
- 分段选择或等效切换结构
- 详情底部弹层或局部展开面板

## 九、页面分批实施

### 第一批：决定整体视觉系统的核心页面

- `dashboard`
- `wardrobe`
- `suggest`
- `outfits`
- `history`
- `analytics`
- `settings`

这批页面会定义：

- 共享骨架
- 列表和卡片风格
- 筛选和表单风格
- 统计区块风格
- 主要按钮与次要按钮风格

### 第二批：铺开与补齐页面

- `family`
- `family-feed`
- `notifications`
- `learning`
- `login`
- `onboarding`
- `invite`
- `pairings`

这批页面基于第一批沉淀出的组件和视觉系统继续对齐，重点解决：

- 头像与成员卡片
- 邀请与状态流
- 通知配置复杂表单
- 学习洞察类信息块
- 登录与引导流程

## 十、交互对齐规则

### 必须严格对齐的内容

- 主按钮位置
- 空状态的主引导动作
- 卡片顺序
- 页面入口层级
- 接受/拒绝类操作的主次关系
- tab 页的导航方式与视觉激活态

### 允许等效替代的内容

- Web Dialog -> 小程序底部弹层 / 局部展开区 / 次级页
- Web Dropdown -> Picker / ActionSheet / 简化选择器
- Hover 态 -> 点击态 / 激活态
- Web route detail -> 页面内详情态

## 十一、实现边界

### 允许修改

- 页面布局
- 组件结构
- 间距和字体
- 图标和视觉层级
- 页面内交互呈现方式
- 页面顺序和区块编排

### 不应随意修改

- API 合同
- 后端持久化逻辑
- 业务规则
- 授权和登录模型
- 与本次页面复刻无关的数据流

## 十二、主要风险

### 1. 共享骨架漂移

如果不先做共享层，而是直接逐页拼接样式，后面会出现页面之间风格不一致，返工成本很高。

### 2. Web 交互强行照搬

某些 web 交互直接搬到小程序会不自然或不稳定，必须优先保证结果等效，而不是机械复刻实现方式。

### 3. 范围膨胀

如果为了追求 100% 页面结构一致而新增很多小程序路由，会超出当前“仅对齐已有页面”的范围。

## 十三、验证策略

根据本次约束，验证安排在全部实现完成之后进行。

最终验证顺序：

1. 完成共享骨架和全部页面对齐
2. 成功构建小程序
3. 按 15 个页面逐页对照 `frontend` mobile 版本检查
4. 逐页验证主要交互是否可用
5. 检查页面之间是否还有风格断层

本项目明确不采用“每完成一页就停下来做完整逐页测试”的方式。

## 十四、验收标准

满足以下条件即可视为完成：

- 小程序现有 15 个页面全部与 `frontend` mobile 页面完成对齐
- 共享顶部栏、底部导航、卡片体系、按钮体系、空状态和骨架风格统一
- `dashboard` 页面达到接近像素级复刻，并成为全站视觉基线
- 其他页面不再呈现出与 web 完全不同的设计语言
- 小程序能力限制下的替代方案保持与 web 一致的页面语义和操作路径
- 全部实现完成后，能够按页面逐个进行最终测试和验收
