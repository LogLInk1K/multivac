---
title: 'Markdown 风格指南'
description: '这是一份在 Astro 中编写 Markdown 内容时可以使用的基本 Markdown 语法示例。'
pubDate: '2024-06-19'
heroImage: '/img/blog-placeholder-1.jpg'
category: 格物篇
tags: ['Markdown', '语法', '写作']
---

> 这是一份在 Astro 中编写 Markdown 内容时可以使用的基本 Markdown 语法示例。

## 标题

以下 HTML `<h1>`—`<h6>` 元素代表六个级别的章节标题。`<h1>` 是最高级别的标题，而 `<h6>` 是最低级别的标题。

# 一级标题

## 二级标题

### 三级标题

#### 四级标题

##### 五级标题

###### 六级标题

## 段落

这是一个段落示例。在 Markdown 中，段落是由一个或多个连续的文本行组成的，段落之间用一个或多个空行分隔。

这是另一个段落示例。Markdown 会自动处理段落的换行和间距，使文本在渲染时保持良好的可读性。

## 图片

### 语法

```markdown
![替代文本](./完整或相对的图片路径)
```

### 输出

![博客占位图](/img/blog-placeholder-about.jpg)

## 引用块

引用块元素用于表示从其他来源引用的内容，可以选择性地包含引用信息（必须在 `footer` 或 `cite` 元素内），并可以包含内联修改，如注释和缩写。

### 无引用信息的引用块

#### 语法

```markdown
> 这是一段引用的文本。  
> **注意** 你可以在引用块中使用 _Markdown 语法_。
```

#### 输出

> 这是一段引用的文本。  
> **注意** 你可以在引用块中使用 _Markdown 语法_。

### 带引用信息的引用块

#### 语法

```markdown
> 不要通过共享内存来通信，而要通过通信来共享内存。<br>
> — <cite>Rob Pike[^1]</cite>
```

#### 输出

> 不要通过共享内存来通信，而要通过通信来共享内存。<br>
> — <cite>Rob Pike[^1]</cite>

[^1]: 上述引语摘自 Rob Pike 在 2015 年 11 月 18 日 Gopherfest 期间的 [演讲](https://www.youtube.com/watch?v=PAAkCSZUG1c)。

## 表格

### 语法

```markdown
| 斜体      | 粗体     | 代码   |
| --------- | -------- | ------ |
| _italics_ | **bold** | `code` |
```

### 输出

| 斜体      | 粗体     | 代码   |
| --------- | -------- | ------ |
| _italics_ | **bold** | `code` |

## 代码块

### 语法

我们可以在新行使用 3 个反引号 ``` 开始一个代码块，并在新行使用 3 个反引号结束。要突出显示特定语言的语法，可以在第一个反引号后添加语言名称，例如 html、javascript、css、markdown、typescript、txt、bash 等。

````markdown
```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>示例 HTML5 文档</title>
  </head>
  <body>
    <p>测试</p>
  </body>
</html>
```
````

### 输出

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>示例 HTML5 文档</title>
  </head>
  <body>
    <p>测试</p>
  </body>
</html>
```

## 列表类型

### 有序列表

#### 语法

```markdown
1. 第一项
2. 第二项
3. 第三项
```

#### 输出

1. 第一项
2. 第二项
3. 第三项

### 无序列表

#### 语法

```markdown
- 列表项
- 另一个列表项
- 还有一个列表项
```

#### 输出

- 列表项
- 另一个列表项
- 还有一个列表项

### 嵌套列表

#### 语法

```markdown
- 水果
  - 苹果
  - 橙子
  - 香蕉
- 乳制品
  - 牛奶
  - 奶酪
```

#### 输出

- 水果
  - 苹果
  - 橙子
  - 香蕉
- 乳制品
  - 牛奶
  - 奶酪

## 其他元素 — abbr, sub, sup, kbd, mark

### 语法

```markdown
<abbr title="Graphics Interchange Format">GIF</abbr> 是一种位图图像格式。

H<sub>2</sub>O

X<sup>n</sup> + Y<sup>n</sup> = Z<sup>n</sup>

按 <kbd>CTRL</kbd> + <kbd>ALT</kbd> + <kbd>Delete</kbd> 结束会话。

大多数 <mark>蝾螈</mark> 是夜行性动物，以昆虫、蠕虫和其他小型生物为食。
```

### 输出

<abbr title="Graphics Interchange Format">GIF</abbr> 是一种位图图像格式。

H<sub>2</sub>O

X<sup>n</sup> + Y<sup>n</sup> = Z<sup>n</sup>

按 <kbd>CTRL</kbd> + <kbd>ALT</kbd> + <kbd>Delete</kbd> 结束会话。

大多数 <mark>蝾螈</mark> 是夜行性动物，以昆虫、蠕虫和其他小型生物为食。
