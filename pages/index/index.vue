<template>
	<view class="app-shell">
		<view class="phone-page">
			<!-- #ifdef H5 -->
			<view class="status-bar" :class="{ 'is-home': screen === 'home' }">
				<text class="status-time">{{ clock }}</text>
				<view class="status-icons" aria-hidden="true">
					<view class="signal"><view></view><view></view><view></view><view></view></view>
					<text class="wifi">⌁</text>
					<view class="battery"><view></view></view>
				</view>
			</view>
			<!-- #endif -->
			<!-- #ifndef H5 -->
			<view class="native-status-space" :class="{ 'is-home': screen === 'home' }"></view>
			<!-- #endif -->

			<view class="top-bar" :class="{ 'is-home': screen === 'home' }">
				<text v-if="screen !== 'home'" class="top-title">{{ pageTitle }}</text>
				<!-- #ifndef MP-WEIXIN -->
				<view class="capsule" aria-hidden="true"><text>•••</text><view class="capsule-divider"></view><text class="capsule-circle">◉</text></view>
				<!-- #endif -->
			</view>

			<view class="campaign-hero" :class="screen === 'home' ? 'home-hero' : 'flow-hero'">
				<view class="campaign-art" role="img" aria-label="国家网络安全宣传周，China Cybersecurity Week">
					<image class="campaign-art-image" src="/static/ui/cybersecurity-week-logo-source.jpg" mode="widthFix" />
				</view>
				<view class="campaign-copy">
					<text v-if="screen === 'home'" class="campaign-year">2026年国家网络安全宣传周</text>
					<text class="campaign-title">网络安全知识竞答</text>
					<text class="campaign-subtitle">{{ activity.subTitle || '智能时代 · 网安护航' }}</text>
					<template v-if="screen === 'home'">
						<text class="campaign-slogan">网络安全为人民　网络安全靠人民</text>
						<text v-if="isTestMode" class="campaign-rules">测试模式 · 不限次数 · 不限时</text>
						<text v-else-if="isRuleTrial" class="campaign-rules">每日1次 · 次日恢复 · 独立测试排名</text>
						<text v-else class="campaign-rules">每日1次 · 共7天 · {{ activity.rewardCount > 0 ? `前${activity.rewardCount}名获奖励` : '不设奖励' }}</text>
						<view class="organizer-credit" aria-label="主办单位：中共林芝市委员会网络安全和信息化委员会办公室，林芝市互联网信息办公室">
							<text class="organizer-label">主办单位</text>
							<text class="organizer-name">中共林芝市委员会网络安全和信息化委员会办公室</text>
							<view class="organizer-name organizer-name-distributed" aria-label="林芝市互联网信息办公室">
								<text v-for="(character, index) in '林芝市互联网信息办公室'.split('')" :key="index" aria-hidden="true">{{ character }}</text>
							</view>
						</view>
						<button class="primary-button hero-start" @tap="startFlow">立即答题<text class="hero-start-arrow" aria-hidden="true">›</text></button>
					</template>
				</view>
			</view>

			<view v-if="statusError && screen !== 'home' && !['quiz', 'submit'].includes(screen)" class="page-content session-feedback">
				<view class="panel session-alert" role="status">
					<text class="detail-copy">{{ statusCopy }}</text>
					<button class="secondary-button" :disabled="statusLoading" @tap="retryRecords">{{ statusLoading ? '正在重试…' : '重新读取记录' }}</button>
				</view>
			</view>

			<!-- ================= 首页 ================= -->
			<view v-if="screen === 'home'" class="page-content home-content">
				<view class="status-card panel" hover-class="panel-pressed" @tap="startFlow">
					<view class="section-title"><image class="section-icon" src="/static/ui/icon-user.png" mode="aspectFit" /><text>参赛状态</text></view>
					<view class="hairline"></view>
					<text class="status-heading">{{ statusHeading }}</text>
					<text class="status-copy">{{ statusCopy }}</text>
					<view class="shield-watermark">★</view>
				</view>

				<view class="feature-row">
					<view class="feature-card">
						<image src="/static/ui/icon-shield.png" mode="aspectFit" />
						<view><text class="feature-title">{{ isTestMode ? '不限次数' : '每日一次' }}</text><text class="feature-copy">{{ isTestMode ? '可反复测试' : '连续7天活动' }}</text></view>
					</view>
					<view class="feature-card">
						<image src="/static/ui/icon-chart.png" mode="aspectFit" />
						<view><text class="feature-title">{{ isTestMode ? '不限时长' : '综合排名' }}</text><text class="feature-copy">{{ isTestMode ? '手动确认交卷' : '次数·分数·用时' }}</text></view>
					</view>
					<view class="feature-card">
						<image src="/static/ui/icon-trophy.png" mode="aspectFit" />
						<view><text class="feature-title">{{ isTestMode ? '测试记录' : (isRuleTrial ? '测试排名' : (activity.rewardCount > 0 ? `前${activity.rewardCount}名` : '不设奖励')) }}</text><text class="feature-copy">{{ isTestMode || isRuleTrial ? '不计正式排名' : (activity.rewardCount > 0 ? '获得活动奖励' : '参与知识竞答') }}</text></view>
					</view>
				</view>

				<view class="quick-grid">
					<view v-for="item in quickItems" :key="item.key" class="quick-item" hover-class="panel-pressed" @tap="openQuick(item.key)">
						<image :src="item.icon" mode="aspectFit" />
						<text>{{ item.label }}</text>
					</view>
				</view>

				<view class="home-duo">
					<view class="ranking-card">
						<view class="card-heading-row">
							<view class="card-heading"><image src="/static/ui/icon-chart.png" mode="aspectFit" /><text>实时排行榜</text></view>
							<text class="card-link" @tap.stop="go('ranking')">查看榜单 ›</text>
						</view>
						<view v-if="!ranking.length" class="rank-empty">{{ isTestMode ? '测试成绩不计入正式排名' : '暂无成绩，快来抢占榜单' }}</view>
						<view v-for="(row, index) in ranking.slice(0, 3)" :key="row.rankNo" class="rank-row">
							<view class="medal" :class="`medal-${index + 1}`">{{ index + 1 }}</view>
							<text class="rank-name">{{ row.nickName }}</text><view class="rank-metrics"><text>{{ row.completedCount }}次 · {{ row.score || 0 }}分</text><text>{{ row.useTimeText || formatSeconds(row.useTime) }}</text></view>
						</view>
					</view>
					<view class="reward-card" @tap="go('rewards')">
						<view class="reward-heading"><image src="/static/ui/icon-gift.png" mode="aspectFit" /><text>活动奖励</text></view>
						<text class="reward-copy">{{ activity.rewardCount > 0 ? `排名前${activity.rewardCount}名可获奖励` : '本场测试不发放奖励' }}</text>
						<view class="reward-card-footer">
							<button class="reward-button" @tap.stop="go('rewards')">查看说明 ›</button>
							<image class="reward-image" src="/static/ui/reward-trophy-clean.png" mode="aspectFit" aria-hidden="true" />
						</view>
					</view>
				</view>
			</view>

			<!-- ================= 竞答规则 ================= -->
			<view v-else-if="screen === 'rules'" class="page-content flow-content">
				<view class="rules-panel panel">
					<view class="panel-heading"><view class="outline-shield">☆</view><text>竞答规则</text></view>
					<view class="rules-list">
						<view v-for="(rule, index) in displayRules" :key="rule" class="rule-row"><text class="rule-number">{{ index + 1 }}</text><text>{{ rule }}</text></view>
					</view>
					<view class="agree-row" @tap="agreed = !agreed">
						<view class="checkbox" :class="{ checked: agreed }"><text v-if="agreed">✓</text></view>
						<text>我已阅读并同意竞答规则</text>
					</view>
					<button class="primary-button" @tap="continueFromRules">下一步</button>
				</view>
			</view>

			<!-- ================= 参赛确认 ================= -->
			<view v-else-if="screen === 'confirm'" class="page-content flow-content">
				<view class="confirm-panel panel">
					<text class="confirm-label">填写参赛信息</text>
					<text class="confirm-tip">请填写本人真实信息，保存成功后开始答题。</text>
					<text v-if="isRuleTrial" class="confirm-tip">独立规则测试：今天交卷后不可再答，北京时间次日零点恢复。成绩仅进入测试榜单。</text>
					<view class="profile-form confirm-profile-form">
						<view class="profile-row">
							<text class="profile-label"><text class="required-mark">*</text>姓名</text>
							<input class="profile-input" v-model="profile.realName" maxlength="32" placeholder="请输入真实姓名" placeholder-class="profile-placeholder" />
						</view>
						<view class="profile-row">
							<text class="profile-label"><text class="required-mark">*</text>手机号</text>
							<input class="profile-input" v-model="profile.phone" type="number" maxlength="11" placeholder="用于奖励发放联系" placeholder-class="profile-placeholder" />
						</view>
					</view>
					<view class="privacy-note">
						<text>姓名用于成绩登记和排行榜展示，手机号仅用于领奖联系，不会在排行榜公开。</text>
					</view>
					<view class="profile-consent" @tap="profileConsent = !profileConsent">
						<view class="checkbox" :class="{ checked: profileConsent }"><text v-if="profileConsent">✓</text></view>
						<text>我同意将姓名和手机号用于本次竞答</text>
					</view>
					<view v-if="isTestMode" class="confirm-stats">
						<view><text>答题机会</text><text class="stat-value">不限次数</text></view><view class="stat-divider"></view><view><text>答题时长</text><text class="stat-value">不限时</text></view>
					</view>
					<view v-else-if="status.logged === true && !statusError" class="confirm-stats">
						<view><text>今日剩余机会</text><text class="stat-value">{{ remainAttempt }}次</text></view><view class="stat-divider"></view><view><text>七天参与进度</text><text class="stat-value">{{ status.completedCount || 0 }} / 7天</text></view>
					</view>
					<view v-if="isTestMode" class="notice-box"><text class="notice-copy">当前为测试模式，共{{ activity.questionCount }}题，不会超时自动交卷。交卷后可再次测试，成绩不计入正式排名。</text></view>
					<view v-else class="notice-box"><text class="hourglass">⌛</text><text class="notice-copy">点击开始后立即计时，共{{ activity.questionCount }}题限时{{ Math.round(activity.duration / 60) }}分钟，\n中途退出不会暂停</text></view>
					<button class="primary-button" :disabled="!status.canJoin || starting || statusLoading || !!statusError" @tap="beginQuiz">{{ starting ? '正在保存并生成试卷…' : '保存信息并开始答题' }}</button>
					<button class="secondary-button" @tap="go('home')">返回首页</button>
				</view>
			</view>

			<!-- ================= 正式竞答 ================= -->
			<view v-else-if="screen === 'quiz'" class="page-content quiz-content">
				<view class="quiz-panel panel">
					<view class="quiz-meta">
						<text>第{{ currentIndex + 1 }}题 / 共{{ questions.length }}题</text>
						<text v-if="!paperTimeLimited" class="timer">测试不限时</text>
						<text v-else class="timer" :class="{ urgent: remainingSeconds <= 60 }">◷ 剩余 {{ formattedTime }}</text>
						<text>{{ progress }}%</text>
					</view>
					<view class="progress-track"><view :style="{ width: `${progress}%` }"></view></view>
					<view class="question-head">
						<text class="type-tag" :class="`type-${currentQuestion.questionType}`">{{ typeText(currentQuestion.questionType) }}</text>
						<text class="question-text">{{ currentQuestion.title }}</text>
					</view>
					<view class="option-list">
						<view v-for="option in currentQuestion.options" :key="option.label" class="option" :class="{ selected: isSelected(option.label) }" hover-class="option-hover" @tap="selectAnswer(option.label)">
							<text class="option-letter">{{ option.label }}</text><text>{{ option.content }}</text><text v-if="isSelected(option.label)" class="option-check">✓</text>
						</view>
					</view>
					<view class="quiz-actions">
						<button class="secondary-button" :disabled="currentIndex === 0" @tap="previousQuestion">上一题</button>
						<button class="primary-button" @tap="nextQuestion">{{ currentIndex === questions.length - 1 ? '查看答题卡' : '下一题' }}</button>
					</view>
				</view>
			</view>

			<!-- ================= 确认交卷 ================= -->
			<view v-else-if="screen === 'submit'" class="page-content submit-content">
				<view class="answer-card panel">
					<view class="answer-heading"><text>答题卡</text><view><view class="legend-filled"></view><text>已答</text><view class="legend-empty"></view><text>未答</text></view></view>
					<view class="question-grid">
						<view v-for="(question, index) in questions" :key="question.questionId" :class="{ answered: !!answers[index] }" @tap="jumpToQuestion(index)">{{ index + 1 }}</view>
					</view>
					<view class="answer-stats"><text>已答 <text class="answer-count">{{ answeredCount }}题</text></text><view class="answer-divider"></view><text>未答 <text class="answer-count unanswered">{{ questions.length - answeredCount }}题</text></text></view>
					<view class="danger-notice"><text class="danger-mark">!</text><text>{{ isTestMode ? '交卷后可再次测试，本次答卷不可修改' : '交卷后不可修改，今日仅此1次机会' }}</text></view>
					<text v-if="!isTestMode && answeredCount === 0" class="ranking-rule">尚未作答。空白交卷不计入排名，且会用掉今天的答题机会。</text>
				</view>
				<view class="submit-confirm panel">
					<text>确认交卷？</text>
					<view><button class="secondary-button" @tap="go('quiz')">继续作答</button><button class="danger-button" :disabled="submitting" @tap="submitQuiz">{{ submitting ? '交卷中…' : '确认交卷' }}</button></view>
				</view>
			</view>

			<!-- ================= 竞答结果 ================= -->
			<view v-else-if="screen === 'result'" class="page-content flow-content">
				<view class="result-panel panel">
					<view class="result-badge">✓</view>
					<text class="result-title">{{ result.status === '2' ? '超时自动交卷' : '交卷成功' }}</text>
					<view class="result-score"><text>{{ result.score }}</text><text class="score-unit">分</text></view>
					<text class="result-copy">本次答对 {{ result.correctCount }} / {{ result.questionCount }} 题，用时 {{ formatSeconds(result.useTime) }}</text>
					<text v-if="isRuleTrial" class="result-copy">今日测试已完成，明天零点恢复一次机会。下方为独立测试排名。</text>
					<text v-if="isTestMode" class="result-copy">测试成绩不计入正式排名，可再次开始答题。</text>
					<view v-else class="result-summary"><view><text class="summary-value">{{ result.completedCount || 0 }} / 7</text><text>有效完成天数</text></view><view class="summary-divider"></view><view><text class="summary-value">{{ formatSeconds(result.totalUseTime) }}</text><text>累计用时</text></view><view class="summary-divider"></view><view><text class="summary-value">{{ result.rankNo || '-' }}</text><text>累计排名</text></view></view>
					<text v-if="!isTestMode" class="result-copy">累计得分 {{ result.cumulativeScore || 0 }} 分</text>
					<text v-if="!isTestMode && result.answeredCount === 0" class="result-copy">本次为空白卷，不计入累计次数、分数和用时，今日机会已使用。</text>
					<view v-if="result.rewarded" class="reward-hit">当前进入前 {{ result.rewardCount }} 名，最终奖励以活动结束后的榜单为准</view>
					<button v-if="isTestMode" class="primary-button" @tap="startFlow">再次测试</button>
					<button v-else class="primary-button" @tap="go('ranking')">查看排行榜</button>
					<button class="secondary-button" @tap="go('home')">返回首页</button>
				</view>
			</view>

			<!-- ================= 排行榜 ================= -->
			<view v-else-if="screen === 'ranking'" class="page-content flow-content">
				<view class="list-panel panel">
					<view class="panel-heading"><image src="/static/ui/icon-chart.png" mode="aspectFit" /><text>实时排行榜</text></view>
					<text class="ranking-rule">{{ isTestMode ? '当前为测试模式，测试记录不计入正式排名' : '有效完成次数多优先，再比累计得分高，最后比累计用时短。空白卷不计入排名。' }}</text>
					<text v-if="isRuleTrial" class="ranking-rule">独立测试榜单，与9月14日至20日正式活动成绩分开。</text>
					<view v-if="myRank" class="my-rank"><text>我的排名：第 {{ myRank.rankNo }} 名</text><text class="my-rank-metrics">有效完成 {{ myRank.completedCount }} 次 · 累计 {{ myRank.score || 0 }} 分 · {{ myRank.useTimeText }}</text></view>
					<view v-if="!ranking.length" class="rank-empty large">暂无上榜成绩</view>
					<view v-for="(row, index) in ranking" :key="`${row.userId}-${index}`" class="ranking-line" :class="{ mine: row.mine }">
						<view class="ranking-index">{{ row.rankNo }}</view><view class="ranking-user"><text>{{ row.nickName }}</text><text class="ranking-time">累计 {{ row.score || 0 }} 分 · 用时 {{ row.useTimeText }}</text></view><text class="ranking-points">{{ row.completedCount }}次</text>
					</view>
				</view>
			</view>

			<!-- ================= 活动奖励 ================= -->
			<view v-else-if="screen === 'rewards'" class="page-content flow-content">
				<view class="reward-detail panel">
					<image class="reward-detail-image" src="/static/ui/reward-trophy-clean.png" mode="aspectFit" aria-hidden="true" />
					<text class="detail-title">活动奖励</text>
					<text class="detail-copy">{{ activity.rewardContent }}</text>
					<button class="primary-button" @tap="go('home')">我知道了</button>
				</view>
			</view>

			<!-- ================= 活动信息 ================= -->
			<view v-else-if="screen === 'info'" class="page-content flow-content">
				<view class="info-panel panel">
					<text class="detail-title">{{ activity.activityName }}</text>
					<text class="detail-copy">{{ activity.noticeContent }}</text>
					<view v-for="item in notices" :key="item.noticeId" class="notice-item">
						<text class="notice-title">{{ item.title }}</text>
						<text class="notice-content">{{ item.content }}</text>
					</view>
					<button class="secondary-button" @tap="go('home')">返回首页</button>
				</view>
			</view>

			<!-- ================= 我的 ================= -->
			<view v-else class="page-content flow-content">
				<view class="info-panel panel">
					<image v-if="user.avatar" class="avatar-image large" :src="user.avatar" mode="aspectFill" />
					<view v-else class="avatar large"><view class="avatar-head"></view><view class="avatar-body"></view></view>
					<text class="detail-title">{{ user.realName || '网安参与者' }}</text>
					<text v-if="isTestMode" class="detail-copy">当前为测试模式，不限日期、次数和答题时长；测试记录不计入正式排名。</text>
					<text v-else-if="status.logged === true && !statusError" class="detail-copy">每日1次，今日已使用 {{ status.usedCount || 0 }} 次。有效完成 {{ status.completedCount || 0 }} / 7天，累计 {{ status.cumulativeScore || 0 }} 分，用时 {{ formatSeconds(status.totalUseTime) }}。</text>
					<view class="profile-summary">
						<view class="profile-summary-row"><text>姓名</text><text>{{ user.realName || '尚未参赛' }}</text></view>
						<view class="profile-summary-row"><text>手机号</text><text>{{ maskedPhone }}</text></view>
					</view>
					<text class="profile-readonly-note">参赛信息将在开始答题前统一确认，此页面仅用于查看。</text>
					<button class="secondary-button" @tap="go('home')">返回首页</button>
				</view>
			</view>

			<view v-if="showMainNav" class="main-nav">
				<view class="nav-item" :class="{ active: screen === 'home' }" @tap="go('home')"><image src="/static/ui/icon-home.png" mode="aspectFit" /><text>首页</text></view>
				<view class="nav-item contest" @tap="openContest"><view class="contest-circle"><image src="/static/ui/icon-pencil.png" mode="aspectFit" /></view><text>竞答</text></view>
				<view class="nav-item" :class="{ active: screen === 'ranking' }" @tap="go('ranking')"><image src="/static/ui/icon-chart.png" mode="aspectFit" /><text>排行榜</text></view>
				<view class="nav-item" :class="{ active: screen === 'profile' }" @tap="go('profile')"><image src="/static/ui/icon-user.png" mode="aspectFit" /><text>我的</text></view>
			</view>

			<view v-if="screen === 'quiz'" class="exam-nav">
				<view @tap="go('submit')"><image src="/static/ui/icon-list.png" mode="aspectFit" /><text>答题卡</text></view><view class="exam-divider"></view><view @tap="go('submit')"><image src="/static/ui/icon-flag.png" mode="aspectFit" /><text>交卷</text></view>
			</view>

			<view v-if="loading" class="page-loading"><view class="loading-spinner"></view><text>加载中…</text></view>
		</view>
	</view>
</template>

<script>
import {
	getHome, getExamStatus, startExam, getPaper, saveAnswer,
	submitExam, getResult, getRankList, getNotices, updateProfile
} from '@/api/quiz.js'
import { getUser, setUser } from '@/utils/request.js'

const DEFAULT_ACTIVITY = {
	testMode: false,
	activityName: '网络安全知识竞答',
	subTitle: '',
	questionCount: 20,
	questionScore: 5,
	duration: 600,
	attemptLimit: 1,
	participationDays: 7,
	rewardCount: 100,
	rules: ['活动共7天，每人每天1次答题机会，北京时间每天零点刷新', '每天20题，限时10分钟，中途退出不暂停计时', '有效完成次数多优先，次数相同则累计得分高优先，再比较累计用时短', '次数、得分与用时均相同时，最后一次有效交卷更早者优先', '至少作答1题的已交卷或超时交卷计为有效完成；空白卷不计排名，仍占当天机会', '最终奖励以活动结束后的榜单为准'],
	rewardContent: '',
	noticeContent: '',
	activityStatus: 'running'
}

export default {
	data() {
		return {
			screen: 'home',
			loading: true,
			statusLoading: true,
			statusError: '',
			statusRequestId: 0,
			starting: false,
			submitting: false,
			agreed: false,
			profileConsent: false,
			clock: '',
			activity: { ...DEFAULT_ACTIVITY },
			status: { canJoin: false, completed: false, answering: false, usedCount: 0, completedCount: 0, totalUseTime: 0, attemptLimit: 1, reason: '' },
			serverOffset: 0,
			user: {},
			ranking: [],
			myRank: null,
			notices: [],
			paperId: null,
			questions: [],
			answers: [],
			currentIndex: 0,
			remainingSeconds: 0,
			paperTimeLimited: true,
			deadlineAt: 0,
			timerId: null,
			clockId: null,
			result: { score: 0, correctCount: 0, questionCount: 0, answeredCount: 0, useTime: 0, rankNo: 0, rewardCount: 0, rewarded: false, status: '1' },
			profile: { realName: '', phone: '', unitName: '' },
			quickItems: [
				{ key: 'rules', label: '竞答规则', icon: '/static/ui/icon-clipboard.png' },
				{ key: 'ranking', label: '排行榜', icon: '/static/ui/icon-chart.png' },
				{ key: 'rewards', label: '活动奖励', icon: '/static/ui/icon-gift.png' },
				{ key: 'info', label: '活动信息', icon: '/static/ui/icon-megaphone.png' }
			]
		}
	},
	computed: {
		isTestMode() {
			return typeof this.status.testMode === 'boolean' ? this.status.testMode : this.activity.testMode === true
		},
		isRuleTrial() {
			return (this.activity.activityName || '').startsWith('【规则测试】')
		},
		displayRules() {
			const rules = (this.activity.rules || []).filter(rule => !(this.activity.rewardCount === 0 && /排名前0名/.test(rule)))
			return this.isRuleTrial ? ['当前为独立规则测试，不发放奖励，成绩仅进入测试榜单', ...rules] : rules
		},
		pageTitle() {
			const titles = { home: '网安林芝', rules: '竞答规则', confirm: '参赛确认', quiz: '正式竞答', submit: '确认交卷', result: '竞答结果', ranking: '排行榜', rewards: '活动奖励', info: '活动信息', profile: '我的' }
			return titles[this.screen] || '网安林芝'
		},
		currentQuestion() {
			return this.questions[this.currentIndex] || { title: '', options: [], questionType: '1' }
		},
		answeredCount() {
			return this.answers.filter(answer => !!answer).length
		},
		progress() {
			return this.questions.length ? Math.round(((this.currentIndex + 1) / this.questions.length) * 100) : 0
		},
		formattedTime() {
			return this.formatSeconds(this.remainingSeconds)
		},
		remainAttempt() {
			return Math.max((this.status.attemptLimit || 1) - (this.status.usedCount || 0), 0)
		},
		maskedPhone() {
			const phone = this.user.phone || ''
			return /^1[3-9]\d{9}$/.test(phone) ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : '尚未参赛'
		},
		statusHeading() {
			if (this.statusError) return '答题记录暂未刷新'
			if (this.status.logged !== true) return '正在读取答题记录'
			if (this.status.answering) return '答题进行中'
			if (this.isTestMode && this.status.canJoin) return '测试通道已开放'
			if (this.status.completed) return '今日已完成答题'
			if (!this.status.canJoin) return this.status.reason || '暂不可参赛'
			return '今日尚未答题'
		},
		statusCopy() {
			if (this.statusError) {
				const previous = this.status.logged === true ? `上次读取：${this.status.completedCount || 0}/7天，${this.status.cumulativeScore || 0}分 · ${this.formatSeconds(this.status.totalUseTime)}。` : ''
				return `${previous}${this.statusError}。点击重试，请勿清除缓存或重复注册。`
			}
			if (this.status.logged !== true) return '正在核对登录与历史记录，请稍候'
			if (this.status.answering) return '点击继续完成本次答题'
			if (this.isTestMode && this.status.canJoin) return '不限次数、不限时，可反复答题；不计正式排名'
			if (this.status.completed && this.status.result) {
				if (this.status.result.answeredCount === 0) return '今日空白交卷，不计入排名；今日机会已使用'
				return `有效完成 ${this.status.completedCount || 0}/7天，累计 ${this.status.cumulativeScore || 0}分 · ${this.formatSeconds(this.status.totalUseTime)}`
			}
			if (!this.status.canJoin) return this.status.reason || '请关注活动时间'
			return `已完成 ${this.status.completedCount || 0}/7天 · 今日${this.activity.questionCount}题，限时${Math.round(this.activity.duration / 60)}分钟`
		},
		showMainNav() {
			return ['home', 'rules', 'confirm', 'ranking', 'profile', 'rewards', 'info', 'result'].includes(this.screen)
		}
	},
	onLoad() {
		this.tickClock()
		this.clockId = setInterval(this.tickClock, 30000)
		this.bootstrap()
	},
	onShow() {
		// 从后台切回时重新校准剩余时间，避免计时器被系统冻结导致偏差
		if (['quiz', 'submit'].includes(this.screen) && this.paperId) {
			this.syncPaper()
		} else if (!this.loading) {
			this.refreshStatus()
		}
	},
	onHide() {
		this.stopTimer()
	},
	onUnload() {
		this.stopTimer()
		if (this.clockId) clearInterval(this.clockId)
	},
	beforeDestroy() {
		this.stopTimer()
		if (this.clockId) clearInterval(this.clockId)
	},
	unmounted() {
		this.stopTimer()
		if (this.clockId) clearInterval(this.clockId)
	},
	methods: {
		// ---------------- 初始化 ----------------
		async bootstrap() {
			this.loading = true
			try {
				await this.loadHome()
			} catch (error) {
				// loadHome 已记录错误，保留此前读到的成绩与时间。
			} finally {
				this.loading = false
			}
		},
		applyFallback(error) {
			this.statusError = error?.code === 401 ? '登录恢复失败' : '暂时无法读取最新记录，请检查网络'
		},
		async loadHome() {
			const requestId = ++this.statusRequestId
			this.statusLoading = true
			try {
				const res = await getHome(3)
				if (requestId !== this.statusRequestId) return
				const data = res.data || {}
				this.activity = { ...DEFAULT_ACTIVITY, ...(data.activity || {}) }
				this.serverOffset = (this.activity.serverTime || Date.now()) - Date.now()
				this.status = data.status || this.status
				this.ranking = data.ranking || []
				this.notices = data.notices || []
				this.myRank = data.myRank || null
				if (data.user) {
					this.user = data.user
					setUser(data.user)
					this.profile = {
						realName: data.user.realName || '',
						phone: data.user.phone || '',
						unitName: data.user.unitName || ''
					}
				}
				if (this.status.completed && this.status.result) {
					this.result = { ...this.result, ...this.status.result }
				}
				this.statusError = ''
			} catch (error) {
				if (requestId === this.statusRequestId) this.applyFallback(error)
				throw error
			} finally {
				if (requestId === this.statusRequestId) this.statusLoading = false
			}
		},
		async refreshStatus() {
			// 未完成首页初始化或曾读取失败时，连同用户信息一起恢复。
			if (!this.user.userId || this.statusError) {
				try { await this.loadHome(); return !this.statusError } catch (error) { return false }
			}
			const requestId = ++this.statusRequestId
			this.statusLoading = true
			try {
				const res = await getExamStatus()
				if (requestId !== this.statusRequestId) return false
				this.status = res.data || this.status
				this.user = getUser() || this.user
				if (typeof this.status.testMode === 'boolean' && this.status.testMode !== this.activity.testMode) {
					await this.loadHome()
				}
				if (this.status.completed && this.status.result) {
					this.result = { ...this.result, ...this.status.result }
				}
				this.statusError = ''
				return true
			} catch (e) {
				if (requestId === this.statusRequestId) this.applyFallback(e)
				return false
			} finally {
				if (requestId === this.statusRequestId) this.statusLoading = false
			}
		},
		async retryRecords() {
			if (this.statusLoading) return
			if (await this.refreshStatus() && this.screen === 'ranking') await this.loadRanking()
		},

		// ---------------- 导航 ----------------
		go(screen) {
			this.screen = screen
			uni.pageScrollTo({ scrollTop: 0, duration: 0 })
			if (screen === 'ranking') this.loadRanking()
			if (screen === 'info') this.loadNotices()
			if (screen === 'home') this.refreshStatus()
			// 作答页与答题卡页都保持计时，其余页面停止
			const timing = screen === 'quiz' || screen === 'submit'
			if (!timing) this.stopTimer()
			if (timing && this.paperId && this.deadlineAt && !this.timerId) this.startTimer()
		},
		async startFlow() {
			if (this.loading || this.starting) return
			if (!await this.refreshStatus()) {
				uni.showToast({ title: '无法获取今日答题机会，请稍后重试', icon: 'none' })
				return
			}
			if (this.status.answering) {
				this.paperId = this.status.paperId
				this.resumeExam()
			} else if (this.status.completed) {
				this.paperId = this.status.paperId
				this.openResult()
			} else if (!this.status.canJoin) {
				uni.showToast({ title: this.status.reason || '当前不可答题', icon: 'none' })
			} else {
				this.paperId = null
				this.go('rules')
			}
		},
		openQuick(key) {
			this.go(key)
		},
		openContest() {
			this.startFlow()
		},
		continueFromRules() {
			if (!this.agreed) {
				uni.showToast({ title: '请先阅读并同意竞答规则', icon: 'none' })
				return
			}
			this.go('confirm')
		},

		// ---------------- 答题 ----------------
		async beginQuiz() {
			if (!this.status.canJoin || this.starting || this.statusLoading || this.statusError) return
			const realName = (this.profile.realName || '').trim()
			const phone = (this.profile.phone || '').trim()
			if (!realName) {
				uni.showToast({ title: '请填写真实姓名', icon: 'none' })
				return
			}
			if (!/^1[3-9]\d{9}$/.test(phone)) {
				uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
				return
			}
			if (!this.profileConsent) {
				uni.showToast({ title: '请先同意参赛信息授权', icon: 'none' })
				return
			}
			this.starting = true
			try {
				const profileRes = await updateProfile({ realName, phone })
				this.user = profileRes.data
				this.profile = { ...this.profile, realName, phone }
				setUser(profileRes.data)
				const res = await startExam()
				this.applyPaper(res.data)
				this.go('quiz')
				this.startTimer()
			} catch (error) {
				await this.refreshStatus()
			} finally {
				this.starting = false
			}
		},
		async resumeExam() {
			this.starting = true
			try {
				const res = await startExam()
				this.applyPaper(res.data)
				this.go('quiz')
				this.startTimer()
			} catch (error) {
				await this.refreshStatus()
			} finally {
				this.starting = false
			}
		},
		applyPaper(paper) {
			this.paperTimeLimited = paper.timeLimited !== false
			this.paperId = paper.paperId
			this.questions = paper.questions || []
			this.answers = this.questions.map(q => q.userAnswer || '')
			this.remainingSeconds = paper.remainSeconds || 0
			// 以绝对时间戳为准：定时器被系统冻结、页面切换都不会导致倒计时失真
			this.deadlineAt = this.paperTimeLimited ? Date.now() + this.remainingSeconds * 1000 : 0
			const firstUnanswered = this.answers.findIndex(a => !a)
			this.currentIndex = firstUnanswered >= 0 ? firstUnanswered : 0
		},
		async syncPaper() {
			if (!this.paperId) return
			try {
				const res = await getPaper(this.paperId)
				const paper = res.data
				if (paper.status !== '0') {
					this.stopTimer()
					await this.openResult()
					return
				}
				const index = this.currentIndex
				this.applyPaper(paper)
				this.currentIndex = Math.min(index, this.questions.length - 1)
				if (!this.timerId) this.startTimer()
			} catch (e) {
				// 同步失败（如断网）时也要把计时器接回来，
				// 否则从后台切回后倒计时会一直停住
				if (!this.timerId && this.deadlineAt) this.startTimer()
			}
		},
		startTimer() {
			this.stopTimer()
			if (!this.paperTimeLimited) return
			this.tickTimer()
			this.timerId = setInterval(() => this.tickTimer(), 1000)
		},
		tickTimer() {
			if (!this.paperTimeLimited) return
			const remain = Math.max(Math.round((this.deadlineAt - Date.now()) / 1000), 0)
			this.remainingSeconds = remain
			if (remain <= 0) {
				this.stopTimer()
				uni.showToast({ title: '答题时间已结束，正在自动交卷', icon: 'none' })
				this.submitQuiz(true)
			}
		},
		stopTimer() {
			if (this.timerId) {
				clearInterval(this.timerId)
				this.timerId = null
			}
		},
		typeText(type) {
			return { '1': '单选题', '2': '多选题', '3': '判断题' }[type] || '单选题'
		},
		isSelected(label) {
			const answer = this.answers[this.currentIndex] || ''
			return answer.split(',').indexOf(label) >= 0
		},
		selectAnswer(label) {
			const question = this.currentQuestion
			let next
			if (question.questionType === '2') {
				const selected = (this.answers[this.currentIndex] || '').split(',').filter(Boolean)
				const index = selected.indexOf(label)
				if (index >= 0) {
					selected.splice(index, 1)
				} else {
					selected.push(label)
				}
				next = selected.sort().join(',')
			} else {
				next = this.answers[this.currentIndex] === label ? '' : label
			}
			this.answers.splice(this.currentIndex, 1, next)
			// 静默同步到服务端，网络异常时交卷会整体补交
			saveAnswer(this.paperId, question.questionId, next).catch(() => {})
		},
		previousQuestion() {
			if (this.currentIndex > 0) this.currentIndex -= 1
		},
		nextQuestion() {
			if (this.currentIndex < this.questions.length - 1) {
				this.currentIndex += 1
			} else {
				this.go('submit')
			}
		},
		jumpToQuestion(index) {
			this.currentIndex = index
			this.go('quiz')
		},
		async submitQuiz(auto = false) {
			if (this.submitting || !this.paperId) return
			this.submitting = true
			this.stopTimer()
			try {
				const answers = this.questions.map((question, index) => ({
					questionId: question.questionId,
					userAnswer: this.answers[index] || ''
				}))
				const res = await submitExam(this.paperId, answers)
				this.result = { ...this.result, ...res.data }
				await this.refreshStatus()
				this.go('result')
				if (!auto) {
					uni.showToast({ title: '交卷成功', icon: 'success' })
				}
			} catch (error) {
				// 交卷失败可能是两种情况：
				// 1) 服务端已按超时结算 —— 直接拉取最终成绩即可
				// 2) 网络异常 —— 必须明确告知用户，不能静默把人丢回首页
				const loaded = await this.openResult(true)
				if (!loaded) {
					uni.showModal({
						title: '交卷失败',
						content: '网络异常，你的作答已保留，请检查网络后重新点击交卷',
						showCancel: false
					})
					// 时间没到就把计时接回来，让用户可以重试
					if (this.deadlineAt && this.deadlineAt - Date.now() > 0) {
						this.startTimer()
					}
				}
			} finally {
				this.submitting = false
			}
		},
		/**
		 * 拉取成绩并跳转结果页
		 * @param {Boolean} silent 为 true 时失败不跳首页，由调用方决定如何提示
		 * @returns {Boolean} 是否成功拿到成绩
		 */
		async openResult(silent = false) {
			const paperId = this.paperId || this.status.paperId
			if (!paperId) {
				if (!silent) this.go('home')
				return false
			}
			try {
				const res = await getResult(paperId)
				this.result = { ...this.result, ...res.data }
				await this.refreshStatus()
				this.go('result')
				return true
			} catch (e) {
				if (!silent) this.go('home')
				return false
			}
		},

		// ---------------- 榜单 / 公告 ----------------
		async loadRanking() {
			try {
				const res = await getRankList(100)
				this.ranking = (res.data && res.data.list) || []
				this.myRank = (res.data && res.data.myRank) || null
			} catch (e) {
				this.applyFallback(e)
			}
		},
		async loadNotices() {
			try {
				const res = await getNotices()
				this.notices = res.data || []
			} catch (e) {
				// 保留已有数据
			}
		},
		// ---------------- 工具 ----------------
		formatSeconds(seconds) {
			const value = Math.max(seconds || 0, 0)
			const m = Math.floor(value / 60).toString().padStart(2, '0')
			const s = (value % 60).toString().padStart(2, '0')
			return `${m}:${s}`
		},
		tickClock() {
			const now = new Date()
			this.clock = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
			const serverDate = new Date(Date.now() + this.serverOffset + 8 * 3600000).toISOString().slice(0, 10)
			if (!this.loading && this.status.serverDate && this.status.serverDate !== serverDate
				&& !['quiz', 'submit'].includes(this.screen)) this.refreshStatus()
		}
	}
}
</script>

<style src="./index.css"></style>
