import DdingRobotView from './views/form';

module.exports = function () {
    this.bindHook('sub_setting_nav', (router) => {
        router.dding = {
            name: '钉钉',
            component: DdingRobotView
        }
    })
}
