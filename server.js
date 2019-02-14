const yapi = require('yapi.js');
const mongoose = require('mongoose');
const controller = require('./controller');

module.exports = function() {
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
}
