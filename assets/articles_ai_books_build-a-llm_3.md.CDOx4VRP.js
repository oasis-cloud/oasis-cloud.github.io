import{_ as a,b as i,c as n,g as l}from"./chunks/framework.86O3EbG5.js";const p="/images/build-a-llm/ch02-2.png",o=JSON.parse('{"title":"从零构建大模型（三）","description":"","frontmatter":{"title":"从零构建大模型（三）","subTitle":"编码注意力机制","author":"oasis","tags":["llm"]},"headers":[],"relativePath":"articles/ai/books/build-a-llm/3.md","filePath":"articles/ai/books/build-a-llm/3.md"}'),e={name:"articles/ai/books/build-a-llm/3.md"};function t(h,s,k,c,d,r){return i(),n("div",null,[...s[0]||(s[0]=[l(`<h2 id="注意力机制解决的问题" tabindex="-1">注意力机制解决的问题</h2><p>注意力机制的目的是解决上下文丢失的问题。编码器-解码器RNN的一个主要限制是，在解码阶段，RNN无法直接访问编码器中的早期隐藏状态。因此，它只能依赖当前的隐藏状态，这个状态包含了所有相关信息。</p><p>自注意力机制允许输入序列中的每个位置关注同一序列中的所有位置。传统的注意力机制关注的是两个不同序列元素之间的关系。而自注意力机制中， 通过关联单个输入序列中的不同位置来计算注意力权重。</p><h2 id="基础注意力机制的逻辑" tabindex="-1">基础注意力机制的逻辑</h2><p>自注意力机制的目标是为每个输入元素计算一个上下文向量，该向量结合了其他所有输入元素的信息。 上下文向量(context vector)可以被理解为一种包含了序列中所有元素信息的嵌入向量。</p><p>计算过程：</p><ol><li>通过点积计算查询x与其他说有输入元素之间的注意力分数。点积可以表示两个向量之间的对齐程度：点积越大，向量之间的对齐程度或相似度越高。</li><li>对计算后的注意力分数进行归一化处理。归一化处理有助于解释结果，能维持大语言模型的训练稳定性。</li><li>将嵌入的输入词元与相应的注意力权重相乘，再将得到的向量求和来计算上下文向量。</li></ol><p>为什么要进行归一化处理？</p><p>归一化的目的是消除奇异样本数据导致的不良影响。例如：</p><p>未归一化处理：</p><div class="language-html vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">html</span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">张三：10000分（他说自己最饿）</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">李四：5分</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">王五：3分</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">其他人：都是1分</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">按分数分披萨：</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">张三：10000/(10000+5+3+1+1+1+1+1) ≈ 99.9%</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">其他人：总共分到0.1%的披萨</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">结果：张三吃了几乎整个披萨，其他人饿死了！</span></span></code></pre></div><p>归一化后（系统调整）：</p><div class="language-html vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">html</span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">系统说：“别闹，最高分不能太离谱”</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">调整后：</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">张三：10分（原来10000分 ÷ 1000）</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">李四：5分不变</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">其他人：1分不变</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">现在分披萨：</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">张三：10/(10+5+1+1+1+1+1+1) ≈ 45%</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">李四：5/... ≈ 23%</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">其他人：各分到大约4%</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">结果：大家都吃到披萨了，没人饿死！</span></span></code></pre></div><h2 id="可训练权重的自注意力机制" tabindex="-1">可训练权重的自注意力机制</h2><p>缩放点积注意力（scaled dot-product attention）的实现步骤</p><ol><li>计算输入元素的查询向量、键向量、值向量</li><li>使用通过各自权重矩阵变换后的查询向量和键向量计算注意力分数</li><li>将注意力分数除以键向量的嵌入维度的平方根来进行缩放</li><li>对值向量进行加权求和来计算上下文向量</li></ol><p>缩放点击注意力怎么体现出可训练权重？可训练权重不再点积计算里，而在生成 Q、K、V的线性变换中。</p><p>可训练体现在反向传播阶段，这些用到的参数需要存储下来？</p><h2 id="因果注意力机制" tabindex="-1">因果注意力机制</h2><p>因果注意力解决了这样的问题：标准的自注意力机制可以一次性访问整个输入序列，但是我们希望自注意力机制在预测序列中的下一个词元时仅考虑 当前位置之前的词元。因果注意力机制实现了这样的逻辑。</p><p>因果注意力的实现基于掩码和归一化，通过掩码实现“只能看左边，不能看右边”的规则。</p><div class="language-html vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">html</span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;"># 假设有4个词的序列</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">序列长度 = 4</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;"># 因果掩码矩阵（下三角矩阵）</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">因果掩码 = [</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">    [True,  False, False, False],  # 词1只能看自己</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">    [True,  True,  False, False],  # 词2能看词1和自己</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">    [True,  True,  True,  False],  # 词3能看词1,2和自己</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">    [True,  True,  True,  True]    # 词4能看所有前面的词</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;">]</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;"># 在注意力中应用：</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;"># False的位置会用-∞替换，这样softmax后概率为0</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#24292E;"># True的位置保留原值</span></span></code></pre></div><p><img src="`+p+'" alt="img.png"></p><h3 id="多头注意力机制" tabindex="-1">多头注意力机制</h3><p>多头注意力的主要思想是并行运行注意力机制，每次使用学到的不同的线性投影（将输入数据乘以权重矩阵得到的）。</p><p>多头注意力的结果表示为一个张量，例如两个注意力头会生成一个张量，该张量包含两个上下文向量矩阵。</p>',26)])])}const g=a(e,[["render",t]]);export{o as __pageData,g as default};
