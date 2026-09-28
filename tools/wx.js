// wx.js —— automator 连接封装：在小程序 AppService 上下文执行代码 / 调云函数
// 前提：cli auto --project <p> --auto-port 9421 已启动
const automator = require('miniprogram-automator');

const WS = process.env.WS_ENDPOINT || 'ws://127.0.0.1:9421';

/** 打开连接 → 执行 fn(mini) → 无论成败都断开 */
async function withMini(fn, ws = WS) {
  const mini = await automator.connect({ wsEndpoint: ws });
  try {
    return await fn(mini);
  } finally {
    await mini.disconnect().catch(() => {});
  }
}

/**
 * 调云函数（resolve 而非 throw，失败时返回 {__err, errCode}）
 * 注意：mini.evaluate 的函数被序列化到小程序上下文执行，
 *      依赖的数据必须用参数传入，不能闭包捕获。
 */
function callCloud(name, data) {
  return withMini((mini) => mini.evaluate((n, d) => new Promise((resolve) => {
    wx.cloud.callFunction({ name: n, data: d })
      .then(r => resolve(r.result))
      .catch(e => resolve({ __err: e.errMsg || e.message, errCode: e.errCode }));
  }), name, data));
}

/** 执行一段 AppService 代码 */
function evaluate(fn, ...args) {
  return withMini((mini) => mini.evaluate(fn, ...args));
}

/** 模拟器截图（视觉验收首选，代替桌面截屏） */
function screenshot(path) {
  return withMini((mini) => mini.screenshot({ path }));
}

module.exports = { withMini, callCloud, evaluate, screenshot, WS };
