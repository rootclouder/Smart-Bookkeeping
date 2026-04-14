# 登录功能实现计划

## 1. 目标
为“智慧财务管理”系统增加用户账户与登录体系，支持“微信扫码登录”与“游客登录”。满足以下核心需求：
- **微信登录**：通过微信开放平台授权登录，用户的记账数据自动同步保存在云端（PostgreSQL）。
- **游客登录**：数据仅保存在本地浏览器（localStorage），不上云。
- **完全隔离**：游客状态下的数据与微信登录后的数据完全隔离，互不影响、互不合并。

## 2. 当前状态分析
- 状态管理使用 `Zustand` 配合 `persist` 中间件进行持久化。
- 目前通过自定义的 `postgresStorage` 同步数据到本地和云端。
- 云端数据库中仅有一个 `AppStateSync` 模型，并通过硬编码的 `id = 'default'` 记录保存所有数据（即目前的单机/单用户模式）。
- 没有用户鉴权与身份识别机制。

## 3. 拟定变更

### 3.1 依赖安装
- 安装 NextAuth 核心库：`next-auth`
- 安装 Prisma 适配器：`@next-auth/prisma-adapter`

### 3.2 数据库结构更新 (`prisma/schema.prisma`)
引入 NextAuth 的标准用户模型，并将业务数据表与用户建立一对一关联。
- 增加 `User`, `Account`, `Session`, `VerificationToken` 模型。
- 改造 `AppStateSync` 模型：
  - 移除硬编码的 `id`，新增 `userId` 字段作为外键关联到 `User` 模型。
  - 确保每个用户在云端有一份独立的财务状态数据。

### 3.3 鉴权接口配置 (`src/app/api/auth/[...nextauth]/route.ts`)
- 配置 NextAuth，引入 `PrismaAdapter` 以连接数据库。
- 引入内置的 `WechatProvider`，对接微信开放平台（扫码登录），通过环境变量 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET` 进行配置。
- 暴露 `authOptions` 供服务端组件和 Server Actions 获取当前登录用户的 Session。

### 3.4 服务端同步逻辑重构 (`src/actions/finance.ts`)
重构现有的服务端同步方法，使其具备“用户意识”：
- `fetchInitialData()`:
  - 解析当前请求的 Session。
  - **无 Session（游客）**：直接返回 `{ isLoggedIn: false }`，不查库。
  - **有 Session（微信登录）**：根据 `session.user.id` 专属查询 `AppStateSync`，返回 `{ isLoggedIn: true, userId, state }`。
- `syncStateToDb(state)`:
  - 同样校验 Session。无 Session 则拒绝写入云端。
  - 有 Session 则通过 `upsert` 将状态树存入对应 `userId` 的 `AppStateSync` 记录中。

### 3.5 状态存储双轨隔离 (`src/store/useStore.ts`)
升级 Zustand 的 `postgresStorage` 中间件读写逻辑，实现数据环境的完全隔离：
- **获取数据 (`getItem`)**：
  - 调用 `fetchInitialData()` 获取云端状态和鉴权信息。
  - **若是游客**：读取并返回 `localStorage.getItem('finance-store-guest')`。
  - **若是登录用户**：优先返回云端拉取的数据。若离线，则回退读取专属的本地缓存 `localStorage.getItem('finance-store-user-{userId}')`。
- **保存数据 (`setItem`)**：
  - 调用 `syncStateToDb(state)` 尝试同步至云端，并获取鉴权返回结果。
  - **若是游客**：将数据存入 `finance-store-guest`。
  - **若是登录用户**：将数据存入专属本地缓存 `finance-store-user-{userId}`。

### 3.6 用户界面交互更新
- **全局布局 (`src/app/ClientLayout.tsx`)**:
  - 在侧边栏和移动端导航栏增加一个用户区域。
  - 未登录时显示“未登录 / 游客”，点击可打开登录弹窗。
  - 登录后显示微信头像、昵称，并提供“退出登录”按钮。
  - *注：切换登录状态时强制刷新页面或重置 Zustand Store，以确保内存中的数据完成隔离切换。*
- **登录弹窗组件 (`src/components/LoginModal.tsx`)**:
  - 创建新的弹窗组件，包含明确的两个操作按钮：
    1. **微信扫码登录**：调用 `signIn('wechat')` 发起 OAuth 授权流程。
    2. **以游客身份继续**：关闭弹窗，默认处于本地记账模式。

## 4. 假设与决定
- **微信开放平台**：采用 NextAuth 内置的 `WechatProvider`，适用于 PC 端网页扫码登录。需在后续配置对应的环境变量。
- **数据隔离策略**：遵循用户的“完全隔离”意图。使用不同的 localStorage 键名以及云端的 userId 强隔离，无论何时切换账号，数据都不会发生任何交集和覆盖。
- **数据库迁移**：由于引入了新的外键约束并改变了数据表结构，需在部署时执行 `npx prisma db push` 进行数据库结构的同步更新。

## 5. 验证步骤
1. 安装依赖并应用 Prisma 数据库更新。
2. 配置好基础的微信环境变量或使用测试账号登录。
3. **测试游客模式**：不登录时记账，刷新页面数据保留（存在 `finance-store-guest` 中）。
4. **测试登录模式**：点击微信登录，授权回调后，应用呈现全新的空白账本（无之前游客数据），记账后刷新页面，数据从云端恢复。
5. **测试退出登录**：退出登录后，重新读取 `finance-store-guest`，恢复之前的游客账本。