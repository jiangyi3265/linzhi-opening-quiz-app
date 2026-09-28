// 本地视觉回归数据，不连接数据库；只绑定回环地址。配合 npm run dev:h5 使用。
// DAILY_PREVIEW_STATE=ready 可切换到“今天未答、此前完成6天”。不可用于生产部署。
import http from 'node:http'

const completed = process.env.DAILY_PREVIEW_STATE !== 'ready'
const port = Number(process.env.DAILY_PREVIEW_PORT || 8080)
const user = { userId: 900001, nickName: '本地测试', realName: '测试用户', phone: '13800000000', unitName: '仅本地预览' }
const ranking = [
  { rankNo: 1, userId: 900002, nickName: '测**', completedCount: 7, score: 700, useTime: 2210, useTimeText: '36:50', mine: false },
  { rankNo: 2, userId: 900001, nickName: '测**', completedCount: 7, score: 650, useTime: 2460, useTimeText: '41:00', mine: true },
  { rankNo: 3, userId: 900003, nickName: '测**', completedCount: 6, score: 580, useTime: 1300, useTimeText: '21:40', mine: false }
]
const result = { paperId: 900007, score: 85, totalScore: 100, correctCount: 17, questionCount: 20, answeredCount: 20, useTime: 360, completedCount: 7, cumulativeScore: 650, totalUseTime: 2460, rankNo: 2, rewardCount: 100, rewarded: true, status: '1' }
function status() {
  return { logged: true, canJoin: !completed, completed, answering: false, usedCount: completed ? 1 : 0, completedCount: completed ? 7 : 6, cumulativeScore: completed ? 650 : 565, totalUseTime: completed ? 2460 : 2100, attemptLimit: 1, paperId: completed ? result.paperId : null, result: completed ? result : null, serverDate: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10), reason: completed ? '今日答题机会已使用，每人每天限1次，请明天再来' : '' }
}
const rules = ['活动共7天，每人每天1次答题机会，北京时间每天零点刷新，未用机会不累计', '每天共20题，限时10分钟，中途退出不暂停计时', '有效完成次数多优先，次数相同则累计得分高优先，再比较累计用时短', '次数、累计得分与用时均相同时，最后一次有效交卷更早者优先', '空白卷不计入排名，仍占当天机会', '排名前100名可获得活动奖励，最终以活动结束后的榜单为准', '交卷后不可修改，已作废答卷不计入排名']
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Content-Type', 'application/json;charset=utf-8')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
  const path = new URL(req.url, 'http://localhost').pathname
  let data
  if (path === '/app/login') data = { token: 'local-visual-fixture-only', user }
  else if (path === '/app/home') data = { activity: { activityStatus: 'running', questionCount: 20, duration: 600, attemptLimit: 1, participationDays: 7, rewardCount: 100, serverTime: Date.now(), rules }, status: status(), ranking, myRank: ranking[1], user, notices: [] }
  else if (path === '/app/exam/status') data = status()
  else if (path === '/app/exam/result/900007') data = result
  else if (path === '/app/rank/list') data = { list: ranking, myRank: ranking[1] }
  else if (path === '/app/notice/list') data = []
  else { res.writeHead(404); res.end(JSON.stringify({ code: 404, msg: '该操作未在视觉预览中模拟' })); return }
  res.end(JSON.stringify({ code: 200, data }))
}).listen(port, '127.0.0.1', () => console.log(`Local daily fixture: ${completed ? 'completed' : 'ready'} at 127.0.0.1:${port}`))
