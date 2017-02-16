var marked = require('marked');
marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: true,
    pedantic: true,
    sanitize: true,
    smartLists: true,
    smartypants: true
});
var markdown = require("markdown").markdown;

var Comment = require('../lib/mongo').Comment;

// 将 comment 的 content 从 markdown 转换成 html
Comment.plugin('contentToHtml', {
    afterFind: function(comments) {
        return comments.map(function(comment) {
            // comment.content = marked(comment.content);
            comment.content = markdown.toHTML(comment.content);
            return comment;
        });
    }
});

module.exports = {
    // 创建一个留言
    create: function create(comment) {
        return Comment.create(comment).exec();
    },

    // 通过用户 id 和留言 id 删除一个留言
    delCommentById: function delCommentById(commentId, author) {
        return Comment.remove({ author: author, _id: commentId }).exec();
    },

    // 通过文章 id 删除该文章下所有留言
    delCommentsByPostId: function delCommentsByPostId(postId) {
        return Comment.remove({ postId: postId }).exec();
    },

    // 通过文章 id 获取该文章留言，按留言创建时间降序
    getCommentslimit: function getCommentslimit(postId,page) {
        return Comment
            .find({ postId: postId })
            .skip((page-1)*5)
            .limit(5)
            .populate({ path: 'author', model: 'User' })
            .sort({ _id: -1 })
            .addCreatedAt()
            .contentToHtml()
            .exec();
    },

    // 通过文章 id 获取该文章下留言数
    getCommentsCount: function getCommentsCount(postId) {
        return Comment.count({ postId: postId }).exec();
    }
};