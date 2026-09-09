import{_ as n,b as t,c as s,g as p}from"./chunks/framework.86O3EbG5.js";const m=JSON.parse('{"title":"Http Multipart 介绍","description":"","frontmatter":{"title":"Http Multipart 介绍","author":"oasis","date":"2023-05-22T00:00:00.000Z"},"headers":[],"relativePath":"articles/network/2.md","filePath":"articles/network/2.md"}'),e={name:"articles/network/2.md"};function i(l,a,o,r,c,d){return t(),s("div",null,[...a[0]||(a[0]=[p(`<blockquote><p>原文地址：<a href="https://blog.adamchalmers.com/multipart/" target="_blank" rel="noreferrer">https://blog.adamchalmers.com/multipart/</a></p></blockquote><ul><li>为什么使用 multipart</li><li>multipart 是什么</li><li>怎么实现 multipart</li><li>压缩</li></ul><h2 id="为什么使用-multipart" tabindex="-1">为什么使用 multipart</h2><ul><li>支持多部分数据：Multipart 允许将多个不同类型的数据组合成一个单一的请求或响应。例如：在发送电子邮件时，可以将文本消息、附件、图像一起包含在一个 multipart 消息中。</li><li>保留数据结构：Multipart 通过使用边界分隔符将不同部分的数据区分开，保留了数据的结构。接收方可以轻松解析和处理每部分数据</li><li>支持多种媒体类型，即支持多种 MIME type</li></ul><h2 id="multipart-是什么" tabindex="-1">multipart 是什么</h2><p>MIME 类型又叫做媒体类型，用于指示文档、文件或字节分类的性质和格式。可以在 <a href="https://datatracker.ietf.org/doc/html/rfc6838" target="_blank" rel="noreferrer">https://datatracker.ietf.org/doc/html/rfc6838</a> 找到它的定义。</p><p>MIME 类型通常由两部分构成：类型和子类型。 <code>type/subtype</code> 例如：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>text/plain</span></span>
<span class="line"><span>text/html</span></span>
<span class="line"><span>text/javascript</span></span></code></pre></div><p>MIME 类型分为两类：</p><ul><li>离散类型（Discrete type）</li><li>Multipart</li></ul><p>离散类型标识一个文件或媒体的类型。multipart 标识由多个部分组成的文档。每个部分都有自己的 MIME。</p><p>Multipart 类型分为两种：</p><ul><li>message</li><li>multipart</li></ul><h2 id="multipart-怎么实现" tabindex="-1">Multipart 怎么实现</h2><p>如果 <code>Content-Type</code> 是 <code>multipart/form-data</code> 则 HTTP 正文包含 Multipart。每个部分都有边界限定符分隔。HTTP 消息有一个标头，它定义了边界限定符，这样服务器就能知道每个部分之间的边界在哪里。每个部分也有自己的 header ：</p><p><code>Content-Disposition</code>: 定义文件名或表单字段名</p><p><code>Content-Type</code>: 每个 part 的类型，默认是 <code>text/plain</code></p><p>请求 Demo：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-light vp-code" tabindex="0"><code><span class="line"><span>POST /cgi-bin/qtest HTTP/1.1</span></span>
<span class="line"><span>Content-Type: multipart/form-data; boundary=2a8ae6ad-f4ad-4d9a-a92c-6d217011fe0f</span></span>
<span class="line"><span>Content-Length: 514</span></span>
<span class="line"><span></span></span>
<span class="line"><span>--2a8ae6ad-f4ad-4d9a-a92c-6d217011fe0f</span></span>
<span class="line"><span>Content-Disposition: form-data; name=&quot;datafile1&quot;; filename=&quot;r.gif&quot;</span></span>
<span class="line"><span>Content-Type: image/gif</span></span>
<span class="line"><span></span></span>
<span class="line"><span>GIF87a.............,...........D..;</span></span>
<span class="line"><span>--2a8ae6ad-f4ad-4d9a-a92c-6d217011fe0f</span></span>
<span class="line"><span>Content-Disposition: form-data; name=&quot;datafile2&quot;; filename=&quot;g.gif&quot;</span></span>
<span class="line"><span>Content-Type: image/gif</span></span>
<span class="line"><span></span></span>
<span class="line"><span>GIF87a.............,...........D..;</span></span>
<span class="line"><span>--2a8ae6ad-f4ad-4d9a-a92c-6d217011fe0f</span></span>
<span class="line"><span>Content-Disposition: form-data; name=&quot;datafile3&quot;; filename=&quot;b.gif&quot;</span></span>
<span class="line"><span>Content-Type: image/gif</span></span>
<span class="line"><span></span></span>
<span class="line"><span>GIF87a.............,...........D..;</span></span>
<span class="line"><span>--2a8ae6ad-f4ad-4d9a-a92c-6d217011fe0f--</span></span></code></pre></div><h2 id="压缩" tabindex="-1">压缩</h2><p>multipart 可以使用 gzip 进行消息体的整体压缩。不能单独对各个 part 进行压缩。</p>`,21)])])}const f=n(e,[["render",i]]);export{m as __pageData,f as default};
