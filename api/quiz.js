import request, { getDeviceId, getToken, setToken, setUser } from '@/utils/request.js'

let loginPending = null

/** 获取微信登录 code（仅小程序端有效） */
function wxLoginCode() {
	return new Promise(resolve => {
		// #ifdef MP-WEIXIN
		uni.login({
			provider: 'weixin',
			success: res => resolve(res.code || ''),
			fail: () => resolve('')
		})
		// #endif
		// #ifndef MP-WEIXIN
		resolve('')
		// #endif
	})
}

/** 当前运行端来源：1 微信小程序 2 H5 3 APP */
function currentSource() {
	// #ifdef MP-WEIXIN
	return '1'
	// #endif
	// #ifdef H5
	return '2'
	// #endif
	// #ifdef APP-PLUS
	return '3'
	// #endif
	// eslint-disable-next-line no-unreachable
	return '2'
}

/**
 * 登录：小程序优先使用 wx.login 的 code，
 * 未配置小程序凭证或在 H5/APP 端时自动降级为设备标识登录。
 */
export function login(profile = {}) {
	// 首页、切回前台与榜单可能同时发现会话过期，只恢复同一设备的一次登录。
	if (!loginPending) loginPending = performLogin(profile).finally(() => { loginPending = null })
	return loginPending
}

async function performLogin(profile) {
	const code = await wxLoginCode()
	const res = await request({
		url: '/app/login',
		method: 'POST',
		data: {
			code,
			deviceId: getDeviceId(),
			source: currentSource(),
			nickName: profile.nickName,
			avatar: profile.avatar
		}
	})
	if (!res.data?.token || !res.data?.user?.userId) {
		throw Object.assign(new Error('登录恢复失败，请重试'), { code: 401 })
	}
	setToken(res.data.token)
	setUser(res.data.user)
	return res.data
}

/** 只重试读取操作；匿名接口的 HTTP 200 不代表当前用户已登录。 */
async function sessionRead(url, recognized = () => true) {
	if (!getToken()) await login()
	for (let attempt = 0; attempt < 2; attempt++) {
		const requestedToken = getToken()
		try {
			const res = await request({ url, showError: false })
			if (recognized(res.data)) return res
		} catch (error) {
			if (error.code !== 401) throw error
		}
		if (attempt === 1) throw Object.assign(new Error('登录恢复失败，请点击重试；请勿清除缓存'), { code: 401 })
		// 迟到的旧会话响应不能触发第二次登录或覆盖已恢复的会话。
		if (!getToken() || getToken() === requestedToken) await login()
	}
}

/** 退出登录 */
export function logout() {
	return request({ url: '/app/logout', method: 'POST', showError: false })
}

/** 首页聚合数据 */
export function getHome(rankSize = 3) {
	return sessionRead(`/app/home?rankSize=${rankSize}`, data => data?.status?.logged === true && !!data?.user?.userId)
}

/** 活动信息 */
export function getActivity() {
	return request({ url: '/app/activity' })
}

/** 参赛状态 */
export function getExamStatus() {
	return sessionRead('/app/exam/status', data => data?.logged === true)
}

/** 开始答题 / 续答 */
export function startExam() {
	return request({ url: '/app/exam/start', method: 'POST' })
}

/** 获取试卷 */
export function getPaper(paperId) {
	return sessionRead(`/app/exam/paper/${paperId}`)
}

/** 保存单题作答 */
export function saveAnswer(paperId, questionId, userAnswer) {
	return request({
		url: '/app/exam/answer',
		method: 'POST',
		data: { paperId, questionId, userAnswer },
		showError: false
	})
}

/** 交卷 */
export function submitExam(paperId, answers) {
	return request({ url: '/app/exam/submit', method: 'POST', data: { paperId, answers } })
}

/** 成绩查询 */
export function getResult(paperId) {
	return sessionRead(`/app/exam/result/${paperId}`)
}

/** 排行榜 */
export async function getRankList(limit = 100) {
	// 聚合接口同时返回登录标志，避免匿名榜单把“我的排名”悄悄清空。
	const res = await getHome(limit)
	return { ...res, data: { list: res.data.ranking, myRank: res.data.myRank } }
}

/** 活动公告 */
export function getNotices() {
	return request({ url: '/app/notice/list' })
}

/** 个人资料 */
export function getUserInfo() {
	return sessionRead('/app/user/info')
}

/** 完善资料 */
export function updateProfile(data) {
	return request({ url: '/app/user/profile', method: 'POST', data })
}
