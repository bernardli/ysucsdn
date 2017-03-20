var User = require('../lib/mongo').User;
var Forgot = require('../lib/mongo').Forgot;

module.exports = {
    // 注册一个用户
    create: function create(user) {
        return User.create(user).exec();
    },

    // 创建忘记密码随机字段
    createForgot: function createForgot(forgot) {
        return Forgot.create(forgot).exec();
    },

    // 创建忘记密码随机字段
    delForgotByAuthor: function delForgot(author) {
        return Forgot.remove({ author: author }).exec();
    },

    // 通过 用户名 获取用户信息
    getUser: function getUser(name, email, id) {
        var query = {};
        if (name) {
            query.name = name;
        }
        if (email) {
            query.email = email;
        }
        if (id) {
            query._id = id;
        }
        return User
            .findOne(query)
            .addCreatedAt()
            .exec();
    },

    // 通过 随机字段 获取忘记密码
    getForgotByrandom: function getUserByName(random) {
        return Forgot
            .findOne({ random: random })
            .exec();
    },

    // 通过 author 获取忘记密码
    getForgotByAuthor: function getForgotByAuthor(author) {
        return Forgot
            .findOne({ author: author })
            .exec();
    },

    //通过用户 ID 和用户 name 更新 用户
    updateUser: function updateUser(userId, userName, data) {
        return User.update({ _id: userId, name: userName }, { $set: data }).exec();
    }
};