// All HTTP/storage are simulated. Never sends requests to production.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8')
const strip = source => source.replace(/import[\s\S]*?from\s+['"][^'"]+['"]\s*/g, '')
  .replace(/export default function/g, 'function').replace(/export (async )?function/g, '$1function')
const pageSource = read('../pages/index/index.vue').match(/<script>([\s\S]*?)<\/script>/)[1]
const validStatus = { logged: true, canJoin: true, completed: false, completedCount: 2, cumulativeScore: 200, totalUseTime: 305, usedCount: 0 }
const user = { userId: 900001, realName: '本地回归用户' }
const anonymous = { logged: false, canJoin: true, completedCount: 0, cumulativeScore: 0, totalUseTime: 0 }
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))

function setup({ failure = '', status = validStatus, delay = () => 0, noToken = false } = {}) {
  const storage = new Map([['token', 'expired'], ['user', user], ['device', 'same-device-regression']])
  if (noToken) storage.delete('token')
  const calls = []
  const fixture = { failure, status }
  const sandbox = { Date, setInterval, clearInterval, config: { storageKey: { token: 'token', user: 'user', device: 'device' }, baseUrl: '', timeout: 500 }, uni: {
    getStorageSync: key => storage.get(key), setStorageSync: (key, value) => storage.set(key, value), removeStorageSync: key => storage.delete(key), showToast() {}, pageScrollTo() {},
    login: opts => opts.success({ code: 'local-fixture' }),
    request: opts => {
      calls.push(opts)
      const logged = opts.header.Authorization === 'Bearer restored'
      setTimeout(() => {
        if (fixture.failure === 'offline') return opts.fail({})
        if (opts.url === '/app/login') {
          assert.equal(opts.data.deviceId, 'same-device-regression')
          return opts.success({ statusCode: 200, data: fixture.failure === 'login' ? { code: 500 } : { code: 200, data: { token: 'restored', user } } })
        }
        const recognized = logged && fixture.failure !== 'anonymous'
        if (!recognized && fixture.failure === '401') return opts.success({ statusCode: 401, data: {} })
        if (!recognized && fixture.failure === 'body401') return opts.success({ statusCode: 200, data: { code: 401 } })
        const state = recognized ? fixture.status : anonymous
        let data
        if (opts.url.startsWith('/app/home')) data = { status: state, user: recognized ? user : null, activity: {}, ranking: [], myRank: recognized ? { completedCount: 2, score: 200, useTime: 305 } : null }
        else if (opts.url === '/app/exam/status') data = state
        else if (opts.url.startsWith('/app/exam/paper/')) {
          if (!recognized) return opts.success({ statusCode: 200, data: { code: 401 } })
          data = { paperId: 900005, remainSeconds: 158, timeLimited: true, questions: [] }
        } else throw Error(`Unexpected request: ${opts.url}`)
        opts.success({ statusCode: 200, data: { code: 200, data } })
      }, delay(opts))
    }
  } }
  vm.createContext(sandbox)
  vm.runInContext(strip(read('../utils/request.js')) + '\n' + strip(read('../api/quiz.js')) + '\n' + strip(pageSource).replace('export default', 'globalThis.component ='), sandbox)
  const app = sandbox.component.data()
  for (const [name, method] of Object.entries(sandbox.component.methods)) app[name] = method.bind(app)
  for (const [name, compute] of Object.entries(sandbox.component.computed)) Object.defineProperty(app, name, { get: () => compute.call(app) })
  return { app, api: sandbox, fixture, storage, calls, logins: () => calls.filter(c => c.url === '/app/login').length }
}

let passed = 0
async function test(name, run) { await run(); passed++; console.log(`PASS: ${name}`) }
await test('expired cached user recovers 2 days / 200 points / 305 seconds using original device', async () => {
  const s = setup(); await s.app.bootstrap()
  assert.equal(s.logins(), 1); assert.equal(s.app.status.logged, true)
  assert.equal(s.app.status.completedCount, 2); assert.equal(s.app.status.totalUseTime, 305)
  assert.equal(s.app.status.cumulativeScore, 200); assert.equal(s.app.user.userId, user.userId)
  assert.equal(s.storage.get('device'), 'same-device-regression'); assert.equal(s.app.statusError, '')
})
await test('return to foreground restores expired login without anonymous zero overwrite', async () => {
  const s = setup(); s.app.user = user; s.app.status = { ...validStatus }
  let sawAnonymous = false, current = s.app.status
  Object.defineProperty(s.app, 'status', { get: () => current, set: value => { if (!value.logged) sawAnonymous = true; current = value } })
  assert.equal(await s.app.refreshStatus(), true); assert.equal(sawAnonymous, false)
  assert.equal(s.app.status.totalUseTime, 305); assert.equal(s.logins(), 1)
})
await test('parallel home/status/ranking use one login, including a late anonymous response', async () => {
  const s = setup({ delay: opts => opts.url === '/app/exam/status' && opts.header.Authorization === 'Bearer expired' ? 30 : 1 })
  const [home, status, rank] = await Promise.all([s.api.getHome(), s.api.getExamStatus(), s.api.getRankList(100)])
  assert.equal(s.logins(), 1); assert.equal(home.data.status.totalUseTime, 305)
  assert.equal(status.data.totalUseTime, 305); assert.equal(rank.data.myRank.useTime, 305)
})
for (const failure of ['401', 'body401']) await test(`${failure} including late old response cannot remove restored token`, async () => {
  const s = setup({ failure, delay: opts => opts.url === '/app/exam/status' && opts.header.Authorization === 'Bearer expired' ? 30 : 1 })
  await Promise.all([s.api.getHome(), s.api.getExamStatus()])
  assert.equal(s.storage.get('token'), 'restored'); assert.equal(s.logins(), 1)
  assert.equal(s.storage.get('device'), 'same-device-regression')
})
await test('missing token, concurrent reads still login only once', async () => {
  const s = setup({ noToken: true }); await Promise.all([s.api.getHome(), s.api.getExamStatus()]); assert.equal(s.logins(), 1)
})
await test('recovery remains bounded when server still responds anonymously', async () => {
  const s = setup({ failure: 'anonymous' }); await s.app.bootstrap()
  assert.equal(s.logins(), 1); assert.equal(s.calls.filter(c => c.url.startsWith('/app/home')).length, 2)
  assert.match(s.app.statusCopy, /登录恢复失败/); assert.doesNotMatch(s.app.statusCopy, /0\/7/)
  assert.equal(s.app.status.canJoin, false)
})
await test('failed login preserves last known scores and duration with explicit retry message', async () => {
  const s = setup({ failure: 'login' }); s.app.user = user; s.app.status = { ...validStatus }
  assert.equal(await s.app.refreshStatus(), false)
  assert.equal(s.app.status.totalUseTime, 305); assert.equal(s.app.status.completedCount, 2)
  assert.match(s.app.statusCopy, /上次读取：2\/7天，200分 · 05:05/)
  assert.match(s.app.statusCopy, /重试/); assert.equal(s.logins(), 1)
  const before = s.calls.length; await s.app.beginQuiz(); assert.equal(s.calls.length, before)
})
await test('offline refresh retains records, retry restores without changing papers', async () => {
  const s = setup({ failure: 'offline' }); s.app.user = user; s.app.status = { ...validStatus }
  await s.app.refreshStatus(); assert.equal(s.app.status.totalUseTime, 305)
  assert.ok(s.app.statusError); s.fixture.failure = ''; await s.app.retryRecords()
  assert.equal(s.app.statusError, ''); assert.equal(s.app.status.totalUseTime, 305)
  assert.equal(s.calls.some(c => ['/app/exam/start', '/app/exam/answer', '/app/exam/submit'].includes(c.url)), false)
})
await test('genuine new participant zero is shown only after server confirms login', async () => {
  const s = setup({ status: { ...validStatus, completedCount: 0, cumulativeScore: 0, totalUseTime: 0 } }); await s.app.bootstrap()
  assert.equal(s.app.status.logged, true); assert.match(s.app.statusCopy, /已完成 0\/7天/)
})
await test('slower old status response cannot overwrite a newer home result', async () => {
  const s = setup({ delay: opts => opts.url === '/app/exam/status' ? 40 : 1 }); s.storage.set('token', 'restored'); s.app.user = user
  const old = s.app.refreshStatus(); await pause(5); await s.app.loadHome()
  s.fixture.status = { ...validStatus, completedCount: 1, totalUseTime: 158 }
  await old; assert.equal(s.app.status.completedCount, 2); assert.equal(s.app.status.totalUseTime, 305)
})
await test('paper read recovers authentication but never restarts or submits a paper', async () => {
  const s = setup(); const response = await s.api.getPaper(900005)
  assert.equal(response.data.remainSeconds, 158); assert.equal(s.logins(), 1)
  assert.equal(s.calls.filter(c => c.method !== 'GET' && c.url !== '/app/login').length, 0)
})
await test('clearing an expired token never removes device identity', async () => {
  const s = setup(); s.api.clearToken(); assert.equal(s.storage.get('device'), 'same-device-regression')
  assert.equal(s.storage.has('token'), false); assert.equal(s.storage.has('user'), false)
})
console.log(`${passed} session recovery checks passed; no production requests were sent.`)
