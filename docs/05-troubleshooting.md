# 05 · 实战踩坑对照表

全部来自真实项目（原生小程序 + 微信云开发）上线过程，按"出现频率 × 浪费时间"排序。

## 云开发

| 症状 | 根因 | 修法 |
|---|---|---|
| 数据库 update 报 `-502001 collection update fail` | 更新数据带了 `_id` / `_openid`（不可更新字段） | 服务端/客户端都 `delete data._id; delete data._openid;` 再 update；服务端 try/catch 把 `e.errMsg` 返回给客户端 |
| `Env Not Exists [100003]` | config 里 envId 抄错一个字母 | 从云开发控制台复制完整环境 ID；`wx.cloud.init({ env })` 与云函数 `DYNAMIC_CURRENT_ENV` 分开确认 |
| 云函数日志查不到历史 | 日志服务默认关闭 | 云开发控制台 → 云函数 → 日志 → 开启；**只采开启后的新日志** |
| 编辑保存"没反应" | 服务端抛错、客户端没 catch | 客户端 `.catch` + `wx.showLoading` + 失败 toast 返回 `errMsg`；服务端所有分支都 return 结构化结果 |
| 人人都是管理员 | `ADMIN_OPENIDS` 为空 = 引导模式 | 私测可用；正式发布前在云函数「版本与配置 → 环境变量」配置白名单后重新部署 |
| 内容审核 `87014` | msgSecCheck 命中敏感词 | 提示用户改文案；服务端对 openapi 异常单独放行并 console.warn 留痕 |

## 工程与打包

| 症状 | 根因 | 修法 |
|---|---|---|
| 上传失败：代码包超 2MB | demo/品牌图/工具脚本被一起打包 | `project.config.json` → `packOptions.ignore` 排除 `demo`、`tools`、`node_modules`、`assets/brand`、文档文件 |
| 排除后又超 | 中途新装了 `node_modules`（如 automator 装进 tools/） | 每次上传前看 CLI 输出的体积表；新目录默认进 ignore |
| 测试号 upload 报无权限 | touristappid 不能上传 | 换正式 AppID |
| 照片存了临时路径，重启丢失 | `wx.chooseMedia` 的 tempFilePath 直接入库 | 走 `wx.cloud.uploadFile` 存云存储，库里存 fileID |

## 工具链（CLI / automator / a11y）

| 症状 | 根因 | 修法 |
|---|---|---|
| 所有 CLI 命令失败 | 服务端口未开 | 设置 → 安全设置 → 服务端口 |
| CLI 卡住无输出 | IDE 被弹窗挡住（版本更新/登录/授权） | a11y 树看窗口 → 点「稍后再说/确定」→ 重跑 |
| automator connect ECONNREFUSED | `cli auto` 没跑或端口不对 | `lsof -nP -i :9421` 核对；重启 `cli auto` |
| evaluate 引用外部变量报 undefined | evaluate 的函数被序列化到另一上下文执行 | 需要的数据用 `evaluate(fn, ...args)` 传参，不能闭包捕获 |
| evaluate 里异步直接抛错拿不到信息 | promise reject 穿透 | 函数体包 `new Promise(resolve => x.then(r=>resolve(r.result)).catch(e=>resolve({__err}))` |
| a11y 点击报 frame stale | 界面在 observe 之后变了 | 重新 observe 拿新 state_id 再 act；不要按旧坐标盲试 |
| 命令行没装 automator | 项目 node_modules 没有 | `cd tools && npm i miniprogram-automator`；tools/ 进 packOptions.ignore |

## 流程提醒

- **部署 ≠ 生效感知**：云函数部署是即时的，但用户/体验版打没打到新版本要靠调用验证（automator 跑一次），
  不要凭"我部署过了"下结论。
- **版本描述写清楚**：`upload -d` 会进后台版本列表，是回溯"哪版修了什么"的唯一线索。
- **一次只改一个变量再验证**：改代码 → 部署 → automator 复现 → 看返回值，闭环后再动下一处。
