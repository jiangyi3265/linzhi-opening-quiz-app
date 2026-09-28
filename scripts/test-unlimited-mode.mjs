import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const source = fs.readFileSync(new URL('../pages/index/index.vue', import.meta.url), 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
  .replace(/import[\s\S]*?from\s+['"][^'"]+['"]\s*/g, '')
  .replace('export default', 'globalThis.component =')
let intervals = 0
const sandbox = { Date, setInterval: () => ++intervals, clearInterval: () => {}, uni: { showToast() {} } }
vm.runInNewContext(script, sandbox)
const definition = sandbox.component
const page = definition.data()
for (const [key, method] of Object.entries(definition.methods)) page[key] = method.bind(page)
let submissions = 0
page.submitQuiz = () => submissions++
page.applyPaper({ paperId: 1, timeLimited: false, remainSeconds: 2147483647, questions: [] })
page.startTimer()
page.tickTimer()
assert.equal(page.deadlineAt, 0)
assert.equal(intervals, 0)
assert.equal(submissions, 0)
page.applyPaper({ paperId: 2, timeLimited: true, remainSeconds: 600, questions: [] })
page.startTimer()
assert.equal(intervals, 1)
assert.ok(page.deadlineAt > Date.now())
assert.equal(submissions, 0)
page.stopTimer()
page.applyPaper({ paperId: 3, timeLimited: true, remainSeconds: 0, questions: [] })
page.tickTimer()
assert.equal(submissions, 1)
page.status = { testMode: true, canJoin: true, completed: false, answering: false }
page.activity = { testMode: true }
assert.equal(definition.computed.isTestMode.call(page), true)
page.status.testMode = false
assert.equal(definition.computed.isTestMode.call(page), false)
page.activity = { activityName: '【规则测试】七天网络安全知识竞答', rewardCount: 0, rules: ['每天一次', '排名前0名可获得活动奖励'] }
page.isRuleTrial = definition.computed.isRuleTrial.call(page)
assert.equal(page.isRuleTrial, true)
assert.equal(definition.computed.displayRules.call(page).length, 2)
page.isTestMode = false
page.status = { logged: true, completed: true, completedCount: 0, cumulativeScore: 0, result: { answeredCount: 0 } }
assert.match(definition.computed.statusCopy.call(page), /空白交卷.*不计入排名/)
page.status = { logged: true, completed: true, completedCount: 2, cumulativeScore: 180, totalUseTime: 400, result: { answeredCount: 20 } }
assert.match(definition.computed.statusCopy.call(page), /180分/)
assert.match(source, /row\.score/)
assert.match(source, /myRank\.score/)
assert.match(source, /空白交卷不计入排名/)
console.log('PASS: unlimited papers never start countdown or auto-submit; timed and expired formal papers retain their behavior.')
