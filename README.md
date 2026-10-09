# GitDist - GitHub 应用更新分发平台

轻量级、高可用的 **GitHub 联动客户端更新分发管理系统**。支持多应用接入、GitHub Webhook 实时触发、Release 自动同步、灰度分发、强制更新控制、国内下载镜像加速、SHA256 防篡改校验以及多语言客户端对接 SDK。

---

## 🌟 核心功能特性

1. **GitHub 全自动联动**：
   - 配置 GitHub Webhook 后，只要你在 GitHub 仓库发版（Release Published），平台秒级自动捕获、提取 Release Assets 安装包并计算校验值。
   - 支持多平台自动归类识别（Windows x64/x86、macOS ARM64/Intel、Linux 等）。
   - 支持读取 `checksums.txt` / `SHA256SUMS` / `*.sha256` 自动关联文件哈希防篡改。
   - 一键手动同步按钮：即使未配置 Webhook，也能随时拉取 GitHub 历史与最新版本。

2. **现代化 Web 管理后台 (UI 界面)**：
   - **应用多租户管理**：支持管理多个桌面端或服务端程序。
   - **发版策略实时调控**：
     - 一键停用 / 恢复版本分发。
     - **强制升级**（Mandatory）开关：开启后客户端提示必须升级才能继续运行。
     - **灰度发布**（0% ~ 100% 滑块）：按客户端机器标识哈希散列，支持平滑灰度上线。
   - **国内下载加速引擎**：内置 GHFast、GHProxy 等加速代理，客户端下载不再超时。
   - **在线 API 模拟测试器**：可在浏览器直接输入版本号、平台模拟客户端检测，实时查看返回结果。
   - **集成 SDK 代码生成器**：支持一键复制 Python、Node.js / Electron、Go、C# / .NET 客户端完整更新脚本。

3. **高性能分发 API**：
   - `GET /api/v1/update/check`：客户端更新检测接口（支持渠道、平台、SemVer 版本智能比对、灰度过滤）。
   - `GET /api/v1/update/download/:assetId`：加速下载重定向与分发量统计。
   - `POST /api/webhook/github/:appId`：GitHub Webhook 自动化回调接入。

---

## 🌐 云端生产部署信息

* **云端公网访问地址**：**http://103.231.59.78:3000**
* **后台管理员账号**：`admin`
* **后台默认初始密码**：`admin123` （登录后右上角可随时修改）
* **已接入应用**：`wk` (网课平台，关联仓库 `2839273551/SkyLearn`，共 17 个版本已同步)
* **后端数据库**：服务器本地 MySQL 5.7 (数据库 `gitdist`)
* **进程守护**：PM2 (`pm2 status` / `pm2 logs gitdist` / `pm2 restart gitdist`)，已配置开机自启
* **项目部署目录**：`/www/wwwroot/gitdist`

---

## 🚀 启动与运维命令

```bash
# 查看云端运行状态
pm2 status

# 查看实时日志
pm2 logs gitdist

# 重启更新服务
pm2 restart gitdist
```

---

## 📖 使用指南

### 第一步：在后台接入你的应用
1. 打开 **http://103.231.59.78:3000**，输入账号密码登录。
2. 可以在左侧查看已接入的应用 `wk`，或点击右上角 **「接入新应用」**。

### 第二步：配置 GitHub Webhook
1. 在管理后台点击 **「Webhook 配置指引」**，一键复制专属的 **Payload URL** (`http://103.231.59.78:3000/api/webhook/github/wk`) 与 **Secret 密钥**。
2. 打开 GitHub 仓库设置：`https://github.com/2839273551/SkyLearn/settings/hooks`。
3. 点击 **Add webhook**：
   - **Payload URL**：`http://103.231.59.78:3000/api/webhook/github/wk`
   - **Content type**：选择 `application/json`
   - **Secret**：粘贴后台给出的 Secret 签名密钥
   - **Which events**：选择 `Let me select individual events` -> 勾选 **Releases**
4. 点击 **Add webhook** 保存！以后发版全自动推送到云端服务！

### 第三步：客户端程序接入

向云端发起更新检测请求：
```http
GET http://103.231.59.78:3000/api/v1/update/check?app_id=wk&version=8.5.0&platform=universal
```

示例 Python / Node.js 客户端代码见 `examples/` 目录。
    print(f"发现新版本: {resp['latest_version']}")
    print(f"下载链接: {resp['asset']['download_url']}")
    # 2. 下载安装包 -> 校验 SHA256 -> 启动安装并重启程序
```

更多语言（Node.js / Electron、Go、C#、Windows 批处理）示例代码已内置在 `examples/` 目录下及网页控制台内。

---

## 🛠️ 项目目录结构

```text
├── server/
│   ├── index.js             # Express 入口服务与路由整合
│   ├── config.js            # 端口与加速代理配置
│   ├── db/                  # SQLite 数据库与持久化建表
│   ├── services/
│   │   ├── appService.js    # 应用管理与统计
│   │   ├── releaseService.js# 版本对比算法、灰度策略、资产管理
│   │   ├── semver.js        # 语义化版本解析与平台识别
│   │   └── github.js        # GitHub Webhook 验签与 Release 抓取
│   └── routes/              # API 路由 (Client API, Admin API, Webhook, Snippets)
├── client/                  # 现代化 React + Tailwind 控制台源码
├── public/                  # 编译后静态前端资源 (开箱即用直接托管)
├── examples/                # 各语言客户端完整自更新对接脚本
└── data/                    # SQLite 数据库持久化存储目录
```
