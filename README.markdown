yapi-plugin-dding
===

添加了当 API 文档发生变化后，进行推送的功能。该插件支持为每个项目添加多个机器人，但是因为推送是同步的，所以最好不要添加太多。推送结果如图:

![预览](./assets/dding-result.png)

### TODO

* [ ] 前端添加测试添加的机器人是否正确的功能
* [ ] 将设置钉钉的机器人页面放到`设置`中，作为一个标签页
* [ ] 将推送任务变成异步队列

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

#### v1.0.0

* 可以配置多个机器人
* 完成基本的推送功能
