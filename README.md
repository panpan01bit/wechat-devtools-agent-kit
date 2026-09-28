# wechat-devtools-agent-kit

让 AI 编码代理（ZCode / Claude Code 等）用「确定性通道」驱动微信开发者工具的实战 kit：
**CLI + miniprogram-automator 干活，能不看屏幕就不看屏幕**；并给出「什么时候必须截图看电脑页面」的判定清单。

来源：一个真实小程序项目（原生小程序 + 微信云开发）从 0 到体验版上线的完整代理协作过程，所有命令与坑均为实战验证。

## 通道分层（核心思想）

| 层 | 通道 | 干什么 | 要看屏幕吗 |
|---|---|---|---|
| L0 | 直接读写文件 | 代码、`project.config.json`、云函数源码 | ❌ |
| L1 | 开发者工具 CLI | 编译、上传体验版、真机预览、部署云函数 | ❌（二维码落盘） |
| L2 | miniprogram-automator | 在小程序上下文执行 `wx.*`、调云函数、页面导航、**模拟器截图** | ❌ |
| L3 | 无障碍树（get_app_state） | DevTools / 云开发控制台的原生 UI：弹窗、按钮 | ❌（无像素） |
| L4 | 桌面截图 + 局部放大 | 纯视觉产物、自绘弹窗、真机表现 | ✅ 唯一必须 |

**规则：信息优先从低层通道拿；当前层拿不到（报错拿不到细节、元素 stale、纯视觉）才升一层。**
排障顺序永远是：返回值 `errMsg` → 云函数日志 → a11y 树 → 截图。

## 快速开始

```bash
# 0) 前置：开发者工具 设置 → 安全设置 → 开启服务端口（CLI 依赖，一次即可）

# 1) 打开项目 + 启动自动化端口
cli open  --project /path/to/miniprogram
cli auto  --project /path/to/miniprogram --auto-port 9421

# 2) 在小程序上下文里干活（调云函数 / 读数据 / 复现 bug）
cd tools && npm i
node -e "require('./wx').callCloud('getSpots',{status:'published'}).then(console.log)"

# 3) 发布
tools/devtools.sh upload 0.4.0 "修复xxx"          # 体验版
tools/devtools.sh preview                          # 真机预览二维码 → preview-qr.png
tools/devtools.sh deploy-fn submitSpot <envId>     # 部署云函数
```

## 目录

- [SKILL.md](SKILL.md) — 给代理的技能指令（可直接放进 skills 目录）
- [docs/01-workflow.md](docs/01-workflow.md) — 工作模式流：标准循环、健康检查、通道升级
- [docs/02-when-to-screenshot.md](docs/02-when-to-screenshot.md) — **什么时候必须截图**（判定清单 + 反模式）
- [docs/03-cli-reference.md](docs/03-cli-reference.md) — CLI 命令速查
- [docs/04-automator-cookbook.md](docs/04-automator-cookbook.md) — automator 代码片段（调云函数、复现、截图）
- [docs/05-troubleshooting.md](docs/05-troubleshooting.md) — 实战踩坑对照表（502001、2MB 超包、端口未开…）
- [tools/](tools/) — 连接封装、复现脚本模板、CLI 包装脚本

## License

MIT
