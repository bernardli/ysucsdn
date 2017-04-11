const marked = require('marked');

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: true,
  sanitize: true,
  smartLists: true,
  smartypants: true,
});
const markdown = require('markdown').markdown;

const Comment = require('../lib/mongo').Comment;

// 将 comment 的 content 从 markdown 转换成 html
Comment.plugin('contentToHtml', {
  afterFind(comments) {
    return comments.map((comment) => {
      // comment.content = marked(comment.content);
      comment.content = markdown.toHTML(comment.content);
      return comment;
    });
  },
});

module.exports = {
  // 创建一个留言
  create: function create(comment) {
    return Comment.create(comment).exec();
  },

  // 通过用户 id 和留言 id 删除一个留言
  delCommentById: function delCommentById(commentId, author) {
    return Comment.remove({
      author,
      _id: commentId,
    }).exec();
  },

  // 管理员通过留言 id 删除一个留言
  admindelCommentById: function delCommentById(commentId) {
    return Comment.remove({
      _id: commentId,
    }).exec();
  },

  // 通过文章 id 删除该文章下所有留言
  delCommentsByPostId: function delCommentsByPostId(postId) {
    return Comment.remove({
      postId,
    }).exec();
  },

  // 通过文章 id 删除该文章下所有留言
  delCommentsByAuthorId: function delCommentsByAuthorId(author) {
    return Comment.remove({
      author,
    }).exec();
  },

  // 通过文章 id 获取该文章留言，按留言创建时间降序
  getCommentslimit: function getCommentslimit(postId, page) {
    return Comment
      .find({
        postId,
      })
      .skip((page - 1) * 5)
      .limit(5)
      .populate({
        path: 'author',
        model: 'User',
      })
      .sort({
        _id: -1,
      })
      .addCreatedAt()
      .contentToHtml()
      .exec();
  },

  // 通过文章 id 获取该文章下留言数
  getCommentsCount: function getCommentsCount(postId) {
    return Comment.count({
      postId,
    }).exec();
  },
};
