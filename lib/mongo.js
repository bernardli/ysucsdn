const config = require('config-lite')(__dirname);
const Mongolass = require('mongolass');

const mongolass = new Mongolass();
mongolass.connect(config.mongodb);

const moment = require('moment');
const objectIdToTimestamp = require('objectid-to-timestamp');

// 根据 id 生成创建时间 created_at
mongolass.plugin('addCreatedAt', {
  afterFind(results) {
    results.forEach((item) => {
      item.created_at = moment(objectIdToTimestamp(item._id)).format('YYYY-MM-DD HH:mm');
    });
    return results;
  },
  afterFindOne(result) {
    if (result) {
      result.created_at = moment(objectIdToTimestamp(result._id)).format('YYYY-MM-DD HH:mm');
    }
    return result;
  },
});

exports.User = mongolass.model('User', {
  name: { type: 'string' },
  password: { type: 'string' },
  identity: { type: 'string', enum: ['admin', 'normal'] },
  avatar: { type: 'string' },
  gender: { type: 'string', enum: ['m', 'f', 'x'] },
  bio: { type: 'string' },
  email: { type: 'string' },
  point: { type: 'number' },
});
exports.User.index({ name: 1 }, { unique: true }).exec(); // 根据用户名找到用户，用户名全局唯一

exports.Post = mongolass.model('Post', {
  author: { type: Mongolass.Types.ObjectId },
  title: { type: 'string' },
  content: { type: 'string' },
  tags: [{ type: 'string' }],
  pv: { type: 'number' },
  top: { type: 'string', enum: ['y', 'n'] },
  published: { type: 'string', enum: ['y', 'n'] },
});
exports.Post.index({ author: 1, _id: -1 }).exec(); // 按创建时间降序查看用户的文章列表

exports.Comment = mongolass.model('Comment', {
  author: { type: Mongolass.Types.ObjectId },
  content: { type: 'string' },
  postId: { type: Mongolass.Types.ObjectId },
});
exports.Comment.index({ postId: 1, _id: 1 }).exec(); // 通过文章 id 获取该文章下所有留言，按留言创建时间升序
exports.Comment.index({ author: 1, _id: 1 }).exec(); // 通过用户 id 和留言 id 删除一个留言

exports.Forgot = mongolass.model('Forgot', {
  author: { type: Mongolass.Types.ObjectId },
  createdAt: { type: 'date' },
  random: { type: 'string' },
});
exports.Forgot.index({ author: 1, _id: -1 }).exec();
exports.Forgot.ensureIndex({ createdAt: 1 }, { expireAfterSeconds: 300 }).exec(); // 300s后自动删除数据

exports.Message = mongolass.model('Message', {
  content: { type: 'string' },
});
exports.Message.index({ content: 1, _id: -1 }).exec(); // 按创建时间降序查看用户的文章列表

exports.YsuNotice = mongolass.model('YsuNotice', {
  name: { type: 'string' },
  newTitle: { type: 'string' },
});
exports.YsuNotice.index({ name: 1 }, { unique: true }).exec(); // 根据用户名找到用户，用户名全局唯一

exports.EmailNotice = mongolass.model('EmailNotice', {
  user: { type: Mongolass.Types.ObjectId },
  ysuNotice: { type: 'string', enum: ['y', 'n'] },
  replyNotice: { type: 'string', enum: ['y', 'n'] },
  pushNotice: { type: 'string', enum: ['y', 'n'] },
});
exports.EmailNotice.index({ user: 1, _id: -1 }).exec(); // 按创建时间降序查看用户的文章列表
