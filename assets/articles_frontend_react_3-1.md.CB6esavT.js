import{_ as a,b as n,c as p,g as i}from"./chunks/framework.86O3EbG5.js";const r=JSON.parse('{"title":"Untitled","description":"","frontmatter":{"title":"Untitled","author":"oasis","date":"2025-11-30T00:00:00.000Z"},"headers":[],"relativePath":"articles/frontend/react/3-1.md","filePath":"articles/frontend/react/3-1.md"}'),e={name:"articles/frontend/react/3-1.md"};function l(t,s,h,d,c,k){return n(),p("div",null,[...s[0]||(s[0]=[i(`<p>用具体例子说明最小堆的工作过程：</p><h2 id="示例-任务调度最小堆" tabindex="-1">示例：任务调度最小堆</h2><p>假设有以下任务需要调度：</p><div class="language-javascript vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">javascript</span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 任务格式：{ id: number, sortIndex: number }</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// sortIndex 越小，优先级越高</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#6F42C1;">任务1</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">: { </span><span style="--shiki-light:#6F42C1;--shiki-dark:#6F42C1;">id</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#005CC5;">1</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">, </span><span style="--shiki-light:#6F42C1;--shiki-dark:#6F42C1;">sortIndex</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#005CC5;">5</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;"> }  </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 优先级 5</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#6F42C1;">任务2</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">: { </span><span style="--shiki-light:#6F42C1;--shiki-dark:#6F42C1;">id</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#005CC5;">2</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">, </span><span style="--shiki-light:#6F42C1;--shiki-dark:#6F42C1;">sortIndex</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#005CC5;">3</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;"> }  </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 优先级 3</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#6F42C1;">任务3</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">: { </span><span style="--shiki-light:#6F42C1;--shiki-dark:#6F42C1;">id</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#005CC5;">3</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">, </span><span style="--shiki-light:#6F42C1;--shiki-dark:#6F42C1;">sortIndex</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#005CC5;">7</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;"> }  </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 优先级 7</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#6F42C1;">任务4</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">: { </span><span style="--shiki-light:#6F42C1;--shiki-dark:#6F42C1;">id</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#005CC5;">4</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">, </span><span style="--shiki-light:#6F42C1;--shiki-dark:#6F42C1;">sortIndex</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#005CC5;">1</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;"> }  </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 优先级 1 (最高)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#6F42C1;">任务5</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">: { </span><span style="--shiki-light:#6F42C1;--shiki-dark:#6F42C1;">id</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#005CC5;">5</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">, </span><span style="--shiki-light:#6F42C1;--shiki-dark:#6F42C1;">sortIndex</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#005CC5;">4</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;"> }  </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 优先级 4</span></span></code></pre></div><h3 id="步骤1-插入任务-push" tabindex="-1">步骤1：插入任务（push）</h3><p>初始堆为空：<code>heap = []</code></p><h4 id="插入任务1-sortindex-5" tabindex="-1">插入任务1 (sortIndex: 5)</h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>heap = [任务1]</span></span>
<span class="line"><span>       [5]</span></span></code></pre></div><p>堆只有一个元素，无需调整。</p><h4 id="插入任务2-sortindex-3" tabindex="-1">插入任务2 (sortIndex: 3)</h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>插入后：heap = [任务1, 任务2]</span></span>
<span class="line"><span>                [5,    3]</span></span>
<span class="line"><span></span></span>
<span class="line"><span>siftUp 过程：</span></span>
<span class="line"><span>- 任务2 在索引1，父节点是索引0的任务1</span></span>
<span class="line"><span>- compare(任务1, 任务2) = 5 - 3 = 2 &gt; 0，父节点更大</span></span>
<span class="line"><span>- 交换：heap = [任务2, 任务1]</span></span>
<span class="line"><span>                [3,    5]</span></span></code></pre></div><p>结果：<code>heap = [任务2(3), 任务1(5)]</code></p><h4 id="插入任务3-sortindex-7" tabindex="-1">插入任务3 (sortIndex: 7)</h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>插入后：heap = [任务2, 任务1, 任务3]</span></span>
<span class="line"><span>                [3,    5,    7]</span></span>
<span class="line"><span></span></span>
<span class="line"><span>siftUp 过程：</span></span>
<span class="line"><span>- 任务3 在索引2，父节点是索引0的任务2</span></span>
<span class="line"><span>- compare(任务2, 任务3) = 3 - 7 = -4 &lt; 0，父节点更小</span></span>
<span class="line"><span>- 无需交换，直接返回</span></span></code></pre></div><p>结果：<code>heap = [任务2(3), 任务1(5), 任务3(7)]</code></p><h4 id="插入任务4-sortindex-1-最高优先级" tabindex="-1">插入任务4 (sortIndex: 1) - 最高优先级</h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>插入后：heap = [任务2, 任务1, 任务3, 任务4]</span></span>
<span class="line"><span>                [3,    5,    7,    1]</span></span>
<span class="line"><span></span></span>
<span class="line"><span>siftUp 过程（第1轮）：</span></span>
<span class="line"><span>- 任务4 在索引3，父节点是索引1的任务1</span></span>
<span class="line"><span>- compare(任务1, 任务4) = 5 - 1 = 4 &gt; 0，父节点更大</span></span>
<span class="line"><span>- 交换：heap = [任务2, 任务4, 任务3, 任务1]</span></span>
<span class="line"><span>                [3,    1,    7,    5]</span></span>
<span class="line"><span></span></span>
<span class="line"><span>siftUp 过程（第2轮）：</span></span>
<span class="line"><span>- 任务4 现在在索引1，父节点是索引0的任务2</span></span>
<span class="line"><span>- compare(任务2, 任务4) = 3 - 1 = 2 &gt; 0，父节点更大</span></span>
<span class="line"><span>- 交换：heap = [任务4, 任务2, 任务3, 任务1]</span></span>
<span class="line"><span>                [1,    3,    7,    5]</span></span></code></pre></div><p>结果：<code>heap = [任务4(1), 任务2(3), 任务3(7), 任务1(5)]</code></p><h4 id="插入任务5-sortindex-4" tabindex="-1">插入任务5 (sortIndex: 4)</h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>插入后：heap = [任务4, 任务2, 任务3, 任务1, 任务5]</span></span>
<span class="line"><span>                [1,    3,    7,    5,    4]</span></span>
<span class="line"><span></span></span>
<span class="line"><span>siftUp 过程：</span></span>
<span class="line"><span>- 任务5 在索引4，父节点是索引1的任务2</span></span>
<span class="line"><span>- compare(任务2, 任务5) = 3 - 4 = -1 &lt; 0，父节点更小</span></span>
<span class="line"><span>- 无需交换</span></span></code></pre></div><p>最终堆：<code>heap = [任务4(1), 任务2(3), 任务3(7), 任务1(5), 任务5(4)]</code></p><h3 id="步骤2-查看堆顶-peek" tabindex="-1">步骤2：查看堆顶（peek）</h3><div class="language-javascript vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">javascript</span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#6F42C1;">peek</span><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">(heap) </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 返回任务4 { id: 4, sortIndex: 1 }</span></span></code></pre></div><p>返回优先级最高的任务，不删除。</p><h3 id="步骤3-弹出堆顶-pop" tabindex="-1">步骤3：弹出堆顶（pop）</h3><h4 id="弹出任务4" tabindex="-1">弹出任务4</h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>初始：heap = [任务4, 任务2, 任务3, 任务1, 任务5]</span></span>
<span class="line"><span>             [1,    3,    7,    5,    4]</span></span>
<span class="line"><span></span></span>
<span class="line"><span>步骤1：保存根节点任务4</span></span>
<span class="line"><span>步骤2：用最后一个节点任务5替换根节点</span></span>
<span class="line"><span>       heap = [任务5, 任务2, 任务3, 任务1]</span></span>
<span class="line"><span>              [4,    3,    7,    5]</span></span>
<span class="line"><span></span></span>
<span class="line"><span>步骤3：siftDown 调整（第1轮）：</span></span>
<span class="line"><span>- 任务5 在索引0，左子节点是索引1的任务2，右子节点是索引2的任务3</span></span>
<span class="line"><span>- compare(任务2, 任务5) = 3 - 4 = -1 &lt; 0，左子节点更小</span></span>
<span class="line"><span>- compare(任务3, 任务2) = 7 - 3 = 4 &gt; 0，左子节点更小</span></span>
<span class="line"><span>- 与左子节点交换：heap = [任务2, 任务5, 任务3, 任务1]</span></span>
<span class="line"><span>                          [3,    4,    7,    5]</span></span>
<span class="line"><span></span></span>
<span class="line"><span>步骤4：siftDown 调整（第2轮）：</span></span>
<span class="line"><span>- 任务5 现在在索引1，左子节点是索引3的任务1</span></span>
<span class="line"><span>- compare(任务1, 任务5) = 5 - 4 = 1 &gt; 0，子节点更大</span></span>
<span class="line"><span>- 无需交换，退出</span></span></code></pre></div><p>结果：<code>heap = [任务2(3), 任务5(4), 任务3(7), 任务1(5)]</code>，返回任务4。</p><h3 id="步骤4-继续弹出" tabindex="-1">步骤4：继续弹出</h3><h4 id="弹出任务2" tabindex="-1">弹出任务2</h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>初始：heap = [任务2, 任务5, 任务3, 任务1]</span></span>
<span class="line"><span>             [3,    4,    7,    5]</span></span>
<span class="line"><span></span></span>
<span class="line"><span>用任务1替换根节点：</span></span>
<span class="line"><span>heap = [任务1, 任务5, 任务3]</span></span>
<span class="line"><span>       [5,    4,    7]</span></span>
<span class="line"><span></span></span>
<span class="line"><span>siftDown：</span></span>
<span class="line"><span>- compare(任务5, 任务1) = 4 - 5 = -1 &lt; 0，左子节点更小</span></span>
<span class="line"><span>- 交换：heap = [任务5, 任务1, 任务3]</span></span>
<span class="line"><span>              [4,    5,    7]</span></span></code></pre></div><p>结果：<code>heap = [任务5(4), 任务1(5), 任务3(7)]</code>，返回任务2。</p><h3 id="完整操作序列总结" tabindex="-1">完整操作序列总结</h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>操作序列：</span></span>
<span class="line"><span>push(任务1) → [任务1(5)]</span></span>
<span class="line"><span>push(任务2) → [任务2(3), 任务1(5)]</span></span>
<span class="line"><span>push(任务3) → [任务2(3), 任务1(5), 任务3(7)]</span></span>
<span class="line"><span>push(任务4) → [任务4(1), 任务2(3), 任务3(7), 任务1(5)]</span></span>
<span class="line"><span>push(任务5) → [任务4(1), 任务2(3), 任务3(7), 任务1(5), 任务5(4)]</span></span>
<span class="line"><span></span></span>
<span class="line"><span>pop() → 返回任务4(1), 堆变为: [任务2(3), 任务5(4), 任务3(7), 任务1(5)]</span></span>
<span class="line"><span>pop() → 返回任务2(3), 堆变为: [任务5(4), 任务1(5), 任务3(7)]</span></span>
<span class="line"><span>pop() → 返回任务5(4), 堆变为: [任务1(5), 任务3(7)]</span></span>
<span class="line"><span>pop() → 返回任务1(5), 堆变为: [任务3(7)]</span></span>
<span class="line"><span>pop() → 返回任务3(7), 堆变为: []</span></span></code></pre></div><h2 id="关键点" tabindex="-1">关键点</h2><ol><li>最小堆保证根节点始终是最小值（最高优先级）</li><li><code>siftUp</code>：插入时从下往上调整</li><li><code>siftDown</code>：删除时从上往下调整</li><li>时间复杂度：push 和 pop 都是 O(log n)，peek 是 O(1)</li><li>比较规则：先比较 <code>sortIndex</code>，相同则比较 <code>id</code></li></ol><p>这样 React Scheduler 可以高效地按优先级调度任务。</p>`,37)])])}const g=a(e,[["render",l]]);export{r as __pageData,g as default};
