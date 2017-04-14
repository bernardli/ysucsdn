const EmailNotice = require('../lib/mongo').EmailNotice;

module.exports = {

    // 创建一条记录
  create: function create(notice) {
    return EmailNotice
            .create(notice)
            .exec();
  },


  getNotice: function getNotice(query) {
    return EmailNotice
            .find(query)
            .populate({ path: 'user', model: 'User' })
            .exec();
  },


  updateNoticeByName: function updateNoticeByName(user, data) {
    return EmailNotice.update({ user }, { $set: data }).exec();
  },

  delNotice: function delNotice(userId) {
    return EmailNotice.remove({ user:userId }).exec();
  },

};
