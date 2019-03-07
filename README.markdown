yapi-plugin-dding
===

添加了，当 API 文档发生变化后，进行推送的功能。该插件支持为每个项目添加多个机器人，但是因为推送是同步的，所以最好不要添加太多。推送结果如图:

![预览](./assets/dding-result.png)

插件安装后，到项目详情页面的 `设置 -> 钉钉机器人` 中修改配置。

### TODO

* [x] 前端添加测试添加的机器人是否正确的功能
* [x] 将设置钉钉的机器人页面放到`设置`中，作为一个标签页
* [ ] 将推送任务变成异步队列

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
