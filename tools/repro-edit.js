// 复现脚本模板：把"用户会做的事"变成确定性云函数调用。
// 以下以「编辑已有记录并保存」为例（当前项目协议：submitSpot 收 {spot}），
// 换成你自己的云函数名与数据协议即可。
const { withMini } = require('./wx');

(async () => {
  const out = await withMini(async (mini) => {
    // 1) 取一条真实数据（模拟编辑表单加载）
    const got = await mini.evaluate(() => new Promise((resolve) => {
      wx.cloud.callFunction({ name: 'getSpots', data: { status: 'published' } })
        .then(r => resolve(r.result))
        .catch(e => resolve({ __err: e.errMsg || e.message }));
    }));
    const list = (got && got.data) || [];
    if (!list.length) return { skip: '云端没有可复现的数据' };
    const doc = list[0];

    // 2) 按用户动作原样构造请求（云数据库不可更新字段必须剥掉）
    const payload = Object.assign({}, doc);
    delete payload._id;
    delete payload._openid;

    // 3) 执行动作
    const saved = await mini.evaluate((s) => new Promise((resolve) => {
      wx.cloud.callFunction({ name: 'submitSpot', data: { spot: s } })
        .then(r => resolve(r.result))
        .catch(e => resolve({ __err: e.errMsg || e.message, errCode: e.errCode }));
    }), payload);

    // 4) 回读验证
    const back = await mini.evaluate((id) => new Promise((resolve) => {
      wx.cloud.callFunction({ name: 'getSpots', data: { id } })
        .then(r => resolve(r.result))
        .catch(e => resolve({ __err: e.errMsg || e.message }));
    }), doc.id);

    return {
      target: { id: doc.id, name: doc.name },
      save: saved,
      readback: back && back.data && back.data[0] ? 'ok' : back,
    };
  });

  console.log(JSON.stringify(out, null, 2));
  if (out && out.save && out.save.__err) process.exit(2);
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
