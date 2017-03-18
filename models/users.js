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
    getUserByName: function getUserByName(name) {
        return User
            .findOne({ name: name })
            .addCreatedAt()
            .exec();
    },

    // 通过 用户名和邮箱 获取用户信息
    getUserByNameAndEmail: function getUserByName(name, email) {
        return User
            .findOne({ name: name, email: email })
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

    // 通过 用户ID 获取用户信息
    getUserById: function getUserById(id) {
        return User
            .findOne({ _id: id })
            .addCreatedAt()
            .exec();
    },

    //通过用户 ID 和用户 name 更新 用户 bio
    updateBioById: function updateBioById(userId, userName, data) {
        return User.update({ _id: userId, name: userName }, { $set: data }).exec();
    },

    //通过用户 ID 和用户 name 更新 用户 avatar
    updateAvatarById: function updateAvatarById(userId, userName, data) {
        return User.update({ _id: userId, name: userName }, { $set: data }).exec();
    },

    //通过用户 ID 和用户 name 更新 用户 password
    updatePasswordById: function updatePasswordById(userId, userName, data) {
        return User.update({ _id: userId, name: userName }, { $set: data }).exec();
    }
};