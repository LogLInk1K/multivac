<div align="center">

# ❯ Multivac

**一款基于 Astro 7 和 Tailwind CSS v4 构建的个人博客**

*支持动态说说 · 观影记录 · 赛博塔罗等功能*

![Astro](https://img.shields.io/badge/Astro-7.0.0+-BC52EE?logo=astro&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-v6-3178C6?logo=typescript&logoColor=white)
![node version](https://img.shields.io/badge/node-22.18.0+-white?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-GPL--3.0-green)

</div>

## 特性

- **文章阅读** — Markdown/MDX 撰写，自动目录、阅读时间、相关推荐，支持 AES-256-GCM 文章加密
- **全文搜索** — `Ctrl+K` 即时搜索，客户端 JSON 索引零延迟
- **分类与标签** — 自动聚合，独立筛选页
- **归档时间线** — 按时间浏览全部文章
- **深色模式** — 跟随系统或手动切换，View Transitions 圆形扩散过渡
- **动态说说** — 类朋友圈短内容，多图 + 自建 Lightbox 灯箱浏览
- **友链管理** — 分组展示，自定义申请说明
- **观影记录** — 影视/动漫追踪，豆瓣 & Bangumi 评分，卡片式展示
- **今晚看什么** — 随机推荐一部，沉浸式单条详情
- **赛博塔罗** — 22 张大阿卡那随机抽牌，正逆位解读，粒子动画
- **时间进度** — 岁/季/月/周/日进度可视化，水墨风格
- **Twikoo 评论** — 文章页 & 观影页评论区
- **音乐播放器** — 侧栏 APlayer，网易云歌单直连
- **首页动态滚动条** — 最新动态 & 年进度轮播
- **个性化侧栏** — 个人卡片（Matrix 文字动画）、分类导航、一言、标签云、随机文章
- **欢迎动画** — 首次访问渐入动画 + 时段问候语
- **页面过渡** — View Transitions 无刷新路由切换，背景光晕浮动
- **RSS & Sitemap** — 自动生成

## 快速开始

### 环境要求

- Node.js >= 22.18.0
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

## 配置文件

所有可配置项集中在根目录 YAML 文件中，由 Zod Schema 强校验，类型错误构建时报错。

### 文件优先级

| 文件 | 用途 | 版本控制 |
|------|------|----------|
| `config.example.yaml` | 仓库默认配置，带注释说明 | 已提交 |
| `config.multivac.yaml` | 个人配置，优先级最高 | gitignore |

使用方式：复制 `config.example.yaml` → 重命名为 `config.multivac.yaml` → 填入实际值。

### 配置项一览

| 分组 | 说明 |
|------|------|
| `site` | 站点域名、标题、描述、Logo、语言、建站年份、分页数 |
| `author` | 昵称、副昵称、头像、标语、矩阵动画文字、简介 |
| `nav` | 顶部导航栏 + 汉堡菜单链接 |
| `social` | 侧栏社交图标 |
| `music` | 歌单链接、Meting API 端点 |
| `comment` | Twikoo 云函数地址与版本 |
| `assets` | 默认封面/关于图、赞赏码、Emoji、十年之约 Logo |
| `footer` | 主页链接、许可证、ICP 备案 |
| `greetings` | 时段问候语 |
| `preconnect` | 预连接域名 |
| `tenYearPledge` | 十年之约链接 |
| `passwordHint` | 加密文章默认提示语 |
| `backup` | 自动化备份配置 |

完整字段与注释见 `config.example.yaml`。

## 功能配置

### 动态说说

新建 `post/moments/index.yml`：

```yaml
---
title: 动态说说
description: 记录生活的点点滴滴
pubDate: 2026-01-01
moments:
  - content: 今天天气真好！
    date: 2026/01/20
  - content: 多图动态
    date: 2026/01/19
    images:
      - https://example.com/img1.jpg
      - https://example.com/img2.jpg
---
```

### 友链

新建 `post/friends/index.yml`：

```yaml
---
title: 友情链接
description: 相逢意气为君饮
pubDate: 2026-01-01
friendGroups:
  - title: 博主
    description: 优秀的博客
    friends:
      - name: 友链名称
        url: https://example.com
        avatar: https://example.com/avatar.jpg
        description: 友链描述
sections:
  - title: 申请友链
    content: |-
      欢迎交换友链！请确保您的网站：
      - 内容积极向上
      - 网站可以正常访问
---
```

### 观影记录

新建 `post/watching/index.yml`：

```yaml
---
title: 最近在看
description: 影视动漫追踪
pubDate: 2026-01-01
watching:
  - title: 虫师
    year: 2005
    cover: https://example.com/img.jpg
    comment: 远山如雾
    type: 动画
    country: 日本
    ratings:
      - source: douban
        score: 9.4
    links:
      - source: douban
        url: https://movie.douban.com/subject/1800597/
---
```

支持 `douban` 和 `bangumi` 两种评分来源，观影页卡片网格展示，点击进入详情页。

### 关于页

新建 `post/about/about.md`：

```markdown
---
title: 关于我
pubDate: 2026-01-01
description: Hello,world.
heroImage: /img/avatar.webp
heroImageWidth: "160"
showDate: false
---

Hello,world.👋
```

## 隐私与内容过滤

| 环境 | `post/example/` | `post/` 其他文章 |
|------|-----------------|-----------------|
| `npm run dev` | 可见 | 本地可见（被 .gitignore 忽略，不进入版本控制） |
| `npm run build` | 自动剔除 | 本地可见（被 .gitignore 忽略，不进入版本控制） |

- 生产构建自动排除 `example/**/*`
- `.gitignore` 忽略 `post/*`（仅保留 `!post/example/`），私有内容不进入版本控制
- Content Collections Schema 强制校验 frontmatter 字段类型与约束

## 私有内容备份（可选配置）

项目支持将本地内容一键安全备份至私有 Git 仓库。

1. 配置备份规则（在 config.multivac.yaml 中修改）：

```yaml
backup:
  enabled: false                  # 自动化备份总开关 (true/false)
  repo_url: "git@github.com:your_username/your_private_repo.git" # 私有备份仓 Git 地址 (推荐 SSH)
  sync_config: false              # 是否同步 config.multivac.yaml 配置文件 (可选，默认 false)
  sync_post: false                # 是否同步 post/ 文件夹 (可选，默认 false)
  sync_twikoo: false              # 是否同步 twikoo_template/ 文件夹 (可选，默认 false)
```

2. 一键运行备份脚本

```bash
npm run backup
```

## 部署

### Vercel（推荐）

项目已内置 Vercel 适配器，自动检测 `VERCEL=1` 环境变量启用 Web Analytics。

```bash
npm i -g vercel
vercel
```

`vercel.json` 已配置缓存策略：页面 1h，`/_astro/` 静态资源 1 年。

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

## 致谢

本项目参考以下诸位博主的设计，特此致谢：

- [张洪Heo](https://blog.zhheo.com)
- [安和鱼](https://blog.anheyu.com)
- [安子璠](https://www.anzifan.com)
- [Hsinyau](https://hsinyau.com)

## 联系

- 主页: [1k.ink](https://1k.ink)
- 博客: [log.1k.ink](https://log.1k.ink)
- GitHub: [@LogLInk1K](https://github.com/LogLInk1K)

## 版权与免责

> 二次创作请保留版权信息

本项目基于 [GPL-3.0](LICENSE) 协议开源

此仓库按 "现状" 提供，暂不保证回复 Issue。