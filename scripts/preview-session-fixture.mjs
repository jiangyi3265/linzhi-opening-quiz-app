// Loopback-only visual fixture. No real participants, database or production API.
import http from 'node:http'
let mode = 'recover', logins = 0, expired = true
const user = { userId: 900001, realName: '本地回归测试', phone: '13800000000' }
const rank = { rankNo: 5, userId: user.userId, nickName: '测**', completedCount: 2, score: 200, useTime: 305, useTimeText: '05:05', mine: true }
const status = { logged: true, completedCount: 2, cumulativeScore: 200, totalUseTime: 305, canJoin: true, completed: false, answering: false, usedCount: 0, attemptLimit: 1 }
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Content-Type', 'application/json;charset=utf-8')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
  const url = new URL(req.url, 'http://127.0.0.1')
  if (url.pathname === '/__fixture/mode') {
    if (url.searchParams.has('value')) { mode = url.searchParams.get('value'); expired = true }
    res.end(JSON.stringify({ mode, logins })); return
  }
  if (mode === 'offline' || (mode === 'login-failed' && url.pathname === '/app/login')) {
    res.end(JSON.stringify({ code: 503, msg: '本地模拟连接失败' })); return
  }
  let data
  if (url.pathname === '/app/login') {
    logins++; if (logins > 1) expired = false
    data = { token: 'local-session-fixture', user }
  } else if (['/app/home', '/app/exam/status'].includes(url.pathname)) {
    const state = expired ? { logged: false, canJoin: true, completedCount: 0 } : status
    data = url.pathname === '/app/exam/status' ? state : {
      status: state, user: expired ? null : user, ranking: expired ? [] : [rank], myRank: expired ? null : rank,
      activity: { activityStatus: 'running', questionCount: 20, duration: 600, rewardCount: 100, rules: [], serverTime: Date.now() }, notices: []
    }
  } else { res.writeHead(404); res.end(JSON.stringify({ code: 404 })); return }
  res.end(JSON.stringify({ code: 200, data }))
}).listen(18090, '127.0.0.1', () => console.log('Session fixture at http://127.0.0.1:18090'))
