import{_ as n,b as a,c as p,g as e}from"./chunks/framework.86O3EbG5.js";const h=JSON.parse('{"title":"Untitled","description":"","frontmatter":{"title":"Untitled","author":"oasis","date":"2025-11-30T00:00:00.000Z"},"headers":[],"relativePath":"articles/frontend/react/3-2.md","filePath":"articles/frontend/react/3-2.md"}'),l={name:"articles/frontend/react/3-2.md"};function i(t,s,c,r,o,u){return a(),p("div",null,[...s[0]||(s[0]=[e(`<h1 id="react-scheduler-执行入口和执行流程详解" tabindex="-1">React Scheduler 执行入口和执行流程详解</h1><h2 id="一、执行入口" tabindex="-1">一、执行入口</h2><h3 id="_1-1-主要入口函数" tabindex="-1">1.1 主要入口函数</h3><p>React Scheduler 的核心入口函数是 <strong><code>unstable_scheduleCallback</code></strong>，这是外部（主要是 React Reconciler）调度任务的主要接口。</p><div class="language-txt vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">txt</span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>function unstable_scheduleCallback(</span></span>
<span class="line"><span>  priorityLevel: PriorityLevel,</span></span>
<span class="line"><span>  callback: Callback,</span></span>
<span class="line"><span>  options?: {delay: number},</span></span>
<span class="line"><span>): Task {</span></span>
<span class="line"><span>  var currentTime = getCurrentTime();</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  var startTime;</span></span>
<span class="line"><span>  if (typeof options === &#39;object&#39; &amp;&amp; options !== null) {</span></span>
<span class="line"><span>    var delay = options.delay;</span></span>
<span class="line"><span>    if (typeof delay === &#39;number&#39; &amp;&amp; delay &gt; 0) {</span></span>
<span class="line"><span>      startTime = currentTime + delay;</span></span>
<span class="line"><span>    } else {</span></span>
<span class="line"><span>      startTime = currentTime;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>  } else {</span></span>
<span class="line"><span>    startTime = currentTime;</span></span>
<span class="line"><span>  }</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  var timeout;</span></span>
<span class="line"><span>  switch (priorityLevel) {</span></span>
<span class="line"><span>    case ImmediatePriority:</span></span>
<span class="line"><span>      // Times out immediately</span></span>
<span class="line"><span>      timeout = -1;</span></span>
<span class="line"><span>      break;</span></span>
<span class="line"><span>    case UserBlockingPriority:</span></span>
<span class="line"><span>      // Eventually times out</span></span>
<span class="line"><span>      timeout = userBlockingPriorityTimeout;</span></span>
<span class="line"><span>      break;</span></span>
<span class="line"><span>    case IdlePriority:</span></span>
<span class="line"><span>      // Never times out</span></span>
<span class="line"><span>      timeout = maxSigned31BitInt;</span></span>
<span class="line"><span>      break;</span></span>
<span class="line"><span>    case LowPriority:</span></span>
<span class="line"><span>      // Eventually times out</span></span>
<span class="line"><span>      timeout = lowPriorityTimeout;</span></span>
<span class="line"><span>      break;</span></span>
<span class="line"><span>    case NormalPriority:</span></span>
<span class="line"><span>    default:</span></span>
<span class="line"><span>      // Eventually times out</span></span>
<span class="line"><span>      timeout = normalPriorityTimeout;</span></span>
<span class="line"><span>      break;</span></span>
<span class="line"><span>  }</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  var expirationTime = startTime + timeout;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  var newTask: Task = {</span></span>
<span class="line"><span>    id: taskIdCounter++,</span></span>
<span class="line"><span>    callback,</span></span>
<span class="line"><span>    priorityLevel,</span></span>
<span class="line"><span>    startTime,</span></span>
<span class="line"><span>    expirationTime,</span></span>
<span class="line"><span>    sortIndex: -1,</span></span>
<span class="line"><span>  };</span></span>
<span class="line"><span>  if (enableProfiling) {</span></span>
<span class="line"><span>    newTask.isQueued = false;</span></span>
<span class="line"><span>  }</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  if (startTime &gt; currentTime) {</span></span>
<span class="line"><span>    // This is a delayed task.</span></span>
<span class="line"><span>    newTask.sortIndex = startTime;</span></span>
<span class="line"><span>    push(timerQueue, newTask);</span></span>
<span class="line"><span>    if (peek(taskQueue) === null &amp;&amp; newTask === peek(timerQueue)) {</span></span>
<span class="line"><span>      // All tasks are delayed, and this is the task with the earliest delay.</span></span>
<span class="line"><span>      if (isHostTimeoutScheduled) {</span></span>
<span class="line"><span>        // Cancel an existing timeout.</span></span>
<span class="line"><span>        cancelHostTimeout();</span></span>
<span class="line"><span>      } else {</span></span>
<span class="line"><span>        isHostTimeoutScheduled = true;</span></span>
<span class="line"><span>      }</span></span>
<span class="line"><span>      // Schedule a timeout.</span></span>
<span class="line"><span>      requestHostTimeout(handleTimeout, startTime - currentTime);</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>  } else {</span></span>
<span class="line"><span>    newTask.sortIndex = expirationTime;</span></span>
<span class="line"><span>    push(taskQueue, newTask);</span></span>
<span class="line"><span>    if (enableProfiling) {</span></span>
<span class="line"><span>      markTaskStart(newTask, currentTime);</span></span>
<span class="line"><span>      newTask.isQueued = true;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    // Schedule a host callback, if needed. If we&#39;re already performing work,</span></span>
<span class="line"><span>    // wait until the next time we yield.</span></span>
<span class="line"><span>    if (!isHostCallbackScheduled &amp;&amp; !isPerformingWork) {</span></span>
<span class="line"><span>      isHostCallbackScheduled = true;</span></span>
<span class="line"><span>      requestHostCallback();</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>  }</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  return newTask;</span></span>
<span class="line"><span>}</span></span></code></pre></div><h3 id="_1-2-调用链入口" tabindex="-1">1.2 调用链入口</h3><p>从 React Reconciler 的调用链：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>React Reconciler (ReactFiberRootScheduler.js)</span></span>
<span class="line"><span>  ↓</span></span>
<span class="line"><span>scheduleCallback() </span></span>
<span class="line"><span>  ↓</span></span>
<span class="line"><span>Scheduler.unstable_scheduleCallback()</span></span>
<span class="line"><span>  ↓</span></span>
<span class="line"><span>unstable_scheduleCallback() [Scheduler.js]</span></span></code></pre></div><h2 id="二、完整执行流程" tabindex="-1">二、完整执行流程</h2><h3 id="_2-1-流程图" tabindex="-1">2.1 流程图</h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>┌─────────────────────────────────────────────────────────────┐</span></span>
<span class="line"><span>│  1. React Reconciler 调用 scheduleCallback()                │</span></span>
<span class="line"><span>│     - 传入优先级和回调函数                                   │</span></span>
<span class="line"><span>└────────────────────┬────────────────────────────────────────┘</span></span>
<span class="line"><span>                     │</span></span>
<span class="line"><span>                     ▼</span></span>
<span class="line"><span>┌─────────────────────────────────────────────────────────────┐</span></span>
<span class="line"><span>│  2. unstable_scheduleCallback()                            │</span></span>
<span class="line"><span>│     - 创建 Task 对象                                        │</span></span>
<span class="line"><span>│     - 计算 expirationTime（过期时间）                       │</span></span>
<span class="line"><span>│     - 根据 startTime 决定放入哪个队列：                      │</span></span>
<span class="line"><span>│       • startTime &gt; currentTime → timerQueue（延迟任务）    │</span></span>
<span class="line"><span>│       • startTime &lt;= currentTime → taskQueue（立即任务）   │</span></span>
<span class="line"><span>└────────────────────┬────────────────────────────────────────┘</span></span>
<span class="line"><span>                     │</span></span>
<span class="line"><span>         ┌───────────┴───────────┐</span></span>
<span class="line"><span>         │                       │</span></span>
<span class="line"><span>         ▼                       ▼</span></span>
<span class="line"><span>┌──────────────────┐   ┌──────────────────────┐</span></span>
<span class="line"><span>│ 延迟任务          │   │ 立即任务              │</span></span>
<span class="line"><span>│ timerQueue       │   │ taskQueue            │</span></span>
<span class="line"><span>│                  │   │                      │</span></span>
<span class="line"><span>│ requestHostTimeout│   │ requestHostCallback()│</span></span>
<span class="line"><span>│ (handleTimeout)  │   │                      │</span></span>
<span class="line"><span>└────────┬─────────┘   └──────────┬───────────┘</span></span>
<span class="line"><span>         │                        │</span></span>
<span class="line"><span>         │                        │</span></span>
<span class="line"><span>         └───────────┬────────────┘</span></span>
<span class="line"><span>                     │</span></span>
<span class="line"><span>                     ▼</span></span>
<span class="line"><span>┌─────────────────────────────────────────────────────────────┐</span></span>
<span class="line"><span>│  3. requestHostCallback()                                  │</span></span>
<span class="line"><span>│     - 设置 isMessageLoopRunning = true                     │</span></span>
<span class="line"><span>│     - 调用 schedulePerformWorkUntilDeadline()              │</span></span>
<span class="line"><span>│       • Node.js: setImmediate()                            │</span></span>
<span class="line"><span>│       • 浏览器: MessageChannel.postMessage()              │</span></span>
<span class="line"><span>│       • 回退: setTimeout()                                 │</span></span>
<span class="line"><span>└────────────────────┬────────────────────────────────────────┘</span></span>
<span class="line"><span>                     │</span></span>
<span class="line"><span>                     ▼</span></span>
<span class="line"><span>┌─────────────────────────────────────────────────────────────┐</span></span>
<span class="line"><span>│  4. performWorkUntilDeadline() [异步执行]                   │</span></span>
<span class="line"><span>│     - 记录开始时间 startTime                                │</span></span>
<span class="line"><span>│     - 调用 flushWork(currentTime)                          │</span></span>
<span class="line"><span>└────────────────────┬────────────────────────────────────────┘</span></span>
<span class="line"><span>                     │</span></span>
<span class="line"><span>                     ▼</span></span>
<span class="line"><span>┌─────────────────────────────────────────────────────────────┐</span></span>
<span class="line"><span>│  5. flushWork(initialTime)                                 │</span></span>
<span class="line"><span>│     - 设置 isPerformingWork = true                         │</span></span>
<span class="line"><span>│     - 调用 workLoop(initialTime)                           │</span></span>
<span class="line"><span>│     - 清理状态和标记                                        │</span></span>
<span class="line"><span>└────────────────────┬────────────────────────────────────────┘</span></span>
<span class="line"><span>                     │</span></span>
<span class="line"><span>                     ▼</span></span>
<span class="line"><span>┌─────────────────────────────────────────────────────────────┐</span></span>
<span class="line"><span>│  6. workLoop(currentTime) [核心工作循环]                     │</span></span>
<span class="line"><span>│     - advanceTimers(): 将到期的延迟任务移到 taskQueue       │</span></span>
<span class="line"><span>│     - 循环处理 taskQueue 中的任务：                        │</span></span>
<span class="line"><span>│       ① peek(taskQueue) 获取最高优先级任务                  │</span></span>
<span class="line"><span>│       ② 检查是否应该让出控制权 (shouldYieldToHost)         │</span></span>
<span class="line"><span>│       ③ 执行任务的 callback                                │</span></span>
<span class="line"><span>│       ④ 如果 callback 返回 continuation，继续调度         │</span></span>
<span class="line"><span>│       ⑤ 任务完成后从队列移除                               │</span></span>
<span class="line"><span>│     - 返回是否有更多工作 (hasMoreWork)                     │</span></span>
<span class="line"><span>└────────────────────┬────────────────────────────────────────┘</span></span>
<span class="line"><span>                     │</span></span>
<span class="line"><span>         ┌───────────┴───────────┐</span></span>
<span class="line"><span>         │                       │</span></span>
<span class="line"><span>    hasMoreWork=true      hasMoreWork=false</span></span>
<span class="line"><span>         │                       │</span></span>
<span class="line"><span>         ▼                       ▼</span></span>
<span class="line"><span>┌──────────────────┐   ┌──────────────────────┐</span></span>
<span class="line"><span>│ 继续调度          │   │ 停止工作循环          │</span></span>
<span class="line"><span>│ schedulePerform  │   │ isMessageLoopRunning │</span></span>
<span class="line"><span>│ WorkUntilDeadline│   │ = false              │</span></span>
<span class="line"><span>└──────────────────┘   └──────────────────────┘</span></span></code></pre></div><h3 id="_2-2-关键函数详解" tabindex="-1">2.2 关键函数详解</h3><h4 id="_2-2-1-requesthostcallback-请求主机回调" tabindex="-1">2.2.1 <code>requestHostCallback()</code> - 请求主机回调</h4><div class="language-txt vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">txt</span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>function requestHostCallback() {</span></span>
<span class="line"><span>  if (!isMessageLoopRunning) {</span></span>
<span class="line"><span>    isMessageLoopRunning = true;</span></span>
<span class="line"><span>    schedulePerformWorkUntilDeadline();</span></span>
<span class="line"><span>  }</span></span>
<span class="line"><span>}</span></span></code></pre></div><p><strong>作用</strong>：启动消息循环，通过平台 API（setImmediate/MessageChannel/setTimeout）异步执行工作。</p><h4 id="_2-2-2-performworkuntildeadline-执行工作直到截止时间" tabindex="-1">2.2.2 <code>performWorkUntilDeadline()</code> - 执行工作直到截止时间</h4><div class="language-txt vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">txt</span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>const performWorkUntilDeadline = () =&gt; {</span></span>
<span class="line"><span>  if (enableRequestPaint) {</span></span>
<span class="line"><span>    needsPaint = false;</span></span>
<span class="line"><span>  }</span></span>
<span class="line"><span>  if (isMessageLoopRunning) {</span></span>
<span class="line"><span>    const currentTime = getCurrentTime();</span></span>
<span class="line"><span>    // 记录开始时间，以便我们可以测量主线程被阻塞了多长时间。</span></span>
<span class="line"><span>    startTime = currentTime;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    // 如果调度器任务抛出错误，退出当前浏览器任务，以便可以观察到错误。</span></span>
<span class="line"><span>    //</span></span>
<span class="line"><span>    // 故意不使用 try-catch，因为这会使某些调试技术变得更困难。</span></span>
<span class="line"><span>    // 相反，如果 \`flushWork\` 出错，那么 \`hasMoreWork\` 将保持为 true，我们会继续工作循环。</span></span>
<span class="line"><span>    let hasMoreWork = true;</span></span>
<span class="line"><span>    try {</span></span>
<span class="line"><span>      hasMoreWork = flushWork(currentTime);</span></span>
<span class="line"><span>    } finally {</span></span>
<span class="line"><span>      if (hasMoreWork) {</span></span>
<span class="line"><span>        // 如果还有更多工作，在前一个消息事件的末尾调度下一个消息事件。</span></span>
<span class="line"><span>        schedulePerformWorkUntilDeadline();</span></span>
<span class="line"><span>      } else {</span></span>
<span class="line"><span>        isMessageLoopRunning = false;</span></span>
<span class="line"><span>      }</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>  }</span></span>
<span class="line"><span>};</span></span></code></pre></div><p><strong>作用</strong>：</p><ul><li>记录开始时间</li><li>调用 <code>flushWork</code> 执行实际工作</li><li>根据返回值决定是否继续调度</li></ul><h4 id="_2-2-3-flushwork-刷新工作" tabindex="-1">2.2.3 <code>flushWork()</code> - 刷新工作</h4><div class="language-txt vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">txt</span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>function flushWork(initialTime: number) {</span></span>
<span class="line"><span>  if (enableProfiling) {</span></span>
<span class="line"><span>    markSchedulerUnsuspended(initialTime);</span></span>
<span class="line"><span>  }</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  // We&#39;ll need a host callback the next time work is scheduled.</span></span>
<span class="line"><span>  isHostCallbackScheduled = false;</span></span>
<span class="line"><span>  if (isHostTimeoutScheduled) {</span></span>
<span class="line"><span>    // We scheduled a timeout but it&#39;s no longer needed. Cancel it.</span></span>
<span class="line"><span>    isHostTimeoutScheduled = false;</span></span>
<span class="line"><span>    cancelHostTimeout();</span></span>
<span class="line"><span>  }</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  isPerformingWork = true;</span></span>
<span class="line"><span>  const previousPriorityLevel = currentPriorityLevel;</span></span>
<span class="line"><span>  try {</span></span>
<span class="line"><span>    if (enableProfiling) {</span></span>
<span class="line"><span>      try {</span></span>
<span class="line"><span>        return workLoop(initialTime);</span></span>
<span class="line"><span>      } catch (error) {</span></span>
<span class="line"><span>        if (currentTask !== null) {</span></span>
<span class="line"><span>          const currentTime = getCurrentTime();</span></span>
<span class="line"><span>          // $FlowFixMe[incompatible-call] found when upgrading Flow</span></span>
<span class="line"><span>          markTaskErrored(currentTask, currentTime);</span></span>
<span class="line"><span>          // $FlowFixMe[incompatible-use] found when upgrading Flow</span></span>
<span class="line"><span>          currentTask.isQueued = false;</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span>        throw error;</span></span>
<span class="line"><span>      }</span></span>
<span class="line"><span>    } else {</span></span>
<span class="line"><span>      // No catch in prod code path.</span></span>
<span class="line"><span>      return workLoop(initialTime);</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>  } finally {</span></span>
<span class="line"><span>    currentTask = null;</span></span>
<span class="line"><span>    currentPriorityLevel = previousPriorityLevel;</span></span>
<span class="line"><span>    isPerformingWork = false;</span></span>
<span class="line"><span>    if (enableProfiling) {</span></span>
<span class="line"><span>      const currentTime = getCurrentTime();</span></span>
<span class="line"><span>      markSchedulerSuspended(currentTime);</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>  }</span></span>
<span class="line"><span>}</span></span></code></pre></div><p><strong>作用</strong>：</p><ul><li>设置工作状态标志</li><li>调用 <code>workLoop</code> 执行工作循环</li><li>清理状态和错误处理</li></ul><h4 id="_2-2-4-workloop-核心工作循环" tabindex="-1">2.2.4 <code>workLoop()</code> - 核心工作循环</h4><div class="language-txt vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">txt</span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>function workLoop(initialTime: number) {</span></span>
<span class="line"><span>  let currentTime = initialTime;</span></span>
<span class="line"><span>  advanceTimers(currentTime);</span></span>
<span class="line"><span>  currentTask = peek(taskQueue);</span></span>
<span class="line"><span>  while (currentTask !== null) {</span></span>
<span class="line"><span>    if (!enableAlwaysYieldScheduler) {</span></span>
<span class="line"><span>      if (currentTask.expirationTime &gt; currentTime &amp;&amp; shouldYieldToHost()) {</span></span>
<span class="line"><span>        // This currentTask hasn&#39;t expired, and we&#39;ve reached the deadline.</span></span>
<span class="line"><span>        break;</span></span>
<span class="line"><span>      }</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    // $FlowFixMe[incompatible-use] found when upgrading Flow</span></span>
<span class="line"><span>    const callback = currentTask.callback;</span></span>
<span class="line"><span>    if (typeof callback === &#39;function&#39;) {</span></span>
<span class="line"><span>      // $FlowFixMe[incompatible-use] found when upgrading Flow</span></span>
<span class="line"><span>      currentTask.callback = null;</span></span>
<span class="line"><span>      // $FlowFixMe[incompatible-use] found when upgrading Flow</span></span>
<span class="line"><span>      currentPriorityLevel = currentTask.priorityLevel;</span></span>
<span class="line"><span>      // $FlowFixMe[incompatible-use] found when upgrading Flow</span></span>
<span class="line"><span>      const didUserCallbackTimeout = currentTask.expirationTime &lt;= currentTime;</span></span>
<span class="line"><span>      if (enableProfiling) {</span></span>
<span class="line"><span>        // $FlowFixMe[incompatible-call] found when upgrading Flow</span></span>
<span class="line"><span>        markTaskRun(currentTask, currentTime);</span></span>
<span class="line"><span>      }</span></span>
<span class="line"><span>      const continuationCallback = callback(didUserCallbackTimeout);</span></span>
<span class="line"><span>      currentTime = getCurrentTime();</span></span>
<span class="line"><span>      if (typeof continuationCallback === &#39;function&#39;) {</span></span>
<span class="line"><span>        // If a continuation is returned, immediately yield to the main thread</span></span>
<span class="line"><span>        // regardless of how much time is left in the current time slice.</span></span>
<span class="line"><span>        // $FlowFixMe[incompatible-use] found when upgrading Flow</span></span>
<span class="line"><span>        currentTask.callback = continuationCallback;</span></span>
<span class="line"><span>        if (enableProfiling) {</span></span>
<span class="line"><span>          // $FlowFixMe[incompatible-call] found when upgrading Flow</span></span>
<span class="line"><span>          markTaskYield(currentTask, currentTime);</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span>        advanceTimers(currentTime);</span></span>
<span class="line"><span>        return true;</span></span>
<span class="line"><span>      } else {</span></span>
<span class="line"><span>        if (enableProfiling) {</span></span>
<span class="line"><span>          // $FlowFixMe[incompatible-call] found when upgrading Flow</span></span>
<span class="line"><span>          markTaskCompleted(currentTask, currentTime);</span></span>
<span class="line"><span>          // $FlowFixMe[incompatible-use] found when upgrading Flow</span></span>
<span class="line"><span>          currentTask.isQueued = false;</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span>        if (currentTask === peek(taskQueue)) {</span></span>
<span class="line"><span>          pop(taskQueue);</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span>        advanceTimers(currentTime);</span></span>
<span class="line"><span>      }</span></span>
<span class="line"><span>    } else {</span></span>
<span class="line"><span>      pop(taskQueue);</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    currentTask = peek(taskQueue);</span></span>
<span class="line"><span>    if (enableAlwaysYieldScheduler) {</span></span>
<span class="line"><span>      if (currentTask === null || currentTask.expirationTime &gt; currentTime) {</span></span>
<span class="line"><span>        // This currentTask hasn&#39;t expired we yield to the browser task.</span></span>
<span class="line"><span>        break;</span></span>
<span class="line"><span>      }</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>  }</span></span>
<span class="line"><span>  // Return whether there&#39;s additional work</span></span>
<span class="line"><span>  if (currentTask !== null) {</span></span>
<span class="line"><span>    return true;</span></span>
<span class="line"><span>  } else {</span></span>
<span class="line"><span>    const firstTimer = peek(timerQueue);</span></span>
<span class="line"><span>    if (firstTimer !== null) {</span></span>
<span class="line"><span>      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    return false;</span></span>
<span class="line"><span>  }</span></span>
<span class="line"><span>}</span></span></code></pre></div><p><strong>核心逻辑</strong>：</p><ol><li><strong>advanceTimers()</strong>: 将到期的延迟任务从 <code>timerQueue</code> 移到 <code>taskQueue</code></li><li><strong>循环处理任务</strong>： <ul><li>从 <code>taskQueue</code> 获取最高优先级任务（最小堆的根节点）</li><li>检查是否应该让出控制权（<code>shouldYieldToHost()</code>）</li><li>执行任务的 <code>callback</code></li><li>如果返回 <code>continuation</code>，继续调度</li><li>任务完成后从队列移除</li></ul></li><li><strong>返回状态</strong>：是否有更多工作需要处理</li></ol><h4 id="_2-2-5-advancetimers-推进定时器" tabindex="-1">2.2.5 <code>advanceTimers()</code> - 推进定时器</h4><div class="language-txt vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">txt</span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>function advanceTimers(currentTime: number) {</span></span>
<span class="line"><span>  // Check for tasks that are no longer delayed and add them to the queue.</span></span>
<span class="line"><span>  let timer = peek(timerQueue);</span></span>
<span class="line"><span>  while (timer !== null) {</span></span>
<span class="line"><span>    if (timer.callback === null) {</span></span>
<span class="line"><span>      // Timer was cancelled.</span></span>
<span class="line"><span>      pop(timerQueue);</span></span>
<span class="line"><span>    } else if (timer.startTime &lt;= currentTime) {</span></span>
<span class="line"><span>      // Timer fired. Transfer to the task queue.</span></span>
<span class="line"><span>      pop(timerQueue);</span></span>
<span class="line"><span>      timer.sortIndex = timer.expirationTime;</span></span>
<span class="line"><span>      push(taskQueue, timer);</span></span>
<span class="line"><span>      if (enableProfiling) {</span></span>
<span class="line"><span>        markTaskStart(timer, currentTime);</span></span>
<span class="line"><span>        timer.isQueued = true;</span></span>
<span class="line"><span>      }</span></span>
<span class="line"><span>    } else {</span></span>
<span class="line"><span>      // Remaining timers are pending.</span></span>
<span class="line"><span>      return;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    timer = peek(timerQueue);</span></span>
<span class="line"><span>  }</span></span>
<span class="line"><span>}</span></span></code></pre></div><p><strong>作用</strong>：将到期的延迟任务从 <code>timerQueue</code> 转移到 <code>taskQueue</code>，使其可以被执行。</p><h4 id="_2-2-6-shouldyieldtohost-是否应该让出控制权" tabindex="-1">2.2.6 <code>shouldYieldToHost()</code> - 是否应该让出控制权</h4><div class="language-txt vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">txt</span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>function shouldYieldToHost(): boolean {</span></span>
<span class="line"><span>  if (!enableAlwaysYieldScheduler &amp;&amp; enableRequestPaint &amp;&amp; needsPaint) {</span></span>
<span class="line"><span>    // Yield now.</span></span>
<span class="line"><span>    return true;</span></span>
<span class="line"><span>  }</span></span>
<span class="line"><span>  const timeElapsed = getCurrentTime() - startTime;</span></span>
<span class="line"><span>  if (timeElapsed &lt; frameInterval) {</span></span>
<span class="line"><span>    // The main thread has only been blocked for a really short amount of time;</span></span>
<span class="line"><span>    // smaller than a single frame. Don&#39;t yield yet.</span></span>
<span class="line"><span>    return false;</span></span>
<span class="line"><span>  }</span></span>
<span class="line"><span>  // Yield now.</span></span>
<span class="line"><span>  return true;</span></span>
<span class="line"><span>}</span></span></code></pre></div><p><strong>作用</strong>：检查是否应该让出控制权给浏览器，避免长时间阻塞主线程。</p><h2 id="三、数据结构" tabindex="-1">三、数据结构</h2><h3 id="_3-1-两个优先级队列" tabindex="-1">3.1 两个优先级队列</h3><ol><li><p><strong><code>taskQueue</code></strong> - 立即执行的任务队列（最小堆）</p><ul><li>按 <code>expirationTime</code> 排序</li><li>使用最小堆快速获取最高优先级任务</li></ul></li><li><p><strong><code>timerQueue</code></strong> - 延迟任务队列（最小堆）</p><ul><li>按 <code>startTime</code> 排序</li><li>到期后转移到 <code>taskQueue</code></li></ul></li></ol><h3 id="_3-2-task-对象结构" tabindex="-1">3.2 Task 对象结构</h3><div class="language-txt vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">txt</span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>export opaque type Task = {</span></span>
<span class="line"><span>  id: number,</span></span>
<span class="line"><span>  callback: Callback | null,</span></span>
<span class="line"><span>  priorityLevel: PriorityLevel,</span></span>
<span class="line"><span>  startTime: number,</span></span>
<span class="line"><span>  expirationTime: number,</span></span>
<span class="line"><span>  sortIndex: number,</span></span>
<span class="line"><span>  isQueued?: boolean,</span></span>
<span class="line"><span>};</span></span></code></pre></div><h2 id="四、执行示例" tabindex="-1">四、执行示例</h2><h3 id="_4-1-典型执行流程示例" tabindex="-1">4.1 典型执行流程示例</h3><div class="language-javascript vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">javascript</span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 1. React Reconciler 调度任务</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#6F42C1;">scheduleCallback</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">(NormalPriority, () </span><span style="--shiki-light:#D73A49;--shiki-dark:#D73A49;">=&gt;</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;"> {</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#6F42C1;">  performWorkOnRoot</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">(root);</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">});</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 2. Scheduler 内部流程</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// - unstable_scheduleCallback() 创建 Task</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// - push(taskQueue, task)</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// - requestHostCallback()</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// - schedulePerformWorkUntilDeadline() (使用 MessageChannel)</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// - performWorkUntilDeadline() 异步执行</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// - flushWork()</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// - workLoop()</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">//   - advanceTimers()</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">//   - 循环执行 taskQueue 中的任务</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">//   - 执行 callback: performWorkOnRoot()</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">//   - 检查 shouldYieldToHost()</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">//   - 返回 hasMoreWork</span></span></code></pre></div><h3 id="_4-2-时间切片-time-slicing" tabindex="-1">4.2 时间切片（Time Slicing）</h3><p>Scheduler 通过 <code>shouldYieldToHost()</code> 实现时间切片：</p><ul><li>每次执行任务前检查是否超过时间限制（<code>frameInterval</code>）</li><li>如果超过，让出控制权，让浏览器处理其他任务</li><li>下次通过 <code>schedulePerformWorkUntilDeadline()</code> 继续执行</li></ul><h2 id="五、关键设计点" tabindex="-1">五、关键设计点</h2><ol><li><strong>异步执行</strong>：使用 MessageChannel/setImmediate/setTimeout 实现异步调度</li><li><strong>优先级队列</strong>：使用最小堆快速获取最高优先级任务</li><li><strong>时间切片</strong>：通过 <code>shouldYieldToHost()</code> 避免长时间阻塞主线程</li><li><strong>延迟任务</strong>：支持延迟执行的任务（<code>timerQueue</code>）</li><li><strong>任务延续</strong>：支持任务返回 continuation callback 继续执行</li></ol><h2 id="六、总结" tabindex="-1">六、总结</h2><p>React Scheduler 的执行流程是一个<strong>事件驱动的异步任务调度系统</strong>：</p><ol><li><strong>入口</strong>：<code>unstable_scheduleCallback()</code> 接收任务并加入队列</li><li><strong>调度</strong>：<code>requestHostCallback()</code> 启动异步执行</li><li><strong>执行</strong>：<code>performWorkUntilDeadline()</code> → <code>flushWork()</code> → <code>workLoop()</code></li><li><strong>循环</strong>：<code>workLoop()</code> 循环处理任务，直到队列为空或需要让出控制权</li><li><strong>让出</strong>：通过 <code>shouldYieldToHost()</code> 检查，必要时让出控制权给浏览器</li></ol><p>这个设计使得 React 能够高效地调度和执行任务，同时保持应用的响应性。</p>`,50)])])}const k=n(l,[["render",i]]);export{h as __pageData,k as default};
