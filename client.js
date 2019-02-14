import DdingRobotView from './views/index';

module.exports = function () {
    this.bindHook('sub_nav', (app) => {
        app.ddingRobot = {
            name: '钉钉',
            path: '/project/:id/dding-robots',
            component: DdingRobotView
        }
    })
}
