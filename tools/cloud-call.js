#!/usr/bin/env node
// 命令行直调云函数：node cloud-call.js getSpots '{"status":"published"}'
const { callCloud } = require('./wx');

(async () => {
  const [name, dataArg] = process.argv.slice(2);
  if (!name) {
    console.error('usage: node cloud-call.js <fnName> [jsonArgs]');
    process.exit(1);
  }
  let data = {};
  if (dataArg) {
    try { data = JSON.parse(dataArg); }
    catch { console.error('jsonArgs 不是合法 JSON'); process.exit(1); }
  }
  const r = await callCloud(name, data);
  console.log(JSON.stringify(r, null, 2));
  if (r && r.__err) process.exit(2);
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
