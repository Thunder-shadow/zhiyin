# 职引·AI求职策略教练 — 设计指南

## 品牌定位
- 应用定位：大学生的 24 小时 AI 求职私教，把求职变成可攻略的策略游戏
- 设计风格：RPG 游戏化 + 专业清晰，策略与热血并存
- 目标用户：大学生求职群体

## 配色方案
| 用途 | 色值 | Tailwind 类名 |
|------|------|---------------|
| 主色（深蓝策略） | #1A2B4C | `bg-[#1A2B4C]` / `text-[#1A2B4C]` |
| 辅助色（活力橙） | #FF6B35 | `bg-[#FF6B35]` / `text-[#FF6B35]` |
| 页面背景 | #F5F7FA | `bg-[#F5F7FA]` |
| 卡片/面板 | #FFFFFF | `bg-white` |
| 文字主色 | #1A2B4C | `text-[#1A2B4C]` |
| 文字辅色 | #6B7280 | `text-gray-500` |
| 成功/通过 | #10B981 | `text-emerald-500` |
| 失败/警告 | #EF4444 | `text-red-500` |
| 经验条渐变 | #FF6B35 → #FFB347 | 渐变样式 |

## 字体规范
- 标题 H1: text-xl font-bold
- 标题 H2: text-lg font-semibold
- 正文: text-sm / text-base
- 数据/分数: font-mono tabular-nums

## 间距系统
- 页面边距: px-4
- 卡片内边距: p-4
- 组件间距: gap-3 / gap-4
- 卡片圆角: rounded-xl
- 按钮圆角: rounded-lg

## 组件使用原则
- 通用 UI 组件（Button / Input / Card / Badge / Dialog / Tabs / Toast / Progress / Skeleton 等）优先使用 `@/components/ui/*`
- 页面布局容器使用 `@tarojs/components` 的 View/Text
- 图标使用 `lucide-react-taro`，用 color/size 属性控制样式

## 导航结构
- TabBar: 驾驶舱(首页) | 副本大厅 | 训练场 | 我的
- 主色: #1A2B4C, 选中色: #FF6B35
- 页面跳转: TabBar 页用 switchTab()，普通页用 navigateTo()

## 状态展示
- 空状态：趣味引导文案 + 图标（lucide-react-taro）
- 加载态：Skeleton 骨架屏
- 经验条动画：Progress 组件 + 数字跳动

## 小程序约束
- 静态资源走 TOS 对象存储（TabBar 图标除外）
- 禁止硬编码 px 值
- 跨端兼容：H5/微信/抖音
