yapi-plugin-dingding
===

添加了，当 API 文档发生变化后，进行推送的功能。该插件支持为每个项目添加多个机器人，但是因为推送是同步的，所以最好不要添加太多。推送结果如图:

![预览](https://github.com/zgs225/yapi-plugin-dding/blob/master/assets/dding-result.png)

插件安装后，到项目详情页面的 `设置 -> 钉钉` 中修改配置。在钉钉客户端上，推送验证方式请选择自定义关键词方式，关键词设置两个：

* 接口文档所属项目的项目名称，用于除测试外的推送验证。
* `测试`: 用于测试推送

### TODO

* [x] 前端添加测试添加的机器人是否正确的功能
* [x] 将设置钉钉的机器人页面放到`设置`中，作为一个标签页
* [ ] 将推送任务变成异步队列
* [ ] 推送内容优化 - 添加接口详细变化
* [ ] 添加推送黑名单，黑名单中的接口不推送
* [ ] 添加企业微信推送
* [ ] 添加集成其他推送的机制

### 安装

* 执行命令 `yapi plugin --name yapi-plugin-dingding`
* 修改配置文件
* 重启服务

如果你在安装插件的过程中遇到了编译等问题，可以使用我打包好的 docker 镜像。
在这个镜像内编译可以避免环境等带来的问题。镜像使用如下:

``` bash
docker run --rm -it --name yapi-node -w `pwd` -v `pwd`:`pwd` -p 9090:9090 -p 4000:4000 yuezzzzzzzzzzz/yapi:1.5.1 bash
yapi plugin --name yapi-plugin-dingding
```

完成后即可退出容器，在宿主机中重启服务。

如果你升级插件后发现前端页面并没有更新，可能是 `ykit` 的缓存造成的，可以尝试删除
`项目目录/vendors/node_modules/.ykit_cache` 目录后然后在 `项目目录/vendors/`
目录中执行命令 `NODE_ENV=production ykit pack -m`，再重启服务器解决。

### 配置

* `host` 是项目的域名，用于拼接接口的链接。

### 配置示例

``` json
{
   "port": "9090",
   "adminAccount": "i@yuez.me",
   "db": {
      "servername": "192.168.50.208",
      "DATABASE": "yapi-dev",
      "port": "27017"
   },
   "mail": {
      "enable": false,
      "host": "smtp.163.com",
      "port": 465,
      "from": "***@163.com",
      "auth": {
         "user": "***@163.com",
         "pass": "*****"
      }
   },
   "plugins": [
      {
         "name": "dingding",
         "options": {
             "host": "http://127.0.0.1:9191"
         }
      }
   ]
}
```

### ChangeLog

#### v1.3.0

* 适配了 1.9.2 版本的 `yapi`
* 更改了添加设置标签的方式
* 推送标题上添加项目名称

#### v1.2.4

* 使用替换`saveLog`函数的方式获取通知内容，丰富了推送通知的类型.
* 使用 `Object.assign` 替换 `{...obj}` 的语法.
* 修复保存钉钉设置时候的 bug
* 修改保存日志的方式

#### v1.1.1

* 添加检测添加的链接是否正确的功能
* 将设置页面放到 `设置->钉钉机器人` 中

#### v1.0.2

* 可以配置多个机器人
* 完成基本的推送功能
