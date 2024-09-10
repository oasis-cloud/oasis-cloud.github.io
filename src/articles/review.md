
React
 React 18 新特性 没有用过

 react hooks

React hooks的使用
////////
React 状态管理

git协作能力
////
 父组件如何调用子组件的方法

 useCallback 和 useMemo

//
ts 组件类型声明 ？如何做成可选，怎么继承 HTML 属性

type 和 interface 区别？

any 和 unkonw 类型差异

泛型是什么？什么场景使用， 函数重载和
/////
# mysql
锁和事务

Innodb 和 MyISAM 引擎

# css

css 单位有哪些

px\em\rem\vh

<img src="/i/mouse.jpg" height="200" width="200" />

为什么要使用 height 和 width 属性
对于创作者来说，一种更为有效的方法是通过 <img> 标签的 height 和 width 属性来指定图像的尺寸。这样的话，浏览器在下载图像之前就为其预留出了位置，从而可以加速文档的显示，还可以避免文档内容的移动。这两个属性都要求是整数值，并以像素为单位来表示图像尺寸。这两个属性在 <img> 标签中出现的次序并不重要。


display


BFC
块格式上下文 (BFC) 是网页视觉 CSS 渲染的一部分，其中布局了块框。浮动、绝对定位元素、内联块、表格单元格、表格标题和具有可见以外溢出的元素（除非该值已传播到视口）建立新的块格式化上下文。

了解如何建立块格式化上下文很重要，因为如果不这样做，包含框将不会包含浮动子项。这类似于边距折叠，但更阴险，因为您会发现整个盒子以奇怪的方式折叠。

BFC 是至少满足以下条件之一的 HTML 框：

float 的值不是 none。
位置的值既不是静态的也不是相对的。
display 的值为 table-cell、table-caption、inline-block、flex 或 inline-flex。
溢出的值是不可见的。
在 BFC 中，每个框的左外边缘接触包含块的左边缘（对于从右到左的格式，右边缘接触）。

<style>
  .a {
    color: red
  }
  .b {
    color: green
  }
</style>
<div class="b a">Demo</div>

z-index
```html
<style>
    .foo, .boo {
        position: absolute;
    }
    .foo {
        z-index: 1;
    }
    .foo div {
        width: 30px;
        height: 30px;
        position: absolute;
        z-index: 4;
        background: red;
    }
    .boo {
        z-index: 2;
    }
    .boo div {
        width: 30px;
        height: 30px;
        z-index: 3;
        background: green;
    }
</style>

<div class="foo">
    <div></div>
</div>
<div class="boo">
    <div></div>
</div>
```

```html
<style>
    :root {
        --color: green
    }
    .foo {
        --color: red
    }
    .boo {
        color: var(--color, black)
    }
</style>

<div class="foo">
    <div class="boo"> demo </div>
</div>
```

```html
<style>
    .boo, .foo {
        width: 30px;
        height: 30px;
        background: #00A000;
    }
    .foo {
        margin-bottom: 10px;
    }
    .boo {
        margin-top: 20px;
    }
</style>
<div class="foo"></div>
<div class="boo"></div>
```

```html
<style>
    .foo {
        font-size: 20px;
    }
    .boo {
        font-size: 0.5em;
    }
</style>

<div class="foo">
    <div class="boo">
        demo
    </div>
</div>
```

# JS

考察变量提升
// function
```js
function bar() {
  return foo;
  foo = 10;
  function foo() {}
  var foo = '11'
}
console.log(typeof bar())
```

```js
var x = 1
function foo() {
  console.log(x)
  var x = 2
}
foo()
```

考察函数的调用方式不同导致 this 指向不同
```js
var obj = {
  value: 10,
  getValue: function() {
    return this.value
  }
}
var getValue = obj.getValue
console.log(getValue())

var obj = {
  value: 10,
  getValue: () => {
    return this.value
  }
}
var getValue = obj.getValue
console.log(getValue())
```

考察 Promise
// Third
```js
function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time))
}
Promise.race([
  delay(1000).then(() => 'First'),
  delay(500).then(() => 'Second'),
  delay(300).then(() => 'Third'),
]).then((e) => {
  console.log(e)
})

```


考察 Promise reject
```js
Promise.reject('error')
  .catch(error => {throw new Error(error)})
  .then(() => console.log(1))
  .then(() => console.log(2))
```

考察 JS 的 ES6
```js
const set = new Set()
set.add(1).add(2).add(3).add(1)
console.log(set.size)
console.log([...set])
```

```js
let obj = {key: 'val'}
const weakMap = new WeakMap()
weakMap.set(obj, 'weakmap value')
let objClone = {...obj}
console.log(weakMap.get(objClone))
```

考察对象的深浅拷贝
```js
const a = [{b: 1}]
const b = [...a]
b[0].b = 2
console.log(a[0].b, b[0].b)
```

考察编程思想-递归，空间复杂度
```js
function pow(x, n) {
  if(n == 1) return x
  return x * pow(x, n - 1)
}
// 尾递归
function pow(x, n) {
  if(n == 1) return x
  return pow(x * x, n - 1)
}
// 循环
function pow(x, n) {
  let a = 1
  while(n > 0) {
    a = a * x
    n = n - 1
  }
  return a
}
```

```js
let range = {
  from: 1,
  to: 5
};
for (let num of range) {
  alert(num); // 1, 然后是 2, 3, 4, 5
}
```

```js
const a = 'test string'
a.name = 'test name'
console.log(a.name)
const b = new String('test')
b.name = 'test'
console.log(b.name)
// undefined
```

```js
console.log(null == undefined)
console.log(null === undefined)
```

```js
function Person(name) {
  this.name = name
}
Person.prototype.greet = function () {
  console.log(`hello ${this.name}`)
}

function Student(name, major) {
  this.major = major
}

Student.prototype = Object.create(Person.prototype)
var s = new Student('A', 'B')
s.greet()

```

```js
function Person(name) {
  this.name = name
}
Person.prototype.greet = function () {
  console.log(`hello ${this.name}`)
}

function Student(name, major) {
  this.major = major
}

Student.prototype = Person.prototype
var s = new Student('A', 'B')
s.greet()

Student.prototype.great = function () {
  console.log(this.name)
}
var p = new Person('A')
p.greet()

```

onload vs DOMContentLoaded


设计模式
观察者模式
工厂模式

代码优化

对象继承
原型链继承

# React

ref 是什么

# webpack

# 最近的学习情况

