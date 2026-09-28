# 03 · 开发者工具 CLI 速查

CLI 路径：`/Applications/wechatwebdevtools.app/Contents/MacOS/cli`（下文简写 `$CLI`）。
所有 `--project` 指向小程序项目根目录（含 `project.config.json`）。

## 会话控制

```bash
$CLI open --project <p>                          # 打开项目
$CLI auto --project <p> --auto-port 9421         # 启动自动化端口（automator 用）
$CLI quit                                        # 退出 IDE
```

## 上传 / 预览

```bash
# 体验版（semver + 描述，后台版本列表可见）
$CLI upload --project <p> -v 0.4.0 -d "修复xxx"

# 真机预览：二维码落盘，绝不截屏识别
$CLI preview --project <p> --qr-format image --qr-output ./preview-qr.png
```

上传成功输出含代码包体积表；超 2MB 会直接失败 → `packOptions.ignore`。

## 云函数

```bash
# 部署（云端装依赖，函数目录需含 package.json 声明 wx-server-sdk）
$CLI cloud functions deploy --project <p> --env <envId> --names submitSpot --remote-npm-install

# 多个函数：--names a,b,c   （也可以分次跑，失败好定位）
# 云端装依赖失败时退路：IDE 左侧云函数目录右键 → 上传并部署：云端安装依赖
```

部署后验证不要靠界面：直接 automator 调一次该函数（见 04）。

## 诊断

```bash
lsof -nP -i :36354    # IDE 服务端口（CLI 底座）
lsof -nP -i :9421     # automator 端口
$CLI islogin          # 登录态检查（部分版本支持）
```

## 常见报错

| 报错 | 原因 | 处理 |
|---|---|---|
| 需要打开服务端口 | 安全设置未开 | 设置 → 安全设置 → 服务端口 |
| IDE server has started, listening on http://127.0.0.1:36354 | 正常输出，非报错 | — |
| 卡在 `- Upload` 不动 | 多半被弹窗挡住 | a11y 树看窗口，处理弹窗重跑 |
| Using AppID: touristappid | 项目配了测试号 | `project.config.json` 换正式 AppID |
