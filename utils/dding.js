const axios = require('axios');

/**
 * 钉钉机器人消息推送封装
 */
class DdingRobotSender {
    constructor(url) {
        this.url = url;
    }

    async sendMarkdown(title, text, atMobiles = [], isAtAll = false) {
        let payload = {
            msgtype: 'markdown',
            markdown: {
                title: title,
                text: text,
                at: {
                    atMobiles: atMobiles,
                    isAtAll: isAtAll
                }
            }
        };

        let result = await this.send(payload);
        return result;
    }

    async send(data) {
        return await axios.post(this.url, data);
    }
}

module.exports = DdingRobotSender
