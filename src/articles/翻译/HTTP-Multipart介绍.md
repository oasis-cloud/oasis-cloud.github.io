---
title: "Http Multipart 介绍"
---

> 原文地址：https://blog.adamchalmers.com/multipart/

- 为什么使用 multipart
- multipart 是什么
- 怎么实现 multipart
- 压缩

## 为什么使用 multipart

- 支持多部分数据：Multipart 允许将多个不同类型的数据组合成一个单一的请求或响应。例如：在发送电子邮件时，可以将文本消息、附件、图像一起包含在一个 multipart 消息中。
- 保留数据结构：Multipart 通过使用边界分隔符将不同部分的数据区分开，保留了数据的结构。接收方可以轻松解析和处理每部分数据
- 支持多种媒体类型，即支持多种 MIME type

## multipart 是什么

MIME 类型又叫做媒体类型，用于指示文档、文件或字节分类的性质和格式。可以在 https://datatracker.ietf.org/doc/html/rfc6838 找到它的定义。

MIME 类型通常由两部分构成：类型和子类型。
```type/subtype```
例如：
```
text/plain
text/html
text/javascript
```

MIME 类型分为两类：
- 离散类型（Discrete type）
- Multipart

离散类型标识一个文件或媒体的类型。multipart 标识由多个部分组成的文档。每个部分都有自己的 MIME。

Multipart 类型分为两种：
- message
- multipart

## Multipart 怎么实现

如果 `Content-Type` 是 `multipart/form-data` 则 HTTP 正文包含 Multipart。每个部分都有边界限定符分隔。HTTP 消息有一个标头，它定义了边界限定符，这样服务器就能知道每个部分之间的边界在哪里。每个部分也有自己的 header ：

`Content-Disposition`: 定义文件名或表单字段名

`Content-Type`: 每个 part 的类型，默认是 `text/plain`

请求 Demo：

```
POST /cgi-bin/qtest HTTP/1.1
Content-Type: multipart/form-data; boundary=2a8ae6ad-f4ad-4d9a-a92c-6d217011fe0f
Content-Length: 514

--2a8ae6ad-f4ad-4d9a-a92c-6d217011fe0f
Content-Disposition: form-data; name="datafile1"; filename="r.gif"
Content-Type: image/gif

GIF87a.............,...........D..;
--2a8ae6ad-f4ad-4d9a-a92c-6d217011fe0f
Content-Disposition: form-data; name="datafile2"; filename="g.gif"
Content-Type: image/gif

GIF87a.............,...........D..;
--2a8ae6ad-f4ad-4d9a-a92c-6d217011fe0f
Content-Disposition: form-data; name="datafile3"; filename="b.gif"
Content-Type: image/gif

GIF87a.............,...........D..;
--2a8ae6ad-f4ad-4d9a-a92c-6d217011fe0f--
```

## 压缩

multipart 可以使用 gzip 进行消息体的整体压缩。不能单独对各个 part 进行压缩。
