# 04 · miniprogram-automator cookbook

安装：`npm i miniprogram-automator`（建议放项目 `tools/`，并加进 `packOptions.ignore`）。
前提：`cli auto --project <p> --auto-port 9421` 已跑，端口在听。

## 连接封装（tools/wx.js）

```js
const automator = require('miniprogram-automator');

async function withMini(fn, ws = 'ws://127.0.0.1:9421') {
  const mini = await automator.connect({ wsEndpoint: ws });
  try { return await fn(mini); } finally { await mini.disconnect().catch(() => {}); }
}

/** 在 AppService 上下文调云函数；resolve 而非 throw，方便脚本打印 */
function callCloud(name, data) {
  return withMini((mini) => mini.evaluate((n, d) => new Promise((resolve) => {
    wx.cloud.callFunction({ name: n, data: d })
      .then(r => resolve(r.result))
      .catch(e => resolve({ __err: e.errMsg || e.message, errCode: e.errCode }));
  }), name, data));
}

module.exports = { withMini, callCloud };
```

要点：
- `mini.evaluate(fn, ...args)` 的 `fn` 会被序列化到小程序上下文执行——**不能引用闭包外的变量**，
  要用参数传进去（可 JSON 序列化）。
- 里层永远包一层 `new Promise(resolve => …)`，失败也 `resolve({__err})`，
  否则 evaluate 直接 reject，拿不到 errMsg。

## 常用片段

```js
const { withMini } = require('./wx');

// 读数据（列表页加载了什么）
await withMini(m => m.evaluate(() => wx.getStorageSync('someKey')));

// 页面导航 + 取当前页栈
await withMini(async m => {
  await m.reLaunch('/pages/plan/plan');
  return m.pageStack();
});

// 页面内取组件/setData 状态
await withMini(async m => {
  const page = await m.currentPage();
  return page.data();                       // 页面 data
  // await page.waitFor(500);               // 等渲染
});

// 模拟器截图（视觉验收首选，代替桌面截屏）
await withMini(m => m.screenshot({ path: '/tmp/simulator.png' }));

// 操作页面元素（回归测试）
await withMini(async m => {
  const page = await m.currentPage();
  const btn = await page.$('.save-btn');
  await btn.tap();
});
```

## 复现脚本模板（排障标配）

```js
// tools/repro-edit.js —— 把"用户会做的事"变成确定性调用
const { withMini } = require('./wx');

(async () => {
  const out = await withMini(async (mini) => {
    // 1) 取一条真实数据（模拟表单加载）
    const got = await mini.evaluate(() => new Promise((resolve) => {
      wx.cloud.callFunction({ name: 'getSpots', data: { status: 'published' } })
        .then(r => resolve(r.result)).catch(e => resolve({ __err: e.errMsg }));
    }));
    const list = got.data || [];
    if (!list.length) return { skip: 'no data' };
    const doc = list[0];

    // 2) 原样执行用户动作（这里是编辑保存；按你的协议改）
    const payload = { ...doc };
    delete payload._id; delete payload._openid;     // 云数据库不可更新字段
    return mini.evaluate((s) => new Promise((resolve) => {
      wx.cloud.callFunction({ name: 'submitSpot', data: { spot: s } })
        .then(r => resolve(r.result)).catch(e => resolve({ __err: e.errMsg }));
    }), payload);
  });
  console.log(JSON.stringify(out, null, 2));
})();
```

实战案例：某次"编辑保存报 502001"即用此脚本验证——
跑一次返回 `{"success":true}` 且云函数日志 200，说明服务端已修复、用户碰到的是旧版本，10 秒定位，全程零截屏。

## 与云开发控制台的配合

- 控制台（Electron 窗口）用 a11y 树操作：云函数 → 日志 → 开启日志服务（**只采开启后的新日志**）。
- 复现脚本跑完 → 控制台日志页点搜索刷新，按函数名过滤看 `console.error` 留痕。
