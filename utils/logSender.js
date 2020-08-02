const yapi = require("yapi.js");
const DdingRobotModel = require("../ddingRobotModel");
const ProjectModel = require("models/project");
const DdingRobotSender = require("./dding");
const { HTMLParser, HTMLNodeToTextTranslater, HTMLNodeToMarkdownTranslater } = require("./html");
const Config = require("./config");

class SendLogViaDingDingSender {
  constructor(log) {
    this.log = log;
    this.dingdingModel = null;
  }

  async send() {
    if (!this.log || !this.log.content || this.log.content.length == 0) {
      yapi.commons.log("yapi-plugin-dingding: 没有推送内容，跳过通知。");
      return;
    }

    await this.retrieveModels();

    if (this.isNotNeedNotify()) {
      yapi.commons.log("yapi-plugin-dingding: 该项目未配置钉钉推送，跳过通知。");
      return;
    }

    let node = HTMLParser.parse(this.log.content);
    this.addHostForNode(node);
    const projectName = await this.getProjectName(this.log.typeid);
    const title = `【${projectName}】${new HTMLNodeToTextTranslater().translate(node)}`;
    const text = new HTMLNodeToMarkdownTranslater().translate(node);

    this.dingdingModel.hooks.forEach((url) => {
      const sender = new DdingRobotSender(url);
      sender.sendMarkdown(title, text);
      yapi.commons.log(`yapi-plugin-dingding: 已推送。title=${title}, text=${text}`);
    });
  }

  addHostForNode(node) {
    if (!node) {
      return;
    }
    if (node.type == "a") {
      let href = `${Config.instance.host}${node.getAttribute("href")}`;
      node.setAttribute("href", href);
    }
    node.children &&
      node.children.forEach((child) => {
        this.addHostForNode(child);
      });
  }

  async retrieveModels() {
    await this.retrieveDingDingModel();
  }

  async retrieveDingDingModel() {
    let Model = yapi.getInst(DdingRobotModel);
    this.dingdingModel = await Model.getByProejctId(this.log.typeid);
  }

  isNotNeedNotify() {
    return !(this.dingdingModel && this.dingdingModel.hooks && this.dingdingModel.hooks.length > 0);
  }

  async getProjectName(projectId) {
    try {
      let model = yapi.getInst(ProjectModel);
      let proj = await model.get(projectId);
      return proj.name;
    } catch (e) {
      yapi.commons.log(`yapi-plugin-dingding: 获取项目信息失败。 error = ${e.message || ''}`)
    }
  }
}

module.exports = {
  SendLogViaDingDingSender,
};
