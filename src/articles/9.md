---
title: 自己动手实现——marquee
categories: Programming
tags: [CSS, JavaScript, React]
---

> 本文中的 Marquee 基于 React 实现。

## HTML `marquee` 元素
HTML `marquee` 元素（`<marquee>`） 用来插入一段滚动的文字。 但目前已经弃用，然而有些浏览器还是支持 `marquee` 的。

示例代码：
```html
<marquee direction="up" style="border: 1px solid #000">Marquee content 1</marquee>
<marquee direction="up" style="border: 1px solid #000">
    <ul>
        <li>list 1</li>
        <li>list 2</li>
    </ul>
</marquee>
<marquee direction="up" style="border: 1px solid #000">
    <div>
        <img src="https://img1.baidu.com/it/u=4018280332,3063702893&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500" />
    </div>
</marquee>

```

## 自己动手实现 marquee
通过上面的 Demo 可以发现，`marquee` 实现了无限滚动，但并未实现无缝滚动，而且 `marquee` 再新的标准中已经弃用。基于这两点原因，所以要自己实现带有无缝滚动的 `marquee`。

### 无缝滚动核心算法
一般来说滚动方向分为水平和垂直，我们首先以水平方向的滚动为例进行阐述。
例如有如下字符 `AB`，且可视区域仅覆盖 `AB`，`|AB|` 标识字符串 `AB` 可见。
```html
|AB| // 初始状态
AB|..| // 滚动后状态
|AB| // 下一周期初始状态
```
从上述示例可以看出，`AB`滚动过程中会出现空白。如何解决空白问题？答案是：**重复**。

例如有如下字符 `AB`，且可视区域仅覆盖 `AB`，`|AB|` 标识字符串 `AB` 可见。
```html
|AB|AB // 初始状态
AB|AB| // 滚动后状态
|AB|AB // 下一周期初始状态
```
例如有如下字符 `AB`，且可视区域大于 `AB`，`|AB|` 标识字符串 `AB` 可见。`.`表示空白
```html
|AB...|AB... // 初始状态
AB...|AB...| // 滚动后状态
|AB...|AB... // 下一周期初始状态
```
垂直方向逻辑同水平方向：
```html
AB
==
AB
==
```


### 算法步骤
1. 复制 AB
2. 计算动画时间
    - 可视区域大于内容区
        - 滚动时间 = 可视区 / 速度
    - 可视区域小于内容区
        - 滚动时间 = 内容区 / 速度
3. 设置 css animation


```css
@keyframes scroll {
    0% {
        transform: translateX(0%);
    }
    100% {
        transform: translateX(-100%);
    }
}
.marquee-content {
    animation: scroll var(--duration) linear var(--delay) var(--iteration-count);
    animation-play-state: var(--play);
    animation-delay: var(--delay);
    animation-direction: var(--direction);
}
```
