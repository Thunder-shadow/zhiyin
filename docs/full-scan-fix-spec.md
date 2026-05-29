# 职引项目全面扫描与修复任务

## 任务目标
对职引项目进行全量代码扫描，修复所有前后端问题，删除无用代码，确保在微信小程序移动端完美运行。

## 项目信息
- **路径**: /root/zhiyin
- **分支**: main
- **技术栈**: Taro + React + TypeScript 前端 + NestJS 后端 + Supabase
- **包管理器**: pnpm（禁止使用 npm 或 yarn）
- **这是微信小程序**，必须考虑微信适配

## 开发规范（必须遵守）

### 命名规范
- 文件名: kebab-case
- 组件名: PascalCase
- 变量/函数: camelCase
- 常量: UPPER_SNAKE_CASE
- 类型/接口: PascalCase
- CSS 类名: Tailwind CSS

### 组件库
必须优先使用 `@/components/ui` 下的组件，禁止用 View/Text + Tailwind 手搓通用 UI 组件。

### Git 提交规范
使用 Commitlint: feat:, fix:, style:, refactor:, chore:

### 图片资源
必须使用 TOS 对象存储 URL，禁止打包大图片到项目中，仅 TabBar 图标允许本地 PNG。

## 任务清单

### 第一阶段：全面扫描
1. 扫描所有前端页面（src/pages/），检查：
   - 是否有未使用的 import
   - 是否有未使用的变量/函数/组件
   - 是否有 console.log 调试代码残留
   - 是否有硬编码的假数据（应该走 API）
   - 是否有 TODO/FIXME/HACK 注释未处理
   - 是否有重复代码可以抽取
   - 样式是否使用了 Tailwind 而非内联样式（微信小程序要求）
   - 是否有 PC 端专用代码（项目只做移动端）

2. 扫描后端（server/src/），检查：
   - 是否有未使用的 import
   - 是否有未使用的函数/服务
   - 是否有 console.log 调试代码残留
   - API 接口是否有完整的错误处理
   - 是否有硬编码的配置值

3. 扫描配置文件，检查：
   - app.config.ts 页面注册是否完整
   - 是否有未使用的页面配置文件
   - 是否有未使用的依赖包

### 第二阶段：修复问题
根据扫描结果，逐项修复：
1. 删除所有无用代码（import、变量、函数、文件）
2. 删除所有 console.log 调试代码
3. 将硬编码假数据改为 API 调用（如果后端有对应接口）
4. 处理 TODO/FIXME 注释
5. 抽取重复代码为公共函数/组件
6. 确保所有样式使用 Tailwind（微信小程序兼容）
7. 删除所有 PC 端专用代码

### 第三阶段：微信小程序适配检查
1. 检查所有页面是否使用 Taro 组件（View, Text, Image 等）
2. 检查是否有 Web-only API（window, document, localStorage 等）
3. 检查路由跳转是否使用 Taro API（navigateTo, switchTab 等）
4. 检查是否有不兼容微信小程序的 CSS 属性
5. 检查页面布局是否适配移动端（fixed header + scrollable middle + fixed bottom 模式）

### 第四阶段：代码质量提升
1. 确保所有函数有 TypeScript 类型标注
2. 确保错误处理完整
3. 确保 loading 状态正确处理
4. 确保空状态有友好提示

## 注意事项
- **不要 git commit**，改完代码就行，我会自己检查后提交
- **移动端优先**，忽略 PC 端
- **如果某个功能改不了，直接换方法重构**
- **保持代码整洁**，宁可删掉不用的代码，也不要留着
- **每个文件改完后确认没有 TypeScript 编译错误**

## 验证方式
改完后运行 `cd /root/zhiyin && pnpm build:weapp` 确认编译通过。
