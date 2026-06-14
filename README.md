# Multivac

> 一款基于 Astro 和 Tailwind CSS 构建的纯静态个人博客，支持深色模式、动态说说、友链管理等功能

![Astro](https://img.shields.io/badge/Astro-5.18+-BC52EE?logo=astro&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 特性

### 核心能力

- **零框架水合** — 纯 Astro 组件 + 原生 `<script>`，无 React/Vue 运行时开销，交互逻辑按需加载
- **深色模式** — 跟随系统 / 手动切换，View Transitions API 圆形扩散过渡动画，路由切换无闪烁
- **响应式三栏布局** — 大屏三栏（左栏 + 内容 + 右栏），中屏两栏，小屏单栏，自适应折叠
- **资源压缩** — astro-compress 压缩 HTML/CSS/JS/SVG
- **预取策略** — 视口内链接自动预取（`defaultStrategy: viewport`），避免全量预取抢占带宽
- **RSS & Sitemap** — 自动生成订阅源和站点地图

### 博客

- **Markdown / MDX / YAML** — Content Collections 统一管理，Schema 强校验
- **文章加密** — AES-256-GCM + PBKDF2 (600k iterations)，构建时加密、客户端解密，服务端不暴露明文
- **自动目录** — 标题自动生成 TOC，滚动高亮当前位置，侧栏 + 浮动双模式
- **阅读时间** — 中英文混合统计，自动计算字数与预计阅读时长
- **文章元数据卡片** — 作者、发布/更新日期、CC 协议、永久链接
- **相关推荐** — 文章底部随机推荐其他文章
- **全文搜索** — 客户端 JSON 索引，`Ctrl+K` / 点击触发即时搜索
- **分类 & 标签** — 自动聚合，独立页面，支持按分类/标签筛选
- **归档** — 按时间线展示全部文章
- **分页** — 首页文章列表分页，动态/观影页也支持分页

### 社交 & 互动

- **动态说说** — 类朋友圈短内容发布，支持多图 + Fancybox 6 灯箱浏览
- **友链管理** — 分组展示，自定义申请说明，卡片悬停动效
- **Twikoo 评论** — 文章页 & 观影页评论区，懒加载 + 路由切换自动重挂载
- **首页动态滚动条** — 实时展示最新动态 & 年进度

### 特色页面

- **观影记录** — 影视/动漫追踪，豆瓣 & Bangumi 评分/链接，卡片式展示
- **今晚看什么** — 观影详情页，随机推荐下一部，沉浸式单条展示
- **赛博塔罗** — 22 张大阿卡那随机抽牌，正逆位解读，粒子动画，`rerun_random_seed()` 重抽
- **时间进度** — 年/季/月/周/日进度可视化，中式命名（岁律/时节/月令/七曜/朝暮），水墨风格

### 侧栏组件

- **个人卡片** — Matrix 文字乱码重组动画 + 头像 Emoji 切换 + 鼠标视差
- **音乐播放器** — APlayer 集成，网易云歌单直连，播放进度/上下首控制
- **分类导航** — 自动统计各分类文章数
- **一言** — Hitokoto 随机语录
- **最近在看** — 观影记录摘要，点击跳转详情
- **公告** — 自定义公告内容
- **标签云** — 标签使用频率排序
- **随机文章** — 右侧栏随机推荐

### 动效 & 体验

- **欢迎动画** — 首次访问时头像 + 站名 + 签名 + 时段问候语渐入动画
- **导航栏** — 固定顶部，滚动时毛玻璃效果，菜单面板，页面标题显示
- **主题切换** — View Transitions API 圆形 clip-path 扩散动画
- **页面过渡** — ClientRouter (View Transitions) 无刷新路由切换
- **背景光晕** — 三个模糊光球缓慢浮动，营造氛围感
- **卡片悬停** — 上浮 + 阴影增强 + 边框显现

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | [Astro 5](https://astro.build) — 静态站点生成，Content Collections |
| 样式 | [Tailwind CSS 3](https://tailwindcss.com) + @tailwindcss/typography + PostCSS Nesting |
| 语言 | TypeScript 5.9 |
| 内容 | Markdown / MDX / YAML |
| 加密 | Web Crypto API (AES-256-GCM + PBKDF2, 600k iterations) |
| 评论 | [Twikoo](https://twikoo.js.org) — 懒加载，路由切换自动重挂载 |
| 灯箱 | [@fancyapps/ui](https://fancyapps.com) (Fancybox 6) |
| 音乐 | [APlayer](https://aplayer.js.org) — 网易云歌单 |
| 图标 | astro-icon (SVG sprite) |
| 字体 | Inter Variable (西文) + Plus Jakarta Sans (Logo) + 系统中文回退 |
| 压缩 | astro-compress (HTML/CSS/JS/SVG) |
| 部署 | Vercel (SSG + Web Analytics) / Cloudflare Pages / 通用静态托管 |

## 项目结构

```
site/
├── post/                          # 内容目录（.gitignore 忽略私有文章）
│   └── example/                   # 示例文章（仅 Dev 可见，Build 自动剔除）
├── public/
│   ├── fonts/                     # Inter Variable, Plus Jakarta Sans (woff2)
│   ├── img/                       # 头像、封面、emoji、站点图标
│   │   └── emoji/                 # 3D Emoji (cat, cool, cry, laugh, nerd, yummy)
│   ├── libs/                      # APlayer CSS/JS, Twikoo 基础样式
│   ├── _headers                   # Cloudflare Pages 缓存头
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── LeftSidebar.astro      # 个人卡片 + 音乐 + 分类 + 一言 + 最近在看
│   │   ├── RightSidebar.astro     # 公告 + 标签云 + 随机文章 + 站点统计
│   │   ├── BlogCard.astro         # 文章卡片（封面 + 标题 + 摘要 + 元信息）
│   │   ├── ArticleMetaCard.astro  # 文章元数据卡片（作者/日期/协议/链接）
│   │   ├── RecentPosts.astro      # 文章底部相关推荐
│   │   ├── PasswordProtect.astro  # 文章加密输入组件（密码显隐切换）
│   │   ├── ThemeToggle.astro      # 深色模式切换（圆形扩散动画）
│   │   ├── SearchModal.astro      # 全文搜索弹窗（Ctrl+K）
│   │   ├── Twikoo.astro           # 评论区（懒加载 + 路由重挂载）
│   │   ├── MomentsTicker.astro    # 首页动态滚动条（动态 + 年进度）
│   │   ├── WelcomeAnimation.astro # 首次访问欢迎动画
│   │   ├── TableOfContents.astro  # 浮动 TOC（移动端）
│   │   ├── SidebarOfContents.astro# 侧栏 TOC（桌面端）
│   │   ├── Header.astro           # 顶部导航（毛玻璃 + 菜单面板 + 页面标题）
│   │   ├── HeaderLink.astro       # 导航链接
│   │   ├── Footer.astro           # 页脚（技术栈图标 + CC 协议）
│   │   ├── Pagination.astro       # 分页组件
│   │   ├── FormattedDate.astro    # 日期格式化
│   │   ├── ArchiveItem.astro      # 归档列表项
│   │   └── BaseHead.astro         # HTML Head（SEO + OG + 结构化数据）
│   ├── layouts/
│   │   ├── MainLayout.astro       # 全局布局（Header + Footer + 背景光晕）
│   │   └── BlogPost.astro         # 文章详情布局（TOC + 元数据 + 评论 + 推荐）
│   ├── pages/
│   │   ├── index.astro            # 首页（文章列表 + 动态滚动条 + 三栏）
│   │   ├── p/[...slug].astro      # 文章详情（加密/普通）
│   │   ├── page/[page].astro      # 文章分页
│   │   ├── moments/index.astro    # 动态说说（Fancybox 灯箱）
│   │   ├── friends/index.astro    # 友链（分组 + 申请说明）
│   │   ├── watching/index.astro   # 观影记录（卡片网格 + 评分）
│   │   ├── tonight/index.astro    # 今晚看什么（随机推荐 + 详情）
│   │   ├── tarot/index.astro      # 赛博塔罗牌
│   │   ├── progress/index.astro   # 时间进度（水墨风格）
│   │   ├── about/index.astro      # 关于页
│   │   ├── archives/index.astro   # 归档页
│   │   ├── categories/
│   │   │   ├── index.astro        # 分类列表
│   │   │   └── [slug].astro       # 分类详情
│   │   ├── tags/
│   │   │   ├── index.astro        # 标签列表
│   │   │   └── [slug].astro       # 标签详情
│   │   ├── rss.xml.js             # RSS 订阅源
│   │   ├── search-data.json.ts    # 搜索索引 API
│   │   └── robots.txt.ts          # Robots.txt
│   ├── scripts/
│   │   └── crypto.ts              # AES-256-GCM 加密/解密（PBKDF2 派生密钥）
│   ├── styles/
│   │   ├── global.css             # 全局样式 + 背景光晕 + 滚动条
│   │   ├── markdown.css           # Markdown 排版样式
│   │   └── twikoo.css             # Twikoo 评论自定义样式
│   ├── utils/
│   │   ├── readingTime.ts         # 阅读时间计算（中英文混合计数）
│   │   └── progressCalc.ts        # 时间进度计算（年/季/月/周/日）
│   ├── icons/                     # 60+ SVG 图标源文件
│   ├── consts.ts                  # 站点标题 & 描述
│   └── content.config.ts          # Content Collections Schema 定义
├── astro.config.mjs               # Astro 配置（集成/压缩/适配器/预取）
├── tailwind.config.js             # 主题色/字体/字号体系/暗色模式
├── postcss.config.js              # PostCSS (autoprefixer + nesting)
├── tsconfig.json                  # TypeScript 配置
├── vercel.json                    # Vercel 缓存策略
└── package.json
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm / pnpm

### 安装与开发

```bash
git clone git@github.com:LogLInk1K/multivac.git
cd multivac
npm install
npm run dev        # http://localhost:4321
```

### 构建

```bash
npm run build      # 输出到 dist/
npm run preview    # 本地预览构建结果
```

## 内容管理

所有内容存放在 `post/` 目录。`.gitignore` 已配置忽略 `post/*`（仅保留 `post/example/`），私有文章不会被推送到仓库。

### 文章

在 `post/` 下创建 `.md` 或 `.mdx` 文件：

```yaml
---
title: "文章标题"
description: "简介，至少 10 字符"
pubDate: 2026-01-20
updatedDate: 2026-01-20    # 可选
heroImage: ./cover.jpg     # 可选
tags: ["标签1", "标签2"]
category: "分类"
draft: false
author: "作者名"
password: "secret"         # 可选，加密文章
passwordHint: "提示信息"    # 可选
---
```

#### 文章加密

加密文章使用 AES-256-GCM，密钥通过 PBKDF2 (600k iterations, SHA-256) 从密码派生：

1. 构建时：`crypto.ts` 的 `encryptContent()` 用密码加密正文，输出 `base64(salt[16] + iv[12] + ciphertext)`
2. 客户端：`PasswordProtect.astro` 收集密码，调用 `decryptContent()` 解密，渲染原文
3. 服务端不存储明文密码，加密载荷嵌入 HTML

### 动态说说

编辑 `post/moments/index.yml`：

```yaml
---
title: 动态说说
description: 记录生活的点点滴滴
moments:
  - content: "今天天气真好！"
    date: 2026/01/20
    images:
      - https://example.com/image.jpg
  - content: "多图动态"
    date: 2026/01/19
    images:
      - https://example.com/img1.jpg
      - https://example.com/img2.jpg
---
```

### 友链

编辑 `post/friends/index.yml`：

```yaml
---
title: 友情链接
description: 相逢意气为君饮
sections:
  - title: 申请友链
    content: |-
      欢迎交换友链！请确保您的网站：
      - 内容积极向上
      - 网站可以正常访问
friendGroups:
  - title: 技术博主
    description: 优秀的技术博客
    friends:
      - name: "友链名称"
        url: "https://example.com"
        avatar: "https://example.com/avatar.jpg"
        description: "友链描述"
---
```

### 观影记录

编辑 `post/watching/index.yml`：

```yaml
---
title: 最近在看
description: 影视动漫追踪
pubDate: 2026-01-01
watching:
  - title: "虫师"
    year: 2005
    cover: "/img/df-cover.webp"
    comment: "远山如雾"
    type: "动画"
    country: "日本"
    ratings:
      - source: douban
        score: 9.4
    links:
      - source: douban
        url: "https://movie.douban.com/subject/1800597/"
---
```

支持 `douban` 和 `bangumi` 两种评分来源，观影页卡片网格展示，点击进入详情页。

## 配置

### 站点信息

`src/consts.ts`：

```typescript
export const SITE_TITLE = '你的博客标题';
export const SITE_DESCRIPTION = '你的博客描述';
```

### 站点 URL & 构建选项

`astro.config.mjs`：

```javascript
export default defineConfig({
  site: 'https://your-domain.com',
  trailingSlash: 'never',
  output: 'static',
  // Vercel 环境自动启用适配器 + Web Analytics
  adapter: isVercel ? vercel({ webAnalytics: { enabled: true } }) : undefined,
  prefetch: { prefetchAll: false, defaultStrategy: 'viewport' },
});
```

### 主题色 & 字体

`tailwind.config.js`：

```javascript
colors: {
  primary:    { light: '#425aef', dark: '#ffc848' },   // 主色
  background: { light: '#f7f9fe', dark: '#000000' },   // 背景
  text:       { light: '#1F2937', dark: '#FFFFFF' },    // 文本
  card:       { light: 'rgba(255,255,255,0.55)', dark: 'rgba(255,255,255,0.04)' },
  border:     { light: 'rgba(0,0,0,0.06)', dark: 'rgba(255,255,255,0.08)' },
  hover:      { light: '#F1F5F9', dark: '#2A2A2A' },
  // ...更多
},
fontFamily: {
  sans: ['Inter Variable', 'PingFang SC', 'Microsoft YaHei', ...],
},
```

### 评论系统

`src/components/Twikoo.astro` 中修改 `envId`：

```astro
const envId = 'https://your-twikoo-endpoint.com';
```

### 个人信息 & 社交链接

`src/components/LeftSidebar.astro` 中修改：
- 头像图片路径
- 昵称 & 个性签名
- GitHub / Bilibili 等社交链接

### 音乐播放器

`src/components/LeftSidebar.astro` 中修改网易云歌单 ID 和封面。

### 导航菜单

`src/components/Header.astro` 中修改导航链接（默认：文稿、友链、漫游、关于）。

## 隐私与内容过滤

| 环境 | `post/example/` | `post/` 其他文章 |
|------|-----------------|-----------------|
| `npm run dev` | 可见 | 不可见（被 .gitignore 忽略） |
| `npm run build` | 自动剔除 | 不可见 |

- `content.config.ts` 中 `isProd` 判断：生产构建排除 `example/**/*`
- `.gitignore` 忽略 `post/*`（仅保留 `!post/example/`），私有内容不进入版本控制
- Content Collections Schema 强制校验 frontmatter 字段类型与约束

## 部署

### Vercel（推荐）

项目已内置 Vercel 适配器，自动检测 `VERCEL=1` 环境变量启用 Web Analytics。

```bash
npm i -g vercel
vercel
```

`vercel.json` 已配置缓存策略：页面 1h，`/_astro/` 静态资源 1 年 immutable。

### Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist
```

`public/_headers` 已配置 Cloudflare 缓存头。

### 通用静态托管

```bash
npm run build
# 将 dist/ 目录上传至任意静态托管服务
```

## 页面一览

| 路由 | 功能 |
|------|------|
| `/` | 首页 — 文章列表 + 动态滚动条 + 三栏布局 |
| `/p/[slug]` | 文章详情 — 正文/加密/评论/TOC/元数据/推荐 |
| `/page/[n]` | 文章分页 |
| `/moments` | 动态说说 — 多图灯箱 + 分页 |
| `/friends` | 友链 — 分组展示 + 申请说明 |
| `/watching` | 观影记录 — 卡片网格 + 评分 + 分页 |
| `/tonight` | 今晚看什么 — 随机推荐 + 沉浸详情 |
| `/tarot` | 赛博塔罗 — 22 张大阿卡那 + 正逆位 + 粒子 |
| `/progress` | 时间进度 — 岁律/时节/月令/七曜/朝暮 |
| `/about` | 关于页 |
| `/archives` | 归档 — 时间线展示 |
| `/categories` | 分类列表 |
| `/categories/[slug]` | 分类详情 |
| `/tags` | 标签列表 |
| `/tags/[slug]` | 标签详情 |
| `/rss.xml` | RSS 订阅源 |
| `/search-data.json` | 搜索索引 API |

## 许可

[MIT](LICENSE)

此仓库按"现状"提供，欢迎 Fork，不保证回复 Issue。

## 联系

- 主页: [1k.ink](https://1k.ink)
- 博客: [log.1k.ink](https://log.1k.ink)
- GitHub: [@LogLInk1K](https://github.com/LogLInk1K)

## 鸣谢

本博客参考以下诸位博主的设计，特此鸣谢：

- [张洪Heo](https://blog.zhheo.com)
- [安和鱼](https://blog.anheyu.com)
- [安子璠](https://www.anzifan.com)
- [Hsinyau](https://hsinyau.com)
