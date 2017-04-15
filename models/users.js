const User = require('../lib/mongo').User;
const Forgot = require('../lib/mongo').Forgot;
const PostModel = require('../models/posts');
const NoticeModel = require('../models/emailNotice');
const CommentModel = require('../models/comments');

module.exports = {
  // 注册一个用户
  create: function create(user) {
    return User.create(user).exec();
  },

  // 创建忘记密码随机字段
  createForgot: function createForgot(forgot) {
    return Forgot.create(forgot).exec();
  },

  // 删除忘记密码随机字段
  delForgotByAuthor: function delForgotByAuthor(author) {
    return Forgot.remove({
      author,
    }).exec();
  },

  // 通过 用户名 获取用户信息
  getUser: function getUser(name, email, id) {
    const query = {};
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

  // 通过 author 随机字段 获取忘记密码
  getForgot: function getForgot(author, random) {
    const query = {};
    if (author) {
      query.author = author;
    }
    if (random) {
      query.random = random;
    }
    return Forgot
      .findOne(query)
      .exec();
  },

  // 通过用户 ID 和用户 name 更新 用户
  updateUser: function updateUser(userId, userName, data) {
    return User.update({
      _id: userId,
      name: userName,
    }, {
      $set: data,
    }).exec();
  },

  // 通过用户 ID 和用户 name 删除 用户
  delUser: function delUser(userId, userName) {
    return User.remove({
      _id: userId,
      name: userName,
    })
      .exec()
      .then((res) => {
        if (res.result.ok && res.result.n > 0) {
          return PostModel.getPosts(userId, null, null, null)
            .then((posts) => {
              posts.forEach(post => PostModel.delPostById(post._id, userId));
            });
        }
        throw new Error('删除文章出错');
      })
      .then(() => Promise.all([
        NoticeModel.delNotice(userId),
        CommentModel.delCommentsByAuthorId(userId),
      ]));
  },
};
