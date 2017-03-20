var Message = require('../lib/mongo').Message;

module.exports = {
    // 创建一条留言
    create: function create(message) {
        return Message
            .create(message)
            .exec();
    },

    //获取一部分留言摘要
    getMessagesLimit: function getMessagesLimit(page, search) {
        var query = {};
        if (search) {
            query.content = { $regex: String(search) };
        }
        return Message
            .find(query)
            .skip((page - 1) * 5)
            .limit(5)
            .sort({ _id: -1 })
            .addCreatedAt()
            .exec();
    },

    //管理员删除留言
    admindelMessageById: function admindelMessageById(messageId) {
        return Message
            .remove({ _id: messageId })
            .exec();
    }
};