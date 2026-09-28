# 01 · 工作模式流

一次会话的标准循环。示例均为 macOS 路径；Windows 把 CLI 路径换成安装目录下的 `cli.bat`。

## 0. 前置（一次性）

1. 开发者工具 → 设置 → 安全设置 → **开启服务端口**（不开则所有 CLI 命令报错）。
2. 项目用**正式 AppID**（测试号不能 `upload`，只能预览）。
3. `project.config.json` 里配好 `packOptions.ignore`（见 05 踩坑表）。

## 1. 健康检查（每次会话开始）

```bash
lsof -nP -i :36354   # IDE HTTP 服务端口：CLI 的底座，由 CLI 自动拉起
lsof -nP -i :9421    # automator WebSocket 端口：`cli auto` 拉起
```

- 36354 没起来 → 跑一次任意 CLI 命令（如 `cli open`），或服务端口没开。
- 9421 没起来 → `cli auto --project <p> --auto-port 9421`。
- 端口被占 → 换一个端口，automator 连接时同步改 wsEndpoint。

## 2. 通道升级链（拿不到信息才升级）

```
L0 文件 ──→ L1 CLI ──→ L2 automator ──→ L3 a11y树 ──→ L4 截图
   代码/配置    编译/上传/预览    小程序上下文执行    DevTools原生UI    纯视觉/真机
                部署云函数        调云函数/读数据     弹窗/菜单        图表/自绘弹窗
```

升级信号举例：

| 信号 | 判定 | 动作 |
|---|---|---|
| CLI 挂起 >60s 无输出 | 多半被弹窗挡住（版本更新/登录/授权） | L3 观察窗口，处理弹窗后重跑 |
| automator `connect` ECONNREFUSED | `cli auto` 没起，或 IDE 被弹窗挡住没进项目 | 先查弹窗再 `cli auto` |
| a11y 返回 stale / 元素找不到 | 界面变了或自绘控件 | 重新 observe；仍无 → L4 截图 |
| 任务本身是"好不好看" | 视觉验证 | `mini.screenshot()`（模拟器），不行再 L4 |

## 3. 开发-验证子循环

```bash
# 改代码（L0）……
# 云函数有改动：
cli cloud functions deploy --project <p> --env <envId> --names submitSpot --remote-npm-install

# 用 automator 复现/验证（L2）——把"用户会做的事"变成一段 evaluate：
node tools/repro-edit.js
```

复现脚本模板见 `tools/repro-edit.js`：取真实数据 → 原样调用云函数 → 打印返回 → 回读验证。
**排障时先看返回的 `errMsg` / 云函数日志，永远不要靠点 UI 猜。**

## 4. 发布子循环

```bash
cli upload --project <p> -v 0.4.0 -d "修复xxx；新增yyy"     # 体验版（后台生成对应二维码）
cli preview --project <p> --qr-format image --qr-output ./preview-qr.png   # 真机预览
```

版本号用 semver 递增；描述写清本次变更（后台版本列表会展示）。

## 5. 收尾

- 把本次踩的坑回写到 05-troubleshooting.md（kit 是活文档）。
- 临时复现脚本要么泛化进 tools/，要么删掉，不留一次性垃圾。
