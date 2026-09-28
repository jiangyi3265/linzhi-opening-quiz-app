# linzhi-opening-quiz-app

林芝市网络安全知识竞答用户端，面向 H5、微信小程序和移动端参赛者提供活动说明、登录、答题、成绩与排行榜体验。

## 项目简介

本项目是“2026 年国家网络安全宣传周 · 林芝市网络安全知识竞答”的用户端应用，基于 UniApp 与 Vue 3 构建。页面以“网安林芝”为活动品牌，围绕移动端参赛流程实现首页活动展示、规则说明、真实姓名和手机号确认、每日答题机会、10 分钟限时答题、断点续答、自动恢复会话、交卷结果、累计排行、奖励说明和活动公告。

项目通过 `linzhi-opening-quiz-backend` 的 `/app/*` 接口获取活动、题库、答卷、榜单和用户数据，可同时面向 H5 与微信小程序构建。

## 技术栈

- UniApp 3
- Vue 3
- Vite 5
- @dcloudio/uni-app
- @dcloudio/uni-h5
- @dcloudio/uni-mp-weixin
- vue-i18n
- cross-env
- Node.js / npm
- 微信小程序
- H5

## 关联仓库

| 项目 | 说明 | GitHub |
| --- | --- | --- |
| linzhi-opening-quiz-backend | 后端服务 | [linzhi-opening-quiz-backend](https://github.com/jiangyi3265/linzhi-opening-quiz-backend) |
| linzhi-opening-quiz-admin | 管理后台 | [linzhi-opening-quiz-admin](https://github.com/jiangyi3265/linzhi-opening-quiz-admin) |
| linzhi-opening-quiz-app | 用户端 | [linzhi-opening-quiz-app](https://github.com/jiangyi3265/linzhi-opening-quiz-app) |

## 快速启动

先启动 `linzhi-opening-quiz-backend` 后端服务，再配置本地 API 地址：

```bash
cp .env.example .env
npm install
npm run dev:h5
```

微信小程序开发：

```bash
npm run dev:mp-weixin
```

构建 H5 与微信小程序：

```bash
npm run build:h5
npm run build:mp-weixin
```

`config.js` 中的生产接口地址需要与后端正式域名保持一致；微信小程序发布前，还需要在微信公众平台配置 request 合法域名。

## 项目结构

```text
api/              用户端登录、活动、答题、成绩、排行、公告接口封装
pages/index/      单页竞答主流程，包含首页、规则、确认、答题、结果、榜单等状态
utils/            请求封装、本地 token、设备标识与用户缓存
static/ui/        活动封面、图标、奖杯等界面素材
scripts/          小程序资源同步、本地预览与回归测试脚本
docs/             奖励素材与设计说明
config.js         API 地址、应用名、超时、缓存 key 等运行配置
manifest.json     UniApp 多端应用配置
pages.json        页面与导航配置
```

## 简历描述示例

参与林芝市网络安全知识竞答用户端开发，基于 UniApp/Vue3 实现 H5 与微信小程序答题流程、参赛资料确认、断点续答、成绩反馈和排行榜展示，并通过统一后端 API 完成多端数据同步。
