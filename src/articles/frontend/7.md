---
title: "JavaScript 中的枚举实现"
---

在 JavaScript 中可以通过 Proxy 创建一个对象的代理，从而实现基本操作的拦截和定义。主要包括：属性查找、赋值、枚举、函数调用等。

## Proxy 语法

```js
const p = new Proxy(target, handler)
```

target: 被代理的对象

handler：一个对象，包含代理方法的对象。例如

```js
const handler = {
    get: (obj, prop) => {
        return prop in obj ? obj[prop] : 'from proxy handler'
    }
}
const p = new Proxy({}, handler)
p.a = 'a'

console.log(p.a)
console.log(p.b) // 'from proxy handler'

```

## Enums 枚举

在 TypeScript 中提供了 Enums ，它可以让程序开发人员定义一组命名常量，从而增强代码的可读性。

```typescript
enum E {
    Up,
    Down,
    Left,
    Right
}
```

然而 JavaScript 中还不支持 Enums，通常可以借助常量或在工程中加入 TypeScript 来使用 Enums。除此之外也可以借助 Proxy
的特性来实现 Enums。

## 字符串枚举 JavaScript 实现
```js
const stringEnums = () => {
    return new Proxy({}, {get: (_, name) => name.toUpperCase()})
}

const {Up, Down, Left, Right} = stringEnums()
console.log(Up) // 'UP'
console.log(Down) // 'DOWN'
```

## 字符串枚举 TypeScript 实现
```typescipt
enum E {
    Up = 'UP',
    Down = 'DOWN',
    Left = 'LEFT',
    Right = 'RIGHT'
}
console.log(E.Up) // 'UP'
console.log(E.Down) // 'DOWN'

```
## 枚举重新赋值对比
```ts
/*
* 假设代码由 TypeScript 实现，Up 重置操作在编译时报错，运行时也报错。
* */
Up = 'reset' // Cannot assign to 'Up' because it is a constant.
console.log('Up', Up)

/*
* 假设代码由 TypeScript 实现，E.Up 重置操作在编译时报错，运行时不报错。
* */
E.Up = 'reset' // Cannot assign to 'Up' because it is a read-only property.
console.log('E.Up', E.Up)
```

本来论述内容来源：https://github.com/chasefleming/enum-xyz