/**
 * 应用配置
 *
 * baseUrl 需要与后端服务地址保持一致：
 *  - H5 本地调试：http://localhost:8080
 *  - 真机 / 微信开发者工具：改成电脑局域网 IP，例如 http://192.168.1.96:8080
 *  - 线上部署：改成正式域名，例如 https://wangan.linzhi.gov.cn/prod-api
 *
 * 微信小程序正式发布时，需要在小程序后台把该域名加入 request 合法域名；
 * 开发阶段可在微信开发者工具中勾选“不校验合法域名”。
 */
const ENV = {
	// 开发环境
	development: {
		baseUrl: import.meta.env.VITE_QUIZ_DEV_API || 'http://localhost:8080'
	},
	// 生产环境
	production: {
		baseUrl: 'https://kaimu.oksja.cn/prod-api'
	}
}

const current = process.env.NODE_ENV === 'production' ? ENV.production : ENV.development

export default {
	// 接口基础地址
	baseUrl: current.baseUrl,
	// 应用名称
	appName: '网安林芝',
	// 请求超时时间（毫秒）
	timeout: 15000,
	// 本地缓存 key
	storageKey: {
		token: 'quiz_token',
		user: 'quiz_user',
		device: 'quiz_device_id'
	}
}
