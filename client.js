import DdingRobotView from './views/index';

module.exports = function () {
    this.bindHook('sub_nav', (app) => {
        app.setting = {
            name: '设置',
            path: '/project/:id/setting',
            component: DdingRobotView
        }
    })
}
