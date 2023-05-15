---
title: "tcpdump"
---

> 原文地址：https://jvns.ca/blog/2016/03/16/tcpdump-is-amazing/

## tcpdump 是什么

tcpdump 是一个网络抓包工具，通过使用它，可以捕获和分析网络数据包。它能够显示源地址、目标地址、协议类型、端口号、数据内容等信息。而且 tcpdump 支持多种协议：TCP、UDP、ICMP 等。并且提供了丰富的选项和过滤规则。

## tcpdump 命令

```
NAME
       tcpdump - dump traffic on a network

SYNOPSIS
       tcpdump [ -AbdDefhHIJKlLnNOpqStuUvxX# ] [ -B buffer_size ]
               [ -c count ]
               [ -C file_size ] [ -G rotate_seconds ] [ -F file ]
               [ -i interface ] [ -j tstamp_type ] [ -k (metadata_arg) ]
               [ -m module ] [ -M secret ]
               [ --number ] [ -Q in|out|inout ]
               [ -r file ] [ -V file ] [ -s snaplen ] [ -T type ] [ -w file ]
               [ -W filecount ]
               [ -E spi@ipaddr algo:secret,...  ]
               [ -y datalinktype ] [ -z postrotate-command ] [ -Z user ]
               [ -Q packet-metadata-filter ] [ -Q in|out|inout ]
               [ --time-stamp-precision=tstamp_precision ]
               [ --immediate-mode ] [ --version ]
               [ expression ]
```

## tcpdump 返回内容解释

命令 ：`sudo tcpdump -n -i any port 10086`

tcpdump 的返回内容依赖协议。下面是大多数协议都有的部分。

- 时间戳：显示数据包捕获的时间和日期信息。
- 源地址和目标地址：指示数据包的源IP地址和目标IP地址。
- 协议类型：指示数据包使用的协议，如TCP、UDP、ICMP等。
- 源端口和目标端口：指示数据包的源端口和目标端口号。
- 数据包长度：指示数据包的长度，通常以字节为单位。
- 标志和控制位：指示数据包的标志和控制位，如TCP的SYN、ACK、FIN等。
- 数据内容：显示数据包的原始内容，如数据包的有效载荷或有效负载。

详细文档：https://www.tcpdump.org/manpages/tcpdump.1.html

`15:34:37.823226 IP 201.31.11.117.10086 > 201.31.11.117.50798: Flags [P.], seq 0:2, ack 1, win 6370, options [nop,nop,TS val 2670709546 ecr 3306380947], length 2`

## 网管工具包

- ping
- dig/nslookup 域名解析
- netstat/ss 检测端口号是否占用
- ifconfig 检查 IP 地址
- ip 配置路由
- arp 查看 ARP Table
- telnet 检测服务器的端口是可用
- ssh 
- lsof 哪些端口被使用
- sysctl 配置 socket
- openvpn 配置 vpn
- nftables/iptables 配置防火墙或 NAT
