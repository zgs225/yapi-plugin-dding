import DdingRobotView from './views/index';

module.exports = function () {
    this.bindHook('sub_setting_nav', function(app) {
        app.setting = {
            name: '钉钉机器人',
            component: DdingRobotView
        }
    });
}
