const yapi = require('yapi.js');
const mongoose = require('mongoose');
const controller = require('./controller');
const InterfaceNotificationSender = require('./utils/interfaceNotificationSender');
const InterfaceModel = require('models/interface');
const Config = require('./utils/config');

module.exports = function(options) {
    Config.instance = options;

    yapi.connect.then(function() {
        let db = mongoose.connection.db.collection('dding_robots');
        db.createIndex({
            project_id: 1
        });
    });

    this.bindHook('add_router', function(router) {
        router({
            controller: controller,
            method: 'get',
            path: 'dding_robots/detail',
            action: 'show'
        });

        router({
            controller: controller,
            method: 'post',
            path: 'dding_robots/up',
            action: 'update'
        });
    });

    this.bindHook('interface_add', function(model) {
        try {
            let sender = new InterfaceNotificationSender(model, 'create');
            sender.send().then();
        } catch (err) {
            yapi.commons.log(err, 'error');
        }
    });

    this.bindHook('interface_del', function(model) {
        try {
            let sender = new InterfaceNotificationSender(model, 'delete');
            sender.send().then();
        } catch (err) {
            yapi.commons.log(err, 'error');
        }
    });

    this.bindHook('interface_update', function(id) {
        try {
            let InterfaceInst = yapi.getInst(InterfaceModel);
            InterfaceInst.get(id).then(function(model) {
                let sender = new InterfaceNotificationSender(model, 'update');
                sender.send().then();
            });
        } catch (err) {
            yapi.commons.log(err, 'error');
        }
    });
}
