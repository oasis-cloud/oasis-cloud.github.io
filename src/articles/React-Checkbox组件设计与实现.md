---
title: Checkbox 组件设计与实现
tags: [React]
---

## 为什么要封装组件

在日常的项目开发过程中，会遇到很多相似的功能，在管理不同代码库的时候，也会面临重复代码的问题，组件的提炼可以解决代码粘贴复制的问题，同时通过对代码的封装复用，降低了同一功能的维护成本。



## 组件实现思路和实现原理



### 组件功能梳理

Checkbox 组件的使用场景主要分为：单独使用、多个独立使用、组合使用。而且在组合使用的场景中需要考虑 Checkbox 嵌套在其他 HTML 标签中的场景。



### 组件实现思路

单独使用 Checkbox 的实现相对简单，主要根据设计的 props 来实现对应的功能，例如：checked 的对应功能是通过设置一个 state 来实现。



在组合使用的场景中，我们又封装了另外一个 CheckboxGroup 组件，通过 CheckboxGroup 组件来对 Checkbox 组件进行分组。同时为了方便的实现全选、反选等功能，需要在 CheckboxGroup 组件是上暴露 Ref，并在 Ref 挂载上处理此功能的方法。例如 CheckboxGroup 可以对外暴露 toggleAll、reverse 方法。



Ref 提供的方法主要借助 [useImperativeHandle](https://react.dev/reference/react/useImperativeHandle) , 代码示例如下：

```ts
useImperativeHandle(res, ()=> ({
  toggleAll(state) {
    
  },
  reverse() {
    const labelsForChildren = []
    React.children.map(childern, child =>{
      labelsForChildren.push(child.props.label)
    })
    const nextState = labelsForChildren.filter((childLabel) => stateForCheckboxGroup.findIndex(value) => value == childlabel) === -1
    setStateForCheckboxGroup(nextState)
  }
}))
```



Checkbox 的组合使用以及支持 HTML 标签嵌套主要借助 React 的 Context 来传递 props。在设计 Context 的时候，要主要只提供必需的，而不要过多的提供 props 下传。

在 CheckboxGroup 组件的 Context 中，主要提供了用于操控 state 的 check() uncheck() 方法，组合的选中状态 checkedValues，限制最大选中数量的 max



```ts
const CheckboxGroupContext =
  createContext<{
    checkedValues: string[]
    max: number | undefined
    check: (value: string) => void
    uncheck: (value: string) => void
  } | null>(null)
```

在调用 createContext 的时候，我们提供了 null 作为默认值，这一点比较重要。因为在 Checkbox 组件中，要同时支持 context 和 非 context 的情况。这种情况的判断，主要根据 context 的值来处理。

```ts
// checkbox.tsx
const ctx = useContext(CheckboxGroupContext)
if(ctx) {
  // 存在 ctx 的情况处理
}
```



在未实现 Context 支持的 Checkbox 组件的实现中，我们设计了一些内部的状态，来控制 Checkbox 的选中，禁用等功能。那在支持 Context 的情况里，我们怎么处理之前设置过的 State 呢？我们可以通过覆盖的方式来处理。

```ts
let [checked, setChecked] = useState(props.checked)

if(ctx) {
  setChecked = (checked) => {
    if(checked) ctx.check()
    else ctx.uncheck()
  }
}
```

### 最后

上面主要介绍了 Checkbox 的几个关键的处理点，如果大家在使用 NutUI-React 过程中，发现此组件的问题可以直接通过 Issues 提问或者直接 PR 给我们。
