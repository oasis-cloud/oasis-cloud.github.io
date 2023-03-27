---
title: "TypeScript 中的 type 和 interface 比较"
---

TypeScript 中定义一个命名类型，有两个选择，可以使用 type 或 interface。

```ts
type P = {
    name: string
}
```

```ts
interface P {
    name: string
}
```

type 用于定义类型别名

```ts
type Simple = string | number
type Point = {
    x: number
    y: number
}
```

通过使用类型别名可以提高代码的可读性，例如：

```ts
type TotalSize = number
type Price = number
type Quantity = number
function calculateTotalSize(x:Price, y:Quantity): TotalSize {
    return x * y
}
```

interface 用于定义对象类型

```ts 
interface Point {
    x:number
    y:number
}
```

interface 可以重新打开类型，添加新属性，type 则不可。

```ts
interface Point {
    x:number
    y:number
}

interface Point {
    z: number
}
```

```ts
type TPoint = {
    x:number
    y:number
}

type TPoint = {
    z: number
}
// Errors in code
// Duplicate identifier 'TPoint'.
// Duplicate identifier 'TPoint'.
```

type 用于条件类型

```ts
type NameOrId<T extends number | string> = T extends number
  ? IdLabel
  : NameLabel;
```

在代码中应该使用哪种方式呢？

1. 从代码库维护层面来讲，如果维护的代码库统一采用 interface，那应该代码库风格保持一致
2. 从代码重构角度来讲，interface 的可扩展性更加简单和可读。
    1. 例如对外提供的 API，当 API 发生变化时，通过 interface 合并新字段可能对你的用户有帮助。
    2. 再项目内部使用类型，声明合并很可能是一个错误，这时使用 type 更合适。

```ts
// a libary
export interface AProps {
    visible: boolean
}

// our project global.d.ts
import type {Aprops} from 'a-libary'
interface AExtends extends Aprops {
    closed: boolean
}
```
