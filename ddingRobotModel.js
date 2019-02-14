const baseModel = require('models/base.js');

class DdingRobotModel extends baseModel {
    getName() {
        return 'dding_robots';
    }

    getSchema() {
        return {
            project_id: {type: Number, required: true},
            created_by_uid: {type: Number, required: true},
            updated_by_uid: {type: Number, default: 0},
            hooks: Array,
            created_at: Number,
            updated_at: Number
        };
    }

    save(data) {
        let m = new this.model(data);
        return m.save();
    }

    getByProejctId(id) {
        return this.model.findOne({
            project_id: id
        }).exec();
    }

    update(id, data) {
        return this.model.update(
            {
                _id: id
            },
            data,
            { runValidators: true }
        );
    }
}

module.exports = DdingRobotModel;
