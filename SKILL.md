---
name: wechat-devtools
description: 用微信开发者工具 CLI + miniprogram-automator 以确定性方式开发/调试/部署微信小程序与云开发项目，避免滥用截屏点击。Use when developing, debugging, deploying, or uploading WeChat mini programs (微信小程序), cloud functions (云函数), or using WeChat DevTools (微信开发者工具) from a coding agent.
---

# 微信开发者工具 · 代理工作模式

目标：全程用「确定性通道」完成开发-验证-发布闭环；截图只留给真正的视觉产物与无可替代的场景。

## 通道优先级（先读这个）

1. **L0 文件**：代码与配置直接读写。
2. **L1 CLI**：`/Applications/wechatwebdevtools.app/Contents/MacOS/cli`（macOS）。
   - `open` / `auto --auto-port 9421` / `upload -v x.y.z -d desc` / `preview --qr-output xx.png`
   - `cloud functions deploy --env <envId> --names <fn> --remote-npm-install`
3. **L2 automator**：`automator.connect({wsEndpoint:'ws://127.0.0.1:9421'})`，
   `mini.evaluate(fn, ...args)` 在 AppService 上下文执行 —— `wx.cloud.callFunction`、
   `wx.getStorageSync`、`wx.reLaunch` 都可用；`mini.screenshot({path})` 可截模拟器画面。
4. **L3 a11y 树**：DevTools / 云开发控制台是 Electron 窗口，优先用 element target（后台安全，不抢焦点）。
5. **L4 截图**：仅当目标是纯视觉（图表形状、自绘弹窗、真机）或上层全部拿不到信息时。

排障顺序：**返回 errMsg → 云函数日志（需先在云开发控制台开启日志服务）→ a11y 树 → 截图**。

## 标准循环

1. 健康检查：`lsof -nP -i :36354`（CLI 服务端口）、`lsof -nP -i :9421`（automator）。
2. `cli open --project <p>`；`cli auto --project <p> --auto-port 9421`。
3. 改代码（L0）→ 云函数变了就 CLI 部署 → 用 automator evaluate 写复现脚本验证（L2）。
4. 发布：`cli upload -v <semver> -d <desc>`；真机：`cli preview --qr-format image --qr-output qr.png`。
5. CLI 无输出挂起 >60s → 大概率被弹窗挡住（版本更新/登录/授权）→ 转 L3 观察并处理弹窗。

## 铁律

- **绝不**截屏读文字/按钮——先 a11y 树拿 element target（后台安全）。
- **绝不**截屏读二维码——CLI `--qr-output` 落盘。
- 数据/报错永远从返回值和日志拿，不从像素拿。
- 「frame stale / 元素 mismatched」= 界面变了：重新 observe 一次再 act，不要盲试坐标。
- 上传超 2MB → `project.config.json` 的 `packOptions.ignore` 排除 demo/tools/node_modules/brand。
- 云数据库 update 报 502001 → 更新数据里带了 `_id`/`_openid`，剥掉再 update。
- 正式发布前：云函数配置 `ADMIN_OPENIDS` 环境变量收紧管理员权限（空 = 引导模式人人是管理员）。

详见 docs/ 与 tools/ 示例。
