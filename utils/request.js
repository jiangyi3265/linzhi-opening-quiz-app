import config from '@/config.js'

const { token: TOKEN_KEY, user: USER_KEY, device: DEVICE_KEY } = config.storageKey

/** 读取本地令牌 */
export function getToken() {
	return uni.getStorageSync(TOKEN_KEY) || ''
}

/** 写入本地令牌 */
export function setToken(token) {
	uni.setStorageSync(TOKEN_KEY, token || '')
}

/** 清除本地登录态 */
export function clearToken() {
	uni.removeStorageSync(TOKEN_KEY)
	uni.removeStorageSync(USER_KEY)
}

/** 读取本地用户信息 */
export function getUser() {
	return uni.getStorageSync(USER_KEY) || null
}

/** 写入本地用户信息 */
export function setUser(user) {
	uni.setStorageSync(USER_KEY, user || null)
}

/**
 * 获取设备标识：用于未配置微信小程序凭证时的降级登录，
 * 同一台设备保持同一标识，由服务端校验“每天一次机会”。
 */
export function getDeviceId() {
	let deviceId = uni.getStorageSync(DEVICE_KEY)
	if (!deviceId) {
		deviceId = 'dev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10)
		uni.setStorageSync(DEVICE_KEY, deviceId)
	}
	return deviceId
}

/**
 * 统一请求方法
 *
 * @param {Object} options 请求配置 { url, method, data, showError, auth }
 * @returns {Promise<Object>} 成功返回响应体 data 字段
 */
export default function request(options) {
	const { url, method = 'GET', data = {}, showError = true } = options
	const requestedToken = getToken()
	return new Promise((resolve, reject) => {
		uni.request({
			url: config.baseUrl + url,
			method: method.toUpperCase(),
			data,
			timeout: config.timeout,
			header: {
				'Content-Type': 'application/json;charset=utf-8',
				Authorization: requestedToken ? 'Bearer ' + requestedToken : ''
			},
			success(res) {
				const body = res.data || {}
				if (res.statusCode === 401 || body.code === 401) {
					// 并发旧请求的 401 不能清掉后来恢复的有效令牌；设备标识始终保留。
					if (getToken() === requestedToken) clearToken()
					if (showError) uni.showToast({ title: '登录已过期，请重新进入', icon: 'none' })
					reject(Object.assign(new Error(body.msg || '登录已过期'), { code: 401 }))
					return
				}
				if (res.statusCode !== 200) {
					const msg = body.msg || `网络异常(${res.statusCode})`
					if (showError) {
						uni.showToast({ title: msg, icon: 'none' })
					}
					reject(new Error(msg))
					return
				}
				if (body.code === 200) {
					resolve(body)
					return
				}
				const msg = body.msg || '请求失败'
				if (showError) {
					uni.showToast({ title: msg, icon: 'none' })
				}
				reject(Object.assign(new Error(msg), { code: body.code }))
			},
			fail(err) {
				const msg = '网络连接失败，请检查网络后重试'
				if (showError) {
					uni.showToast({ title: msg, icon: 'none' })
				}
				reject(Object.assign(new Error(msg), { raw: err }))
			}
		})
	})
}
